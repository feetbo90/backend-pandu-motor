const {
  Penjualan,
  Pendapatan,
  PendapatanLain,
  Piutang,
  SirkulasiPiutang,
  SirkulasiStock,
  BarangPk,
  Beban,
  SumberDaya
} = require("../../models");

module.exports = {
  async createAll(req, res) {
    const t = await Penjualan.sequelize.transaction();

    try {
      const {
        branch_id,
        period_id,
        penjualan,
        pendapatan,
        pendapatan_lain,
        piutang,
        sirkulasi_piutang,
        sirkulasi_stock,
        barang_pk,
        beban,
        sumber_daya
      } = req.body;

      if (!branch_id || !period_id) {
        return res.status(400).json({ message: "branch_id dan period_id wajib diisi" });
      }

      // semua field wajib ada
      if (
        !penjualan ||
        !pendapatan ||
        !pendapatan_lain ||
        !piutang ||
        !sirkulasi_piutang ||
        !sirkulasi_stock ||
        !barang_pk ||
        !beban ||
        !sumber_daya
      ) {
        return res.status(400).json({
          message:
            "Semua data (penjualan, pendapatan, pendapatan_lain, piutang, sirkulasi_piutang, sirkulasi_stock, barang_pk, beban, sumber_daya) wajib diisi"
        });
      }

      const result = {};
      result.penjualan = await Penjualan.create({ branch_id, period_id, ...penjualan }, { transaction: t });
      result.pendapatan = await Pendapatan.create({ branch_id, period_id, ...pendapatan }, { transaction: t });
      result.pendapatan_lain = await PendapatanLain.create({ branch_id, period_id, ...pendapatan_lain }, { transaction: t });
      result.piutang = await Piutang.create({ branch_id, period_id, ...piutang }, { transaction: t });
      result.sirkulasi_piutang = await SirkulasiPiutang.create({ branch_id, period_id, ...sirkulasi_piutang }, { transaction: t });
      result.sirkulasi_stock = await SirkulasiStock.create({ branch_id, period_id, ...sirkulasi_stock }, { transaction: t });
      result.barang_pk = await BarangPk.create({ branch_id, period_id, ...barang_pk }, { transaction: t });
      result.beban = await Beban.create({ branch_id, period_id, ...beban }, { transaction: t });
      result.sumber_daya = await SumberDaya.create({ branch_id, period_id, ...sumber_daya }, { transaction: t });

      await t.commit();

      res.status(201).json({ message: "Semua data berhasil disimpan", data: result });
    } catch (err) {
      await t.rollback();
      console.error("Error di createAll:", err); // <== ini
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },
  // GET semua data berdasarkan branch_id & period_id
  async getAll(req, res) {
    try {
      const { branch_id, period_id } = req.query;

      if (!branch_id || !period_id) {
        return res.status(400).json({ message: "branch_id dan period_id wajib diisi" });
      }

      const data = {};

      data.penjualan = await Penjualan.findOne({ where: { branch_id, period_id, is_active: true } });
      data.pendapatan = await Pendapatan.findOne({ where: { branch_id, period_id, is_active: true } });
      data.pendapatan_lain = await PendapatanLain.findOne({ where: { branch_id, period_id, is_active: true } });
      data.piutang = await Piutang.findOne({ where: { branch_id, period_id, is_active: true } });
      data.sirkulasi_piutang = await SirkulasiPiutang.findOne({ where: { branch_id, period_id, is_active: true } });
      data.sirkulasi_stock = await SirkulasiStock.findOne({ where: { branch_id, period_id, is_active: true } });
      data.barang_pk = await BarangPk.findOne({ where: { branch_id, period_id, is_active: true } });
      data.beban = await Beban.findOne({ where: { branch_id, period_id, is_active: true } });
      data.sumber_daya = await SumberDaya.findOne({ where: { branch_id, period_id, is_active: true } });

      res.status(200).json({
        message: "Data berhasil diambil",
        data
      });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  }
};
