const express = require("express");
const pool = require("./src/config/db");

const app = express();
const PORT = 5000;

app.use(express.json());
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Database connected successfully",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    message: "StockSense Backend is running 🚀",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});