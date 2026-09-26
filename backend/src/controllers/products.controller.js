const pool = require("../config/db");

const getProducts = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id ASC"
    );

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

    res.status(201).json(result.rows[0]);
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