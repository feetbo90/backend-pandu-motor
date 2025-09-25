const express = require("express");
const router = express.Router();
const entityController = require("../controllers/master/entityController");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /entities:
 *   get:
 *     summary: Get all entities
 *     tags:
 *       - Entities
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create new entity
 *     tags:
 *       - Entities
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               entity_type:
 *                 type: string
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *             required:
 *               - name
 *               - entity_type
 *     responses:
 *       201:
 *         description: Entity berhasil diload
 *       400:
 *         description: Data tidak valid
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /entities/{id}:
 *   get:
 *     summary: Get entity by ID
 *     tags:
 *       - Entities
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Entity tidak ditemukan
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update entity by ID
 *     tags:
 *       - Entities
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
 *               name:
 *                 type: string
 *               entity_type:
 *                 type: string
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Entity berhasil diperbarui
 *       404:
 *         description: Entity tidak ditemukan
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Soft delete entity by ID
 *     tags:
 *       - Entities
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Entity berhasil di-nonaktifkan
 *       404:
 *         description: Entity tidak ditemukan
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /entities:
 *   delete:
 *     summary: Delete all entities
 *     tags:
 *       - Entities
 *     responses:
 *       200:
 *         description: Semua entities berhasil dihapus
 *       500:
 *         description: Server error
 */
// CRUD
router.get("/", authMiddleware, entityController.getAll);
router.get("/:id", authMiddleware, entityController.getById);
router.post("/", authMiddleware, entityController.create);
router.put("/:id", authMiddleware, entityController.update);
router.delete("/:id", authMiddleware, entityController.remove);
router.delete("/", authMiddleware, entityController.removeAll);

module.exports = router;
