const pool = require("../config/db");

const createAdjustment = async (req, res) => {
  const client = await pool.connect();

  try {
    const { product_id, quantity_change, reason } = req.body;

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
    const newStock = currentStock + quantity_change;

    // 2. Prevent negative stock
    if (newStock < 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Adjustment would make stock negative",
        current_stock: currentStock,
      });
    }

    // 3. Create adjustment
    const adjustmentResult = await client.query(
      `INSERT INTO stock_adjustments
       (product_id, quantity_change, reason)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [product_id, quantity_change, reason]
    );

    // 4. Update stock
    const stockResult = await client.query(
      `UPDATE stock
       SET quantity = quantity + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE product_id = $2
       RETURNING *`,
      [quantity_change, product_id]
    );

    // 5. Add adjustment to stock ledger
    await client.query(
      `INSERT INTO stock_ledger
       (product_id, movement_type, quantity_change, balance_after, reference_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        product_id,
        "ADJUSTMENT",
        quantity_change,
        stockResult.rows[0].quantity,
        adjustmentResult.rows[0].id,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Stock adjustment created",
      adjustment: adjustmentResult.rows[0],
      stock: stockResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).json({
      message: "Failed to create stock adjustment",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  createAdjustment,
};