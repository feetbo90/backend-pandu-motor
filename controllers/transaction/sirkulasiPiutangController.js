const { SirkulasiPiutang, Period } = require("../../models");

module.exports = {
  // POST /api/sirkulasi-piutang
  async create(req, res) {
    try {
      const { branch_id, ...rest } = req.body;

      if (!branch_id) {
        return res.status(400).json({ message: "branch_id wajib diisi" });
      }

      const data = await SirkulasiPiutang.create({
        branch_id,
        period_id: 1,
        ...rest,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        is_active: true
      });

      res.status(201).json({
        message: "Data sirkulasi_piutang berhasil ditambahkan",
        data
      });
    } catch (err) {
      res.status(500).json({
        message: "Terjadi kesalahan",
        error: err.message
      });
    }
  },

  // GET /api/sirkulasi-piutang?branch_id=1&year=2025&month=6
  async getAll(req, res) {
    try {
      const { branch_id, year, month, page = 1 } = req.query;

      if (!branch_id) {
        return res.status(400).json({
          message: "branch_id wajib diisi"
        });
      }

      let finalPeriodId = 0;

      // if (year && month) {
      //   // Cari period_id dari tabel periods
      //   const period = await Period.findOne({
      //     where: { year, month, is_active: true }
      //   });

      //   if (!period) {
      //     return res.status(404).json({
      //       message: `Periode ${month}-${year} tidak ditemukan`
      //     });
      //   }

      //   finalPeriodId = period.id;
      // }

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
        data = await SirkulasiPiutang.findAll({
          where,
          order: [["created_at", "DESC"]],
        });
        total = data.length;
        totalPages = 1;
      } else {
        // Jika tidak ada filter => lakukan paginasi (limit + offset) + hitung total
        // Jalankan kedua query secara paralel untuk menghemat waktu
        const [rows, count] = await Promise.all([
          SirkulasiPiutang.findAll({
            where,
            order: [["created_at", "DESC"]],
            limit,
            offset,
          }),
          SirkulasiPiutang.count({ where }),
        ]);

        data = rows;
        total = count;
        totalPages = Math.ceil(count / limit);
      }

      res.status(200).json({
        message: "Data sirkulasi_piutang berhasil diambil",
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
      const data = await SirkulasiPiutang.findByPk(req.params.id);
      if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });

      await data.destroy();

      res.json({ message: "Data Sirkulasi Piutang berhasil dihapus" });
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

      const data = await SirkulasiPiutang.findByPk(id);
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
        message: "Data sirkulasi piutang berhasil diperbarui",
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
