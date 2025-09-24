const express = require("express");
const router = express.Router();
const controller = require("../controllers/transaction/sirkulasiPiutangController");

/**
 * @swagger
 * /sirkulasi-piutang:
 *   post:
 *     summary: Create new sirkulasi piutang
 *     tags:
 *       - SirkulasiPiutang
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
 *               ...rest:
 *                 type: object
 *                 description: Field lain sesuai kebutuhan sirkulasi piutang
 *             required:
 *               - branch_id
 *               - period_id
 *     responses:
 *       201:
 *         description: Data sirkulasi_piutang berhasil ditambahkan
 *       400:
 *         description: Data tidak valid
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /sirkulasi-piutang:
 *   get:
 *     summary: Get all sirkulasi piutang (paginasi & filter)
 *     tags:
 *       - SirkulasiPiutang
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
 *         description: Data sirkulasi_piutang berhasil diambil
 *       400:
 *         description: branch_id wajib diisi
 *       500:
 *         description: Server error
 */
router.post("/", controller.create);
router.get("/", controller.getAll);

module.exports = router;
