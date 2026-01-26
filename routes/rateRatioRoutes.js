const express = require("express");
const router = express.Router();
const rateRatioController = require("../controllers/transaction/rateRatioController");
const rateRatioRangeController = require("../controllers/transaction/rateRatioRangeController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/rate", authMiddleware, rateRatioController.getRate);
router.get("/:entity_id/descendants", authMiddleware, rateRatioController.getRateDescendants);
router.get(
  "/:entity_id/descendants/range",
  authMiddleware,
  rateRatioRangeController.getRateDescendantsRange
);
router.get("/:entity_id/ratio/descendants", authMiddleware, rateRatioController.getRatioDescendants);


module.exports = router;
