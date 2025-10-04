const express = require("express");
const router = express.Router();
const exportController = require("../controllers/master/exportController");
const authMiddleware = require("../middlewares/authMiddleware");


// endpoint untuk export pendapatan.json
router.get("/export/pendapatan", exportController.exportPendapatan);
// endpoint untuk export penjualan.json
router.get("/export/penjualan", exportController.exportPenjualan);
router.get("/export/all", exportController.exportAll);

module.exports = router;
