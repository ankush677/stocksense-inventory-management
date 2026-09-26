const pool = require("../config/db");

const getLedger = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        l.id,
        l.product_id,
        p.name AS product_name,
        p.sku,
        l.movement_type,
        l.quantity_change,
        l.balance_after,
        l.reference_id,
        l.created_at
      FROM stock_ledger l
      JOIN products p ON p.id = l.product_id
      ORDER BY l.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch stock ledger",
    });
  }
};

module.exports = {
  getLedger,
};