const express = require("express");

const {
  createReceipt,
} = require("../controllers/receipts.controller");

const router = express.Router();

router.post("/", createReceipt);

module.exports = router;