const { Sum } = require("@tensorflow/tfjs");
const { SumberDaya, Period } = require("../../models");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // POST /api/sumber-daya
  async create(req, res) {
    try {
      const { branch_id, year, month, ...rest } = req.body;

      if (!branch_id) {
        return res.status(400).json({ message: "branch_id wajib diisi" });
      }

      const existing = await SumberDaya.findOne({
        where: { branch_id, year, month, is_active: true }
      });

      if (existing) {
        if (existing.is_active === true) {
          // Kalau sudah aktif → tolak create baru
          return res.status(400).json({
            message: `Data Sumber Daya untuk tahun ${year} dan bulan ${month} sudah aktif`
          });
        } else {
          await existing.update({
            ...req.body,
            is_active: true,
            updated_at: new Date(),
            version: existing.version + 1,
            change_id: uuidv4()
          });

          return res.status(200).json({
            message: "Data Sumber Daya nonaktif berhasil diaktifkan kembali dan diperbarui",
            data: existing
          });
        }
      }

      const data = await SumberDaya.create({
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

      res.status(201).json({
        message: "Data sumber daya berhasil ditambahkan",
        data
      });
    } catch (err) {
      res.status(500).json({
        message: "Terjadi kesalahan",
        error: err.message
      });
    }
  },

  // GET /api/sumber-daya?branch_id=1&year=2025&month=6
  async getAll(req, res) {
    try {
      const { branch_id, year, month, page = 1 } = req.query;

      if (!branch_id) {
        return res.status(400).json({ message: "branch_id wajib diisi" });
      }

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
        data = await SumberDaya.findAll({
          where,
          order: [["created_at", "DESC"]],
        });
        total = data.length;
        totalPages = 1;
      } else {
        // Jika tidak ada filter => lakukan paginasi (limit + offset) + hitung total
        // Jalankan kedua query secara paralel untuk menghemat waktu
        const [rows, count] = await Promise.all([
          SumberDaya.findAll({
            where,
            order: [["created_at", "DESC"]],
            limit,
            offset,
          }),
          SumberDaya.count({ where }),
        ]);

        data = rows;
        total = count;
        totalPages = Math.ceil(count / limit);
      }

      res.status(200).json({
        message: "Data sumber daya berhasil diambil",
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
  // PUT /api/sumber-daya/:id
  async update(req, res) {
    try {
      const id = req.params.id;
      const { branch_id, year, month, ...rest } = req.body;

      const sumberDaya = await SumberDaya.findByPk(id);
      if (!sumberDaya) {
        return res.status(404).json({ message: "Data sumber daya tidak ditemukan" });
      }

      await sumberDaya.update({
        branch_id: branch_id || sumberDaya.branch_id,
        year: year || sumberDaya.year,
        month: month || sumberDaya.month,
        ...rest,
        updated_at: new Date(),
        change_id: uuidv4(),
        version: Number(sumberDaya.version) + 1
      });

      res.json({
        message: "Data sumber daya berhasil diupdate",
        data: sumberDaya
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
      const data = await SumberDaya.findByPk(req.params.id);
      if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });

      await data.update({
        is_active: false,
        version: Number(data.version) + 1,
        change_id: uuidv4(),
        updated_at: new Date()
      });

      res.json({ message: "Data Sumber Daya berhasil dihapus" });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  }
};