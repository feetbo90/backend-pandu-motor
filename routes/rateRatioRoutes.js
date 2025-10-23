const express = require("express");
const router = express.Router();
const rateRatioController = require("../controllers/transaction/rateRatioController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/rate", authMiddleware, rateRatioController.getRate);

module.exports = router;
