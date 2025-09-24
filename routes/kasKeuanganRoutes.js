const express = require("express");
const router = express.Router();
const controller = require("../controllers/transaction/kasKeuanganController");

/**
 * @swagger
 * /kas-keuangan:
 *   post:
 *     summary: Create new kas keuangan
 *     tags:
 *       - KasKeuangan
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
 *               year:
 *                 type: integer
 *               month:
 *                 type: integer
 *               kas_tunai:
 *                 type: integer
 *               rekening_bank:
 *                 type: integer
 *               jumlah_kas_lancar:
 *                 type: integer
 *               bon_karyawan:
 *                 type: integer
 *               bon_pusat:
 *                 type: integer
 *               bon_operasional:
 *                 type: integer
 *               bon_gantung:
 *                 type: integer
 *               jumlah_kas_macet:
 *                 type: integer
 *               saldo_akhir:
 *                 type: integer
 *             required:
 *               - branch_id
 *               - period_id
 *     responses:
 *       201:
 *         description: Data kas keuangan berhasil ditambahkan
 *       400:
 *         description: Data tidak valid
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /kas-keuangan:
 *   get:
 *     summary: Get all kas keuangan (paginasi & filter)
 *     tags:
 *       - KasKeuangan
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
 *         description: Data kas keuangan berhasil diambil
 *       400:
 *         description: branch_id wajib diisi
 *       500:
 *         description: Server error
 */
router.post("/", controller.create);
router.get("/", controller.getAll);

module.exports = router;
