const pool = require("../config/db");

const createDelivery = async (req, res) => {
  const client = await pool.connect();

  try {
    const { product_id, quantity } = req.body;

    await client.query("BEGIN");

    // 1. Check current stock
    const stockCheck = await client.query(
      `SELECT * FROM stock
       WHERE product_id = $1
       FOR UPDATE`,
      [product_id]
    );

    if (stockCheck.rows.length === 0) {
      throw new Error("Stock record not found");
    }

    const currentStock = stockCheck.rows[0].quantity;

    if (currentStock < quantity) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Insufficient stock",
        current_stock: currentStock,
      });
    }

    // 2. Create delivery
    const deliveryResult = await client.query(
      `INSERT INTO deliveries (product_id, quantity)
       VALUES ($1, $2)
       RETURNING *`,
      [product_id, quantity]
    );

    // 3. Decrease stock
    const stockResult = await client.query(
      `UPDATE stock
       SET quantity = quantity - $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE product_id = $2
       RETURNING *`,
      [quantity, product_id]
    );

    // 4. Add delivery to stock ledger
    await client.query(
      `INSERT INTO stock_ledger
       (product_id, movement_type, quantity_change, balance_after, reference_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        product_id,
        "DELIVERY",
        -quantity,
        stockResult.rows[0].quantity,
        deliveryResult.rows[0].id,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Delivery created and stock updated",
      delivery: deliveryResult.rows[0],
      stock: stockResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).json({
      message: "Failed to create delivery",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  createDelivery,
};