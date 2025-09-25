const { User } = require("../../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret_key";

module.exports = {
  // Register user baru
  async register(req, res) {
    try {
      const { name, email, password, entity_type, entity_id } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, dan password wajib diisi" });
      }

      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(400).json({ message: "Email sudah terdaftar" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        entity_type: entity_type || null,
        entity_id: entity_id || null,
        created_at: new Date()
      });

      return res.status(201).json({
        message: "User berhasil diregistrasi",
        user: { id: user.id, email: user.email, name: user.name }
      });
    } catch (err) {
      return res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },

  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email dan password wajib diisi" });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Password salah" });
      }

      const payload = {
        id: user.id,
        email: user.email,
        entity_type: user.entity_type,
        entity_id: user.entity_id
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
      const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });

      return res.json({
        message: "Login berhasil",
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          entity_type: user.entity_type,
          entity_id: user.entity_id
        }
      });
    } catch (err) {
      return res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },

  // Refresh token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token wajib diisi" });
      }

      jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, user) => {
        if (err) {
          return res.status(403).json({ message: "Refresh token tidak valid" });
        }

        const payload = {
          id: user.id,
          email: user.email,
          entity_type: user.entity_type,
          entity_id: user.entity_id
        };

        const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

        return res.json({
          message: "Token berhasil diperbarui",
          token: newToken
        });
      });
    } catch (err) {
      return res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  }
};
