const express = require("express");
const router = express.Router();
const controller = require("../controllers/transaction/pendapatanController");

router.post("/", controller.create);
router.get("/", controller.getAll);

module.exports = router;
