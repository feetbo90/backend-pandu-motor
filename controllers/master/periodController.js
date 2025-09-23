const { Period } = require("../../models");

module.exports = {
  // GET /api/periods
  async getAll(req, res) {
    try {
      const periods = await Period.findAll({
        where: { is_active: true },
        order: [["year", "DESC"], ["month", "DESC"]]
      });
      res.json(periods);
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },

  // GET /api/periods/:id
  async getById(req, res) {
    try {
      const period = await Period.findByPk(req.params.id);
      if (!period) return res.status(404).json({ message: "Period tidak ditemukan" });
      res.json(period);
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },

  // POST /api/periods
  async create(req, res) {
    try {
      const { month, year } = req.body;
      if (!month || !year) {
        return res.status(400).json({ message: "Month dan year wajib diisi" });
      }

      const existing = await Period.findOne({ where: { month, year } });
      if (existing) {
        return res.status(400).json({ message: "Period sudah ada" });
      }

      const period = await Period.create({
        month,
        year,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        is_active: true
      });

      res.status(201).json({ message: "Period berhasil dibuat", data: period });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },

  // PUT /api/periods/:id
  async update(req, res) {
    try {
      const { month, year, is_active } = req.body;
      const period = await Period.findByPk(req.params.id);

      if (!period) return res.status(404).json({ message: "Period tidak ditemukan" });

      await period.update({
        month: month ?? period.month,
        year: year ?? period.year,
        is_active: is_active ?? period.is_active,
        updated_at: new Date(),
        version: period.version + 1
      });

      res.json({ message: "Period berhasil diperbarui", data: period });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },

  // DELETE /api/periods/:id (soft delete)
  async remove(req, res) {
    try {
      const period = await Period.findByPk(req.params.id);
      if (!period) return res.status(404).json({ message: "Period tidak ditemukan" });

      await period.update({
        is_active: false,
        updated_at: new Date(),
        version: period.version + 1
      });

      res.json({ message: "Period berhasil dinonaktifkan" });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },

  // DELETE /api/periods (hapus semua period)
  async removeAll(req, res) {
    try {
      await Period.destroy({
        where: {},
        truncate: true,
        restartIdentity: true,
        cascade: true
      });

      res.json({ message: "Semua period berhasil dihapus" });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  }
};
