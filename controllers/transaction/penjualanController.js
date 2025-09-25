const { Penjualan, Period } = require("../../models");

module.exports = {
  // POST /api/penjualan
  async create(req, res) {
    try {
      const { branch_id, period_id, kontan, kredit, leasing, jumlah, year, month } = req.body;

      if (!branch_id || !period_id) {
        return res.status(400).json({ message: "branch_id dan period_id wajib diisi" });
      }

      const data = await Penjualan.create({
        branch_id,
        period_id,
        kontan: kontan || 0,
        kredit: kredit || 0,
        leasing: leasing || 0,
        jumlah: jumlah || 0,
        created_at: new Date(),
        updated_at: new Date(),
        year,
        month,
        version: 1,
        is_active: true
      });

      res.status(201).json({ message: "Data penjualan berhasil disimpan", data });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },
    async remove(req, res) {
    try {
      const data = await Penjualan.findByPk(req.params.id);
      if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });

      await data.destroy();

      res.json({ message: "Data penjualan berhasil dihapus" });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },

  // GET /api/penjualan?branch_id=1&period_id=5
  async getAll(req, res) {
    try {
      const { branch_id, year, month, page = 1 } = req.query;

      if (!branch_id) {
        return res.status(400).json({ message: "branch_id wajib diisi" });
      }

      let finalPeriodId = 0;

      // Kalau tidak ada period_id tapi ada year & month, cari di Periods
      // if (year && month) {
      //   const period = await Period.findOne({
      //     where: { year, month, is_active: true }
      //   });

      //   if (!period) {
      //     return res.status(404).json({ message: "Periode tidak ditemukan" });
      //   }

      //   finalPeriodId = period.id;
      // }

      let data, total, totalPages;
      const limit = 10;
      const offset = (parseInt(page) - 1) * limit;

      if (year && month) {
        const { count, rows } = await Penjualan.findAndCountAll({
          where: { branch_id, year, month, is_active: true },
          order: [["created_at", "DESC"]],
          limit,
          offset
        });
        data = rows;
        total = count;
        totalPages = Math.ceil(count / limit);
      } else {
        // Jika year & month tidak diinput, ambil semua data branch_id dan paginasi
        const { count, rows } = await Penjualan.findAndCountAll({
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
        message: "Data penjualan berhasil diambil",
        period_id: finalPeriodId || null,
        data,
        total,
        totalPages,
        currentPage: parseInt(page)
      });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },
};
