const { KasKeuangan, Period } = require("../../models");

module.exports = {
  // POST /api/kas-keuangan
  async create(req, res) {
    try {
      const { branch_id, period_id, year, month, ...rest } = req.body;

      if (!branch_id || !period_id) {
        return res.status(400).json({ message: "branch_id dan period_id wajib diisi" });
      }

      const data = await KasKeuangan.create({
        branch_id,
        period_id,
        year,
        month,
        ...rest,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        is_active: true
      });

      res.status(201).json({
        message: "Data kas keuangan berhasil ditambahkan",
        data
      });
    } catch (err) {
      res.status(500).json({
        message: "Terjadi kesalahan",
        error: err.message
      });
    }
  },

  // GET /api/kas-keuangan?branch_id=1&year=2025&month=6
  async getAll(req, res) {
    try {
      const { branch_id, year, month, page = 1 } = req.query;

      if (!branch_id) {
        return res.status(400).json({ message: "branch_id wajib diisi" });
      }

      let data, total, totalPages;
      const limit = 10;
      const offset = (parseInt(page) - 1) * limit;

      if (year && month) {
        const { count, rows } = await KasKeuangan.findAndCountAll({
          where: { branch_id, year, month, is_active: true },
          order: [["created_at", "DESC"]],
          limit,
          offset
        });
        data = rows;
        total = count;
        totalPages = Math.ceil(count / limit);
      } else {
        const { count, rows } = await KasKeuangan.findAndCountAll({
          where: { branch_id, is_active: true },
          order: [["created_at", "DESC"]],
          limit,
          offset
        });
        data = rows;
        total = count;
        totalPages = Math.ceil(count / limit);
      }

      res.status(200).json({
        message: "Data kas keuangan berhasil diambil",
        data,
        total,
        totalPages,
        currentPage: parseInt(page)
      });
    } catch (err) {
      res.status(500).json({
        message: "Terjadi kesalahan",
        error: err.message
      });
    }
  },
    async remove(req, res) {
    try {
      const data = await KasKeuangan.findByPk(req.params.id);
      if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });

      await data.destroy();

      res.json({ message: "Data Kas Keuangan berhasil dihapus" });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  }
};
      