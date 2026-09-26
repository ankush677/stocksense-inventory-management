const express = require("express");

const {
  createAdjustment,
} = require("../controllers/adjustments.controller");

const router = express.Router();

router.post("/", createAdjustment);

module.exports = router;