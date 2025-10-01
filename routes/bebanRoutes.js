const express = require("express");
const router = express.Router();
const controller = require("../controllers/transaction/bebanController");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /beban:
 *   post:
 *     summary: Create new beban
 *     tags:
 *       - Beban
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
 *               gaji:
 *                 type: integer
 *               admin:
 *                 type: integer
 *               operasional:
 *                 type: integer
 *               beban_umum_operasional:
 *                 type: integer
 *               penyusutan_aktiva:
 *                 type: integer
 *               cadangan_piutang:
 *                 type: integer
 *               cadangan_stock:
 *                 type: integer
 *             required:
 *               - branch_id
 *               - period_id
 *     responses:
 *       201:
 *         description: Data beban berhasil ditambahkan
 *       400:
 *         description: Data tidak valid
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /beban:
 *   get:
 *     summary: Get all beban (paginasi & filter)
 *     tags:
 *       - Beban
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
 *         description: Data beban berhasil diambil
 *       400:
 *         description: branch_id wajib diisi
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /beban/{id}/update-fields:
 *   put:
 *     summary: Update penyusutan_aktiva, cadangan_stock, dan total pada beban
 *     tags:
 *       - Beban
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
 *               penyusutan_aktiva:
 *                 type: integer
 *               cadangan_stock:
 *                 type: integer
 *               total:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Data beban berhasil diupdate
 *       404:
 *         description: Data beban tidak ditemukan
 *       500:
 *         description: Server error
 */
router.post("/", authMiddleware, controller.create);
router.get("/", authMiddleware, controller.getAll);
router.put('/:id/update-fields', authMiddleware,controller.updateFields);
router.put('/:id', authMiddleware,controller.update);

router.delete("/:id", authMiddleware, controller.remove);

module.exports = router;
