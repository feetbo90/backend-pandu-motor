const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth/authController");

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register user baru
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               entity_type:
 *                 type: string
 *                 nullable: true
 *               entity_id:
 *                 type: integer
 *                 nullable: true
 *             required:
 *               - name
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: User berhasil diregistrasi
 *       400:a
 *         description: Data tidak valid atau email sudah terdaftar
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Login berhasil
 *       401:
 *         description: Password salah
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Server error
 */
router.post("/register", authController.register);
router.post("/login", authController.login);

module.exports = router;
