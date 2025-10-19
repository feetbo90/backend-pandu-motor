const { Pendapatan, Period } = require("../../models");
const { upsertPendapatan } = require("../../services/pendapatanService");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // GET /api/pendapatan
// ...existing code...
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

      // Asumsi: limit, offset, branch_id, year, month tersedia di scope
      const where = { branch_id, is_active: true };

      // Tambahkan filter kondisional
      if (year) where.year = year;
      if (month) where.month = month;

      const hasFilter = Boolean(year || month);

      if (hasFilter) {
        // Jika ada filter year/month => ambil semua hasil (sesuai perilaku asli)
        data = await Pendapatan.findAll({
          where,
          order: [["created_at", "DESC"]],
        });
        total = data.length;
        totalPages = 1;
      } else {
        // Jika tidak ada filter => lakukan paginasi (limit + offset) + hitung total
        // Jalankan kedua query secara paralel untuk menghemat waktu
        const [rows, count] = await Promise.all([
          Pendapatan.findAll({
            where,
            order: [["created_at", "DESC"]],
            limit,
            offset,
          }),
          Pendapatan.count({ where }),
        ]);

        data = rows;
        total = count;
        totalPages = Math.ceil(count / limit);
      }


      res.status(200).json({
        message: "Data pendapatan lain berhasil diambil",
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
  // GET /api/pendapatan/:id
  async getById(req, res) {
    try {
      const data = await Pendapatan.findByPk(req.params.id);
      if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },

  // POST /api/pendapatan
  async create(req, res) {
    try {
      const { branch_id, year, month, ...rest } = req.body;

      if (!branch_id) {
        return res.status(400).json({ message: "branch_id dan period_id wajib diisi" });
      }

      const existing = await Pendapatan.findOne({
        where: { branch_id, year, month, is_active: true }
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
            ...req.body,
            is_active: true,
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

      const data = await Pendapatan.create({
        branch_id,
        period_id: 1,
        year,
        month,
        ...rest,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        change_id: uuidv4(),
        is_active: true
      });

      res.status(201).json({ message: "Data pendapatan berhasil ditambahkan", data });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },

  // PUT /api/pendapatan/:id
  async update(req, res) {
    try {
      const { markup_kontan, markup_kredit, markup_jumlah, realisasi_bunga, diskon_bunga, denda, administrasi, jumlah_pendapatan } = req.body;

      const data = await Pendapatan.findByPk(req.params.id);
      if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });


      console.log("req.body.version:", req.body.version);
      console.log("data.version:",( Number(data.version) + 1));

      await data.update({
        markup_kontan: markup_kontan ?? data.markup_kontan,
        markup_kredit: markup_kredit ?? data.markup_kredit,
        markup_jumlah: markup_jumlah ?? data.markup_jumlah,
        realisasi_bunga: realisasi_bunga ?? data.realisasi_bunga,
        diskon_bunga: diskon_bunga ?? data.diskon_bunga,
        denda: denda ?? data.denda,
        administrasi: administrasi ?? data.administrasi,
        jumlah_pendapatan: jumlah_pendapatan ?? data.jumlah_pendapatan,
        change_id: uuidv4(),
        updated_at: new Date(),
        version: Number(data.version) + 1 // selalu naikkan versi
      });
      res.json({ message: "Data pendapatan berhasil diperbarui", data });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },

  // DELETE /api/pendapatan/:id (soft delete)
  async remove(req, res) {
    try {
      const data = await Pendapatan.findByPk(req.params.id);
      if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });

      await data.update({
        is_active: false,
        version: Number(data.version) + 1,
        change_id: uuidv4(),
        updated_at: new Date()
      });

      res.json({ message: "Data pendapatan berhasil dihapus (soft delete)" });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },
  async bulkUpsert(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "File JSON wajib diupload" });
      }

      // Baca isi file JSON
      const rawData = fs.readFileSync(req.file.path, "utf-8");
      const jsonData = JSON.parse(rawData);
      // Ambil array dari key "pendapatan"
      const records = jsonData.pendapatan;

      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ message: "Data pendapatan kosong atau tidak valid" });
      }

      await upsertPendapatan(records);

      res.json({ message: "Data pendapatan berhasil disimpan / diupdate" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  }
};
