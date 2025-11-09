const express = require("express");
const router = express.Router();
const entitiesController = require("../controllers/entitiesController");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /entities/cabang:
 *   get:
 *     summary: Mendapatkan seluruh data cabang aktif
 *     tags:
 *       - Entities
 *     responses:
 *       200:
 *         description: Data cabang berhasil diambil
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.get("/cabang", authMiddleware, entitiesController.getCabang);

module.exports = router;
