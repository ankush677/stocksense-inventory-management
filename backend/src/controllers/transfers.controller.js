const pool = require("../config/db");

const createTransfer = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      product_id,
      from_location_id,
      to_location_id,
      quantity,
    } = req.body;

    if (
      !product_id ||
      !from_location_id ||
      !to_location_id ||
      !quantity ||
      quantity <= 0
    ) {
      return res.status(400).json({
        message: "Invalid transfer data",
      });
    }

    if (from_location_id === to_location_id) {
      return res.status(400).json({
        message: "Source and destination locations must be different",
      });
    }

    await client.query("BEGIN");

    const sourceStock = await client.query(
      `SELECT *
       FROM location_stock
       WHERE location_id = $1 AND product_id = $2
       FOR UPDATE`,
      [from_location_id, product_id]
    );

    if (sourceStock.rows.length === 0) {
      throw new Error("Source stock record not found");
    }

    const currentStock = sourceStock.rows[0].quantity;

    if (currentStock < quantity) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Insufficient stock at source location",
        current_stock: currentStock,
      });
    }

    const destinationStock = await client.query(
      `SELECT *
       FROM location_stock
       WHERE location_id = $1 AND product_id = $2
       FOR UPDATE`,
      [to_location_id, product_id]
    );

    const transferResult = await client.query(
      `INSERT INTO stock_transfers
       (product_id, from_location_id, to_location_id, quantity)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [product_id, from_location_id, to_location_id, quantity]
    );

    const sourceResult = await client.query(
      `UPDATE location_stock
       SET quantity = quantity - $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE location_id = $2
         AND product_id = $3
       RETURNING *`,
      [quantity, from_location_id, product_id]
    );

    let destinationResult;

    if (destinationStock.rows.length === 0) {
      destinationResult = await client.query(
        `INSERT INTO location_stock
         (location_id, product_id, quantity)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [to_location_id, product_id, quantity]
      );
    } else {
      destinationResult = await client.query(
        `UPDATE location_stock
         SET quantity = quantity + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE location_id = $2
           AND product_id = $3
         RETURNING *`,
        [quantity, to_location_id, product_id]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Stock transferred successfully",
      transfer: transferResult.rows[0],
      source_stock: sourceResult.rows[0],
      destination_stock: destinationResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).json({
      message: "Failed to create stock transfer",
    });
  } finally {
    client.release();
  }
};

// Get recent transfers
const getTransfers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        st.id,
        st.product_id,
        p.name AS product_name,
        p.sku,
        st.from_location_id,
        fl.name AS from_location,
        st.to_location_id,
        tl.name AS to_location,
        st.quantity,
        st.transferred_at
      FROM stock_transfers st
      JOIN products p
        ON p.id = st.product_id
      JOIN locations fl
        ON fl.id = st.from_location_id
      JOIN locations tl
        ON tl.id = st.to_location_id
      ORDER BY st.transferred_at DESC
      LIMIT 8
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch transfers",
    });
  }
};

module.exports = {
  createTransfer,
  getTransfers,
};