const { Penjualan, SumberDaya, Pendapatan, Beban, Entities, Piutang, SirkulasiPiutang, sequelize } = require("../../models");
const { Sequelize, Op } = require("sequelize");
const { getAllDescendants } = require("../../utils/getDescendants.js");

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
  async getRateDescendantsBackup(req, res) {
    // Implementasi serupa dengan getRate, tetapi menyesuaikan untuk cabang turunan
    try {
    const { entity_id } = req.params;
    const { year, month } = req.query;


    // ✅ Ambil semua turunan aktif (termasuk parent)
    const entityIds = await getAllDescendants(entity_id);
      console.log("Descendant Entity IDs:", entityIds);
    // ✅ Ambil semua data penjualan per entity (unit)
    const dataPerEntity = {};
    const rateTiga = {};
    const rateEmpat = {};
    const rateLimaEnamTujuh = {};

    for (const entityItem of entityIds) {
      const { id, type, name } = entityItem || {};

      if (!id) continue; // 🔒 skip kalau id tidak valid

      // Lewati parent kalau CABANG utama
      if (parseInt(id) === parseInt(entity_id) && type === "CABANG") continue;

      let where = { branch_id: id, year, is_active: true  };
      if (month) where.month = month;
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
          ]
        ],
        group: ["year", "month"],
        order: [["year", "ASC"], ["month", "ASC"]],
        raw: true,
      });

      // Ambil type-nya dari Entities
      const entity = await Entities.findOne({
        where: { id, is_active: true },
        attributes: ["entity_type"],
        raw: true,
      });

      dataPerEntity[name] = dataBulan.map((row) => ({
        type: entity?.entity_type?.toLowerCase() || "unknown",
        ...row,
      }));

      // --- Ambil data sumber daya ---
      const sumberDaya = await SumberDaya.findAll({
        where: where,
        attributes: ["year", "month", "jumlah_karyawan"],
        raw: true,
      });
      // === Gabungkan untuk rate_tiga ===
      const mergedData = dataBulan.map((penj) => {
        const sd = sumberDaya.find((s) => s.year === penj.year && s.month === penj.month);
        const jumlah_karyawan = sd?.jumlah_karyawan || 0;
        const total_penjualan = parseFloat(penj.total_penjualan || 0);

        return {
          year: penj.year,
          month: penj.month,
          total_penjualan: total_penjualan,
          jumlah_karyawan,
          penjualan_per_karyawan: jumlah_karyawan > 0 ? total_penjualan / jumlah_karyawan : 0,
        };
      });

      rateTiga[name] = mergedData;

      // === RATE_EMPAT: (Pendapatan.markup_jumlah) / (Jumlah Karyawan) ===
      const pendapatan = await Pendapatan.findAll({
        where: where,
        attributes: [
          "year",
          "month",
          [Sequelize.fn("SUM", Sequelize.col("markup_jumlah")), "total_markup"],
        ],
        group: ["year", "month"],
        raw: true,
      });

      // === (6) Gabung ke rate_empat (markup_jumlah / karyawan) ===
      const mergedEmpat = pendapatan.map((p) => {
        const sd = sumberDaya.find((s) => s.year === p.year && s.month === p.month);
        const jumlah_karyawan = sd?.jumlah_karyawan || 0;
        const total_markup = parseFloat(p.total_markup || 0);

        return {
          year: p.year,
          month: p.month,
          total_markup,
          jumlah_karyawan,
          rate_empat: jumlah_karyawan > 0 ? total_markup / jumlah_karyawan : 0,
        };
      });

      rateEmpat[name] = mergedEmpat;

      const bebanData = await Beban.findAll({
        where: where,
        attributes: ["year", "month", "gaji", "beban_umum_operasional", "penyusutan_aktiva"],
        raw: true,
      });

      // gabungkan data dengan jumlah karyawan
    const result = pendapatan.map((p) => {
      const b = bebanData.find(
        (item) =>
          item.branch_id === p.branch_id &&
          item.year === p.year &&
          item.month === p.month
      );  

      const sd = sumberDaya.find((s) => s.year === p.year && s.month === p.month);
        const jumlah_karyawan = sd?.jumlah_karyawan || 0;
      

        return {
          branch_id: p.branch_id,
          year: p.year,
          month: p.month,
          gaji: Number(b?.gaji) || 0,
          beban_umum_operasional: Number(b?.beban_umum_operasional) || 0,
          penyusutan_aktiva: Number(b?.penyusutan_aktiva) || 0,
          jumlah_karyawan: jumlah_karyawan,

          // RATE 4, 5, 6, 7
          rate_gaji_per_karyawan:
            jumlah_karyawan > 0 ? (Number(b?.gaji) / jumlah_karyawan) : 0,
          rate_beban_umum_operasional_per_karyawan:
            jumlah_karyawan > 0 ? (Number(b?.beban_umum_operasional) / jumlah_karyawan) : 0,
          rate_penyusutan_aktiva_per_karyawan: 
            jumlah_karyawan > 0 ? (Number(b?.penyusutan_aktiva) / jumlah_karyawan) : 0, 
        };
      });
      rateLimaEnamTujuh[name] = result;
    }

    // ✅ Response akhir
      return res.json({
        success: true,
        entity_id,
        entityIds,
        rate_satu_dua: dataPerEntity,
        rate_tiga: rateTiga,
        rate_empat: rateEmpat,
        rate_lima_enam_tujuh: rateLimaEnamTujuh,
      });
    } catch (error) {
      console.error("Error in getRateSatuDua:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },
  async getRateDescendants(req, res) {
  try {
    const { entity_id } = req.params;
    const { year, month } = req.query;

    const entityIds = await getAllDescendants(entity_id);
    const branchIds = entityIds.map(e => e.id).filter(Boolean);

    // ✅ Raw SQL Query — ambil semua data dalam satu tembakan
    const results = await sequelize.query(`
      WITH sumber AS (
        SELECT branch_id, year, month, jumlah_karyawan
        FROM sumber_daya
        WHERE is_active = true
      ),
      pendapatan AS (
        SELECT branch_id, year, month, SUM(markup_jumlah) AS total_markup
        FROM pendapatan
        WHERE is_active = true
        GROUP BY branch_id, year, month
      ),
      penjualan AS (
        SELECT 
          branch_id, year, month,
          SUM(kredit + leasing) AS total_pembiayaan,
          SUM(unit_jualkredit + unit_jualleasing) AS total_unit_jual,
          CASE 
            WHEN SUM(unit_jualkredit + unit_jualleasing) = 0 THEN 0
            ELSE SUM(kredit + leasing)::float / SUM(unit_jualkredit + unit_jualleasing)
          END AS pembiayaan_per_unit,
          SUM(kontan + kredit + leasing) AS total_penjualan,
          SUM(unit_jualkontan + unit_jualkredit + unit_jualleasing) AS total_unit,
          CASE 
            WHEN SUM(unit_jualkontan + unit_jualkredit + unit_jualleasing) = 0 THEN 0
            ELSE SUM(kontan + kredit + leasing)::float / SUM(unit_jualkontan + unit_jualkredit + unit_jualleasing)
          END AS penjualan_per_unit
        FROM penjualan
        WHERE is_active = true
        GROUP BY branch_id, year, month
      ),
      beban AS (
        SELECT 
          branch_id, year, month,
          SUM(gaji) AS total_gaji,
          SUM(beban_umum_operasional) AS total_beban_umum_operasional,
          SUM(penyusutan_aktiva) AS total_penyusutan_aktiva
        FROM beban
        WHERE is_active = true
        GROUP BY branch_id, year, month
      )

      SELECT 
        e.id AS branch_id,
        e.name AS entity_name,
        e.entity_type AS type,
        p.year,
        p.month,
        p.total_pembiayaan,
        p.total_unit_jual,
        p.pembiayaan_per_unit,
        p.total_penjualan,
        p.total_unit,
        p.penjualan_per_unit,
        s.jumlah_karyawan,
        pd.total_markup,
        b.total_gaji,
        b.total_beban_umum_operasional,
        b.total_penyusutan_aktiva,

        -- RATE 3: penjualan per karyawan
        CASE WHEN s.jumlah_karyawan > 0 THEN p.total_penjualan / s.jumlah_karyawan ELSE 0 END AS rate_penjualan_per_karyawan,

        -- RATE 4: markup / karyawan
        CASE WHEN s.jumlah_karyawan > 0 THEN pd.total_markup / s.jumlah_karyawan ELSE 0 END AS rate_markup_per_karyawan,

        -- RATE 5: gaji / karyawan
        CASE WHEN s.jumlah_karyawan > 0 THEN b.total_gaji / s.jumlah_karyawan ELSE 0 END AS rate_gaji_per_karyawan,

        -- RATE 6: beban umum operasional / karyawan
        CASE WHEN s.jumlah_karyawan > 0 THEN b.total_beban_umum_operasional / s.jumlah_karyawan ELSE 0 END AS rate_beban_umum_operasional_per_karyawan,

        -- RATE 7: penyusutan aktiva
        b.total_penyusutan_aktiva AS rate_penyusutan_aktiva_per_karyawan

      FROM entities e
      LEFT JOIN penjualan p ON e.id = p.branch_id
      LEFT JOIN sumber s ON e.id = s.branch_id AND p.year = s.year AND p.month = s.month
      LEFT JOIN pendapatan pd ON e.id = pd.branch_id AND p.year = pd.year AND p.month = pd.month
      LEFT JOIN beban b ON e.id = b.branch_id AND p.year = b.year AND p.month = b.month

      WHERE e.id IN (:branchIds)
      ${year ? 'AND p.year = :year' : ''}
      ${month ? 'AND p.month = :month' : ''}

      ORDER BY e.id, p.year, p.month;
    `, {
      replacements: { branchIds, year, month },
      type: sequelize.QueryTypes.SELECT,
    });

    // ✅ Group hasil per entity name (seperti struktur JSON kamu)
    const grouped = {};
    for (const row of results) {
      const name = row.entity_name;
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(row);
    }

    return res.json({
      success: true,
      entity_id,
      entityIds,
      data: grouped,
    });

  } catch (error) {
    console.error("Error in getRateDescendants:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
  },
  async getRatioDescendants(req, res) {
    try {
      const { entity_id } = req.params;
      const { year, month } = req.query;

      // ✅ Ambil semua turunan aktif (termasuk parent)
      const entityIds = await getAllDescendants(entity_id);
      console.log("Descendant Entity IDs:", entityIds);

      // ✅ Struktur hasil
      const rateSatu = {};
      const rateTiga = {};
      const rateEmpat = {};
      const rateLima = {};
      for (const entityItem of entityIds) {
        const { id, type, name } = entityItem || {};
        if (!id) continue;
        if (parseInt(id) === parseInt(entity_id) && type === "CABANG") continue;

        const where = { branch_id: id, year, is_active: true };
        if (month) where.month = month;

        // --- Ambil data Penjualan (pembiayaan = kredit + leasing) ---
        const penjualanData = await Penjualan.findAll({
          where,
          attributes: [
            "year",
            "month",
            [Sequelize.fn("SUM", Sequelize.literal("kredit + leasing")), "pembiayaan"],
          ],
          group: ["year", "month"],
          order: [["year", "ASC"], ["month", "ASC"]],
          raw: true,
        });

        // --- Ambil data Piutang (realisasi_pokok) ---
        const piutangData = await Piutang.findAll({
          where,
          attributes: [
            "year",
            "month",
            [Sequelize.fn("SUM", Sequelize.col("realisasi_pokok")), "realisasi_pokok"],
          ],
          group: ["year", "month"],
          raw: true,
        });

        // --- Gabungkan data penjualan dan piutang berdasarkan tahun & bulan ---
        const merged = penjualanData.map((p) => {
          const matchingPiutang = piutangData.find(
            (pt) => pt.year === p.year && pt.month === p.month
          );
          const pembiayaan = parseFloat(p.pembiayaan || 0);
          const realisasi_pokok = parseFloat(matchingPiutang?.realisasi_pokok || 0);
          const ratio =
            realisasi_pokok > 0 ? (pembiayaan / realisasi_pokok) * 100 : 0;

          return {
            type: type.toLowerCase(),
            year: p.year,
            month: p.month,
            pembiayaan: pembiayaan,
            realisasi_pokok: realisasi_pokok,
            pembiayaan_per_realisasi_pokok: ratio + " %",
          };
        });

        rateSatu[name] = merged;

        const pendapatan = await Pendapatan.findAll({
          where: where,
          attributes: [
            "year",
            "month",
            [Sequelize.fn("SUM", Sequelize.col("markup_jumlah")), "total_markup"],
            [Sequelize.fn("SUM", Sequelize.col("realisasi_bunga")), "realisasi_bunga"],
            [Sequelize.fn("SUM", Sequelize.col("jumlah_pendapatan")), "jumlah_pendapatan"],

          ],
          group: ["year", "month"],
          raw: true,
        });

        const mergedData = pendapatan.map((pend) => {
          const matchPenjualan = penjualanData.find(
            (p) => p.year === pend.year && p.month === pend.month
          );

          const total_markup = parseFloat(pend.total_markup || 0);
          const pembiayaan = parseFloat(matchPenjualan?.pembiayaan || 0);

          const rasio_markup =
            pembiayaan > 0 ? (total_markup / pembiayaan) * 100 : 0;

          return {
            type: type.toLowerCase(),
            year: pend.year,
            month: pend.month,
            total_markup: total_markup.toFixed(1),
            pembiayaan: pembiayaan.toFixed(1),
            rasio_markup: rasio_markup.toFixed(2),
          };
      });

      rateTiga[name] = mergedData;

      const sirkulasiPiutang = await SirkulasiPiutang.findAll({
          where: where,
          attributes: [
            "year",
            "month",
            [Sequelize.fn("SUM", Sequelize.col("total")), "total"],
          ],
          group: ["year", "month"],
          raw: true,
        });

        const mergedPendapatanSirkulasi = pendapatan.map((pend) => {
          const matchSirkulasi = sirkulasiPiutang.find(
            (p) => p.year === pend.year && p.month === pend.month
          );

          const realisasi_bunga = parseFloat(pend.realisasi_bunga || 0);
          const total = parseFloat(matchSirkulasi?.total || 0);

          const rasio_markup =
            total > 0 ? (realisasi_bunga / total) * 100 : 0;

          return {
            type: type.toLowerCase(),
            year: pend.year,
            month: pend.month,
            realisasi_bunga: realisasi_bunga.toFixed(1),
            total: total.toFixed(1),
            rasio_realisasi_bunga_per_total_piutang: rasio_markup.toFixed(2),
          };
      });

      rateEmpat[name] = mergedPendapatanSirkulasi;

      const mergedMarkedUpAndJumlahPendapatan = pendapatan.map((pend) => {
          
          const total_markup = parseFloat(pend.total_markup || 0);
          const jumlah_pendapatan = parseFloat(pend?.jumlah_pendapatan || 0);

          const rasio_markup =
            jumlah_pendapatan > 0 ? (total_markup / jumlah_pendapatan) * 100 : 0;

          return {
            type: type.toLowerCase(),
            year: pend.year,
            month: pend.month,
            jumlah_pendapatan: jumlah_pendapatan.toFixed(1),
            total_markup: total_markup.toFixed(1),
            rasio_markup_per_jumlah_pendapatan: rasio_markup.toFixed(2),
          };
      });

      rateLima[name] = mergedMarkedUpAndJumlahPendapatan;
      }

      // --- Kembalikan hasil akhir ---
      return res.json({
        success: true,
        entity_id,
        entityIds,
        rateSatu,
        rateTiga,
        rateEmpat,
        rateLima,
      });

    } catch (error) {
      console.error("Error in getRatioDescendants:", error);
      return res
        .status(500)
        .json({ success: false, message: error.message });
    }
  },

};
