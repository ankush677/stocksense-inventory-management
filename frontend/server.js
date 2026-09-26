const express = require("express");
const pool = require("./src/config/db");
const productsRoutes = require("./src/routes/products.routes");
const receiptsRoutes = require("./src/routes/receipts.routes");
const deliveriesRoutes = require("./src/routes/deliveries.routes");
const adjustmentsRoutes = require("./src/routes/adjustments.routes");
const ledgerRoutes = require("./src/routes/ledger.routes");
const dashboardRoutes = require("./src/routes/dashboard.routes");
const transfersRoutes = require("./src/routes/transfers.routes");

const app = express();
const PORT = 5000;

app.use(express.json());

// CORS: required so the frontend (running on a different port/origin)
// can call this API from the browser. Does not touch any routes,
// controllers, or database logic.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use("/api/products", productsRoutes);

app.use("/api/receipts", receiptsRoutes);

app.use("/api/deliveries", deliveriesRoutes);

app.use("/api/adjustments", adjustmentsRoutes);

app.use("/api/ledger", ledgerRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/transfers", transfersRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "StockSense Backend is running 🚀",
  });
});

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});