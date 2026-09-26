const express = require("express");

const {
  createTransfer,
  getTransfers,
} = require("../controllers/transfers.controller");

const router = express.Router();

router.get("/", getTransfers);
router.post("/", createTransfer);

module.exports = router;