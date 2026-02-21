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
const safeDivide = (numerator, denominator) =>
  denominator > 0 ? numerator / denominator : 0;
const roundTwo = (value) => Number(toNumber(value).toFixed(2));

const buildMonthMap = (rows, fieldName) => {
  const map = new Map();
  rows.forEach((row) => {
    map.set(Number(row.month), toNumber(row[fieldName]));
  });
  return map;
};

const cumulativeTotal = (monthMap, monthEnd) => {
  let total = 0;
  for (let month = 1; month <= monthEnd; month += 1) {
    total += toNumber(monthMap.get(month) || 0);
  }
  return total;
};

const buildAverageRateSeries = (
  selectedMonth,
  numeratorMap,
  denominatorMap,
  config
) => {
  const {
    numeratorMonthField,
    denominatorMonthField,
    numeratorTotalField,
    denominatorTotalField,
    averageNumeratorBase,
    averageDenominatorBase,
    ratioField,
  } = config;

  const result = [];
  for (let monthEnd = 1; monthEnd <= selectedMonth; monthEnd += 1) {
    const numeratorMonthValue = toNumber(numeratorMap.get(monthEnd) || 0);
    const denominatorMonthValue = toNumber(denominatorMap.get(monthEnd) || 0);
    const numeratorTotal = cumulativeTotal(numeratorMap, monthEnd);
    const denominatorTotal = cumulativeTotal(denominatorMap, monthEnd);
    const averageNumerator = numeratorTotal / monthEnd;
    const averageDenominator = denominatorTotal / monthEnd;

    result.push({
      month_end: monthEnd,
      [numeratorMonthField]: roundTwo(numeratorMonthValue),
      [denominatorMonthField]: roundTwo(denominatorMonthValue),
      [numeratorTotalField]: roundTwo(numeratorTotal),
      [denominatorTotalField]: roundTwo(denominatorTotal),
      [`${averageNumeratorBase}_r${monthEnd}`]: roundTwo(averageNumerator),
      [`${averageDenominatorBase}_r${monthEnd}`]: roundTwo(averageDenominator),
      [ratioField]: roundTwo(safeDivide(averageNumerator, averageDenominator)),
    });
  }

  return result;
};

const buildUnitCountRateSeries = (selectedMonth, valueMap, unitCount, config) => {
  const {
    monthField,
    totalField,
    averageBase,
    averageUnitBase,
    unitField,
    ratioField,
  } = config;

  const result = [];
  for (let monthEnd = 1; monthEnd <= selectedMonth; monthEnd += 1) {
    const monthValue = toNumber(valueMap.get(monthEnd) || 0);
    const totalValue = cumulativeTotal(valueMap, monthEnd);
    const averageValue = totalValue / monthEnd;

    result.push({
      month_end: monthEnd,
      [monthField]: roundTwo(monthValue),
      [totalField]: roundTwo(totalValue),
      [`${averageBase}_r${monthEnd}`]: roundTwo(averageValue),
      [`${averageUnitBase}_r${monthEnd}`]: roundTwo(unitCount),
      [unitField]: unitCount,
      [ratioField]: roundTwo(safeDivide(averageValue, unitCount)),
    });
  }

  return result;
};

const buildAveragePercentSeries = (
  selectedMonth,
  numeratorMap,
  denominatorMap,
  config
) => {
  const {
    numeratorMonthField,
    denominatorMonthField,
    numeratorTotalField,
    denominatorTotalField,
    averageNumeratorBase,
    averageDenominatorBase,
    ratioField,
  } = config;

  const result = [];
  for (let monthEnd = 1; monthEnd <= selectedMonth; monthEnd += 1) {
    const numeratorMonthValue = toNumber(numeratorMap.get(monthEnd) || 0);
    const denominatorMonthValue = toNumber(denominatorMap.get(monthEnd) || 0);
    const numeratorTotal = cumulativeTotal(numeratorMap, monthEnd);
    const denominatorTotal = cumulativeTotal(denominatorMap, monthEnd);
    const averageNumerator = numeratorTotal / monthEnd;
    const averageDenominator = denominatorTotal / monthEnd;

    result.push({
      month_end: monthEnd,
      [numeratorMonthField]: roundTwo(numeratorMonthValue),
      [denominatorMonthField]: roundTwo(denominatorMonthValue),
      [numeratorTotalField]: roundTwo(numeratorTotal),
      [denominatorTotalField]: roundTwo(denominatorTotal),
      [`${averageNumeratorBase}_r${monthEnd}`]: roundTwo(averageNumerator),
      [`${averageDenominatorBase}_r${monthEnd}`]: roundTwo(averageDenominator),
      [ratioField]: roundTwo(safeDivide(averageNumerator, averageDenominator) * 100),
    });
  }

  return result;
};

