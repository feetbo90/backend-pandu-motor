const { BarangPk, Period } = require("../../models");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // POST /api/barang-pk
  async create(req, res) {
    try {
      const { branch_id, year, month, ...rest } = req.body;

      if (!branch_id) {
        return res.status(400).json({ message: "branch_id wajib diisi" });
      }

      const existing = await BarangPk.findOne({
        where: { branch_id, year, month, is_active: true }
      });

      if (existing) {
        if (existing.is_active === true) {
          // Kalau sudah aktif → tolak create baru
          return res.status(400).json({
            message: `Data beban untuk tahun ${year} dan bulan ${month} sudah aktif`
          });
        } else {
          await existing.update({
            ...req.body,
            is_active: true,
            updated_at: new Date(),
            version: Number(existing.version) + 1,
            change_id: uuidv4()
          });

          return res.status(200).json({
            message: "Data beban nonaktif berhasil diaktifkan kembali dan diperbarui",
            data: existing
          });
        }
      }

      const data = await BarangPk.create({
        branch_id,
        period_id: 1,
        ...rest,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        year,
        month,
        change_id: uuidv4(),
        is_active: true
      });

      res.status(201).json({
        message: "Data barang_pk berhasil ditambahkan",
        data
      });
    } catch (err) {
      res.status(500).json({
        message: "Terjadi kesalahan",
        error: err.message
      });
    }
  },

  // GET /api/barang-pk?branch_id=1&year=2025&month=6
// ...existing code...
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
      //   // cari period_id dulu
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
        data = await BarangPk.findAll({
          where,
          order: [["created_at", "DESC"]],
        });
        total = data.length;
        totalPages = 1;
      } else {
        // Jika tidak ada filter => lakukan paginasi (limit + offset) + hitung total
        // Jalankan kedua query secara paralel untuk menghemat waktu
        const [rows, count] = await Promise.all([
          BarangPk.findAll({
            where,
            order: [["created_at", "DESC"]],
            limit,
            offset,
          }),
          BarangPk.count({ where }),
        ]);

        data = rows;
        total = count;
        totalPages = Math.ceil(count / limit);
      }

      res.status(200).json({
        message: "Data barang_pk berhasil diambil",
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
      const data = await BarangPk.findByPk(req.params.id);
      if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });

      await data.update({
        is_active: false,
        version: Number(data.version) + 1,
        change_id: uuidv4(),
        updated_at: new Date()
      });

      res.json({ message: "Data Barang berhasil dihapus" });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },
    // PUT /api/barangpk/:id
  async update(req, res) {
    try {
      const data = await BarangPk.findByPk(req.params.id);
      if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });

      await data.update({
        ...req.body,
        change_id: uuidv4(),
        updated_at: new Date(),
        version: Number(data.version) + 1
      });

      res.json({ message: "Data barang_pk berhasil diperbarui", data });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },
};
