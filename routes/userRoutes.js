const express = require("express");
const router = express.Router();
const userController = require("../controllers/master/userController");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get list users
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Server error
 */
router.get("/", authMiddleware, userController.getAll);

/**
 * @swagger
 * /users/{id}/password:
 *   put:
 *     summary: Update password user cabang atau unit
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
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
 *               password:
 *                 type: string
 *                 example: "password123"
 *             required:
 *               - password
 *     responses:
 *       200:
 *         description: Password user berhasil diperbarui
 *       400:
 *         description: Data tidak valid
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Server error
 */
router.put("/:id/password", authMiddleware, userController.updatePassword);

module.exports = router;
