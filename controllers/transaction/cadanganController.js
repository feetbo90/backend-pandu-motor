const { Cadangan, Period } = require("../../models");

module.exports = {
  // POST /api/cadangan
  async create(req, res) {
    try {
      const { branch_id, year, month, ...rest } = req.body;

      if (!branch_id) {
        return res.status(400).json({ message: "branch_id wajib diisi" });
      }

      const data = await Cadangan.create({
        branch_id,
        period_id: 1,
        year,
        month,
        ...rest,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        is_active: true
      });

      res.status(201).json({
        message: "Data cadangan berhasil ditambahkan",
        data
      });
    } catch (err) {
      res.status(500).json({
        message: "Terjadi kesalahan",
        error: err.message
      });
    }
  },

  // GET /api/cadangan?branch_id=1&year=2025&month=6
  async getAll(req, res) {
    try {
      const { branch_id, year, month, page = 1 } = req.query;

      if (!branch_id) {
        return res.status(400).json({ message: "branch_id wajib diisi" });
      }

      let finalPeriodId = 0;

    //   if (year && month) {
    //     const period = await Period.findOne({
    //       where: { year, month, is_active: true }
    //     });

    //     if (period) {
    //       finalPeriodId = period.id;
    //     }
    //   }

      let data, total, totalPages;
      const limit = 10;
      const offset = (parseInt(page) - 1) * limit;

      // Asumsi: limit, offset, branch_id, year, month tersedia di scope
      const where = { branch_id, is_active: true };

      // Tambahkan filter kondisional
      if (year) where.year = year;
      if (month) where.month = month;

      const hasFilter = Boolean(year || month);

      if (hasFilter) {
        // Jika ada filter year/month => ambil semua hasil (sesuai perilaku asli)
        data = await Cadangan.findAll({
          where,
          order: [["created_at", "DESC"]],
        });
        total = data.length;
        totalPages = 1;
      } else {
        // Jika tidak ada filter => lakukan paginasi (limit + offset) + hitung total
        // Jalankan kedua query secara paralel untuk menghemat waktu
        const [rows, count] = await Promise.all([
          Cadangan.findAll({
            where,
            order: [["created_at", "DESC"]],
            limit,
            offset,
          }),
          Cadangan.count({ where }),
        ]);

        data = rows;
        total = count;
        totalPages = Math.ceil(count / limit);
      }

      res.status(200).json({
        message: "Data cadangan berhasil diambil",
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
      const data = await Cadangan.findByPk(req.params.id);
      if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });

      await data.destroy();

      res.json({ message: "Data cadangan berhasil dihapus (soft delete)" });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },
  
  async update(req, res) {
    try {
      const data = await Cadangan.findByPk(req.params.id);
      if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });

      await data.update({
        ...req.body,
        updated_at: new Date(),
        version: data.version + 1
      });

      res.json({ message: "Data cadangan berhasil diperbarui", data });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  }
};