const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const { User } = require("../../models");

module.exports = {
  // GET /api/users?search=keyword
  async getAll(req, res) {
    try {
      const search = String(req.query.search || req.query.q || "").trim();
      const where = {};

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const users = await User.findAll({
        attributes: ["id", "name", "email"],
        where,
        order: [["name", "ASC"], ["email", "ASC"]]
      });

      return res.json(users);
    } catch (err) {
      return res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },

  // PUT /api/users/:id/password
  async updatePassword(req, res) {
    try {
      const { id } = req.params;
      const newPassword = req.body.new_password ?? req.body.newPassword ?? req.body.password;

      if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
        return res.status(400).json({
          message: "Password baru wajib diisi minimal 6 karakter"
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan" });
      }

      if (!["CABANG", "UNIT"].includes(user.entity_type)) {
        return res.status(400).json({
          message: "Password hanya bisa diganti untuk user cabang atau unit"
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ password: hashedPassword });

      return res.json({
        message: "Password user berhasil diperbarui",
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    } catch (err) {
      return res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  }
};
