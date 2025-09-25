const express = require("express");
const router = express.Router();
const controller = require("../controllers/transaction/sirkulasiStockController");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /sirkulasi-stock:
 *   post:
 *     summary: Create new sirkulasi stock
 *     tags:
 *       - SirkulasiStock
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
 *                 description: Field lain sesuai kebutuhan sirkulasi stock
 *             required:
 *               - branch_id
 *               - period_id
 *     responses:
 *       201:
 *         description: Data sirkulasi_stock berhasil ditambahkan
 *       400:
 *         description: Data tidak valid
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /sirkulasi-stock:
 *   get:
 *     summary: Get all sirkulasi stock (paginasi & filter)
 *     tags:
 *       - SirkulasiStock
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
 *         description: Data sirkulasi_stock berhasil diambil
 *       400:
 *         description: branch_id wajib diisi
 *       500:
 *         description: Server error
 */
router.post("/", authMiddleware, controller.create);
router.get("/", authMiddleware, controller.getAll);
router.delete("/:id", authMiddleware, controller.remove);

module.exports = router;
