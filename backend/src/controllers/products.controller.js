const pool = require("../config/db");

const getProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.category,
        p.unit,
        p.reorder_level,
        COALESCE(s.quantity, 0) AS quantity,
        p.created_at
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      ORDER BY p.id ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, sku, category, unit, reorder_level } = req.body;

    const result = await pool.query(
      `INSERT INTO products
       (name, sku, category, unit, reorder_level)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, sku, category, unit, reorder_level || 0]
    );

    await pool.query(
      `INSERT INTO stock (product_id, quantity)
       VALUES ($1, 0)`,
      [result.rows[0].id]
    );

    res.status(201).json({
      ...result.rows[0],
      quantity: 0,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create product",
    });
  }
};

module.exports = {
  getProducts,
  createProduct,
};