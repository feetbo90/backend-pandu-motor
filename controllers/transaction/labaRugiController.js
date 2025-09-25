const { LabaRugi } = require("../../models");

module.exports = {
  // POST /api/laba-rugi
  async create(req, res) {
    try {
      const { branch_id, period_id, ...rest } = req.body;

      if (!branch_id || !period_id) {
        return res.status(400).json({ message: "branch_id dan period_id wajib diisi" });
      }

      const data = await LabaRugi.create({
        branch_id,
        period_id,
        ...rest,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        is_active: true
      });

      res.status(201).json({
        message: "Data laba rugi berhasil ditambahkan",
        data
      });
    } catch (err) {
      res.status(500).json({
        message: "Terjadi kesalahan",
        error: err.message
      });
    }
  },

  // GET /api/laba-rugi?branch_id=1&year=2025&month=6
  async getAll(req, res) {
    try {
      const { branch_id, year, month, page = 1 } = req.query;

      if (!branch_id) {
        return res.status(400).json({
          message: "branch_id wajib diisi"
        });
      }

      let finalPeriodId = 0;

    //   if (year && month) {
    //     // Cari period_id dari tabel periods
    //     const period = await Period.findOne({
    //       where: { year, month, is_active: true }
    //     });

    //     if (!period) {
    //       return res.status(404).json({
    //         message: `Periode ${month}-${year} tidak ditemukan`
    //       });
    //     }

    //     finalPeriodId = period.id;
    //   }

      let data, total, totalPages;
      const limit = 10;
      const offset = (parseInt(page) - 1) * limit;

      if (year && month) {
        const { count, rows } = await LabaRugi.findAndCountAll({
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
        const { count, rows } = await LabaRugi.findAndCountAll({
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
        message: "Data laba rugi berhasil diambil",
        period_id: finalPeriodId || null,
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
  }
  ,
    async remove(req, res) {
    try {
      const data = await LabaRugi.findByPk(req.params.id);
      if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });

      await data.destroy();

      res.json({ message: "Data Laba Rugi berhasil dihapus" });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  }
};