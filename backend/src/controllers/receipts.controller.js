const pool = require("../config/db");

const createReceipt = async (req, res) => {
  const client = await pool.connect();

  try {
    const { product_id, quantity } = req.body;

    await client.query("BEGIN");

    // 1. Create receipt
    const receiptResult = await client.query(
      `INSERT INTO receipts (product_id, quantity)
       VALUES ($1, $2)
       RETURNING *`,
      [product_id, quantity]
    );

    // 2. Increase stock
    const stockResult = await client.query(
      `UPDATE stock
       SET quantity = quantity + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE product_id = $2
       RETURNING *`,
      [quantity, product_id]
    );

    // 3. Make sure stock exists
    if (stockResult.rows.length === 0) {
      throw new Error("Stock record not found for this product");
    }

    // 4. Add movement to ledger
    await client.query(
      `INSERT INTO stock_ledger
       (product_id, movement_type, quantity_change, balance_after, reference_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        product_id,
        "RECEIPT",
        quantity,
        stockResult.rows[0].quantity,
        receiptResult.rows[0].id,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Receipt created and stock updated",
      receipt: receiptResult.rows[0],
      stock: stockResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).json({
      message: "Failed to create receipt",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  createReceipt,
};