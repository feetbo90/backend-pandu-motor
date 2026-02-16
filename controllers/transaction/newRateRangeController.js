const {
  Penjualan,
  Piutang,
  SumberDaya,
  Pendapatan,
  PendapatanLain,
  Beban,
  SirkulasiPiutang,
  LabaRugi,
  Entities,
} = require("../../models");
const { Sequelize, Op } = require("sequelize");
const { getAllDescendants } = require("../../utils/getDescendants.js");

const toNumber = (value) => parseFloat(value || 0);

// Helper untuk membentuk map total per bulan.
// key: month (1-12), value: total numerik field yang dipilih.
const buildMonthMap = (rows, valueField) => {
  const monthMap = new Map();

  rows.forEach((row) => {
    const month = Number(row.month);
    if (!monthMap.has(month)) monthMap.set(month, 0);
    monthMap.set(month, monthMap.get(month) + toNumber(row[valueField]));
  });

  return monthMap;
};

// Helper untuk jumlah kumulatif bulan 1..monthEnd.
const cumulativeTotal = (monthMap, monthEnd) => {
  let total = 0;
  for (let month = 1; month <= monthEnd; month += 1) {
    total += monthMap.get(month) || 0;
  }
  return total;
};

// Helper untuk pembagian aman agar tidak kena divide-by-zero.
const safeDivide = (numerator, denominator) =>
  denominator > 0 ? numerator / denominator : 0;
const roundTwo = (value) => Number(toNumber(value).toFixed(2));

// Builder generic untuk rate berbasis rata-rata kumulatif (bulan 1..N).
const buildAverageRate = (
  selectedMonth,
  numeratorMap,
  denominatorMap,
  opts
) => {
  const {
    numeratorTotalField,
    denominatorTotalField,
    numeratorAverageField,
    denominatorAverageField,
    ratioField,
    komentar,
  } = opts;

  const results = [];

  for (let monthEnd = 2; monthEnd <= selectedMonth; monthEnd += 1) {
    const totalNumerator = cumulativeTotal(numeratorMap, monthEnd);
    const totalDenominator = cumulativeTotal(denominatorMap, monthEnd);
    const averageNumerator = roundTwo(totalNumerator / monthEnd);
    const averageDenominator = roundTwo(totalDenominator / monthEnd);

    results.push({
      month_end: monthEnd,
      komentar,
      [numeratorTotalField]: totalNumerator,
      [denominatorTotalField]: totalDenominator,
      [numeratorAverageField]: averageNumerator,
      [denominatorAverageField]: averageDenominator,
      [ratioField]: roundTwo(safeDivide(averageNumerator, averageDenominator)),
    });
  }

  return results;
};

// Builder untuk rate yang denominator-nya unit count tetap (jumlah unit turunan).
const buildUnitCountRate = (
  selectedMonth,
  valueMap,
  unitCount,
  opts
) => {
  const {
    totalField,
    averageField,
    unitField,
    ratioField,
    komentar,
  } = opts;

  const results = [];

  for (let monthEnd = 2; monthEnd <= selectedMonth; monthEnd += 1) {
    const totalValue = cumulativeTotal(valueMap, monthEnd);
    const averageValue = roundTwo(totalValue / monthEnd);

    results.push({
      month_end: monthEnd,
      komentar,
      [totalField]: totalValue,
      [averageField]: averageValue,
      [unitField]: unitCount,
      [ratioField]: roundTwo(safeDivide(averageValue, unitCount)),
    });
  }

  return results;
};

// Builder generic untuk ratio persentase:
// (average numerator / average denominator) * 100
const buildAveragePercentRate = (
  selectedMonth,
  numeratorMap,
  denominatorMap,
  opts
) => {
  const {
    numeratorTotalField,
    denominatorTotalField,
    numeratorAverageField,
    denominatorAverageField,
    ratioField,
    komentar,
  } = opts;

  const results = [];

  for (let monthEnd = 2; monthEnd <= selectedMonth; monthEnd += 1) {
    const totalNumerator = cumulativeTotal(numeratorMap, monthEnd);
    const totalDenominator = cumulativeTotal(denominatorMap, monthEnd);
    const averageNumerator = roundTwo(totalNumerator / monthEnd);
    const averageDenominator = roundTwo(totalDenominator / monthEnd);

    results.push({
      month_end: monthEnd,
      komentar,
      [numeratorTotalField]: totalNumerator,
      [denominatorTotalField]: totalDenominator,
      [numeratorAverageField]: averageNumerator,
      [denominatorAverageField]: averageDenominator,
      [ratioField]: roundTwo(
        safeDivide(averageNumerator, averageDenominator) * 100
      ),
    });
  }

  return results;
};

