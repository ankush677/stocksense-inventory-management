const express = require("express");

const {
  createDelivery,
} = require("../controllers/deliveries.controller");

const router = express.Router();

router.post("/", createDelivery);

module.exports = router;