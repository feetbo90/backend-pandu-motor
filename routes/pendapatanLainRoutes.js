const express = require("express");
const router = express.Router();
const controller = require("../controllers/transaction/pendapatanLainController");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /pendapatan-lain:
 *   post:
 *     summary: Create new pendapatan lain
 *     tags:
 *       - PendapatanLain
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
 *                 description: Field lain sesuai kebutuhan pendapatan lain
 *             required:
 *               - branch_id
 *               - period_id
 *     responses:
 *       201:
 *         description: Data pendapatan_lain berhasil ditambahkan
 *       400:
 *         description: Data tidak valid
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /pendapatan-lain/by-period:
 *   get:
 *     summary: Get all pendapatan lain by period (paginasi & filter)
 *     tags:
 *       - PendapatanLain
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
 *         description: Data pendapatan_lain berhasil diambil
 *       400:
 *         description: branch_id wajib diisi
 *       500:
 *         description: Server error
 */
router.get("/", authMiddleware, controller.getAll);
router.post("/", authMiddleware, controller.create);
router.post("/by-period", authMiddleware, controller.getByPeriod);
router.delete("/:id", authMiddleware, controller.remove);
router.put("/:id", authMiddleware, controller.update);

module.exports = router;
