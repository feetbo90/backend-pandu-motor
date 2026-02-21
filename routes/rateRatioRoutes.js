const express = require("express");
const router = express.Router();
const rateRatioController = require("../controllers/transaction/rateRatioController");
const rateRatioRangeController = require("../controllers/transaction/rateRatioRangeController");
const newRateRangeController = require("../controllers/transaction/newRateRangeController");
const newRateMonthlyController = require("../controllers/transaction/newRateMonthlyController");
const rateRatioMetricsController = require("../controllers/transaction/rateRatioMetricsController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/rate", authMiddleware, rateRatioController.getRate);
router.get("/:entity_id/descendants", authMiddleware, rateRatioController.getRateDescendants);
router.get(
  "/:entity_id/descendants/range",
  authMiddleware,
  rateRatioRangeController.getRateDescendantsRange
);
router.get(
  "/:entity_id/descendants/new-rate-range",
  authMiddleware,
  newRateRangeController.getNewRateRange
);
router.get(
  "/:entity_id/descendants/new-rate-by-month",
  authMiddleware,
  newRateMonthlyController.getNewRateByMonth
);
router.get(
  "/:entity_id/descendants/pembiayaan-unit-penjualan",
  authMiddleware,
  rateRatioMetricsController.getPembiayaanUnitPenjualan
);
router.get(
  "/:entity_id/descendants/rates-ratios",
  authMiddleware,
  rateRatioMetricsController.getRatesRatios
);
router.get("/:entity_id/ratio/descendants", authMiddleware, rateRatioController.getRatioDescendants);


module.exports = router;
