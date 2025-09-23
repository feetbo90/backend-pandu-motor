const express = require("express");
const router = express.Router();
const controller = require("../controllers/transaction/pendapatanLainController");

router.post("/", controller.create);
router.post("/by-period", controller.getByPeriod);

module.exports = router;
