const express = require("express");
const router = express.Router();
const controller = require("../controllers/transaction/penjualanController");

/**
 * @swagger
 * /penjualan:
 *   post:
 *     summary: Create new penjualan
 *     tags:
 *       - Penjualan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               branch_id:
 *                 type: integer
 *               period_id:
 *                 type: integer
 *               kontan:
 *                 type: integer
 *               kredit:
 *                 type: integer
 *               leasing:
 *                 type: integer
 *               jumlah:
 *                 type: integer
 *             required:
 *               - branch_id
 *               - period_id
 *     responses:
 *       201:
 *         description: Data penjualan berhasil disimpan
 *       400:
 *         description: Data tidak valid
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /penjualan:
 *   get:
 *     summary: Get all penjualan (paginasi & filter)
 *     tags:
 *       - Penjualan
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Data penjualan berhasil diambil
 *       400:
 *         description: branch_id wajib diisi
 *       500:
 *         description: Server error
 */
router.post("/", controller.create);
router.get("/", controller.getAll);

module.exports = router;
