const express = require("express");
const router = express.Router();
const controller = require("../controllers/transaction/barangPkController");
const authMiddleware = require("../middlewares/authMiddleware");
/**
 * @swagger
 * /barang-pk:
 *   post:
 *     summary: Create new barang PK
 *     tags:
 *       - BarangPK
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
 *                 description: Field lain sesuai kebutuhan barang PK
 *             required:
 *               - branch_id
 *               - period_id
 *     responses:
 *       201:
 *         description: Data barang_pk berhasil ditambahkan
 *       400:
 *         description: Data tidak valid
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /barang-pk:
 *   get:
 *     summary: Get all barang PK (paginasi & filter)
 *     tags:
 *       - BarangPK
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
 *         description: Data barang_pk berhasil diambil
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
