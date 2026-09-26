const pool = require("../config/db");

const getDashboard = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM products) AS total_products,
        COALESCE((SELECT SUM(quantity) FROM stock), 0) AS total_stock,
        (
          SELECT COUNT(*)
          FROM products p
          JOIN stock s ON s.product_id = p.id
          WHERE s.quantity <= p.reorder_level
        ) AS low_stock_count,
        (SELECT COUNT(*) FROM receipts) AS receipts_count,
        (SELECT COUNT(*) FROM deliveries) AS deliveries_count
    `);

    const row = result.rows[0];

    res.json({
      total_products: Number(row.total_products),
      total_stock: Number(row.total_stock),
      low_stock_count: Number(row.low_stock_count),
      receipts_count: Number(row.receipts_count),
      deliveries_count: Number(row.deliveries_count),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch dashboard data",
    });
  }
};

module.exports = {
  getDashboard,
};