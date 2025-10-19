const { Penjualan, Period } = require("../../models");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // POST /api/penjualan
async create(req, res) {
  try {
    const { branch_id, kontan, kredit, leasing, jumlah, year, month, unit_jualkontan, unit_jualkredit, unit_jualleasing } = req.body;

    if (!branch_id || !year || !month) {
      return res.status(400).json({ message: "branch_id wajib diisi, year, dan month wajib diisi" });
    }

    // cek apakah data dengan branch_id, year, month sudah ada
    const existing = await Penjualan.findOne({
      where: { branch_id, year, month }
    });

    if (existing) {
        if (existing.is_active === true) {
          // Kalau sudah aktif → tolak create baru
          return res.status(400).json({
            message: `Data penjualan untuk tahun ${year} dan bulan ${month} sudah aktif`
          });
        } else {
          // Kalau sudah ada tapi nonaktif → aktifkan kembali dan update fieldnya
          await existing.update({
            kontan: kontan ?? existing.kontan,
            kredit: kredit ?? existing.kredit,
            leasing: leasing ?? existing.leasing,
            jumlah: jumlah ?? existing.jumlah,
            is_active: true,
            unit_jualkontan: unit_jualkontan ?? existing.unit_jualkontan,
            unit_jualkredit: unit_jualkredit ?? existing.unit_jualkredit,
            unit_jualleasing: unit_jualleasing ?? existing.unit_jualleasing,
            updated_at: new Date(),
            version: existing.version + 1,
            change_id: uuidv4()
          });

          return res.status(200).json({
            message: "Data penjualan nonaktif berhasil diaktifkan kembali dan diperbarui",
            data: existing
          });
        }
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
      unit_jualkontan: unit_jualkontan || 0,
      unit_jualkredit: unit_jualkredit || 0,
      unit_jualleasing: unit_jualleasing || 0,
      year,
      month,
      version: 1,
      change_id: uuidv4(),
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

      await data.update({
        is_active: false,
        version: data.version + 1,
        change_id: uuidv4(),
        updated_at: new Date()
      });

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
      const { branch_id, period_id, kontan, kredit, leasing, jumlah, year, month, unit_jualkontan, unit_jualkredit, unit_jualleasing } = req.body;

      const data = await Penjualan.findByPk(id);

      if (!data) {
        return res.status(404).json({ message: "Data penjualan tidak ditemukan" });
      }

      await data.update({
        kontan: kontan ?? data.kontan,
        kredit: kredit ?? data.kredit,
        leasing: leasing ?? data.leasing,
        jumlah: jumlah ?? data.jumlah,
        year: year ?? data.year,
        month: month ?? data.month,
        unit_jualkontan: unit_jualkontan ?? data.unit_jualkontan,
        unit_jualkredit: unit_jualkredit ?? data.unit_jualkredit,
        unit_jualleasing: unit_jualleasing ?? data.unit_jualleasing,
        change_id: uuidv4(),
        updated_at: new Date(),
        version: data.version + 1 // selalu naikkan versi
      });

      res.json({ message: "Data penjualan berhasil diperbarui", data });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  }

};
