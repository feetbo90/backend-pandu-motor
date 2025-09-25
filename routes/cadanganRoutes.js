const express = require("express");
const router = express.Router();
const cadanganController = require("../controllers/transaction/cadanganController");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /cadangan:
 *   get:
 *     summary: Get all cadangan
 *     tags:
 *       - Cadangan
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID cabang
 *       - in: query
 *         name: year
 *         required: false
 *         schema:
 *           type: integer
 *         description: Tahun
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: integer
 *         description: Bulan
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *         description: Nomor halaman (default 1)
 *     responses:
 *       200:
 *         description: Data cadangan berhasil diambil
 *       400:
 *         description: branch_id wajib diisi
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create new cadangan
 *     tags:
 *       - Cadangan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branch_id
 *               - period_id
 *             properties:
 *               branch_id:
 *                 type: integer
 *               period_id:
 *                 type: integer
 *               year:
 *                 type: integer
 *               month:
 *                 type: integer
 *               keterangan:
 *                 type: string
 *     responses:
 *       201:
 *         description: Data cadangan berhasil ditambahkan
 *       400:
 *         description: branch_id atau period_id tidak diisi
 *       500:
 *         description: Server error
 */

// Routes
router.get("/", authMiddleware, cadanganController.getAll);
router.post("/", authMiddleware, cadanganController.create);

module.exports = router;
