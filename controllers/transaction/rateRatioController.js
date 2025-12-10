const { Penjualan, SumberDaya, Pendapatan, Beban, Entities, Piutang, SirkulasiPiutang, LabaRugi, sequelize } = require("../../models");
const { Sequelize, Op } = require("sequelize");
const { getAllDescendants } = require("../../utils/getDescendants.js");

module.exports = {
  async getRate(req, res) {
    try {
      const { branch_id, year, month } = req.query;
      const branchId = branch_id ? parseInt(branch_id, 10) : undefined;
      const yearInt = year ? parseInt(year, 10) : undefined;
      const monthInt = month ? parseInt(month, 10) : undefined;

      if (!branchId || !yearInt) {
        return res.status(400).json({ message: "branch_id dan year wajib diisi" });
      }

      let where = { branch_id: branchId, year: yearInt, is_active: true  };
      if (monthInt) where.month = monthInt;

      // --- Perhitungan agregasi tahunan (rate_satu_dua) ---
      const dataTahunRaw = await Penjualan.findAll({
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
      const dataTahun = dataTahunRaw.map(row => ({
        ...row,
        year: Number(row.year),
        total_pembiayaan: parseFloat(row.total_pembiayaan || 0),
        total_unit_jual: parseFloat(row.total_unit_jual || 0),
        total_penjualan: parseFloat(row.total_penjualan || 0),
        total_unit: parseFloat(row.total_unit || 0),
      }));

      // --- Ambil rate_satu_dua per bulan ---
      const dataBulanRaw = await Penjualan.findAll({
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
      // normalisasi angka agar kunci per bulan konsisten
      const dataBulan = dataBulanRaw.map(row => ({
        ...row,
        year: Number(row.year),
        month: Number(row.month),
        total_pembiayaan: parseFloat(row.total_pembiayaan || 0),
        total_unit_jual: parseFloat(row.total_unit_jual || 0),
        total_penjualan: parseFloat(row.total_penjualan || 0),
        total_unit: parseFloat(row.total_unit || 0),
      }));

      // --- Ambil data sumber daya ---
      const sumberDayaRaw = await SumberDaya.findAll({
        where: where,
        attributes: ["year", "month", "jumlah_karyawan", "updated_at", "id"],
        order: [
          ["updated_at", "DESC"],
          ["id", "DESC"],
        ],
        raw: true,
      });
      // ambil record terbaru per (year, month)
      const sumberDayaMap = new Map();
      sumberDayaRaw.forEach(sd => {
        const y = Number(sd.year);
        const m = Number(sd.month);
        const key = `${y}-${m}`;
        if (!sumberDayaMap.has(key)) {
          sumberDayaMap.set(key, {
            year: y,
            month: m,
            jumlah_karyawan: Number(sd.jumlah_karyawan || 0),
          });
        }
      });

      // --- Hitung rate_tiga ---
      const rateTiga = [];
      for (const bulan of dataBulan) {
        const sd = sumberDayaMap.get(`${bulan.year}-${bulan.month}`);
        const jumlahKaryawan = sd?.jumlah_karyawan ?? 0;

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
        const sd = sumberDayaMap.get(`${Number(p.year)}-${Number(p.month)}`);
        const jumlahKaryawan = sd?.jumlah_karyawan ?? 0;
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
        const sd = sumberDayaMap.get(`${bulan.year}-${bulan.month}`);
        const jumlahKaryawan = sd?.jumlah_karyawan ?? 0;

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
  async getRateDescendants(req, res) {
    // Implementasi serupa dengan getRate, tetapi menyesuaikan untuk cabang turunan
    try {
    const { entity_id } = req.params;
    const { year, month } = req.query;
    // normalisasi angka supaya perbandingan === tidak gagal karena tipe berbeda
    const entityId = parseInt(entity_id, 10);
    const yearInt = year ? parseInt(year, 10) : undefined;
    const monthInt = month ? parseInt(month, 10) : undefined;


    // ✅ Ambil semua turunan aktif (termasuk parent)
    const entityIds = await getAllDescendants(entityId);
    const unitCount = entityIds.filter(entity => entity?.type === "UNIT").length;
    const rootEntity = await Entities.findOne({
      where: { id: entityId, is_active: true },
      attributes: ["entity_type", "name"],
      raw: true,
    });
      console.log("Descendant Entity IDs:", entityIds);
    // ✅ Ambil semua data penjualan per entity (unit)
    const rateSatu = {};
    const rateDua = {};
    const rateTiga = {};
    const rateEmpat = {};
    const rateLima = {};
    const rateEnam = {};
    const rateTujuh = {};
    const rateSepuluh = {};
    const rateSebelas = {};
    const agregatCabang = {
      total_pembiayaan: 0,
      total_unit_jual: 0,
      total_penjualan: 0,
      total_unit: 0,
      total_karyawan: 0,
      total_cadangan_piutang: 0,
      total_cadangan_stock: 0,
      total_kumulatif: 0,
    };
    // AGREGAT PER BULAN untuk seluruh unit di bawah cabang
    // key = `${year}-${month}`
    const agregatByMonth = {};
    const ensureAgregatMonth = (aggYear, aggMonth) => {
      const key = `${aggYear}-${aggMonth}`;
      if (!agregatByMonth[key]) {
        agregatByMonth[key] = {
          year: aggYear,
          month: aggMonth,
          total_pembiayaan: 0,
          total_unit_jual: 0,
          total_penjualan: 0,
          total_unit: 0,
          total_karyawan: 0,
          total_markup: 0,
          total_gaji: 0,
          total_beban_umum_operasional: 0,
          total_penyusutan_aktiva: 0,
          total_cadangan_piutang: 0,
          total_cadangan_stock: 0,
          total_kumulatif: 0,
        };
      }
      return agregatByMonth[key];
    };

    for (const entityItem of entityIds) {
      const { id, type, name } = entityItem || {};

      if (!id) continue; // 🔒 skip kalau id tidak valid

      // Lewati parent kalau CABANG utama
      if (parseInt(id) === entityId && type === "CABANG") continue;

      let where = { branch_id: id, is_active: true  };
      if (yearInt) where.year = yearInt;
      if (monthInt) where.month = monthInt;
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
      const entityType = entity?.entity_type?.toLowerCase() || "unknown";

      // "type": "unit",
      //           "year": 2025,
      //           "month": 10,
      //           "total_pembiayaan": "2000",
      //           "total_unit_jual": "2",
      //           "pembiayaan_per_unit": 1000,
      //           "total_penjualan": "3000",
      //           "total_unit": "3",
      //           "penjualan_per_unit": 1000
      // --- Ambil data sumber daya ---
      const sumberDaya = await SumberDaya.findAll({
        where,
        attributes: [
          "year",
          "month",
          [Sequelize.fn("SUM", Sequelize.col("jumlah_karyawan")), "jumlah_karyawan"],
        ],
        group: ["year", "month"],
        raw: true,
      });
      const sumberDayaMap = new Map();
      sumberDaya.forEach((sd) => {
        const key = `${Number(sd.year)}-${Number(sd.month)}`;
        sumberDayaMap.set(key, {
          year: Number(sd.year),
          month: Number(sd.month),
          jumlah_karyawan: parseFloat(sd.jumlah_karyawan || 0),
        });
      });

      rateSatu[name] = dataBulan.map(row => {
        const totalPembiayaan = parseFloat(row.total_pembiayaan || 0);
        const totalUnitJual = parseFloat(row.total_unit_jual || 0);
        return {
          type: entityType,
          year: Number(row.year),
          month: Number(row.month),
          total_pembiayaan: totalPembiayaan,
          total_unit_jual: totalUnitJual,
          pembiayaan_per_unit: totalUnitJual > 0 ? totalPembiayaan / totalUnitJual : 0,
        };
      });

      rateDua[name] = dataBulan.map(row => {
        const totalPenjualan = parseFloat(row.total_penjualan || 0);
        const totalUnit = parseFloat(row.total_unit || 0);
        return {
          type: entityType,
          year: Number(row.year),
          month: Number(row.month),
          total_penjualan: totalPenjualan,
          total_unit: totalUnit,
          penjualan_per_unit: totalUnit > 0 ? totalPenjualan / totalUnit : 0,
        };
      });

      // ✅ Tambahkan ke agregat cabang
      dataBulan.forEach(row => {
        agregatCabang.total_pembiayaan += parseFloat(row.total_pembiayaan || 0);
        agregatCabang.total_unit_jual += parseFloat(row.total_unit_jual || 0);
        agregatCabang.total_penjualan += parseFloat(row.total_penjualan || 0);
        agregatCabang.total_unit += parseFloat(row.total_unit || 0);
      });

      // Tambahkan ke agregat cabang per bulan (sum across units)
      dataBulan.forEach(row => {
        const yearVal = Number(row.year);
        const monthVal = Number(row.month);
        const monthAgg = ensureAgregatMonth(yearVal, monthVal);
        monthAgg.total_pembiayaan += parseFloat(row.total_pembiayaan || 0);
        monthAgg.total_unit_jual += parseFloat(row.total_unit_jual || 0);
        monthAgg.total_penjualan += parseFloat(row.total_penjualan || 0);
        monthAgg.total_unit += parseFloat(row.total_unit || 0);
      });

      // tambahkan jumlah karyawan unit ke agregatByMonth
      sumberDaya.forEach(sd => {
        const monthAgg = ensureAgregatMonth(Number(sd.year), Number(sd.month));
        const jumlahKaryawan = parseFloat(sd.jumlah_karyawan || 0);
        monthAgg.total_karyawan += jumlahKaryawan;
        agregatCabang.total_karyawan += jumlahKaryawan;
      });


      // === Gabungkan untuk rate_tiga ===
      const mergedData = dataBulan.map((penj) => {
        const sd = sumberDaya.find((s) => Number(s.year) === Number(penj.year) && Number(s.month) === Number(penj.month));
        const jumlah_karyawan = sd?.jumlah_karyawan || 0;
        const total_penjualan = parseFloat(penj.total_penjualan || 0);

        return {
          year: Number(penj.year),
          month: Number(penj.month),
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
        const sd = sumberDaya.find((s) => Number(s.year) === Number(p.year) && Number(s.month) === Number(p.month));
        const jumlah_karyawan = sd?.jumlah_karyawan || 0;
        const total_markup = parseFloat(p.total_markup || 0);


        const monthAgg = ensureAgregatMonth(Number(p.year), Number(p.month));
        monthAgg.total_markup += total_markup;

        return {
          year: Number(p.year),
          month: Number(p.month),
          total_markup,
          jumlah_karyawan,
          rate_empat: jumlah_karyawan > 0 ? total_markup / jumlah_karyawan : 0,
        };
      });

      rateEmpat[name] = mergedEmpat;

      const bebanData = await Beban.findAll({
        where,
        attributes: [
          "year",
          "month",
          [Sequelize.fn("SUM", Sequelize.col("gaji")), "gaji"],
          [
            Sequelize.fn("SUM", Sequelize.col("beban_umum_operasional")),
            "beban_umum_operasional",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("penyusutan_aktiva")),
            "penyusutan_aktiva",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("cadangan_piutang")),
            "cadangan_piutang",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("cadangan_stock")),
            "cadangan_stock",
          ],
        ],
        group: ["year", "month"],
        raw: true,
      });
      const bebanMap = new Map();
      bebanData.forEach((b) => {
        const key = `${b.year}-${b.month}`;
        const gajiValue = parseFloat(b.gaji || 0);
        const cadanganPiutangValue = parseFloat(b.cadangan_piutang || 0);
        const cadanganStockValue = parseFloat(b.cadangan_stock || 0);
        bebanMap.set(key, {
          gaji: gajiValue,
          beban_umum_operasional: parseFloat(b.beban_umum_operasional || 0),
          penyusutan_aktiva: parseFloat(b.penyusutan_aktiva || 0),
          cadangan_piutang: cadanganPiutangValue,
          cadangan_stock: cadanganStockValue,
        });

        const monthAgg = ensureAgregatMonth(Number(b.year), Number(b.month));
        monthAgg.total_gaji += gajiValue;
        monthAgg.total_beban_umum_operasional += parseFloat(b.beban_umum_operasional || 0);
        monthAgg.total_penyusutan_aktiva += parseFloat(b.penyusutan_aktiva || 0);
        monthAgg.total_cadangan_piutang += cadanganPiutangValue;
        monthAgg.total_cadangan_stock += cadanganStockValue;
        agregatCabang.total_cadangan_piutang += cadanganPiutangValue;
        agregatCabang.total_cadangan_stock += cadanganStockValue;
      });

      // === Laba Rugi (kumulatif) tiap unit -> agregat cabang ===
      const labaRugiData = await LabaRugi.findAll({
        where,
        attributes: [
          "year",
          "month",
          [Sequelize.fn("SUM", Sequelize.col("kumulatif")), "kumulatif"],
        ],
        group: ["year", "month"],
        raw: true,
      });
      labaRugiData.forEach((lr) => {
        const monthAgg = ensureAgregatMonth(Number(lr.year), Number(lr.month));
        const kumulatifValue = parseFloat(lr.kumulatif || 0);
        monthAgg.total_kumulatif += kumulatifValue;
        agregatCabang.total_kumulatif += kumulatifValue;
      });

      const monthKeyMap = new Map();
      const collectMonthKey = (items = []) => {
        items.forEach((item) => {
          if (item?.year === undefined || item?.month === undefined) return;
          const y = Number(item.year);
          const m = Number(item.month);
          const key = `${y}-${m}`;
          if (!monthKeyMap.has(key)) {
            monthKeyMap.set(key, { year: y, month: m });
          }
        });
      };
      collectMonthKey(dataBulan);
      collectMonthKey(sumberDaya);
      collectMonthKey(bebanData);

      const rateBiayaData = Array.from(monthKeyMap.values())
        .sort((a, b) => a.year - b.year || a.month - b.month)
        .map(({ year: yearVal, month: monthVal }) => {
          const key = `${yearVal}-${monthVal}`;
          const sd = sumberDayaMap.get(key);
          const beban = bebanMap.get(key);
          const jumlah_karyawan = sd?.jumlah_karyawan || 0;
          const gaji = beban?.gaji || 0;
          const bebanUmum = beban?.beban_umum_operasional || 0;
          const penyusutan = beban?.penyusutan_aktiva || 0;

          return {
            branch_id: id,
            year: yearVal,
            month: monthVal,
            gaji,
            beban_umum_operasional: bebanUmum,
            penyusutan,
            jumlah_karyawan,
            rate_gaji_per_karyawan:
              jumlah_karyawan > 0 ? gaji / jumlah_karyawan : 0,
            rate_beban_umum_operasional_per_karyawan:
              jumlah_karyawan > 0 ? bebanUmum / jumlah_karyawan : 0,
            rate_penyusutan_aktiva_per_karyawan:
              jumlah_karyawan > 0 ? penyusutan / jumlah_karyawan : 0,
          };
        });

      rateLima[name] = rateBiayaData.map((item) => ({
        type: entityType,
        branch_id: item.branch_id,
        year: item.year,
        month: item.month,
        gaji: item.gaji,
        jumlah_karyawan: item.jumlah_karyawan,
        rate_gaji_per_karyawan: item.rate_gaji_per_karyawan,
      }));

      rateEnam[name] = rateBiayaData.map((item) => ({
        type: entityType,
        branch_id: item.branch_id,
        year: item.year,
        month: item.month,
        beban_umum_operasional: item.beban_umum_operasional,
        jumlah_karyawan: item.jumlah_karyawan,
        rate_beban_umum_operasional_per_karyawan:
          item.rate_beban_umum_operasional_per_karyawan,
      }));

      rateTujuh[name] = rateBiayaData.map((item) => ({
        type: entityType,
        branch_id: item.branch_id,
        year: item.year,
        month: item.month,
        penyusutan: item.penyusutan,
        jumlah_karyawan: item.jumlah_karyawan,
        rate_penyusutan_aktiva_per_karyawan:
          item.rate_penyusutan_aktiva_per_karyawan,
      }));

      // === Rate 10 & 11: kumulatif per unit dan per karyawan (per entity) ===
      const entityUnitCount = entityType === "unit" ? 1 : 1; // fallback 1 agar tidak bagi 0
      rateSepuluh[name] = labaRugiData.map((lr) => {
        const totalKumulatif = parseFloat(lr.kumulatif || 0);
        return {
          type: entityType,
          year: lr.year,
          month: lr.month,
          total_kumulatif: totalKumulatif,
          total_unit: entityUnitCount,
          kumulatif_per_unit:
            entityUnitCount > 0 ? totalKumulatif / entityUnitCount : 0,
        };
      });

      rateSebelas[name] = labaRugiData.map((lr) => {
        const key = `${lr.year}-${lr.month}`;
        const sd = sumberDayaMap.get(key);
        const totalKaryawan = parseFloat(sd?.jumlah_karyawan || 0);
        const totalKumulatif = parseFloat(lr.kumulatif || 0);
        return {
          type: entityType,
          year: lr.year,
          month: lr.month,
          total_kumulatif: totalKumulatif,
          total_karyawan: totalKaryawan,
          kumulatif_per_karyawan:
            totalKaryawan > 0 ? totalKumulatif / totalKaryawan : 0,
        };
      });
    }

    // Tambahkan data cabang utama (parent) ke agregat gaji & karyawan hanya jika root adalah CABANG
    if (rootEntity?.entity_type === "CABANG") {
      const cabangWhere = { branch_id: entityId, is_active: true };
      if (yearInt) cabangWhere.year = yearInt;
      if (monthInt) cabangWhere.month = monthInt;

      const cabangSumberDaya = await SumberDaya.findAll({
        where: cabangWhere,
        attributes: [
          "year",
          "month",
          [Sequelize.fn("SUM", Sequelize.col("jumlah_karyawan")), "jumlah_karyawan"],
        ],
        group: ["year", "month"],
        raw: true,
      });
      cabangSumberDaya.forEach((sd) => {
        const monthAgg = ensureAgregatMonth(Number(sd.year), Number(sd.month));
        const jumlahKaryawan = parseFloat(sd.jumlah_karyawan || 0);
        monthAgg.total_karyawan += jumlahKaryawan;
        agregatCabang.total_karyawan += jumlahKaryawan;
      });

      const cabangBeban = await Beban.findAll({
        where: cabangWhere,
        attributes: [
          "year",
          "month",
          [Sequelize.fn("SUM", Sequelize.col("gaji")), "gaji"],
          [
            Sequelize.fn("SUM", Sequelize.col("beban_umum_operasional")),
            "beban_umum_operasional",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("penyusutan_aktiva")),
            "penyusutan_aktiva",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("cadangan_piutang")),
            "cadangan_piutang",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("cadangan_stock")),
            "cadangan_stock",
          ],
        ],
        group: ["year", "month"],
        raw: true,
      });
      cabangBeban.forEach((b) => {
        const monthAgg = ensureAgregatMonth(Number(b.year), Number(b.month));
        monthAgg.total_gaji += parseFloat(b.gaji || 0);
        monthAgg.total_beban_umum_operasional += parseFloat(b.beban_umum_operasional || 0);
        monthAgg.total_penyusutan_aktiva += parseFloat(b.penyusutan_aktiva || 0);
        const cabangCadanganPiutang = parseFloat(b.cadangan_piutang || 0);
        const cabangCadanganStock = parseFloat(b.cadangan_stock || 0);
        monthAgg.total_cadangan_piutang += cabangCadanganPiutang;
        monthAgg.total_cadangan_stock += cabangCadanganStock;
        agregatCabang.total_cadangan_piutang += cabangCadanganPiutang;
        agregatCabang.total_cadangan_stock += cabangCadanganStock;
      });

      const cabangLabaRugi = await LabaRugi.findAll({
        where: cabangWhere,
        attributes: [
          "year",
          "month",
          [Sequelize.fn("SUM", Sequelize.col("kumulatif")), "kumulatif"],
        ],
        group: ["year", "month"],
        raw: true,
      });
      cabangLabaRugi.forEach((row) => {
        const monthAgg = ensureAgregatMonth(Number(row.year), Number(row.month));
        const kumulatifValue = parseFloat(row.kumulatif || 0);
        monthAgg.total_kumulatif += kumulatifValue;
        agregatCabang.total_kumulatif += kumulatifValue;
      });
    }

    // === Pastikan agregat kumulatif cabang mengambil semua descendant (termasuk parent) ===
    const allBranchIds = entityIds.map((e) => e.id).filter(Boolean);
    if (allBranchIds.length) {
      // reset total_kumulatif agar tidak double-count sebelum dijumlah ulang
      Object.values(agregatByMonth).forEach((agg) => {
        agg.total_kumulatif = 0;
      });
      agregatCabang.total_kumulatif = 0;

      const semuaLabaRugi = await LabaRugi.findAll({
        where: {
          branch_id: allBranchIds,
          is_active: true,
          ...(yearInt ? { year: yearInt } : {}),
          ...(monthInt ? { month: monthInt } : {}),
        },
        attributes: [
          "year",
          "month",
          [Sequelize.fn("SUM", Sequelize.col("kumulatif")), "kumulatif"],
        ],
        group: ["year", "month"],
        raw: true,
      });

      semuaLabaRugi.forEach((row) => {
        const monthAgg = ensureAgregatMonth(Number(row.year), Number(row.month));
        const kumulatifValue = parseFloat(row.kumulatif || 0);
        monthAgg.total_kumulatif += kumulatifValue;
        agregatCabang.total_kumulatif += kumulatifValue;
      });
    }

    // ✅ Hitung rasio cabang (hasil rata-rata dari semua unit)
    const cabang = rootEntity;

    const hasilCabang = {
      cabang: cabang?.name || "CABANG",
      total_pembiayaan: agregatCabang.total_pembiayaan,
      total_unit_jual: agregatCabang.total_unit_jual,
      total_penjualan: agregatCabang.total_penjualan,
      total_unit: agregatCabang.total_unit,
      pembiayaan_per_unit:
        agregatCabang.total_unit_jual > 0
          ? agregatCabang.total_pembiayaan / agregatCabang.total_unit_jual
          : 0,
      penjualan_per_unit:
        agregatCabang.total_unit > 0
          ? agregatCabang.total_penjualan / agregatCabang.total_unit
          : 0,
    };

     // Buat hasil cabang per bulan dari agregatByMonth
    const hasilCabangPerBulan = Object.values(agregatByMonth)
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .map(item => {
        const totalPembiayaan = Number(item.total_pembiayaan ?? 0);
        const totalUnitJual = Number(item.total_unit_jual ?? 0);
        const totalPenjualan = Number(item.total_penjualan ?? 0);
        const totalUnit = Number(item.total_unit ?? 0);
        const totalKaryawan = Number(item.total_karyawan ?? 0);
        const totalMarkup = Number(item.total_markup ?? 0);
        const totalGaji = Number(item.total_gaji ?? 0);
        const totalBebanUmum = Number(item.total_beban_umum_operasional ?? 0);
        const totalPenyusutan = Number(item.total_penyusutan_aktiva ?? 0);
        const totalCadanganPiutang = Number(item.total_cadangan_piutang ?? 0);
        const totalCadanganStock = Number(item.total_cadangan_stock ?? 0);
        const totalKumulatif = Number(item.total_kumulatif ?? 0);

        return {
          year: item.year,
          month: item.month,
          total_pembiayaan: totalPembiayaan,
          total_unit_jual: totalUnitJual,
          total_penjualan: totalPenjualan,
          total_unit: totalUnit,
          total_karyawan: totalKaryawan,
          total_markup: totalMarkup,
          total_gaji: totalGaji,
          total_beban_umum_operasional: totalBebanUmum,
          total_penyusutan_aktiva: totalPenyusutan,
          total_cadangan_piutang: totalCadanganPiutang,
          total_cadangan_stock: totalCadanganStock,
          total_kumulatif: totalKumulatif,
          // metrics:
          pembiayaan_per_unit: totalUnitJual > 0 ? totalPembiayaan / totalUnitJual : 0,
          penjualan_per_unit: totalUnit > 0 ? totalPenjualan / totalUnit : 0,
          penjualan_per_karyawan: totalKaryawan > 0 ? totalPenjualan / totalKaryawan : 0,
          mark_up_per_karyawan: totalKaryawan > 0 ? totalMarkup / totalKaryawan : 0,
          gaji_per_karyawan: totalKaryawan > 0 ? totalGaji / totalKaryawan : 0,
          beban_umum_operasional_per_karyawan:
            totalKaryawan > 0 ? totalBebanUmum / totalKaryawan : 0,
          penyusutan_aktiva_per_karyawan:
            totalKaryawan > 0 ? totalPenyusutan / totalKaryawan : 0,
          penyusutan_aktiva_per_unit:
            unitCount > 0 ? totalPenyusutan / unitCount : 0,
          total_penyusutan_dan_cadangan:
            totalPenyusutan + totalCadanganPiutang + totalCadanganStock,
          penyusutan_dan_cadangan_per_unit:
            unitCount > 0
              ? (totalPenyusutan + totalCadanganPiutang + totalCadanganStock) / unitCount
              : 0,
        };
      });
    const cabangRateSatu = hasilCabangPerBulan.map(item => ({
      type: "cabang",
      year: item.year,
      month: item.month,
      total_pembiayaan: item.total_pembiayaan,
      total_unit_jual: item.total_unit_jual,
      pembiayaan_per_unit: item.pembiayaan_per_unit,
    }));

    const cabangRateDua = hasilCabangPerBulan.map(item => ({
      type: "cabang",
      year: item.year,
      month: item.month,
      total_penjualan: item.total_penjualan,
      total_unit: item.total_unit,
      penjualan_per_unit: item.penjualan_per_unit,
    }));

    const cabangRateTiga = hasilCabangPerBulan.map(item => ({
      type: "cabang",
      year: item.year,
      month: item.month,
      total_penjualan: item.total_penjualan,
      total_karyawan: item.total_karyawan,
      penjualan_per_karyawan: item.penjualan_per_karyawan,
    }));

    const cabangRateEmpat = hasilCabangPerBulan.map(item => ({
      type: "cabang",
      year: item.year,
      month: item.month,
      total_markup: item.total_markup,
      total_karyawan: item.total_karyawan,
      markup_per_karyawan: item.mark_up_per_karyawan,
    }));

    const cabangRateLima = hasilCabangPerBulan.map(item => ({
      type: "cabang",
      year: item.year,
      month: item.month,
      total_gaji: item.total_gaji,
      total_karyawan: item.total_karyawan,
      rate_gaji_per_karyawan: item.gaji_per_karyawan,
    }));
    const cabangRateEnam = hasilCabangPerBulan.map(item => ({
      type: "cabang",
      year: item.year,
      month: item.month,
      total_beban_umum_operasional: item.total_beban_umum_operasional,
      total_karyawan: item.total_karyawan,
      rate_beban_umum_operasional_per_karyawan: item.beban_umum_operasional_per_karyawan,
    }));
    const cabangRateTujuh = hasilCabangPerBulan.map(item => ({
      type: "cabang",
      year: item.year,
      month: item.month,
      total_penyusutan_aktiva: item.total_penyusutan_aktiva,
      total_karyawan: item.total_karyawan,
      rate_penyusutan_aktiva_per_karyawan: item.penyusutan_aktiva_per_karyawan,
    }));
    const cabangRateDelapan = hasilCabangPerBulan.map(item => ({
      type: "cabang",
      year: item.year,
      month: item.month,
      total_penyusutan_aktiva: item.total_penyusutan_aktiva,
      total_unit: unitCount,
      rate_penyusutan_aktiva_per_unit: unitCount > 0 ? item.total_penyusutan_aktiva / unitCount : 0,
    }));
    const cabangRateSembilan = hasilCabangPerBulan.map(item => ({
      type: "cabang",
      year: item.year,
      month: item.month,
      total_penyusutan_aktiva: item.total_penyusutan_aktiva,
      total_cadangan_piutang: item.total_cadangan_piutang,
      total_cadangan_stock: item.total_cadangan_stock,
      total_unit: unitCount,
      rate_penyusutan_dan_cadangan_per_unit: item.penyusutan_dan_cadangan_per_unit,
    }));
    const cabangRateSepuluh = hasilCabangPerBulan.map(item => {
      const totalKumulatif = Number(item.total_kumulatif ?? 0);
      return {
        type: "cabang",
        year: item.year,
        month: item.month,
        total_kumulatif: totalKumulatif,
        total_unit: unitCount,
        kumulatif_per_unit: unitCount > 0 ? totalKumulatif / unitCount : 0,
      };
    });
    const cabangRateSebelas = hasilCabangPerBulan.map(item => {
      const totalKumulatif = Number(item.total_kumulatif ?? 0);
      const totalKaryawan = Number(item.total_karyawan ?? 0);
      return {
        type: "cabang",
        year: item.year,
        month: item.month,
        total_kumulatif: totalKumulatif,
        total_karyawan: totalKaryawan,
        kumulatif_per_karyawan:
          totalKaryawan > 0 ? totalKumulatif / totalKaryawan : 0,
      };
    });


    // ✅ Response akhir
      return res.json({
        success: true,
        entity_id,
        entityIds,
        cabang: {
          name: cabang?.name || "CABANG",
          rate_satu: cabangRateSatu,
          rate_dua: cabangRateDua,
          rate_tiga: cabangRateTiga,
          rate_empat: cabangRateEmpat,
          rate_lima: cabangRateLima,
          rate_enam: cabangRateEnam,
          rate_tujuh: cabangRateTujuh,
          rate_delapan: cabangRateDelapan,
          rate_sembilan: cabangRateSembilan,
          rate_sepuluh: cabangRateSepuluh,
          rate_sebelas: cabangRateSebelas,
        },
        rate_satu: rateSatu,
        rate_dua: rateDua,
        rate_tiga: rateTiga,
        rate_empat: rateEmpat,
        rate_lima: rateLima,
        rate_enam: rateEnam,
        rate_tujuh: rateTujuh,
        rate_sepuluh: rateSepuluh,
        rate_sebelas: rateSebelas,
      });
    } catch (error) {
      console.error("Error in getRateSatuDua:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },
  async getRateDescendantsBackup(req, res) {
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
      const rasioSatu = {};
      const rasioDua = {};
      const rasioTiga = {};
      const rasioEmpat = {};
      const rasioLima = {};
      const rasioEnam = {};
      const rasioTujuh = {};
      const rasioDelapan = {};
      const rasioSembilan = {};
      const rasioSepuluh = {};
      const rasioSebelas = {};
      const cabangRatioAggregates = {};
      const cabangRatioDuaAggregates = {};
      const formatFixed = (value, digits = 1) => Number(value || 0).toFixed(digits);
      const ensureCabangRatioMonth = (ratioYear, ratioMonth) => {
        const key = `${ratioYear}-${ratioMonth}`;
        if (!cabangRatioAggregates[key]) {
          cabangRatioAggregates[key] = {
            year: ratioYear,
            month: ratioMonth,
            pembiayaan: 0,
            realisasi_pokok: 0,
            total_markup: 0,
            realisasi_bunga: 0,
            jumlah_pendapatan: 0,
            denda: 0,
            administrasi: 0,
            total_sirkulasi: 0,
            gaji: 0,
            beban_umum_operasional: 0,
            penyusutan_aktiva: 0,
            cadangan_piutang: 0,
          };
        }
        return cabangRatioAggregates[key];
      };
      const ensureCabangRatioDuaMonth = (ratioYear, ratioMonth) => {
        const key = `${ratioYear}-${ratioMonth}`;
        if (!cabangRatioDuaAggregates[key]) {
          cabangRatioDuaAggregates[key] = {
            year: ratioYear,
            month: ratioMonth,
            macet_lama: 0,
            stock_kredit: 0,
            leasing: 0,
          };
        }
        return cabangRatioDuaAggregates[key];
      };

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
            [Sequelize.fn("SUM", Sequelize.col("kredit")), "total_kredit"],
            [Sequelize.fn("SUM", Sequelize.col("leasing")), "total_leasing"],
          ],
          group: ["year", "month"],
          order: [["year", "ASC"], ["month", "ASC"]],
          raw: true,
        });
        const penjualanMap = new Map();
        penjualanData.forEach((row) => {
          const bucket = ensureCabangRatioMonth(row.year, row.month);
          bucket.pembiayaan += parseFloat(row.pembiayaan || 0);
          penjualanMap.set(`${row.year}-${row.month}`, row);

          const ratioDuaBucket = ensureCabangRatioDuaMonth(row.year, row.month);
          ratioDuaBucket.stock_kredit += parseFloat(row.total_kredit || 0);
          ratioDuaBucket.leasing += parseFloat(row.total_leasing || 0);
        });

        // --- Ambil data Piutang (realisasi_pokok) ---
        const piutangData = await Piutang.findAll({
          where,
          attributes: [
            "year",
            "month",
            [Sequelize.fn("SUM", Sequelize.col("realisasi_pokok")), "realisasi_pokok"],
            [Sequelize.fn("SUM", Sequelize.col("jumlah_angsuran")), "jumlah_angsuran"],
          ],
          group: ["year", "month"],
          raw: true,
        });
        piutangData.forEach((row) => {
          const bucket = ensureCabangRatioMonth(row.year, row.month);
          bucket.realisasi_pokok += parseFloat(row.realisasi_pokok || 0);
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

        rasioSatu[name] = merged;

        const pendapatan = await Pendapatan.findAll({
          where: where,
          attributes: [
            "year",
            "month",
            [Sequelize.fn("SUM", Sequelize.col("markup_jumlah")), "total_markup"],
            [Sequelize.fn("SUM", Sequelize.col("realisasi_bunga")), "realisasi_bunga"],
            [Sequelize.fn("SUM", Sequelize.col("jumlah_pendapatan")), "jumlah_pendapatan"],
            [Sequelize.fn("SUM", Sequelize.col("denda")), "denda"],
            [Sequelize.fn("SUM", Sequelize.col("administrasi")), "administrasi"],
          ],
          group: ["year", "month"],
          raw: true,
        });
        pendapatan.forEach((pend) => {
          const bucket = ensureCabangRatioMonth(pend.year, pend.month);
          bucket.total_markup += parseFloat(pend.total_markup || 0);
          bucket.realisasi_bunga += parseFloat(pend.realisasi_bunga || 0);
          bucket.jumlah_pendapatan += parseFloat(pend.jumlah_pendapatan || 0);
          bucket.denda += parseFloat(pend.denda || 0);
          bucket.administrasi += parseFloat(pend.administrasi || 0);
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

      rasioTiga[name] = mergedData;

      const sirkulasiPiutang = await SirkulasiPiutang.findAll({
          where: where,
          attributes: [
            "year",
            "month",
            [Sequelize.fn("SUM", Sequelize.col("total")), "total"],
            [Sequelize.fn("SUM", Sequelize.col("macet_lama")), "macet_lama"],
          ],
          group: ["year", "month"],
          raw: true,
        });
        sirkulasiPiutang.forEach((row) => {
          const bucket = ensureCabangRatioMonth(row.year, row.month);
          bucket.total_sirkulasi += parseFloat(row.total || 0);

          const ratioDuaBucket = ensureCabangRatioDuaMonth(row.year, row.month);
          ratioDuaBucket.macet_lama += parseFloat(row.macet_lama || 0);
        });

        const mergedKemacetan = sirkulasiPiutang.map((row) => {
          const macetLama = parseFloat(row.macet_lama || 0);
          const penjualanRow = penjualanMap.get(`${row.year}-${row.month}`) || {};
          const stockKredit = parseFloat(penjualanRow.total_kredit || 0);
          const leasingValue = parseFloat(penjualanRow.total_leasing || 0);
          const totalStock = stockKredit + leasingValue;
          const rasio_kemacetan =
            totalStock > 0 ? (macetLama / totalStock) * 100 : 0;

          return {
            type: type.toLowerCase(),
            year: row.year,
            month: row.month,
            macet_lama: macetLama.toFixed(1),
            stock_kredit: stockKredit.toFixed(1),
            leasing: leasingValue.toFixed(1),
            rasio_kemacetan_pembiayaan: rasio_kemacetan.toFixed(2),
          };
        });
        rasioDua[name] = mergedKemacetan;

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

      rasioEmpat[name] = mergedPendapatanSirkulasi;

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

      rasioLima[name] = mergedMarkedUpAndJumlahPendapatan;

      const mergedRasioPendapatanBungaPerJmlhPendapatan = pendapatan.map((pend) => {
          
          const realisasi_bunga = parseFloat(pend.realisasi_bunga || 0);
          const jumlah_pendapatan = parseFloat(pend?.jumlah_pendapatan || 0);

          const rasio_markup =
            jumlah_pendapatan > 0 ? (realisasi_bunga / jumlah_pendapatan) * 100 : 0;

          return {
            type: type.toLowerCase(),
            year: pend.year,
            month: pend.month,
            jumlah_pendapatan: jumlah_pendapatan.toFixed(1),
            realisasi_bunga: realisasi_bunga.toFixed(1),
            rasio_pendapatan_bunga_per_jumlah_pendapatan: rasio_markup.toFixed(2),
          };
      });
      rasioEnam[name] = mergedRasioPendapatanBungaPerJmlhPendapatan;

      const mergedRasioDendaAdministrasiPerJmlhPendapatan = pendapatan.map((pend) => {
          
          const denda = parseFloat(pend.denda || 0);
          const administrasi = parseFloat(pend.administrasi || 0);
          const jumlah_pendapatan = parseFloat(pend?.jumlah_pendapatan || 0);

          const rasio_pendapatan_lainnya =
            jumlah_pendapatan > 0 ? ((denda + administrasi) / jumlah_pendapatan) * 100 : 0;

          return {
            type: type.toLowerCase(),
            year: pend.year,
            month: pend.month,
            jumlah_pendapatan: jumlah_pendapatan.toFixed(1),
            denda: denda.toFixed(1),
            administrasi: administrasi.toFixed(1),
            rasio_pendapatan_lainnya_per_jumlah_pendapatan: rasio_pendapatan_lainnya.toFixed(2),
          };
      });
      rasioTujuh[name] = mergedRasioDendaAdministrasiPerJmlhPendapatan;

      const beban = await Beban.findAll({
        where: where,
        attributes: ["year", "month", "gaji", "beban_umum_operasional", "penyusutan_aktiva", "cadangan_piutang"],
        raw: true,
      });
      beban.forEach((b) => {
        const bucket = ensureCabangRatioMonth(b.year, b.month);
        bucket.gaji += parseFloat(b.gaji || 0);
        bucket.beban_umum_operasional += parseFloat(b.beban_umum_operasional || 0);
        bucket.penyusutan_aktiva += parseFloat(b.penyusutan_aktiva || 0);
        bucket.cadangan_piutang += parseFloat(b.cadangan_piutang || 0);
      });
      const bebanMap = new Map();
      beban.forEach((row) => {
        bebanMap.set(`${row.year}-${row.month}`, row);
      });

      const mergedGajiPerPendapatan = pendapatan.map((pend) => {
          const key = `${pend.year}-${pend.month}`;
          const bebanRow = bebanMap.get(key);
          const gaji = parseFloat(bebanRow?.gaji || 0);
          const jumlah_pendapatan = parseFloat(pend?.jumlah_pendapatan || 0);
          const rasio_gaji_per_pendapatan = jumlah_pendapatan > 0 ? (gaji /jumlah_pendapatan) * 100 : 0;

          return {
            type: type.toLowerCase(),
            year: pend.year,
            month: pend.month,
            jumlah_pendapatan: jumlah_pendapatan.toFixed(1),
            gaji: gaji,
            rasio_gaji_per_pendapatan: rasio_gaji_per_pendapatan.toFixed(2)
          }

      });
      rasioDelapan[name] = mergedGajiPerPendapatan;
      const mergedBebanOperasionalPerPendapatan = pendapatan.map((pend) => {
        const key = `${pend.year}-${pend.month}`;
        const bebanRow = bebanMap.get(key);
        const beban_umum_operasional = parseFloat(bebanRow?.beban_umum_operasional || 0);
        const jumlah_pendapatan = parseFloat(pend?.jumlah_pendapatan || 0);
        const rasio_beban_operasional_per_pendapatan = jumlah_pendapatan > 0 ? (beban_umum_operasional / jumlah_pendapatan) * 100 : 0;

        return {
          type: type.toLowerCase(),
          year: pend.year,
          month: pend.month,
          jumlah_pendapatan: jumlah_pendapatan.toFixed(1),
          beban_umum_operasional: beban_umum_operasional.toFixed(1),
          rasio_beban_operasional_per_pendapatan: rasio_beban_operasional_per_pendapatan.toFixed(2),
        };
      });
      rasioSembilan[name] = mergedBebanOperasionalPerPendapatan;
      const mergedPenyusutanPerPendapatan = pendapatan.map((pend) => {
        const key = `${pend.year}-${pend.month}`;
        const bebanRow = bebanMap.get(key);
        const penyusutan_aktiva = parseFloat(bebanRow?.penyusutan_aktiva || 0);
        const jumlah_pendapatan = parseFloat(pend?.jumlah_pendapatan || 0);
        const rasio_penyusutan_per_pendapatan =
          jumlah_pendapatan > 0 ? (penyusutan_aktiva / jumlah_pendapatan) * 100 : 0;

        return {
          type: type.toLowerCase(),
          year: pend.year,
          month: pend.month,
          jumlah_pendapatan: jumlah_pendapatan.toFixed(1),
          penyusutan_aktiva: penyusutan_aktiva.toFixed(1),
          rasio_penyusutan_aktiva_per_jumlah_pendapatan: rasio_penyusutan_per_pendapatan.toFixed(2),
        };
      });
      rasioSepuluh[name] = mergedPenyusutanPerPendapatan;
      const mergedCadanganPerPendapatan = pendapatan.map((pend) => {
        const key = `${pend.year}-${pend.month}`;
        const bebanRow = bebanMap.get(key);
        const cadangan_piutang = parseFloat(bebanRow?.cadangan_piutang || 0);
        const jumlah_pendapatan = parseFloat(pend?.jumlah_pendapatan || 0);
        const rasio_cadangan_per_pendapatan =
          jumlah_pendapatan > 0 ? (cadangan_piutang / jumlah_pendapatan) * 100 : 0;

        return {
          type: type.toLowerCase(),
          year: pend.year,
          month: pend.month,
          jumlah_pendapatan: jumlah_pendapatan.toFixed(1),
          cadangan_piutang: cadangan_piutang.toFixed(1),
          rasio_cadangan_piutang_per_jumlah_pendapatan: rasio_cadangan_per_pendapatan.toFixed(2),
        };
      });
      rasioSebelas[name] = mergedCadanganPerPendapatan;
      }

      // Tambahkan kontribusi cabang utama ke agregat
      const cabangWhere = { branch_id: entity_id, year, is_active: true };
      if (month) cabangWhere.month = month;

      const cabangPenjualan = await Penjualan.findAll({
        where: cabangWhere,
        attributes: [
          "year",
          "month",
          [Sequelize.fn("SUM", Sequelize.literal("kredit + leasing")), "pembiayaan"],
        ],
        group: ["year", "month"],
        raw: true,
      });
      cabangPenjualan.forEach((row) => {
        const bucket = ensureCabangRatioMonth(row.year, row.month);
        bucket.pembiayaan += parseFloat(row.pembiayaan || 0);
      });

      const cabangPiutang = await Piutang.findAll({
        where: cabangWhere,
        attributes: [
          "year",
          "month",
          [Sequelize.fn("SUM", Sequelize.col("realisasi_pokok")), "realisasi_pokok"],
        ],
        group: ["year", "month"],
        raw: true,
      });
      cabangPiutang.forEach((row) => {
        const bucket = ensureCabangRatioMonth(row.year, row.month);
        bucket.realisasi_pokok += parseFloat(row.realisasi_pokok || 0);
      });

      const cabangPendapatan = await Pendapatan.findAll({
        where: cabangWhere,
        attributes: [
          "year",
          "month",
          [Sequelize.fn("SUM", Sequelize.col("markup_jumlah")), "total_markup"],
          [Sequelize.fn("SUM", Sequelize.col("realisasi_bunga")), "realisasi_bunga"],
          [Sequelize.fn("SUM", Sequelize.col("jumlah_pendapatan")), "jumlah_pendapatan"],
          [Sequelize.fn("SUM", Sequelize.col("denda")), "denda"],
          [Sequelize.fn("SUM", Sequelize.col("administrasi")), "administrasi"],
        ],
        group: ["year", "month"],
        raw: true,
      });
      cabangPendapatan.forEach((row) => {
        const bucket = ensureCabangRatioMonth(row.year, row.month);
        bucket.total_markup += parseFloat(row.total_markup || 0);
        bucket.realisasi_bunga += parseFloat(row.realisasi_bunga || 0);
        bucket.jumlah_pendapatan += parseFloat(row.jumlah_pendapatan || 0);
        bucket.denda += parseFloat(row.denda || 0);
        bucket.administrasi += parseFloat(row.administrasi || 0);
      });

      const cabangSirkulasi = await SirkulasiPiutang.findAll({
        where: cabangWhere,
        attributes: [
          "year",
          "month",
          [Sequelize.fn("SUM", Sequelize.col("total")), "total"],
        ],
        group: ["year", "month"],
        raw: true,
      });
      cabangSirkulasi.forEach((row) => {
        const bucket = ensureCabangRatioMonth(row.year, row.month);
        bucket.total_sirkulasi += parseFloat(row.total || 0);
      });

      const cabangBeban = await Beban.findAll({
        where: cabangWhere,
        attributes: [
          "year",
          "month",
          [Sequelize.fn("SUM", Sequelize.col("gaji")), "gaji"],
          [
            Sequelize.fn("SUM", Sequelize.col("beban_umum_operasional")),
            "beban_umum_operasional",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("penyusutan_aktiva")),
            "penyusutan_aktiva",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("cadangan_piutang")),
            "cadangan_piutang",
          ],
        ],
        group: ["year", "month"],
        raw: true,
      });
      cabangBeban.forEach((row) => {
        const bucket = ensureCabangRatioMonth(row.year, row.month);
        bucket.gaji += parseFloat(row.gaji || 0);
        bucket.beban_umum_operasional += parseFloat(row.beban_umum_operasional || 0);
        bucket.penyusutan_aktiva += parseFloat(row.penyusutan_aktiva || 0);
        bucket.cadangan_piutang += parseFloat(row.cadangan_piutang || 0);
      });

      const cabangRatioMonths = Object.values(cabangRatioAggregates).sort(
        (a, b) => a.year - b.year || a.month - b.month
      );

      const cabangRasioSatu = cabangRatioMonths.map((item) => {
        const pembiayaan = parseFloat(item.pembiayaan || 0);
        const realisasiPokok = parseFloat(item.realisasi_pokok || 0);
        const ratio =
          realisasiPokok > 0 ? (pembiayaan / realisasiPokok) * 100 : 0;

        return {
          type: "cabang",
          year: item.year,
          month: item.month,
          pembiayaan,
          realisasi_pokok: realisasiPokok,
          pembiayaan_per_realisasi_pokok: ratio + " %",
        };
      });

      const cabangRasioDuaMonths = Object.values(cabangRatioDuaAggregates).sort(
        (a, b) => a.year - b.year || a.month - b.month
      );
      const cabangRasioDua = cabangRasioDuaMonths.map((item) => {
        const macetLama = parseFloat(item.macet_lama || 0);
        const stockKredit = parseFloat(item.stock_kredit || 0);
        const leasingValue = parseFloat(item.leasing || 0);
        const totalStock = stockKredit + leasingValue;
        const rasioKemacetan =
          totalStock > 0 ? (macetLama / totalStock) * 100 : 0;

        return {
          type: "cabang",
          year: item.year,
          month: item.month,
          macet_lama: formatFixed(macetLama),
          stock_kredit: formatFixed(stockKredit),
          leasing: formatFixed(leasingValue),
          rasio_kemacetan_pembiayaan: formatFixed(rasioKemacetan, 2),
        };
      });

      const cabangRasioTiga = cabangRatioMonths.map((item) => {
        const totalMarkup = parseFloat(item.total_markup || 0);
        const pembiayaan = parseFloat(item.pembiayaan || 0);
        const rasioMarkup =
          pembiayaan > 0 ? (totalMarkup / pembiayaan) * 100 : 0;

        return {
          type: "cabang",
          year: item.year,
          month: item.month,
          total_markup: formatFixed(totalMarkup),
          pembiayaan: formatFixed(pembiayaan),
          rasio_markup: formatFixed(rasioMarkup, 2),
        };
      });

      const cabangRasioEmpat = cabangRatioMonths.map((item) => {
        const realisasiBunga = parseFloat(item.realisasi_bunga || 0);
        const totalSirkulasi = parseFloat(item.total_sirkulasi || 0);
        const rasioEmpat =
          totalSirkulasi > 0 ? (realisasiBunga / totalSirkulasi) * 100 : 0;

        return {
          type: "cabang",
          year: item.year,
          month: item.month,
          realisasi_bunga: formatFixed(realisasiBunga),
          total: formatFixed(totalSirkulasi),
          rasio_realisasi_bunga_per_total_piutang: formatFixed(rasioEmpat, 2),
        };
      });

      const cabangRasioLima = cabangRatioMonths.map((item) => {
        const totalMarkup = parseFloat(item.total_markup || 0);
        const jumlahPendapatan = parseFloat(item.jumlah_pendapatan || 0);
        const rasioLima =
          jumlahPendapatan > 0 ? (totalMarkup / jumlahPendapatan) * 100 : 0;

        return {
          type: "cabang",
          year: item.year,
          month: item.month,
          jumlah_pendapatan: formatFixed(jumlahPendapatan),
          total_markup: formatFixed(totalMarkup),
          rasio_markup_per_jumlah_pendapatan: formatFixed(rasioLima, 2),
        };
      });

      const cabangRasioEnam = cabangRatioMonths.map((item) => {
        const realisasiBunga = parseFloat(item.realisasi_bunga || 0);
        const jumlahPendapatan = parseFloat(item.jumlah_pendapatan || 0);
        const rasioEnam =
          jumlahPendapatan > 0 ? (realisasiBunga / jumlahPendapatan) * 100 : 0;

        return {
          type: "cabang",
          year: item.year,
          month: item.month,
          jumlah_pendapatan: formatFixed(jumlahPendapatan),
          realisasi_bunga: formatFixed(realisasiBunga),
          rasio_pendapatan_bunga_per_jumlah_pendapatan: formatFixed(rasioEnam, 2),
        };
      });

      const cabangRasioTujuh = cabangRatioMonths.map((item) => {
        const denda = parseFloat(item.denda || 0);
        const administrasi = parseFloat(item.administrasi || 0);
        const jumlahPendapatan = parseFloat(item.jumlah_pendapatan || 0);
        const pendapatanLainnya = denda + administrasi;
        const rasioTujuh =
          jumlahPendapatan > 0 ? (pendapatanLainnya / jumlahPendapatan) * 100 : 0;

        return {
          type: "cabang",
          year: item.year,
          month: item.month,
          jumlah_pendapatan: formatFixed(jumlahPendapatan),
          denda: formatFixed(denda),
          administrasi: formatFixed(administrasi),
          rasio_pendapatan_lainnya_per_jumlah_pendapatan: formatFixed(rasioTujuh, 2),
        };
      });

      const cabangRasioDelapan = cabangRatioMonths.map((item) => {
        const gaji = parseFloat(item.gaji || 0);
        const jumlahPendapatan = parseFloat(item.jumlah_pendapatan || 0);
        const rasioDelapan =
          jumlahPendapatan > 0 ? (gaji / jumlahPendapatan) * 100 : 0;

        return {
          type: "cabang",
          year: item.year,
          month: item.month,
          jumlah_pendapatan: formatFixed(jumlahPendapatan),
          gaji,
          rasio_gaji_per_pendapatan: formatFixed(rasioDelapan, 2),
        };
      });

      const cabangRasioSembilan = cabangRatioMonths.map((item) => {
        const bebanUmum = parseFloat(item.beban_umum_operasional || 0);
        const jumlahPendapatan = parseFloat(item.jumlah_pendapatan || 0);
        const rasioSembilanVal =
          jumlahPendapatan > 0 ? (bebanUmum / jumlahPendapatan) * 100 : 0;

        return {
          type: "cabang",
          year: item.year,
          month: item.month,
          jumlah_pendapatan: formatFixed(jumlahPendapatan),
          beban_umum_operasional: formatFixed(bebanUmum),
          rasio_beban_operasional_per_pendapatan: formatFixed(rasioSembilanVal, 2),
        };
      });
      const cabangRasioSepuluh = cabangRatioMonths.map((item) => {
        const penyusutan = parseFloat(item.penyusutan_aktiva || 0);
        const jumlahPendapatan = parseFloat(item.jumlah_pendapatan || 0);
        const rasioSepuluhVal =
          jumlahPendapatan > 0 ? (penyusutan / jumlahPendapatan) * 100 : 0;

        return {
          type: "cabang",
          year: item.year,
          month: item.month,
          jumlah_pendapatan: formatFixed(jumlahPendapatan),
          penyusutan_aktiva: formatFixed(penyusutan),
          rasio_penyusutan_aktiva_per_jumlah_pendapatan: formatFixed(rasioSepuluhVal, 2),
        };
      });
      const cabangRasioSebelas = cabangRatioMonths.map((item) => {
        const cadanganPiutang = parseFloat(item.cadangan_piutang || 0);
        const jumlahPendapatan = parseFloat(item.jumlah_pendapatan || 0);
        const rasioSebelasVal =
          jumlahPendapatan > 0 ? (cadanganPiutang / jumlahPendapatan) * 100 : 0;

        return {
          type: "cabang",
          year: item.year,
          month: item.month,
          jumlah_pendapatan: formatFixed(jumlahPendapatan),
          cadangan_piutang: formatFixed(cadanganPiutang),
          rasio_cadangan_piutang_per_jumlah_pendapatan: formatFixed(rasioSebelasVal, 2),
        };
      });

      const cabangRatios = {
        rasioSatu: cabangRasioSatu,
        rasioDua: cabangRasioDua,
        rasioTiga: cabangRasioTiga,
        rasioEmpat: cabangRasioEmpat,
        rasioLima: cabangRasioLima,
        rasioEnam: cabangRasioEnam,
        rasioTujuh: cabangRasioTujuh,
        rasioDelapan: cabangRasioDelapan,
        rasioSembilan: cabangRasioSembilan,
        rasioSepuluh: cabangRasioSepuluh,
        rasioSebelas: cabangRasioSebelas,
      };

      // --- Kembalikan hasil akhir ---
      return res.json({
        success: true,
        entity_id,
        entityIds,
        cabang: cabangRatios,
        rasioSatu,
        rasioDua,
        rasioTiga,
        rasioEmpat,
        rasioLima,
        rasioEnam,
        rasioTujuh,
        rasioDelapan,
        rasioSembilan,
        rasioSepuluh,
        rasioSebelas
      });

    } catch (error) {
      console.error("Error in getRatioDescendants:", error);
      return res
        .status(500)
        .json({ success: false, message: error.message });
    }
  },

};
