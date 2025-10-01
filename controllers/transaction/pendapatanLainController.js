const { PendapatanLain, Period } = require("../../models");

module.exports = {
  // POST /api/pendapatan-lain
    async getAll(req, res) {
    try {
      const { branch_id, year, month, page = 1 } = req.query;

      if (!branch_id) {
        return res.status(400).json({ message: "branch_id wajib diisi" });
      }

      let finalPeriodId = 0;

      // Kalau tidak ada period_id tapi ada year & month, ambil dari tabel periods
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
        data = await PendapatanLain.findAll({
          where: { branch_id, year, month, is_active: true },
          order: [["created_at", "DESC"]]
        });
        total = data.length;
        totalPages = 1;
      } else {
        // Jika year & month tidak diinput, ambil semua data branch_id dan paginasi
        const { count, rows } = await PendapatanLain.findAndCountAll({
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
        message: "Data pendapatan berhasil diambil",
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
  },
  async create(req, res) {
    try {
      const { branch_id, ...rest } = req.body;

      if (!branch_id) {
        return res.status(400).json({ message: "branch_id wajib diisi" });
      }

      const data = await PendapatanLain.create({
        branch_id,
        period_id: 1,
        ...rest,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        is_active: true
      });

      res.status(201).json({
        message: "Data pendapatan_lain berhasil ditambahkan",
        data
      });
    } catch (err) {
      res.status(500).json({
        message: "Terjadi kesalahan",
        error: err.message
      });
    }
  },

  // GET /api/pendapatan-lain/by-period
  async getByPeriod(req, res) {
    try {
      const { branch_id, year, month, page = 1 } = req.query; // atau req.query

      if (!branch_id) {
        return res.status(400).json({ message: "branch_id wajib diisi" });
      }

      let finalPeriodId = 0;

      // if (year && month) {
      //   // cari periode
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
        const { count, rows } = await PendapatanLain.findAndCountAll({
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
        const { count, rows } = await PendapatanLain.findAndCountAll({
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
        message: "Data pendapatan_lain berhasil diambil",
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
  },
    async remove(req, res) {
    try {
      const data = await PendapatanLain.findByPk(req.params.id);
      if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });

      await data.destroy();

      res.json({ message: "Data Pendapatan Lain berhasil dihapus" });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },
  async update(req, res) {
    try {
      const { id } = req.params;
      const { branch_id, year, month, ...rest } = req.body;

      if (!branch_id) {
        return res.status(400).json({ message: "branch_id wajib diisi" });
      }

      const data = await PendapatanLain.findByPk(id);
      if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });

      await data.update({
        branch_id,
        period_id: 1,
        year,
        month,
        ...rest,
        updated_at: new Date(),
        version: data.version + 1
      });

      res.status(200).json({
        message: "Data kas keuangan berhasil diperbarui",
        data
      });
    } catch (err) {
      res.status(500).json({
        message: "Terjadi kesalahan",
        error: err.message
      });
    }
  }
};