const buildRatesAndRatios = async (branchIds, yearInt, selectedMonth, unitCount) => {
  const baseWhere = {
    branch_id: branchIds,
    year: yearInt,
    month: { [Op.between]: [1, selectedMonth] },
    is_active: true,
  };

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

  const penjualanRows = await Penjualan.findAll({
    where: baseWhere,
    attributes: [
      "month",
      [
        Sequelize.fn(
          "SUM",
          Sequelize.literal("unit_jualkredit + unit_jualleasing + unit_jualkontan")
        ),
        "total_unit_penjualan",
      ],
      [
        Sequelize.fn("SUM", Sequelize.literal("kontan + kredit + leasing")),
        "total_penjualan",
      ],
      [Sequelize.fn("SUM", Sequelize.col("kredit")), "total_kredit"],
      [Sequelize.fn("SUM", Sequelize.col("leasing")), "total_leasing"],
    ],
    group: ["month"],
    order: [["month", "ASC"]],
    raw: true,
  });

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

  const pendapatanLainRows = await PendapatanLain.findAll({
    where: baseWhere,
    attributes: [
      "month",
      [Sequelize.fn("SUM", Sequelize.col("jumlah_pendapatan_lain")), "total_pendapatan_lain"],
    ],
    group: ["month"],
    order: [["month", "ASC"]],
    raw: true,
  });

  const bebanRows = await Beban.findAll({
    where: baseWhere,
    attributes: [
      "month",
      [Sequelize.fn("SUM", Sequelize.col("gaji")), "total_gaji"],
      [Sequelize.fn("SUM", Sequelize.col("operasional")), "total_operasional"],
      [Sequelize.fn("SUM", Sequelize.col("penyusutan_aktiva")), "total_penyusutan"],
      [Sequelize.fn("SUM", Sequelize.col("cadangan_piutang")), "total_cadangan_piutang"],
      [Sequelize.fn("SUM", Sequelize.col("cadangan_stock")), "total_cadangan_stock"],
    ],
    group: ["month"],
    order: [["month", "ASC"]],
    raw: true,
  });

  const sirkulasiRows = await SirkulasiPiutang.findAll({
    where: baseWhere,
    attributes: [
      "month",
      [Sequelize.fn("SUM", Sequelize.col("macet_lama")), "total_macet_lama"],
    ],
    group: ["month"],
    order: [["month", "ASC"]],
    raw: true,
  });

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

  const pembiayaanByMonth = buildMonthMap(piutangRows, "total_pembiayaan");
  const realisasiPokokByMonth = buildMonthMap(piutangRows, "total_realisasi_pokok");
  const saldoAkhirByMonth = buildMonthMap(piutangRows, "total_saldo_akhir");
  const unitPenjualanByMonth = buildMonthMap(penjualanRows, "total_unit_penjualan");
  const penjualanByMonth = buildMonthMap(penjualanRows, "total_penjualan");
  const kreditByMonth = buildMonthMap(penjualanRows, "total_kredit");
  const leasingByMonth = buildMonthMap(penjualanRows, "total_leasing");
  const karyawanByMonth = buildMonthMap(sumberDayaRows, "total_karyawan");
  const markupByMonth = buildMonthMap(pendapatanRows, "total_markup");
  const realisasiBungaByMonth = buildMonthMap(pendapatanRows, "total_realisasi_bunga");
  const jumlahPendapatanByMonth = buildMonthMap(pendapatanRows, "total_jumlah_pendapatan");
  const dendaByMonth = buildMonthMap(pendapatanRows, "total_denda");
  const administrasiByMonth = buildMonthMap(pendapatanRows, "total_administrasi");
  const pendapatanLainByMonth = buildMonthMap(pendapatanLainRows, "total_pendapatan_lain");
  const gajiByMonth = buildMonthMap(bebanRows, "total_gaji");
  const operasionalByMonth = buildMonthMap(bebanRows, "total_operasional");
  const penyusutanByMonth = buildMonthMap(bebanRows, "total_penyusutan");
  const cadanganPiutangByMonth = buildMonthMap(bebanRows, "total_cadangan_piutang");
  const cadanganStockByMonth = buildMonthMap(bebanRows, "total_cadangan_stock");
  const macetLamaByMonth = buildMonthMap(sirkulasiRows, "total_macet_lama");
  const kumulatifByMonth = buildMonthMap(labaRugiRows, "total_kumulatif");

  const bebanGabunganByMonth = new Map();
  const cadanganTotalByMonth = new Map();
  for (let monthIdx = 1; monthIdx <= selectedMonth; monthIdx += 1) {
    const penyusutan = penyusutanByMonth.get(monthIdx) || 0;
    const cadPiutang = cadanganPiutangByMonth.get(monthIdx) || 0;
    const cadStock = cadanganStockByMonth.get(monthIdx) || 0;
    bebanGabunganByMonth.set(monthIdx, penyusutan + cadPiutang + cadStock);
    cadanganTotalByMonth.set(monthIdx, cadPiutang + cadStock);
  }

  const rate_satu = buildAverageRateSeries(
    selectedMonth,
    pembiayaanByMonth,
    unitPenjualanByMonth,
    {
      numeratorMonthField: "pembiayaan_bulan_ini",
      denominatorMonthField: "unit_penjualan_bulan_ini",
      numeratorTotalField: "total_pembiayaan",
      denominatorTotalField: "total_unit_penjualan",
      averageNumeratorBase: "average_pembiayaan",
      averageDenominatorBase: "average_unit_penjualan",
      ratioField: "pembiayaan_per_unit_penjualan",
    }
  );

  const rate_dua = buildAverageRateSeries(
    selectedMonth,
    penjualanByMonth,
    unitPenjualanByMonth,
    {
      numeratorMonthField: "penjualan_bulan_ini",
      denominatorMonthField: "unit_penjualan_bulan_ini",
      numeratorTotalField: "total_penjualan",
      denominatorTotalField: "total_unit_penjualan",
      averageNumeratorBase: "average_penjualan",
      averageDenominatorBase: "average_unit_penjualan",
      ratioField: "penjualan_per_unit_penjualan",
    }
  );

  const rate_tiga = buildAverageRateSeries(
    selectedMonth,
    penjualanByMonth,
    karyawanByMonth,
    {
      numeratorMonthField: "penjualan_bulan_ini",
      denominatorMonthField: "karyawan_bulan_ini",
      numeratorTotalField: "total_penjualan",
      denominatorTotalField: "total_karyawan",
      averageNumeratorBase: "average_penjualan",
      averageDenominatorBase: "average_karyawan",
      ratioField: "penjualan_per_karyawan",
    }
  );

  const rate_empat = buildAverageRateSeries(
    selectedMonth,
    markupByMonth,
    karyawanByMonth,
    {
      numeratorMonthField: "markup_bulan_ini",
      denominatorMonthField: "karyawan_bulan_ini",
      numeratorTotalField: "total_markup",
      denominatorTotalField: "total_karyawan",
      averageNumeratorBase: "average_markup",
      averageDenominatorBase: "average_karyawan",
      ratioField: "markup_per_karyawan",
    }
  );

  const rate_lima = buildAverageRateSeries(
    selectedMonth,
    gajiByMonth,
    karyawanByMonth,
    {
      numeratorMonthField: "gaji_bulan_ini",
      denominatorMonthField: "karyawan_bulan_ini",
      numeratorTotalField: "total_gaji",
      denominatorTotalField: "total_karyawan",
      averageNumeratorBase: "average_gaji",
      averageDenominatorBase: "average_karyawan",
      ratioField: "gaji_per_karyawan",
    }
  );

  const rate_enam = buildAverageRateSeries(
    selectedMonth,
    operasionalByMonth,
    karyawanByMonth,
    {
      numeratorMonthField: "operasional_bulan_ini",
      denominatorMonthField: "karyawan_bulan_ini",
      numeratorTotalField: "total_operasional",
      denominatorTotalField: "total_karyawan",
      averageNumeratorBase: "average_operasional",
      averageDenominatorBase: "average_karyawan",
      ratioField: "operasional_per_karyawan",
    }
  );

  const rate_tujuh = buildAverageRateSeries(
    selectedMonth,
    penyusutanByMonth,
    karyawanByMonth,
    {
      numeratorMonthField: "penyusutan_bulan_ini",
      denominatorMonthField: "karyawan_bulan_ini",
      numeratorTotalField: "total_penyusutan",
      denominatorTotalField: "total_karyawan",
      averageNumeratorBase: "average_penyusutan",
      averageDenominatorBase: "average_karyawan",
      ratioField: "penyusutan_per_karyawan",
    }
  );

  const rate_delapan = buildUnitCountRateSeries(
    selectedMonth,
    penyusutanByMonth,
    unitCount,
    {
      monthField: "penyusutan_bulan_ini",
      totalField: "total_penyusutan",
      averageBase: "average_penyusutan",
      averageUnitBase: "average_satuan_kerja",
      unitField: "total_satuan_kerja",
      ratioField: "penyusutan_per_satuan_kerja",
    }
  );

  const rate_sembilan = buildUnitCountRateSeries(
    selectedMonth,
    bebanGabunganByMonth,
    unitCount,
    {
      monthField: "beban_gabungan_bulan_ini",
      totalField: "total_beban_gabungan",
      averageBase: "average_beban_gabungan",
      averageUnitBase: "average_satuan_kerja",
      unitField: "total_satuan_kerja",
      ratioField: "beban_gabungan_per_satuan_kerja",
    }
  );

  const rate_sepuluh = buildUnitCountRateSeries(
    selectedMonth,
    kumulatifByMonth,
    unitCount,
    {
      monthField: "kumulatif_bulan_ini",
      totalField: "total_kumulatif",
      averageBase: "average_kumulatif",
      averageUnitBase: "average_satuan_kerja",
      unitField: "total_satuan_kerja",
      ratioField: "kumulatif_per_satuan_kerja",
    }
  );

  const rate_sebelas = buildAverageRateSeries(
    selectedMonth,
    kumulatifByMonth,
    karyawanByMonth,
    {
      numeratorMonthField: "kumulatif_bulan_ini",
      denominatorMonthField: "karyawan_bulan_ini",
      numeratorTotalField: "total_kumulatif",
      denominatorTotalField: "total_karyawan",
      averageNumeratorBase: "average_kumulatif",
      averageDenominatorBase: "average_karyawan",
      ratioField: "kumulatif_per_karyawan",
    }
  );

  const ratio_satu = buildAveragePercentSeries(
    selectedMonth,
    pembiayaanByMonth,
    realisasiPokokByMonth,
    {
      numeratorMonthField: "pembiayaan_bulan_ini",
      denominatorMonthField: "realisasi_pokok_bulan_ini",
      numeratorTotalField: "total_pembiayaan",
      denominatorTotalField: "total_realisasi_pokok",
      averageNumeratorBase: "average_pembiayaan",
      averageDenominatorBase: "average_realisasi_pokok",
      ratioField: "pembiayaan_per_realisasi_pokok",
    }
  );

  const ratio_dua = [];
  for (let monthEnd = 1; monthEnd <= selectedMonth; monthEnd += 1) {
    const cadanganPiutangMonth = toNumber(cadanganPiutangByMonth.get(monthEnd) || 0);
    const tambahanMonth = toNumber(pembiayaanByMonth.get(monthEnd) || 0);
    const macetLamaMonth = toNumber(macetLamaByMonth.get(monthEnd) || 0);
    const stockKreditMonth = toNumber(kreditByMonth.get(monthEnd) || 0);
    const leasingMonth = toNumber(leasingByMonth.get(monthEnd) || 0);

    const cadanganPiutangTotal = cumulativeTotal(cadanganPiutangByMonth, monthEnd);
    const tambahanTotal = cumulativeTotal(pembiayaanByMonth, monthEnd);
    const macetLamaTotal = cumulativeTotal(macetLamaByMonth, monthEnd);
    const stockKreditTotal = cumulativeTotal(kreditByMonth, monthEnd);
    const leasingTotal = cumulativeTotal(leasingByMonth, monthEnd);

    const averageCadanganPiutang = cadanganPiutangTotal / monthEnd;
    const averageTambahan = tambahanTotal / monthEnd;
    const averageMacetLama = macetLamaTotal / monthEnd;
    const averageStockKredit = stockKreditTotal / monthEnd;
    const averageLeasing = leasingTotal / monthEnd;

    ratio_dua.push({
      month_end: monthEnd,
      cadangan_piutang_bulan_ini: roundTwo(cadanganPiutangMonth),
      tambahan_bulan_ini: roundTwo(tambahanMonth),
      macet_lama_bulan_ini: roundTwo(macetLamaMonth),
      stock_kredit_bulan_ini: roundTwo(stockKreditMonth),
      leasing_bulan_ini: roundTwo(leasingMonth),
      total_cadangan_piutang: roundTwo(cadanganPiutangTotal),
      total_tambahan: roundTwo(tambahanTotal),
      total_macet_lama: roundTwo(macetLamaTotal),
      total_stock_kredit: roundTwo(stockKreditTotal),
      total_leasing: roundTwo(leasingTotal),
      [`average_cadangan_piutang_r${monthEnd}`]: roundTwo(averageCadanganPiutang),
      [`average_tambahan_r${monthEnd}`]: roundTwo(averageTambahan),
      [`average_macet_lama_r${monthEnd}`]: roundTwo(averageMacetLama),
      [`average_stock_kredit_r${monthEnd}`]: roundTwo(averageStockKredit),
      [`average_leasing_r${monthEnd}`]: roundTwo(averageLeasing),
      rasio_kemacetan_pembiayaan: roundTwo(
        safeDivide(averageCadanganPiutang, averageTambahan) * 100
      ),
    });
  }

  const ratio_tiga = buildAveragePercentSeries(
    selectedMonth,
    markupByMonth,
    pembiayaanByMonth,
    {
      numeratorMonthField: "markup_bulan_ini",
      denominatorMonthField: "pembiayaan_bulan_ini",
      numeratorTotalField: "total_markup",
      denominatorTotalField: "total_pembiayaan",
      averageNumeratorBase: "average_markup",
      averageDenominatorBase: "average_pembiayaan",
      ratioField: "rasio_markup",
    }
  );

  const ratio_empat = buildAveragePercentSeries(
    selectedMonth,
    realisasiBungaByMonth,
    saldoAkhirByMonth,
    {
      numeratorMonthField: "realisasi_bunga_bulan_ini",
      denominatorMonthField: "saldo_akhir_bulan_ini",
      numeratorTotalField: "total_realisasi_bunga",
      denominatorTotalField: "total_saldo_akhir",
      averageNumeratorBase: "average_realisasi_bunga",
      averageDenominatorBase: "average_saldo_akhir",
      ratioField: "rasio_realisasi_bunga_per_total_piutang",
    }
  );

  const ratio_lima = buildAveragePercentSeries(
    selectedMonth,
    markupByMonth,
    jumlahPendapatanByMonth,
    {
      numeratorMonthField: "markup_bulan_ini",
      denominatorMonthField: "jumlah_pendapatan_bulan_ini",
      numeratorTotalField: "total_markup",
      denominatorTotalField: "total_jumlah_pendapatan",
      averageNumeratorBase: "average_markup",
      averageDenominatorBase: "average_jumlah_pendapatan",
      ratioField: "rasio_markup_per_jumlah_pendapatan",
    }
  );

  const ratio_enam = buildAveragePercentSeries(
    selectedMonth,
    realisasiBungaByMonth,
    jumlahPendapatanByMonth,
    {
      numeratorMonthField: "realisasi_bunga_bulan_ini",
      denominatorMonthField: "jumlah_pendapatan_bulan_ini",
      numeratorTotalField: "total_realisasi_bunga",
      denominatorTotalField: "total_jumlah_pendapatan",
      averageNumeratorBase: "average_realisasi_bunga",
      averageDenominatorBase: "average_jumlah_pendapatan",
      ratioField: "rasio_pendapatan_bunga_per_jumlah_pendapatan",
    }
  );

  const ratio_tujuh = [];
  for (let monthEnd = 1; monthEnd <= selectedMonth; monthEnd += 1) {
    const pendapatanLainMonth = toNumber(pendapatanLainByMonth.get(monthEnd) || 0);
    const jumlahPendapatanMonth = toNumber(jumlahPendapatanByMonth.get(monthEnd) || 0);
    const dendaMonth = toNumber(dendaByMonth.get(monthEnd) || 0);
    const administrasiMonth = toNumber(administrasiByMonth.get(monthEnd) || 0);

    const pendapatanLainTotal = cumulativeTotal(pendapatanLainByMonth, monthEnd);
    const jumlahPendapatanTotal = cumulativeTotal(jumlahPendapatanByMonth, monthEnd);
    const dendaTotal = cumulativeTotal(dendaByMonth, monthEnd);
    const administrasiTotal = cumulativeTotal(administrasiByMonth, monthEnd);

    const averagePendapatanLain = pendapatanLainTotal / monthEnd;
    const averageJumlahPendapatan = jumlahPendapatanTotal / monthEnd;
    const averageDenda = dendaTotal / monthEnd;
    const averageAdministrasi = administrasiTotal / monthEnd;

    ratio_tujuh.push({
      month_end: monthEnd,
      jumlah_pendapatan_lain_bulan_ini: roundTwo(pendapatanLainMonth),
      jumlah_pendapatan_bulan_ini: roundTwo(jumlahPendapatanMonth),
      denda_bulan_ini: roundTwo(dendaMonth),
      administrasi_bulan_ini: roundTwo(administrasiMonth),
      total_jumlah_pendapatan_lain: roundTwo(pendapatanLainTotal),
      total_jumlah_pendapatan: roundTwo(jumlahPendapatanTotal),
      total_denda: roundTwo(dendaTotal),
      total_administrasi: roundTwo(administrasiTotal),
      [`average_jumlah_pendapatan_lain_r${monthEnd}`]: roundTwo(averagePendapatanLain),
      [`average_jumlah_pendapatan_r${monthEnd}`]: roundTwo(averageJumlahPendapatan),
      [`average_denda_r${monthEnd}`]: roundTwo(averageDenda),
      [`average_administrasi_r${monthEnd}`]: roundTwo(averageAdministrasi),
      rasio_pendapatan_lainnya_per_jumlah_pendapatan: roundTwo(
        safeDivide(averagePendapatanLain, averageJumlahPendapatan) * 100
      ),
    });
  }

  const ratio_delapan = buildAveragePercentSeries(
    selectedMonth,
    gajiByMonth,
    jumlahPendapatanByMonth,
    {
      numeratorMonthField: "gaji_bulan_ini",
      denominatorMonthField: "jumlah_pendapatan_bulan_ini",
      numeratorTotalField: "total_gaji",
      denominatorTotalField: "total_jumlah_pendapatan",
      averageNumeratorBase: "average_gaji",
      averageDenominatorBase: "average_jumlah_pendapatan",
      ratioField: "rasio_gaji_per_pendapatan",
    }
  );

  const ratio_sembilan = buildAveragePercentSeries(
    selectedMonth,
    operasionalByMonth,
    jumlahPendapatanByMonth,
    {
      numeratorMonthField: "operasional_bulan_ini",
      denominatorMonthField: "jumlah_pendapatan_bulan_ini",
      numeratorTotalField: "total_operasional",
      denominatorTotalField: "total_jumlah_pendapatan",
      averageNumeratorBase: "average_operasional",
      averageDenominatorBase: "average_jumlah_pendapatan",
      ratioField: "rasio_operasional_per_pendapatan",
    }
  );

  const ratio_sepuluh = buildAveragePercentSeries(
    selectedMonth,
    penyusutanByMonth,
    jumlahPendapatanByMonth,
    {
      numeratorMonthField: "penyusutan_bulan_ini",
      denominatorMonthField: "jumlah_pendapatan_bulan_ini",
      numeratorTotalField: "total_penyusutan",
      denominatorTotalField: "total_jumlah_pendapatan",
      averageNumeratorBase: "average_penyusutan",
      averageDenominatorBase: "average_jumlah_pendapatan",
      ratioField: "rasio_penyusutan_per_pendapatan",
    }
  );

  const ratio_sebelas = buildAveragePercentSeries(
    selectedMonth,
    cadanganTotalByMonth,
    jumlahPendapatanByMonth,
    {
      numeratorMonthField: "cadangan_bulan_ini",
      denominatorMonthField: "jumlah_pendapatan_bulan_ini",
      numeratorTotalField: "total_cadangan",
      denominatorTotalField: "total_jumlah_pendapatan",
      averageNumeratorBase: "average_cadangan",
      averageDenominatorBase: "average_jumlah_pendapatan",
      ratioField: "rasio_cadangan_per_pendapatan",
    }
  );

  return {
    rate_satu,
    rate_dua,
    rate_tiga,
    rate_empat,
    rate_lima,
    rate_enam,
    rate_tujuh,
    rate_delapan,
    rate_sembilan,
    rate_sepuluh,
    rate_sebelas,
    ratio_satu,
    ratio_dua,
    ratio_tiga,
    ratio_empat,
    ratio_lima,
    ratio_enam,
    ratio_tujuh,
    ratio_delapan,
    ratio_sembilan,
    ratio_sepuluh,
    ratio_sebelas,
  };
};