module.exports = {
  // GET /rate-ratio/:entity_id/descendants/new-rate-range?year=2025&month=3
  // Menghasilkan rate_satu sampai rate_sebelas dengan metode rata-rata kumulatif:
  // month_end = 2 berarti rata-rata bulan 1-2, month_end = 3 berarti rata-rata bulan 1-3, dst.
  async getNewRateRange(req, res) {
    try {
      const { entity_id } = req.params;
      const { year, month } = req.query;

      const entityId = parseInt(entity_id, 10);
      const yearInt = year ? parseInt(year, 10) : undefined;
      const selectedMonth = month ? parseInt(month, 10) : undefined;

      if (!entityId || !yearInt || !selectedMonth) {
        return res.status(400).json({
          success: false,
          message: "entity_id, year, dan month wajib diisi",
        });
      }

      if (selectedMonth < 1 || selectedMonth > 12) {
        return res.status(400).json({
          success: false,
          message: "month harus di antara 1 sampai 12",
        });
      }

      const rootEntity = await Entities.findOne({
        where: { id: entityId, is_active: true },
        attributes: ["id", "name", "entity_type"],
        raw: true,
      });

      if (!rootEntity) {
        return res.status(404).json({
          success: false,
          message: "Entity tidak ditemukan",
        });
      }

      const descendants = await getAllDescendants(entityId);
      const branchIds = descendants
        .map((item) => Number(item?.id))
        .filter((id) => Number.isInteger(id));
      const unitCount = descendants.filter((item) => item?.type === "UNIT").length;

      if (!branchIds.length) {
        return res.json({
          success: true,
          entity_id: entityId,
          entity_name: rootEntity.name,
          year: yearInt,
          selected_month: selectedMonth,
          unit_count: unitCount,
          komentar:
            "Semua rate dihitung kumulatif dari bulan 1 sampai month_end.",
          rate_satu: [],
          rate_dua: [],
          rate_tiga: [],
          rate_empat: [],
          rate_lima: [],
          rate_enam: [],
          rate_tujuh: [],
          rate_delapan: [],
          rate_sembilan: [],
          rate_sepuluh: [],
          rate_sebelas: [],
          ratio_satu: [],
          ratio_dua: [],
          ratio_tiga: [],
          ratio_empat: [],
          ratio_lima: [],
          ratio_enam: [],
          ratio_tujuh: [],
          ratio_delapan: [],
          ratio_sembilan: [],
          ratio_sepuluh: [],
          ratio_sebelas: [],
        });
      }

      const monthFilter = { [Op.between]: [1, selectedMonth] };
      const baseWhere = {
        branch_id: branchIds,
        year: yearInt,
        month: monthFilter,
        is_active: true,
      };

      // Ambil total pembiayaan per bulan (Piutang.tambahan).
      const piutangRows = await Piutang.findAll({
        where: baseWhere,
        attributes: [
          "month",
          [Sequelize.fn("SUM", Sequelize.col("tambahan")), "total_pembiayaan"],
          [Sequelize.fn("SUM", Sequelize.col("realisasi_pokok")), "total_realisasi_pokok"],
          [Sequelize.fn("SUM", Sequelize.col("saldo_akhir")), "total_saldo_akhir"],
        ],
        group: ["month"],
        order: [["month", "ASC"]],
        raw: true,
      });

      // Ambil data penjualan per bulan untuk rate 2 dan unit_jual untuk rate 1.
      const penjualanRows = await Penjualan.findAll({
        where: baseWhere,
        attributes: [
          "month",
          [
            Sequelize.fn(
              "SUM",
              Sequelize.literal("unit_jualkredit + unit_jualleasing")
            ),
            "total_unit_jual",
          ],
          [
            Sequelize.fn("SUM", Sequelize.literal("kontan + kredit + leasing")),
            "total_penjualan",
          ],
          [Sequelize.fn("SUM", Sequelize.col("kredit")), "total_kredit"],
          [Sequelize.fn("SUM", Sequelize.col("leasing")), "total_leasing"],
          [
            Sequelize.fn(
              "SUM",
              Sequelize.literal(
                "unit_jualkredit + unit_jualleasing + unit_jualkontan"
              )
            ),
            "total_unit",
          ],
        ],
        group: ["month"],
        order: [["month", "ASC"]],
        raw: true,
      });

      // Ambil total jumlah karyawan per bulan.
      const sumberDayaRows = await SumberDaya.findAll({
        where: baseWhere,
        attributes: [
          "month",
          [Sequelize.fn("SUM", Sequelize.col("jumlah_karyawan")), "total_karyawan"],
        ],
        group: ["month"],
        order: [["month", "ASC"]],
        raw: true,
      });

      // Ambil total markup per bulan.
      const pendapatanRows = await Pendapatan.findAll({
        where: baseWhere,
        attributes: [
          "month",
          [Sequelize.fn("SUM", Sequelize.col("markup_jumlah")), "total_markup"],
          [Sequelize.fn("SUM", Sequelize.col("realisasi_bunga")), "total_realisasi_bunga"],
          [Sequelize.fn("SUM", Sequelize.col("jumlah_pendapatan")), "total_jumlah_pendapatan"],
          [Sequelize.fn("SUM", Sequelize.col("denda")), "total_denda"],
          [Sequelize.fn("SUM", Sequelize.col("administrasi")), "total_administrasi"],
        ],
        group: ["month"],
        order: [["month", "ASC"]],
        raw: true,
      });

      // Ambil total pendapatan lain per bulan untuk ratio 7.
      const pendapatanLainRows = await PendapatanLain.findAll({
        where: baseWhere,
        attributes: [
          "month",
          [
            Sequelize.fn("SUM", Sequelize.col("jumlah_pendapatan_lain")),
            "total_pendapatan_lain",
          ],
        ],
        group: ["month"],
        order: [["month", "ASC"]],
        raw: true,
      });

      // Ambil total beban per bulan untuk rate 5, 6, 7, 8, 9.
      const bebanRows = await Beban.findAll({
        where: baseWhere,
        attributes: [
          "month",
          [Sequelize.fn("SUM", Sequelize.col("gaji")), "total_gaji"],
          [Sequelize.fn("SUM", Sequelize.col("operasional")), "total_beban_umum_operasional"],
          [Sequelize.fn("SUM", Sequelize.col("penyusutan_aktiva")), "total_penyusutan_aktiva"],
          [Sequelize.fn("SUM", Sequelize.col("cadangan_piutang")), "total_cadangan_piutang"],
          [Sequelize.fn("SUM", Sequelize.col("cadangan_stock")), "total_cadangan_stock"],
        ],
        group: ["month"],
        order: [["month", "ASC"]],
        raw: true,
      });

      // Ambil total laba rugi kumulatif per bulan untuk rate 10 dan 11.
      const labaRugiRows = await LabaRugi.findAll({
        where: baseWhere,
        attributes: [
          "month",
          [Sequelize.fn("SUM", Sequelize.col("kumulatif")), "total_kumulatif"],
        ],
        group: ["month"],
        order: [["month", "ASC"]],
        raw: true,
      });

      // Ambil total macet lama per bulan untuk ratio 2.
      const sirkulasiPiutangRows = await SirkulasiPiutang.findAll({
        where: baseWhere,
        attributes: [
          "month",
          [Sequelize.fn("SUM", Sequelize.col("macet_lama")), "total_macet_lama"],
        ],
        group: ["month"],
        order: [["month", "ASC"]],
        raw: true,
      });

      // Mapping semua dataset per bulan agar mudah diolah kumulatif.
      const pembiayaanByMonth = buildMonthMap(piutangRows, "total_pembiayaan");
      const realisasiPokokByMonth = buildMonthMap(
        piutangRows,
        "total_realisasi_pokok"
      );
      const saldoAkhirByMonth = buildMonthMap(piutangRows, "total_saldo_akhir");
      const unitJualByMonth = buildMonthMap(penjualanRows, "total_unit_jual");
      const kreditByMonth = buildMonthMap(penjualanRows, "total_kredit");
      const leasingByMonth = buildMonthMap(penjualanRows, "total_leasing");
      const penjualanByMonth = buildMonthMap(penjualanRows, "total_penjualan");
      const unitByMonth = buildMonthMap(penjualanRows, "total_unit");
      const karyawanByMonth = buildMonthMap(sumberDayaRows, "total_karyawan");
      const markupByMonth = buildMonthMap(pendapatanRows, "total_markup");
      const realisasiBungaByMonth = buildMonthMap(
        pendapatanRows,
        "total_realisasi_bunga"
      );
      const jumlahPendapatanByMonth = buildMonthMap(
        pendapatanRows,
        "total_jumlah_pendapatan"
      );
      const dendaByMonth = buildMonthMap(pendapatanRows, "total_denda");
      const administrasiByMonth = buildMonthMap(
        pendapatanRows,
        "total_administrasi"
      );
      const pendapatanLainByMonth = buildMonthMap(
        pendapatanLainRows,
        "total_pendapatan_lain"
      );
      const gajiByMonth = buildMonthMap(bebanRows, "total_gaji");
      const bebanUmumByMonth = buildMonthMap(
        bebanRows,
        "total_beban_umum_operasional"
      );
      const penyusutanByMonth = buildMonthMap(bebanRows, "total_penyusutan_aktiva");
      const cadanganPiutangByMonth = buildMonthMap(
        bebanRows,
        "total_cadangan_piutang"
      );
      const cadanganStockByMonth = buildMonthMap(
        bebanRows,
        "total_cadangan_stock"
      );
      const macetLamaByMonth = buildMonthMap(
        sirkulasiPiutangRows,
        "total_macet_lama"
      );
      const kumulatifByMonth = buildMonthMap(labaRugiRows, "total_kumulatif");

      // Rate 1: pembiayaan per unit jual (basis rata-rata kumulatif).
      const rateSatu = buildAverageRate(
        selectedMonth,
        pembiayaanByMonth,
        unitJualByMonth,
        {
          numeratorTotalField: "total_pembiayaan",
          denominatorTotalField: "total_unit_jual",
          numeratorAverageField: "average_total_pembiayaan",
          denominatorAverageField: "average_total_unit_jual",
          ratioField: "pembiayaan_per_unit",
          komentar:
            "Rate 1: rata-rata kumulatif pembiayaan dibagi rata-rata kumulatif unit jual.",
        }
      );

      // Rate 2: penjualan per unit.
      const rateDua = buildAverageRate(
        selectedMonth,
        penjualanByMonth,
        unitByMonth,
        {
          numeratorTotalField: "total_penjualan",
          denominatorTotalField: "total_unit",
          numeratorAverageField: "average_total_penjualan",
          denominatorAverageField: "average_total_unit",
          ratioField: "penjualan_per_unit",
          komentar:
            "Rate 2: rata-rata kumulatif penjualan dibagi rata-rata kumulatif total unit.",
        }
      );

      // Rate 3: penjualan per karyawan.
      const rateTiga = buildAverageRate(
        selectedMonth,
        penjualanByMonth,
        karyawanByMonth,
        {
          numeratorTotalField: "total_penjualan",
          denominatorTotalField: "total_karyawan",
          numeratorAverageField: "average_total_penjualan",
          denominatorAverageField: "average_total_karyawan",
          ratioField: "penjualan_per_karyawan",
          komentar:
            "Rate 3: rata-rata kumulatif penjualan dibagi rata-rata kumulatif karyawan.",
        }
      );

      // Rate 4: markup per karyawan.
      const rateEmpat = buildAverageRate(
        selectedMonth,
        markupByMonth,
        karyawanByMonth,
        {
          numeratorTotalField: "total_markup",
          denominatorTotalField: "total_karyawan",
          numeratorAverageField: "average_total_markup",
          denominatorAverageField: "average_total_karyawan",
          ratioField: "markup_per_karyawan",
          komentar:
            "Rate 4: rata-rata kumulatif markup dibagi rata-rata kumulatif karyawan.",
        }
      );

      // Rate 5: gaji per karyawan.
      const rateLima = buildAverageRate(
        selectedMonth,
        gajiByMonth,
        karyawanByMonth,
        {
          numeratorTotalField: "total_gaji",
          denominatorTotalField: "total_karyawan",
          numeratorAverageField: "average_total_gaji",
          denominatorAverageField: "average_total_karyawan",
          ratioField: "gaji_per_karyawan",
          komentar:
            "Rate 5: rata-rata kumulatif gaji dibagi rata-rata kumulatif karyawan.",
        }
      );

      // Rate 6: beban umum operasional per karyawan.
      const rateEnam = buildAverageRate(
        selectedMonth,
        bebanUmumByMonth,
        karyawanByMonth,
        {
          numeratorTotalField: "total_beban_umum_operasional",
          denominatorTotalField: "total_karyawan",
          numeratorAverageField: "average_total_beban_umum_operasional",
          denominatorAverageField: "average_total_karyawan",
          ratioField: "beban_umum_operasional_per_karyawan",
          komentar:
            "Rate 6: rata-rata kumulatif beban operasional dibagi rata-rata kumulatif karyawan.",
        }
      );

      // Rate 7: penyusutan aktiva per karyawan.
      const rateTujuh = buildAverageRate(
        selectedMonth,
        penyusutanByMonth,
        karyawanByMonth,
        {
          numeratorTotalField: "total_penyusutan_aktiva",
          denominatorTotalField: "total_karyawan",
          numeratorAverageField: "average_total_penyusutan_aktiva",
          denominatorAverageField: "average_total_karyawan",
          ratioField: "penyusutan_aktiva_per_karyawan",
          komentar:
            "Rate 7: rata-rata kumulatif penyusutan dibagi rata-rata kumulatif karyawan.",
        }
      );

      // Rate 8: penyusutan aktiva per unit (denominator = jumlah unit tetap).
      const rateDelapan = buildUnitCountRate(
        selectedMonth,
        penyusutanByMonth,
        unitCount,
        {
          totalField: "total_penyusutan_aktiva",
          averageField: "average_total_penyusutan_aktiva",
          unitField: "total_unit",
          ratioField: "penyusutan_aktiva_per_unit",
          komentar:
            "Rate 8: rata-rata kumulatif penyusutan dibagi jumlah unit turunan.",
        }
      );

      // Rate 9: (penyusutan + cadangan piutang + cadangan stock) per unit.
      const gabunganBebanByMonth = new Map();
      for (let monthIdx = 1; monthIdx <= selectedMonth; monthIdx += 1) {
        const val =
          (penyusutanByMonth.get(monthIdx) || 0) +
          (cadanganPiutangByMonth.get(monthIdx) || 0) +
          (cadanganStockByMonth.get(monthIdx) || 0);
        gabunganBebanByMonth.set(monthIdx, val);
      }
      const rateSembilan = buildUnitCountRate(
        selectedMonth,
        gabunganBebanByMonth,
        unitCount,
        {
          totalField: "total_penyusutan_dan_cadangan",
          averageField: "average_total_penyusutan_dan_cadangan",
          unitField: "total_unit",
          ratioField: "penyusutan_dan_cadangan_per_unit",
          komentar:
            "Rate 9: rata-rata kumulatif (penyusutan + cadangan) dibagi jumlah unit turunan.",
        }
      );

      // Rate 10: kumulatif per unit.
      const rateSepuluh = buildUnitCountRate(
        selectedMonth,
        kumulatifByMonth,
        unitCount,
        {
          totalField: "total_kumulatif",
          averageField: "average_total_kumulatif",
          unitField: "total_unit",
          ratioField: "kumulatif_per_unit",
          komentar:
            "Rate 10: rata-rata kumulatif laba rugi kumulatif dibagi jumlah unit turunan.",
        }
      );

      // Rate 11: kumulatif per karyawan.
      const rateSebelas = buildAverageRate(
        selectedMonth,
        kumulatifByMonth,
        karyawanByMonth,
        {
          numeratorTotalField: "total_kumulatif",
          denominatorTotalField: "total_karyawan",
          numeratorAverageField: "average_total_kumulatif",
          denominatorAverageField: "average_total_karyawan",
          ratioField: "kumulatif_per_karyawan",
          komentar:
            "Rate 11: rata-rata kumulatif laba rugi kumulatif dibagi rata-rata kumulatif karyawan.",
        }
      );

      // Ratio 1: pembiayaan (tambahan) per realisasi pokok.
      const ratioSatu = buildAveragePercentRate(
        selectedMonth,
        pembiayaanByMonth,
        realisasiPokokByMonth,
        {
          numeratorTotalField: "total_pembiayaan",
          denominatorTotalField: "total_realisasi_pokok",
          numeratorAverageField: "average_total_pembiayaan",
          denominatorAverageField: "average_total_realisasi_pokok",
          ratioField: "pembiayaan_per_realisasi_pokok",
          komentar:
            "Ratio 1: (rata-rata kumulatif pembiayaan / rata-rata kumulatif realisasi pokok) x 100.",
        }
      );

      // Ratio 2: kemacetan pembiayaan = cadangan piutang per tambahan (pembiayaan).
      const ratioDua = [];
      for (let monthEnd = 2; monthEnd <= selectedMonth; monthEnd += 1) {
        const totalCadanganPiutang = cumulativeTotal(cadanganPiutangByMonth, monthEnd);
        const totalTambahan = cumulativeTotal(pembiayaanByMonth, monthEnd);
        const totalMacetLama = cumulativeTotal(macetLamaByMonth, monthEnd);
        const totalStockKredit = cumulativeTotal(kreditByMonth, monthEnd);
        const totalLeasing = cumulativeTotal(leasingByMonth, monthEnd);

        const averageCadanganPiutang = roundTwo(totalCadanganPiutang / monthEnd);
        const averageTambahan = roundTwo(totalTambahan / monthEnd);
        const averageMacetLama = roundTwo(totalMacetLama / monthEnd);
        const averageStockKredit = roundTwo(totalStockKredit / monthEnd);
        const averageLeasing = roundTwo(totalLeasing / monthEnd);

        ratioDua.push({
          month_end: monthEnd,
          komentar:
            "Ratio 2: (rata-rata kumulatif cadangan piutang / rata-rata kumulatif tambahan) x 100.",
          total_cadangan_piutang: totalCadanganPiutang,
          total_tambahan: totalTambahan,
          total_macet_lama: totalMacetLama,
          total_stock_kredit: totalStockKredit,
          total_leasing: totalLeasing,
          average_cadangan_piutang: averageCadanganPiutang,
          average_tambahan: averageTambahan,
          average_macet_lama: averageMacetLama,
          average_stock_kredit: averageStockKredit,
          average_leasing: averageLeasing,
          rasio_kemacetan_pembiayaan: roundTwo(
            safeDivide(averageCadanganPiutang, averageTambahan) * 100
          ),
        });
      }

      // Ratio 3: markup per pembiayaan.
      const ratioTiga = buildAveragePercentRate(
        selectedMonth,
        markupByMonth,
        pembiayaanByMonth,
        {
          numeratorTotalField: "total_markup",
          denominatorTotalField: "total_pembiayaan",
          numeratorAverageField: "average_total_markup",
          denominatorAverageField: "average_total_pembiayaan",
          ratioField: "rasio_markup",
          komentar:
            "Ratio 3: (rata-rata kumulatif markup / rata-rata kumulatif pembiayaan) x 100.",
        }
      );

      // Ratio 4: realisasi bunga per total sirkulasi piutang.
      const ratioEmpat = buildAveragePercentRate(
        selectedMonth,
        realisasiBungaByMonth,
        saldoAkhirByMonth,
        {
          numeratorTotalField: "total_realisasi_bunga",
          denominatorTotalField: "total_saldo_akhir",
          numeratorAverageField: "average_total_realisasi_bunga",
          denominatorAverageField: "average_total_saldo_akhir",
          ratioField: "rasio_realisasi_bunga_per_total_piutang",
          komentar:
            "Ratio 4: (rata-rata kumulatif realisasi bunga / rata-rata kumulatif saldo akhir piutang) x 100.",
        }
      );

      // Ratio 5: markup per jumlah pendapatan.
      const ratioLima = buildAveragePercentRate(
        selectedMonth,
        markupByMonth,
        jumlahPendapatanByMonth,
        {
          numeratorTotalField: "total_markup",
          denominatorTotalField: "total_jumlah_pendapatan",
          numeratorAverageField: "average_total_markup",
          denominatorAverageField: "average_total_jumlah_pendapatan",
          ratioField: "rasio_markup_per_jumlah_pendapatan",
          komentar:
            "Ratio 5: (rata-rata kumulatif markup / rata-rata kumulatif jumlah pendapatan) x 100.",
        }
      );

      // Ratio 6: pendapatan bunga per jumlah pendapatan.
      const ratioEnam = buildAveragePercentRate(
        selectedMonth,
        realisasiBungaByMonth,
        jumlahPendapatanByMonth,
        {
          numeratorTotalField: "total_realisasi_bunga",
          denominatorTotalField: "total_jumlah_pendapatan",
          numeratorAverageField: "average_total_realisasi_bunga",
          denominatorAverageField: "average_total_jumlah_pendapatan",
          ratioField: "rasio_pendapatan_bunga_per_jumlah_pendapatan",
          komentar:
            "Ratio 6: (rata-rata kumulatif realisasi bunga / rata-rata kumulatif jumlah pendapatan) x 100.",
        }
      );

      // Ratio 7: pendapatan lain per jumlah pendapatan (denda & administrasi hanya informasi pendukung).
      const ratioTujuh = [];
      for (let monthEnd = 2; monthEnd <= selectedMonth; monthEnd += 1) {
        const totalPendapatanLain = cumulativeTotal(pendapatanLainByMonth, monthEnd);
        const totalJumlahPendapatan = cumulativeTotal(
          jumlahPendapatanByMonth,
          monthEnd
        );
        const totalDenda = cumulativeTotal(dendaByMonth, monthEnd);
        const totalAdministrasi = cumulativeTotal(administrasiByMonth, monthEnd);

        const averagePendapatanLain = roundTwo(totalPendapatanLain / monthEnd);
        const averageJumlahPendapatan = roundTwo(totalJumlahPendapatan / monthEnd);
        const averageDenda = roundTwo(totalDenda / monthEnd);
        const averageAdministrasi = roundTwo(totalAdministrasi / monthEnd);

        ratioTujuh.push({
          month_end: monthEnd,
          komentar:
            "Ratio 7: (rata-rata kumulatif pendapatan lain / rata-rata kumulatif jumlah pendapatan) x 100.",
          total_jumlah_pendapatan: totalJumlahPendapatan,
          total_denda: totalDenda,
          total_administrasi: totalAdministrasi,
          total_jumlah_pendapatan_lain: totalPendapatanLain,
          average_jumlah_pendapatan: averageJumlahPendapatan,
          average_denda: averageDenda,
          average_administrasi: averageAdministrasi,
          average_jumlah_pendapatan_lain: averagePendapatanLain,
          rasio_pendapatan_lainnya_per_jumlah_pendapatan: roundTwo(
            safeDivide(averagePendapatanLain, averageJumlahPendapatan) * 100
          ),
        });
      }

      // Ratio 8: gaji per jumlah pendapatan.
      const ratioDelapan = buildAveragePercentRate(
        selectedMonth,
        gajiByMonth,
        jumlahPendapatanByMonth,
        {
          numeratorTotalField: "total_gaji",
          denominatorTotalField: "total_jumlah_pendapatan",
          numeratorAverageField: "average_total_gaji",
          denominatorAverageField: "average_total_jumlah_pendapatan",
          ratioField: "rasio_gaji_per_pendapatan",
          komentar:
            "Ratio 8: (rata-rata kumulatif gaji / rata-rata kumulatif jumlah pendapatan) x 100.",
        }
      );

      // Ratio 9: beban operasional per jumlah pendapatan.
      const ratioSembilan = buildAveragePercentRate(
        selectedMonth,
        bebanUmumByMonth,
        jumlahPendapatanByMonth,
        {
          numeratorTotalField: "total_beban_umum_operasional",
          denominatorTotalField: "total_jumlah_pendapatan",
          numeratorAverageField: "average_total_beban_umum_operasional",
          denominatorAverageField: "average_total_jumlah_pendapatan",
          ratioField: "rasio_beban_operasional_per_pendapatan",
          komentar:
            "Ratio 9: (rata-rata kumulatif beban operasional / rata-rata kumulatif jumlah pendapatan) x 100.",
        }
      );

      // Ratio 10: penyusutan aktiva per jumlah pendapatan.
      const ratioSepuluh = buildAveragePercentRate(
        selectedMonth,
        penyusutanByMonth,
        jumlahPendapatanByMonth,
        {
          numeratorTotalField: "total_penyusutan_aktiva",
          denominatorTotalField: "total_jumlah_pendapatan",
          numeratorAverageField: "average_total_penyusutan_aktiva",
          denominatorAverageField: "average_total_jumlah_pendapatan",
          ratioField: "rasio_penyusutan_aktiva_per_jumlah_pendapatan",
          komentar:
            "Ratio 10: (rata-rata kumulatif penyusutan / rata-rata kumulatif jumlah pendapatan) x 100.",
        }
      );

      // Ratio 11: cadangan (piutang + stock) per jumlah pendapatan.
      const cadanganTotalByMonth = new Map();
      for (let monthIdx = 1; monthIdx <= selectedMonth; monthIdx += 1) {
        cadanganTotalByMonth.set(
          monthIdx,
          (cadanganPiutangByMonth.get(monthIdx) || 0) +
            (cadanganStockByMonth.get(monthIdx) || 0)
        );
      }
      const ratioSebelas = buildAveragePercentRate(
        selectedMonth,
        cadanganTotalByMonth,
        jumlahPendapatanByMonth,
        {
          numeratorTotalField: "total_cadangan_piutang_dan_stock",
          denominatorTotalField: "total_jumlah_pendapatan",
          numeratorAverageField: "average_total_cadangan_piutang_dan_stock",
          denominatorAverageField: "average_total_jumlah_pendapatan",
          ratioField: "rasio_cadangan_piutang_per_jumlah_pendapatan",
          komentar:
            "Ratio 11: (rata-rata kumulatif cadangan piutang+stock / rata-rata kumulatif jumlah pendapatan) x 100.",
        }
      );

      return res.json({
        success: true,
        entity_id: entityId,
        entity_name: rootEntity.name,
        year: yearInt,
        selected_month: selectedMonth,
        unit_count: unitCount,
        komentar:
          "Semua rate dihitung kumulatif dari bulan 1 sampai month_end (mulai month_end=2).",
        rate_satu: rateSatu,
        rate_dua: rateDua,
        rate_tiga: rateTiga,
        rate_empat: rateEmpat,
        rate_lima: rateLima,
        rate_enam: rateEnam,
        rate_tujuh: rateTujuh,
        rate_delapan: rateDelapan,
        rate_sembilan: rateSembilan,
        rate_sepuluh: rateSepuluh,
        rate_sebelas: rateSebelas,
        ratio_satu: ratioSatu,
        ratio_dua: ratioDua,
        ratio_tiga: ratioTiga,
        ratio_empat: ratioEmpat,
        ratio_lima: ratioLima,
        ratio_enam: ratioEnam,
        ratio_tujuh: ratioTujuh,
        ratio_delapan: ratioDelapan,
        ratio_sembilan: ratioSembilan,
        ratio_sepuluh: ratioSepuluh,
        ratio_sebelas: ratioSebelas,
      });
    } catch (error) {
      console.error("Error in getNewRateRange:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};
