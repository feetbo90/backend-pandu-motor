const express = require("express");
const router = express.Router();
const controller = require("../controllers/transaction/inputUnitController");

// Endpoint untuk input semua data sekaligus
router.post("/", controller.createAll);
// Ambil semua data berdasarkan branch_id & period_id
router.get("/", controller.getAll);
module.exports = router;
