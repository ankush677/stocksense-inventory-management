const express = require("express");

const {
  getLedger,
} = require("../controllers/ledger.controller");

const router = express.Router();

router.get("/", getLedger);

module.exports = router;