const express = require("express");
const router = express.Router();
const controller = require("../controllers/transaction/labaRugiController");

/**
 * @swagger
 * /laba-rugi:
 *   post:
 *     summary: Create new laba rugi
 *     tags:
 *       - LabaRugi
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
 *               bulan_ini:
 *                 type: integer
 *               kumulatif:
 *                 type: integer
 *               penarikan:
 *                 type: integer
 *               modal:
 *                 type: integer
 *               year:
 *                 type: integer
 *               month:
 *                 type: integer
 *             required:
 *               - branch_id
 *               - period_id
 *     responses:
 *       201:
 *         description: Data laba rugi berhasil ditambahkan
 *       400:
 *         description: Data tidak valid
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /laba-rugi:
 *   get:
 *     summary: Get all laba rugi (paginasi & filter)
 *     tags:
 *       - LabaRugi
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
 *         description: Data laba rugi berhasil diambil
 *       400:
 *         description: branch_id wajib diisi
 *       500:
 *         description: Server error
 */
router.post("/", controller.create);
router.get("/", controller.getAll);

module.exports = router;
