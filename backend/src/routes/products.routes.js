const express = require("express");

const {
  getProducts,
  createProduct,
} = require("../controllers/products.controller");

const router = express.Router();

router.get("/", getProducts);
router.post("/", createProduct);

module.exports = router;