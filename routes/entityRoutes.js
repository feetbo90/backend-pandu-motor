const express = require("express");
const router = express.Router();
const entityController = require("../controllers/master/entityController");

// CRUD
router.get("/", entityController.getAll);
router.get("/:id", entityController.getById);
router.post("/", entityController.create);
router.put("/:id", entityController.update);
router.delete("/:id", entityController.remove);
router.delete("/", entityController.removeAll);

module.exports = router;
