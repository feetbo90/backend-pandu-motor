const { Pendapatan, Period } = require("../../models");
const { upsertPendapatan } = require("../../services/pendapatanService");
const fs = require("fs");

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

      if (year && month) {
        data = await Pendapatan.findAll({
          where: { branch_id, year, month, is_active: true },
          order: [["created_at", "DESC"]]
        });
        total = data.length;
        totalPages = 1;
      } else {
        // Jika year & month tidak diinput, ambil semua data branch_id dan paginasi
        const { count, rows } = await Pendapatan.findAndCountAll({
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
      const { branch_id, ...rest } = req.body;

      if (!branch_id) {
        return res.status(400).json({ message: "branch_id dan period_id wajib diisi" });
      }

      const existing = await Pendapatan.findOne({
        where: { branch_id, year, month, is_active: true }
      });

      if (existing) {
        return res.status(400).json({
          message: `Data pendapatan untuk tahun ${year} dan bulan ${month} sudah tersedia`
        });
      }

      const data = await Pendapatan.create({
        branch_id,
        period_id: 1,
        ...rest,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
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
      const data = await Pendapatan.findByPk(req.params.id);
      if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });

      await data.update({
        ...req.body,
        updated_at: new Date(),
        version: data.version + 1
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

      await data.destroy(); 

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
