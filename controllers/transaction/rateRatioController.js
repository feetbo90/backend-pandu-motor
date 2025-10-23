const { Penjualan, SumberDaya, Pendapatan, Beban } = require("../../models");
const { Sequelize } = require("sequelize");

module.exports = {
  async getRate(req, res) {
    try {
      const { branch_id, year, month } = req.query;

      if (!branch_id || !year) {
        return res.status(400).json({ message: "branch_id dan year wajib diisi" });
      }

      let where = { branch_id, year, is_active: true  };
      if (month) where.month = month;

      // --- Perhitungan agregasi tahunan (rate_satu_dua) ---
      const dataTahun = await Penjualan.findAll({
        where,
        attributes: [
          "year",
          [
            Sequelize.fn("SUM", Sequelize.literal("kredit + leasing")),
            "total_pembiayaan",
          ],
          [
            Sequelize.fn("SUM", Sequelize.literal("unit_jualkredit + unit_jualleasing")),
            "total_unit_jual",
          ],
          [
            Sequelize.literal(`
              CASE 
                WHEN SUM(unit_jualkredit + unit_jualleasing) = 0 THEN 0
                ELSE CAST(SUM(kredit + leasing) AS float) / SUM(unit_jualkredit + unit_jualleasing)
              END
            `),
            "pembiayaan_per_unit",
          ],
          [
            Sequelize.fn("SUM", Sequelize.literal("kontan + kredit + leasing")),
            "total_penjualan",
          ],
          [
            Sequelize.fn("SUM", Sequelize.literal("unit_jualkredit + unit_jualleasing + unit_jualkontan")),
            "total_unit",
          ],
          [
            Sequelize.literal(`
              CASE 
                WHEN SUM(unit_jualkredit + unit_jualleasing + unit_jualkontan) = 0 THEN 0
                ELSE CAST(SUM(kredit + leasing + kontan) AS float) / SUM(unit_jualkredit + unit_jualleasing + unit_jualkontan)
              END
            `),
            "penjualan_per_unit",
          ],
        ],
        group: ["year"],
        order: [["year", "ASC"]],
        raw: true,
      });

      // --- Ambil rate_satu_dua per bulan ---
      const dataBulan = await Penjualan.findAll({
        where: where,
        attributes: [
          "year",
          "month",
          [
            Sequelize.fn("SUM", Sequelize.literal("kredit + leasing")),
            "total_pembiayaan",
          ],
          [
            Sequelize.fn("SUM", Sequelize.literal("unit_jualkredit + unit_jualleasing")),
            "total_unit_jual",
          ],
          [
            Sequelize.literal(`
              CASE 
                WHEN SUM(unit_jualkredit + unit_jualleasing) = 0 THEN 0
                ELSE CAST(SUM(kredit + leasing) AS float) / SUM(unit_jualkredit + unit_jualleasing)
              END
            `),
            "pembiayaan_per_unit",
          ],
          [
            Sequelize.fn("SUM", Sequelize.literal("kontan + kredit + leasing")),
            "total_penjualan",
          ],
          [
            Sequelize.fn("SUM", Sequelize.literal("unit_jualkredit + unit_jualleasing + unit_jualkontan")),
            "total_unit",
          ],
          [
            Sequelize.literal(`
              CASE 
                WHEN SUM(unit_jualkredit + unit_jualleasing + unit_jualkontan) = 0 THEN 0
                ELSE CAST(SUM(kredit + leasing + kontan) AS float) / SUM(unit_jualkredit + unit_jualleasing + unit_jualkontan)
              END
            `),
            "penjualan_per_unit",
          ],
        ],
        group: ["year", "month"],
        order: [["month", "ASC"]],
        raw: true,
      });

      // --- Ambil data sumber daya ---
      const sumberDaya = await SumberDaya.findAll({
        where: where,
        attributes: ["year", "month", "jumlah_karyawan"],
        raw: true,
      });

      // --- Hitung rate_tiga ---
      const rateTiga = [];
      for (const bulan of dataBulan) {
        const sd = sumberDaya.find(
          (s) => s.year === bulan.year && s.month === bulan.month
        );
        const jumlahKaryawan = sd?.jumlah_karyawan || 0;

        const totalPenjualan =
          parseFloat(bulan.total_penjualan || 0);

        rateTiga.push({
          year: bulan.year,
          month: bulan.month,
          jumlah_karyawan: jumlahKaryawan,
          total_penjualan: totalPenjualan,
          total_penjualan_per_karyawan:
            jumlahKaryawan === 0 ? 0 : totalPenjualan / jumlahKaryawan,
        });
      }

      // === RATE_EMPAT: (Pendapatan.markup_jumlah) / (Jumlah Karyawan) ===
      const pendapatan = await Pendapatan.findAll({
        where: where,
        attributes: [
          "year",
          "month",
          [Sequelize.fn("SUM", Sequelize.col("markup_jumlah")), "total_markup"],
        ],
        group: ["year", "month"],
        order: [["month", "ASC"]],
        raw: true,
      });

      const rateEmpat = pendapatan.map((p) => {
        const sd = sumberDaya.find(
          (s) => s.year === p.year && s.month === p.month
        );
        const jumlahKaryawan = sd?.jumlah_karyawan || 0;
        const totalMarkup = parseFloat(p.total_markup || 0);

        return {
          year: p.year,
          month: p.month,
          jumlah_karyawan: jumlahKaryawan,
          total_markup: totalMarkup,
          total_markup_per_karyawan: jumlahKaryawan === 0 ? 0 : totalMarkup / jumlahKaryawan,
        };
      });

      // --- Beban ---
      const beban = await Beban.findAll({
        where: { branch_id, year, is_active: true },
        attributes: ["year", "month", "gaji", "beban_umum_operasional", "penyusutan_aktiva"],
        raw: true,
      });

      // --- Hitung rate tiga dan tambahan ---
      const rateLimaEnamTujuh = [];
      for (const bulan of dataBulan) {
        const sd = sumberDaya.find((s) => s.year === bulan.year && s.month === bulan.month);
        const jumlahKaryawan = sd?.jumlah_karyawan || 0;

        const bebanData = beban.find((b) => b.year === bulan.year && b.month === bulan.month);

        const gaji = parseFloat(bebanData?.gaji || 0);
        const bebanUmum = parseFloat(bebanData?.beban_umum_operasional || 0);
        const penyusutan = parseFloat(bebanData?.penyusutan_aktiva || 0);

        rateLimaEnamTujuh.push({
          year: bulan.year,
          month: bulan.month,
          jumlah_karyawan: jumlahKaryawan,
          gaji: gaji,
          beban_umum_operasional: bebanUmum,
          penyusutan: penyusutan,
          gaji_per_karyawan: jumlahKaryawan === 0 ? 0 : gaji / jumlahKaryawan,
          beban_umum_operasional_per_karyawan: jumlahKaryawan === 0 ? 0 : bebanUmum / jumlahKaryawan,
          penyusutan_per_karyawan: jumlahKaryawan === 0 ? 0 : penyusutan / jumlahKaryawan,
        });
      }

      // Gabungkan hasil jadi satu response
      const result = dataTahun.map((tahunData) => {
        const rate_satu_dua = dataBulan.filter((b) => b.year === tahunData.year);
        const rate_tiga_tahun = rateTiga.filter((r) => r.year === tahunData.year);
        const rate_empat_tahun = rateEmpat.filter((r) => r.year === tahunData.year);
        const rate_lima_enam_tujuh_tahun = rateLimaEnamTujuh.filter((r) => r.year === tahunData.year);

        return {
          ...tahunData,
          rate_satu_dua: rate_satu_dua,
          rate_tiga: rate_tiga_tahun,
          rate_empat: rate_empat_tahun,
          rate_lima_enam_tujuh: rate_lima_enam_tujuh_tahun,
        };
      });

      return res.json({
        message: "Data penjualan dengan rate_tiga",
        data: result,
      });
    } catch (err) {
      console.error("Error:", err);
      return res.status(500).json({
        message: "Terjadi kesalahan saat mengambil data penjualan",
        error: err.message,
      });
    }
  },
};
