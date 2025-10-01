const { Beban, Period } = require("../../models");

module.exports = {
  // POST /api/beban
  async create(req, res) {
    try {
      const { branch_id, ...rest } = req.body;

      if (!branch_id) {
        return res.status(400).json({ message: "branch_id wajib diisi" });
      }

      // Hitung total otomatis
      const total =
        (rest.gaji || 0) +
        (rest.admin || 0) +
        (rest.operasional || 0) +
        (rest.beban_umum_operasional || 0) +
        (rest.penyusutan_aktiva || 0) +
        (rest.cadangan_piutang || 0) +
        (rest.cadangan_stock || 0);

      const data = await Beban.create({
        branch_id,
        period_id: 1,
        ...rest,
        total,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        is_active: true
      });

      res.status(201).json({
        message: "Data beban berhasil ditambahkan",
        data
      });
    } catch (err) {
      res.status(500).json({
        message: "Terjadi kesalahan",
        error: err.message
      });
    }
  },

  // GET /api/beban?branch_id=1&year=2025&month=6
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

      if (year && month) {
        const { count, rows } = await Beban.findAndCountAll({
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
        const { count, rows } = await Beban.findAndCountAll({
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
        message: "Data beban berhasil diambil",
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
  // PUT /api/beban/:id/update-fields
  async updateFields(req, res) {
    try {
      const { penyusutan_aktiva, cadangan_stock, total } = req.body;
      const id = req.params.id;

      const beban = await Beban.findByPk(id);
      if (!beban) {
        return res.status(404).json({ message: "Data beban tidak ditemukan" });
      }

      // Hitung total baru
      // const total =
      //   (beban.gaji || 0) +
      //   (beban.admin || 0) +
      //   (beban.operasional || 0) +
      //   (beban.beban_umum_operasional || 0) +
      //   (penyusutan_aktiva || 0) +
      //   (beban.cadangan_piutang || 0) +
      //   (cadangan_stock || 0);

      await beban.update({
        penyusutan_aktiva: penyusutan_aktiva || beban.penyusutan_aktiva,
        cadangan_stock: cadangan_stock || beban.cadangan_stock,
        total,
        updated_at: new Date(),
        version: beban.version + 1
      });

      res.json({
        message: "Data beban berhasil diupdate",
        data: beban
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
      const data = await Beban.findByPk(req.params.id);
      if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });

      await data.destroy();

      res.json({ message: "Data beban berhasil dihapus (soft delete)" });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  }
};
