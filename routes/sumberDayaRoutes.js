const express = require("express");
const router = express.Router();
const controller = require("../controllers/transaction/sumberDayaController");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /sumber-daya:
 *   post:
 *     summary: Create new sumber daya
 *     tags:
 *       - SumberDaya
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
 *               jumlah_karyawan:
 *                 type: integer
 *               formasi_tenaga:
 *                 type: string
 *               pimpinan:
 *                 type: integer
 *               kasir:
 *                 type: integer
 *               administrasi:
 *                 type: integer
 *               pdl:
 *                 type: integer
 *               kontrak_kantor:
 *                 type: integer
 *               inventaris_mobil:
 *                 type: integer
 *               inventaris_mobil_ket:
 *                 type: string
 *               sisa_inventaris_pendirian:
 *                 type: integer
 *               penyusutan_bulan:
 *                 type: integer
 *             required:
 *               - branch_id
 *               - period_id
 *     responses:
 *       201:
 *         description: Data sumber daya berhasil ditambahkan
 *       400:
 *         description: Data tidak valid
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /sumber-daya:
 *   get:
 *     summary: Get all sumber daya (paginasi & filter)
 *     tags:
 *       - SumberDaya
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
 *         description: Data sumber daya berhasil diambil
 *       400:
 *         description: branch_id wajib diisi
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /sumber-daya/{id}:
 *   put:
 *     summary: Update sumber daya by ID
 *     tags:
 *       - SumberDaya
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               branch_id:
 *                 type: integer
 *               year:
 *                 type: integer
 *               month:
 *                 type: integer
 *               jumlah_karyawan:
 *                 type: integer
 *               formasi_tenaga:
 *                 type: string
 *               pimpinan:
 *                 type: integer
 *               kasir:
 *                 type: integer
 *               administrasi:
 *                 type: integer
 *               pdl:
 *                 type: integer
 *               kontrak_kantor:
 *                 type: integer
 *               inventaris_mobil:
 *                 type: integer
 *               inventaris_mobil_ket:
 *                 type: string
 *               sisa_inventaris_pendirian:
 *                 type: integer
 *               penyusutan_bulan:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Data sumber daya berhasil diupdate
 *       404:
 *         description: Data sumber daya tidak ditemukan
 *       500:
 *         description: Server error
 */
router.post("/", authMiddleware, controller.create);
router.get("/", authMiddleware, controller.getAll);
router.put('/sumber-daya/:id', authMiddleware, controller.update);

module.exports = router;
