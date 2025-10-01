const { Penjualan, Period } = require("../../models");

module.exports = {
  // POST /api/penjualan
async create(req, res) {
  try {
    const { branch_id, kontan, kredit, leasing, jumlah, year, month } = req.body;

    if (!branch_id) {
      return res.status(400).json({ message: "branch_id wajib diisi" });
    }

    // cek apakah data dengan branch_id, year, month sudah ada
    const existing = await Penjualan.findOne({
      where: { branch_id, year, month, is_active: true }
    });

    if (existing) {
      return res.status(400).json({
        message: `Data penjualan untuk tahun ${year} dan bulan ${month} sudah tersedia`
      });
    }

    // kalau belum ada → buat baru
    const data = await Penjualan.create({
      branch_id,
      "period_id": 1,
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

      // Asumsi: limit, offset, branch_id, year, month tersedia di scope
      const where = { branch_id, is_active: true };

      // Tambahkan filter kondisional
      if (year) where.year = year;
      if (month) where.month = month;

      const hasFilter = Boolean(year || month);

      if (hasFilter) {
        // Jika ada filter year/month => ambil semua hasil (sesuai perilaku asli)
        data = await Penjualan.findAll({
          where,
          order: [["created_at", "DESC"]],
        });
        total = data.length;
        totalPages = 1;
      } else {
        // Jika tidak ada filter => lakukan paginasi (limit + offset) + hitung total
        // Jalankan kedua query secara paralel untuk menghemat waktu
        const [rows, count] = await Promise.all([
          Penjualan.findAll({
            where,
            order: [["created_at", "DESC"]],
            limit,
            offset,
          }),
          Penjualan.count({ where }),
        ]);

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
  // controllers/penjualanController.js
  async update(req, res) {
    try {
      const { id } = req.params;
      const { branch_id, period_id, kontan, kredit, leasing, jumlah, year, month } = req.body;

      const data = await Penjualan.findByPk(id);

      if (!data) {
        return res.status(404).json({ message: "Data penjualan tidak ditemukan" });
      }

      await data.update({
        branch_id: branch_id ?? data.branch_id,
        period_id: period_id ?? data.period_id,
        kontan: kontan ?? data.kontan,
        kredit: kredit ?? data.kredit,
        leasing: leasing ?? data.leasing,
        jumlah: jumlah ?? data.jumlah,
        year: year ?? data.year,
        month: month ?? data.month,
        updated_at: new Date(),
        version: data.version + 1 // selalu naikkan versi
      });

      res.json({ message: "Data penjualan berhasil diperbarui", data });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  }

};
