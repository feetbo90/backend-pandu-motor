const express = require("express");
const router = express.Router();
const controller = require("../controllers/transaction/piutangController");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /piutang:
 *   post:
 *     summary: Create new piutang
 *     tags:
 *       - Piutang
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
 *                 description: Field lain sesuai kebutuhan piutang
 *             required:
 *               - branch_id
 *               - period_id
 *     responses:
 *       201:
 *         description: Data piutang berhasil ditambahkan
 *       400:
 *         description: Data tidak valid
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /piutang:
 *   get:
 *     summary: Get all piutang (paginasi & filter)
 *     tags:
 *       - Piutang
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
 *         description: Data piutang berhasil diambil
 *       400:
 *         description: branch_id wajib diisi
 *       500:
 *         description: Server error
 */
router.post("/", authMiddleware, controller.create);
router.get("/", authMiddleware, controller.getAll);
router.delete("/:id", authMiddleware, controller.remove);
router.put("/:id", authMiddleware, controller.update);

module.exports = router;