const handleGetRatesRatios = async (req, res) => {
  try {
    const { entity_id } = req.params;
    const { year, month } = req.query;

    const entityId = parseInt(entity_id, 10);
    const yearInt = year ? parseInt(year, 10) : undefined;
    const selectedMonth = month ? parseInt(month, 10) : 12;

    if (!entityId || !yearInt) {
      return res.status(400).json({
        success: false,
        message: "entity_id dan year wajib diisi",
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
    const unitEntities = descendants.filter((item) => item?.type === "UNIT");

    const metrics = await buildRatesAndRatios(
      branchIds,
      yearInt,
      selectedMonth,
      unitEntities.length
    );

    const units = [];
    for (const unit of unitEntities) {
      const unitId = Number(unit.id);
      if (!Number.isInteger(unitId)) continue;

      const unitMetrics = await buildRatesAndRatios(
        [unitId],
        yearInt,
        selectedMonth,
        1
      );

      units.push({
        unit_id: unitId,
        unit_name: unit.name,
        ...unitMetrics,
      });
    }

    return res.json({
      success: true,
      entity_id: entityId,
      entity_name: rootEntity.name,
      entity_type: rootEntity.entity_type,
      year: yearInt,
      selected_month: selectedMonth,
      included_branch_ids: branchIds,
      unit_count: unitEntities.length,
      komentar:
        "Jika entity adalah CABANG, perhitungan memakai cabang itu sendiri + semua turunannya.",
      ...metrics,
      units,
    });
  } catch (error) {
    console.error("Error in getRatesRatios:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  // GET /rate-ratio/:entity_id/descendants/rates-ratios?year=2025&month=3
  async getRatesRatios(req, res) {
    return handleGetRatesRatios(req, res);
  },
  // Backward compatibility endpoint lama.
  async getPembiayaanUnitPenjualan(req, res) {
    return handleGetRatesRatios(req, res);
  },
};
