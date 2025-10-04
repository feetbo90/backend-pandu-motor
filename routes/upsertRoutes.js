const express = require("express");
const router = express.Router();
const controller = require("../controllers/transaction/upsertController");
const upload = require("../utils/upload"); // multer setup

// Upload file .json
router.post("/import-to-cabang", upload.single("file"), controller.bulkUpsert);

// Kirim langsung JSON di body
router.post("/bulk-upsert-body", controller.bulkUpsertFromBody);

module.exports = router;
