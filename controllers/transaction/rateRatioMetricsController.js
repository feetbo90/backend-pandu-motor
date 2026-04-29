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
  denominator !== 0 ? numerator / denominator : 0;
const roundTwo = (value) => Math.round(toNumber(value));
const roundRatio = (value) => Number(toNumber(value).toFixed(2));

const buildMonthMap = (rows, fieldName, branchIdFilter) => {
  const map = new Map();
  rows.forEach((row) => {
    if (
      branchIdFilter !== undefined &&
      Number(row.branch_id) !== Number(branchIdFilter)
    ) {
      return;
    }

    const month = Number(row.month);
    const currentValue = toNumber(map.get(month) || 0);
    map.set(month, currentValue + toNumber(row[fieldName]));
  });
  return map;
};

const buildMonthMapForYear = (rows, fieldName, yearFilter, branchIdFilter) => {
  const map = new Map();
  rows.forEach((row) => {
    if (Number(row.year) !== Number(yearFilter)) {
      return;
    }
    if (
      branchIdFilter !== undefined &&
      Number(row.branch_id) !== Number(branchIdFilter)
    ) {
      return;
    }

    const month = Number(row.month);
    const currentValue = toNumber(map.get(month) || 0);
    map.set(month, currentValue + toNumber(row[fieldName]));
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

const buildMonthlyIncreaseMap = (
  rows,
  fieldName,
  yearFilter,
  branchIdFilter,
  allowedBranchIds
) => {
  const byBranch = new Map();
  const allowedBranchIdSet = Array.isArray(allowedBranchIds)
    ? new Set(
        allowedBranchIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id))
      )
    : null;

  rows.forEach((row) => {
    const branchId = Number(row.branch_id);
    const year = Number(row.year);
    const month = Number(row.month);
    if (!Number.isInteger(branchId) || !Number.isInteger(year) || !Number.isInteger(month)) {
      return;
    }
    if (
      branchIdFilter !== undefined &&
      Number(row.branch_id) !== Number(branchIdFilter)
    ) {
      return;
    }
    if (allowedBranchIdSet && !allowedBranchIdSet.has(branchId)) {
      return;
    }
    if (
      year !== Number(yearFilter) &&
      !(year === Number(yearFilter) - 1 && month === 12)
    ) {
      return;
    }

    if (!byBranch.has(branchId)) {
      byBranch.set(branchId, new Map());
    }

    byBranch.get(branchId).set(`${year}-${month}`, toNumber(row[fieldName]));
  });

  const increaseMap = new Map();
  byBranch.forEach((monthMap) => {
    for (let month = 1; month <= 12; month += 1) {
      if (month !== 1 && !monthMap.has(`${yearFilter}-${month}`)) {
        continue;
      }
      const currentValue = toNumber(monthMap.get(`${yearFilter}-${month}`) || 0);
      const previousValue =
        month === 1
          ? toNumber(monthMap.get(`${Number(yearFilter) - 1}-12`) || 0)
          : toNumber(monthMap.get(`${yearFilter}-${month - 1}`) || 0);
      const currentIncrease = currentValue - previousValue;
      increaseMap.set(month, toNumber(increaseMap.get(month) || 0) + currentIncrease);
    }
  });

  return increaseMap;
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
    denominatorTotalFromCurrentMonth = false,
  } = config;

  const result = [];
  for (let monthEnd = 1; monthEnd <= selectedMonth; monthEnd += 1) {
    const numeratorMonthValue = toNumber(numeratorMap.get(monthEnd) || 0);
    const denominatorMonthValue = toNumber(denominatorMap.get(monthEnd) || 0);
    const numeratorTotal = cumulativeTotal(numeratorMap, monthEnd);
    const denominatorTotalCumulative = cumulativeTotal(denominatorMap, monthEnd);
    const denominatorTotal = denominatorTotalFromCurrentMonth
      ? denominatorMonthValue
      : denominatorTotalCumulative;
    const averageNumerator = numeratorTotal / monthEnd;
    const averageDenominator = denominatorTotalCumulative / monthEnd;

    result.push({
      month_end: monthEnd,
      [numeratorMonthField]: roundTwo(numeratorMonthValue),
      [denominatorMonthField]: roundTwo(denominatorMonthValue),
      [numeratorTotalField]: roundTwo(numeratorTotal),
      [denominatorTotalField]: roundTwo(denominatorTotal),
      [`${averageNumeratorBase}_r${monthEnd}`]: roundTwo(averageNumerator),
      [`${averageDenominatorBase}_r${monthEnd}`]: roundTwo(averageDenominator),
      [ratioField]: roundRatio(safeDivide(averageNumerator, averageDenominator)),
    });
  }

  return result;
};

const buildUnitRateSeries = (selectedMonth, valueMap, unitMap, config) => {
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
    const unitValue = toNumber(unitMap.get(monthEnd) || 0);
    const totalUnit = cumulativeTotal(unitMap, monthEnd);
    const averageUnit = totalUnit / monthEnd;

    result.push({
      month_end: monthEnd,
      [monthField]: roundTwo(monthValue),
      [totalField]: roundTwo(totalValue),
      [`${averageBase}_r${monthEnd}`]: roundTwo(averageValue),
      [`${averageUnitBase}_r${monthEnd}`]: roundTwo(averageUnit),
      [unitField]: roundTwo(unitValue),
      [ratioField]: roundTwo(safeDivide(averageValue, averageUnit)),
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
      [ratioField]: roundRatio(safeDivide(averageNumerator, averageDenominator) * 100),
    });
  }

  return result;
};

const fetchRatesAndRatiosAggregates = async (
  branchIds,
  yearInt,
  selectedMonth,
  groupByBranch = false
) => {
  const baseWhere = {
    branch_id: branchIds,
    year: yearInt,
    month: { [Op.between]: [1, selectedMonth] },
    is_active: true,
  };
  const sirkulasiWhere = {
    branch_id: branchIds,
    is_active: true,
    [Op.or]: [
      { year: yearInt, month: { [Op.between]: [1, selectedMonth] } },
      { year: yearInt - 1, month: 12 },
    ],
  };

  const dimensionAttrs = groupByBranch ? ["branch_id", "month"] : ["month"];
  const dimensionGroup = groupByBranch ? ["branch_id", "month"] : ["month"];

  const [
    piutangRows,
    penjualanRows,
    sumberDayaRows,
    pendapatanRows,
    pendapatanLainRows,
    bebanRows,
    sirkulasiRows,
    labaRugiRows,
  ] = await Promise.all([
    Piutang.findAll({
      where: baseWhere,
      attributes: [
        ...dimensionAttrs,
        [Sequelize.fn("SUM", Sequelize.col("tambahan")), "total_pembiayaan"],
        [Sequelize.fn("SUM", Sequelize.col("realisasi_pokok")), "total_realisasi_pokok"],
      ],
      group: dimensionGroup,
      order: [["month", "ASC"]],
      raw: true,
    }),
    Penjualan.findAll({
      where: baseWhere,
      attributes: [
        ...dimensionAttrs,
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
      group: dimensionGroup,
      order: [["month", "ASC"]],
      raw: true,
    }),
    SumberDaya.findAll({
      where: baseWhere,
      attributes: [
        ...dimensionAttrs,
        [Sequelize.fn("SUM", Sequelize.col("jumlah_karyawan")), "total_karyawan"],
        [Sequelize.fn("SUM", Sequelize.col("jumlah_unit")), "total_satuan_kerja"],
      ],
      group: dimensionGroup,
      order: [["month", "ASC"]],
      raw: true,
    }),
    Pendapatan.findAll({
      where: baseWhere,
      attributes: [
        ...dimensionAttrs,
        [Sequelize.fn("SUM", Sequelize.col("markup_jumlah")), "total_markup"],
        [Sequelize.fn("SUM", Sequelize.col("realisasi_bunga")), "total_realisasi_bunga"],
        [Sequelize.fn("SUM", Sequelize.col("jumlah_pendapatan")), "total_jumlah_pendapatan"],
        [Sequelize.fn("SUM", Sequelize.col("denda")), "total_denda"],
        [Sequelize.fn("SUM", Sequelize.col("administrasi")), "total_administrasi"],
        [Sequelize.fn("SUM", Sequelize.col("pendapatan_lain")), "total_pendapatan_lain_pendapatan"],
      ],
      group: dimensionGroup,
      order: [["month", "ASC"]],
      raw: true,
    }),
    PendapatanLain.findAll({
      where: baseWhere,
      attributes: [
        ...dimensionAttrs,
        [Sequelize.fn("SUM", Sequelize.col("jumlah_pendapatan_lain")), "total_pendapatan_lain"],
      ],
      group: dimensionGroup,
      order: [["month", "ASC"]],
      raw: true,
    }),
    Beban.findAll({
      where: baseWhere,
      attributes: [
        ...dimensionAttrs,
        [Sequelize.fn("SUM", Sequelize.col("gaji")), "total_gaji"],
        [Sequelize.fn("SUM", Sequelize.col("operasional")), "total_operasional"],
        [Sequelize.fn("SUM", Sequelize.col("penyusutan_aktiva")), "total_penyusutan"],
        [Sequelize.fn("SUM", Sequelize.col("cadangan_piutang")), "total_cadangan_piutang"],
        [Sequelize.fn("SUM", Sequelize.col("cadangan_stock")), "total_cadangan_stock"],
      ],
      group: dimensionGroup,
      order: [["month", "ASC"]],
      raw: true,
    }),
    SirkulasiPiutang.findAll({
      where: sirkulasiWhere,
      attributes: [
        "branch_id",
        "year",
        "month",
        [Sequelize.fn("SUM", Sequelize.col("macet_lama")), "total_macet_lama"],
        [Sequelize.fn("SUM", Sequelize.col("total")), "total_saldo_akhir"],
      ],
      group: ["branch_id", "year", "month"],
      order: [["year", "ASC"], ["month", "ASC"]],
      raw: true,
    }),
    LabaRugi.findAll({
      where: baseWhere,
      attributes: [
        ...dimensionAttrs,
        [Sequelize.fn("SUM", Sequelize.col("bulan_ini")), "total_kumulatif"],
      ],
      group: dimensionGroup,
      order: [["month", "ASC"]],
      raw: true,
    }),
  ]);

  return {
    piutangRows,
    penjualanRows,
    sumberDayaRows,
    pendapatanRows,
    pendapatanLainRows,
    bebanRows,
    sirkulasiRows,
    labaRugiRows,
  };
};

const buildRatesAndRatiosFromAggregates = (
  aggregates,
  yearInt,
  selectedMonth,
  branchIdFilter,
  increaseBranchIds
) => {
  const {
    piutangRows,
    penjualanRows,
    sumberDayaRows,
    pendapatanRows,
    pendapatanLainRows,
    bebanRows,
    sirkulasiRows,
    labaRugiRows,
  } = aggregates;

  const pembiayaanByMonth = buildMonthMap(
    piutangRows,
    "total_pembiayaan",
    branchIdFilter
  );
  const realisasiPokokByMonth = buildMonthMap(
    piutangRows,
    "total_realisasi_pokok",
    branchIdFilter
  );
  const saldoAkhirByMonth = buildMonthMap(
    sirkulasiRows,
    "total_saldo_akhir",
    branchIdFilter
  );
  const unitPenjualanByMonth = buildMonthMap(
    penjualanRows,
    "total_unit_penjualan",
    branchIdFilter
  );
  const penjualanByMonth = buildMonthMap(
    penjualanRows,
    "total_penjualan",
    branchIdFilter
  );
  const kreditByMonth = buildMonthMap(penjualanRows, "total_kredit", branchIdFilter);
  const leasingByMonth = buildMonthMap(penjualanRows, "total_leasing", branchIdFilter);
  const karyawanByMonth = buildMonthMap(
    sumberDayaRows,
    "total_karyawan",
    branchIdFilter
  );
  const satuanKerjaByMonth = buildMonthMap(
    sumberDayaRows,
    "total_satuan_kerja",
    branchIdFilter
  );
  const markupByMonth = buildMonthMap(pendapatanRows, "total_markup", branchIdFilter);
  const realisasiBungaByMonth = buildMonthMap(
    pendapatanRows,
    "total_realisasi_bunga",
    branchIdFilter
  );
  const jumlahPendapatanByMonth = buildMonthMap(
    pendapatanRows,
    "total_jumlah_pendapatan",
    branchIdFilter
  );
  const dendaByMonth = buildMonthMap(pendapatanRows, "total_denda", branchIdFilter);
  const administrasiByMonth = buildMonthMap(
    pendapatanRows,
    "total_administrasi",
    branchIdFilter
  );
  const pendapatanLainPendapatanByMonth = buildMonthMap(
    pendapatanRows,
    "total_pendapatan_lain_pendapatan",
    branchIdFilter
  );
  const pendapatanLainByMonth = buildMonthMap(
    pendapatanLainRows,
    "total_pendapatan_lain",
    branchIdFilter
  );
  const gajiByMonth = buildMonthMap(bebanRows, "total_gaji", branchIdFilter);
  const operasionalByMonth = buildMonthMap(
    bebanRows,
    "total_operasional",
    branchIdFilter
  );
  const penyusutanByMonth = buildMonthMap(
    bebanRows,
    "total_penyusutan",
    branchIdFilter
  );
  const cadanganPiutangByMonth = buildMonthMap(
    bebanRows,
    "total_cadangan_piutang",
    branchIdFilter
  );
  const cadanganStockByMonth = buildMonthMap(
    bebanRows,
    "total_cadangan_stock",
    branchIdFilter
  );
  const macetLamaByMonth = buildMonthMapForYear(
    sirkulasiRows,
    "total_macet_lama",
    yearInt,
    branchIdFilter
  );
  const kenaikanMacetLamaByMonth = buildMonthlyIncreaseMap(
    sirkulasiRows,
    "total_macet_lama",
    yearInt,
    branchIdFilter,
    increaseBranchIds
  );
  const kumulatifByMonth = buildMonthMap(
    labaRugiRows,
    "total_kumulatif",
    branchIdFilter
  );

  const bebanGabunganByMonth = new Map();
  const cadanganTotalByMonth = new Map();
  for (let monthIdx = 1; monthIdx <= selectedMonth; monthIdx += 1) {
    const penyusutan = penyusutanByMonth.get(monthIdx) || 0;
    const cadPiutang = cadanganPiutangByMonth.get(monthIdx) || 0;
    const cadStock = cadanganStockByMonth.get(monthIdx) || 0;
    bebanGabunganByMonth.set(monthIdx, penyusutan + cadPiutang + cadStock);
    cadanganTotalByMonth.set(monthIdx, cadPiutang + cadStock);
  }

  let rate_satu = buildAverageRateSeries(
    selectedMonth,
    pembiayaanByMonth,
    unitPenjualanByMonth,
    {
      numeratorMonthField: "pembiayaan_bulan_ini",
      denominatorMonthField: "unit_penjualan_bulan_ini",
      numeratorTotalField: "total_pembiayaan",
      denominatorTotalField: "total_unit_penjualan",
      averageNumeratorBase: "average_unit_pembiayaan",
      averageDenominatorBase: "average_unit_penjualan",
      ratioField: "pembiayaan_per_unit_penjualan",
    }
  );
  rate_satu = rate_satu.map((item) => {
    const monthEnd = Number(item.month_end);
    const pembiayaanTotal = cumulativeTotal(pembiayaanByMonth, monthEnd);
    const totalUnitPenjualan = cumulativeTotal(unitPenjualanByMonth, monthEnd);
    const averageUnitPembiayaan = pembiayaanTotal / monthEnd;
    const averageUnitPenjualan = totalUnitPenjualan / monthEnd;
    const roundedAverageUnitPembiayaan = roundTwo(averageUnitPembiayaan);
    const roundedAverageUnitPenjualan = roundTwo(averageUnitPenjualan);
    const pendapatanAdministrasi = toNumber(administrasiByMonth.get(monthEnd) || 0);
    const pendapatanDenda = toNumber(dendaByMonth.get(monthEnd) || 0);
    const pendapatanLainBulanIni = toNumber(
      pendapatanLainPendapatanByMonth.get(monthEnd) || 0
    );
    const administrasiTotal = cumulativeTotal(administrasiByMonth, monthEnd);
    const dendaTotal = cumulativeTotal(dendaByMonth, monthEnd);
    const averagePendapatanAdministrasi = administrasiTotal / monthEnd;
    const averagePendapatanDenda = dendaTotal / monthEnd;
    const averageUnitPembiayaanKey = `average_unit_pembiayaan_r${monthEnd}`;
    const averageUnitPenjualanKey = `average_unit_penjualan_r${monthEnd}`;
    const averageUnitPembiayaanValue = toNumber(item[averageUnitPembiayaanKey]);
    const averageUnitPenjualanValue = toNumber(item[averageUnitPenjualanKey]);

    return {
      ...item,
      [`average_unit_pembiayaan_r${monthEnd}`]: roundedAverageUnitPembiayaan,
      [`average_unit_penjualan_r${monthEnd}`]: roundedAverageUnitPenjualan,
      pembiayaan_per_unit_penjualan: roundTwo(
        safeDivide(
          averageUnitPembiayaanValue || roundedAverageUnitPembiayaan,
          averageUnitPenjualanValue || roundedAverageUnitPenjualan
        )
      ),
      pendapatan_administrasi: roundTwo(pendapatanAdministrasi),
      [`average_pendapatan_administrasi_r${monthEnd}`]: roundTwo(
        averagePendapatanAdministrasi
      ),
      pendapatan_denda: roundTwo(pendapatanDenda),
      [`average_pendapatan_denda_r${monthEnd}`]: roundTwo(averagePendapatanDenda),
      pendapatan_lain_bulan_ini: roundTwo(pendapatanLainBulanIni),
    };
  });

  let rate_dua = buildAverageRateSeries(
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
  rate_dua = rate_dua.map((item) => {
    const monthEnd = Number(item.month_end);
    const penjualanTotal = cumulativeTotal(penjualanByMonth, monthEnd);
    const totalUnitPenjualan = cumulativeTotal(unitPenjualanByMonth, monthEnd);
    const averagePenjualan = penjualanTotal / monthEnd;
    const averageUnitPenjualan = totalUnitPenjualan / monthEnd;
    const roundedAveragePenjualan = roundTwo(averagePenjualan);
    const roundedAverageUnitPenjualan = roundTwo(averageUnitPenjualan);

    return {
      ...item,
      [`average_penjualan_r${monthEnd}`]: roundedAveragePenjualan,
      penjualan_per_unit_penjualan: roundTwo(
        safeDivide(roundedAveragePenjualan, roundedAverageUnitPenjualan)
      ),
    };
  });

  let rate_tiga = buildAverageRateSeries(
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
      denominatorTotalFromCurrentMonth: true,
    }
  );
  rate_tiga = rate_tiga.map((item) => {
    const monthEnd = Number(item.month_end);
    const penjualanTotal = cumulativeTotal(penjualanByMonth, monthEnd);
    const averagePenjualan = penjualanTotal / monthEnd;
    const totalKaryawan = toNumber(karyawanByMonth.get(monthEnd) || 0);

    return {
      ...item,
      [`average_penjualan_r${monthEnd}`]: roundTwo(averagePenjualan),
      penjualan_per_karyawan: roundTwo(safeDivide(averagePenjualan, totalKaryawan)),
    };
  });

  let rate_empat = buildAverageRateSeries(
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
      denominatorTotalFromCurrentMonth: true,
    }
  );
  rate_empat = rate_empat.map((item) => {
    const monthEnd = Number(item.month_end);
    const markupTotal = cumulativeTotal(markupByMonth, monthEnd);
    const averageMarkup = markupTotal / monthEnd;
    const totalKaryawan = toNumber(karyawanByMonth.get(monthEnd) || 0);

    return {
      ...item,
      [`average_markup_r${monthEnd}`]: roundTwo(averageMarkup),
      markup_per_karyawan: roundTwo(safeDivide(averageMarkup, totalKaryawan)),
    };
  });

  let rate_lima = buildAverageRateSeries(
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
      denominatorTotalFromCurrentMonth: true,
    }
  );
  rate_lima = rate_lima.map((item) => {
    const monthEnd = Number(item.month_end);
    const gajiTotal = cumulativeTotal(gajiByMonth, monthEnd);
    const averageGaji = gajiTotal / monthEnd;
    const totalKaryawan = toNumber(karyawanByMonth.get(monthEnd) || 0);

    return {
      ...item,
      [`average_gaji_r${monthEnd}`]: roundTwo(averageGaji),
      gaji_per_karyawan: roundTwo(safeDivide(averageGaji, totalKaryawan)),
    };
  });

  let rate_enam = buildAverageRateSeries(
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
      denominatorTotalFromCurrentMonth: true,
    }
  );
  rate_enam = rate_enam.map((item) => {
    const monthEnd = Number(item.month_end);
    const operasionalTotal = cumulativeTotal(operasionalByMonth, monthEnd);
    const averageOperasional = operasionalTotal / monthEnd;
    const totalKaryawan = toNumber(karyawanByMonth.get(monthEnd) || 0);

    return {
      ...item,
      [`average_operasional_r${monthEnd}`]: roundTwo(averageOperasional),
      operasional_per_karyawan: roundTwo(
        safeDivide(averageOperasional, totalKaryawan)
      ),
    };
  });

  let rate_tujuh = buildAverageRateSeries(
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
      denominatorTotalFromCurrentMonth: true,
    }
  );
  rate_tujuh = rate_tujuh.map((item) => {
    const monthEnd = Number(item.month_end);
    const penyusutanTotal = cumulativeTotal(penyusutanByMonth, monthEnd);
    const averagePenyusutan = penyusutanTotal / monthEnd;
    const totalKaryawan = toNumber(karyawanByMonth.get(monthEnd) || 0);

    return {
      ...item,
      [`average_penyusutan_r${monthEnd}`]: roundTwo(averagePenyusutan),
      penyusutan_per_karyawan: roundTwo(
        safeDivide(averagePenyusutan, totalKaryawan)
      ),
    };
  });

  const rate_delapan = buildUnitRateSeries(
    selectedMonth,
    penyusutanByMonth,
    satuanKerjaByMonth,
    {
      monthField: "penyusutan_bulan_ini",
      totalField: "total_penyusutan",
      averageBase: "average_penyusutan",
      averageUnitBase: "average_satuan_kerja",
      unitField: "total_satuan_kerja",
      ratioField: "penyusutan_per_satuan_kerja",
    }
  );

  const rate_sembilan = buildUnitRateSeries(
    selectedMonth,
    bebanGabunganByMonth,
    satuanKerjaByMonth,
    {
      monthField: "beban_gabungan_bulan_ini",
      totalField: "total_beban_gabungan",
      averageBase: "average_beban_gabungan",
      averageUnitBase: "average_satuan_kerja",
      unitField: "total_satuan_kerja",
      ratioField: "beban_gabungan_per_satuan_kerja",
    }
  );

  const rate_sepuluh = buildUnitRateSeries(
    selectedMonth,
    kumulatifByMonth,
    satuanKerjaByMonth,
    {
      monthField: "kumulatif_bulan_ini",
      totalField: "total_kumulatif",
      averageBase: "average_kumulatif",
      averageUnitBase: "average_satuan_kerja",
      unitField: "total_satuan_kerja",
      ratioField: "kumulatif_per_satuan_kerja",
    }
  );

  let rate_sebelas = buildAverageRateSeries(
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
      denominatorTotalFromCurrentMonth: true,
    }
  );
  rate_sebelas = rate_sebelas.map((item) => {
    const monthEnd = Number(item.month_end);
    const kumulatifTotal = cumulativeTotal(kumulatifByMonth, monthEnd);
    const averageKumulatif = kumulatifTotal / monthEnd;
    const totalKaryawan = toNumber(karyawanByMonth.get(monthEnd) || 0);

    return {
      ...item,
      [`average_kumulatif_r${monthEnd}`]: roundTwo(averageKumulatif),
      kumulatif_per_karyawan: roundTwo(safeDivide(averageKumulatif, totalKaryawan)),
    };
  });

  let ratio_satu = buildAveragePercentSeries(
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
  ratio_satu = ratio_satu.map((item) => {
    const pembiayaanBulanIni = toNumber(item.pembiayaan_bulan_ini || 0);
    const realisasiPokokBulanIni = toNumber(item.realisasi_pokok_bulan_ini || 0);

    return {
      ...item,
      pembiayaan_per_realisasi_pokok: roundRatio(
        safeDivide(pembiayaanBulanIni, realisasiPokokBulanIni) * 100
      ),
    };
  });

  const ratio_dua = [];
  for (let monthEnd = 1; monthEnd <= selectedMonth; monthEnd += 1) {
    const cadanganPiutangMonth = toNumber(cadanganPiutangByMonth.get(monthEnd) || 0);
    const pembiayaanMonth = toNumber(pembiayaanByMonth.get(monthEnd) || 0);
    const macetLamaCurrent = toNumber(macetLamaByMonth.get(monthEnd) || 0);
    const kenaikanMacetLama = toNumber(
      kenaikanMacetLamaByMonth.get(monthEnd) || 0
    );
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
      tambahan_bulan_ini: roundTwo(pembiayaanMonth),
      macet_lama_bulan_ini: roundTwo(macetLamaCurrent),
      kenaikan_macet_lama: roundTwo(kenaikanMacetLama),
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
      rasio_kemacetan_pembiayaan: roundRatio(
        safeDivide(kenaikanMacetLama, pembiayaanMonth) * 100
      ),
    });
  }

  let ratio_tiga = buildAveragePercentSeries(
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
  ratio_tiga = ratio_tiga.map((item) => {
    const markupBulanIni = toNumber(item.markup_bulan_ini || 0);
    const pembiayaanBulanIni = toNumber(item.pembiayaan_bulan_ini || 0);

    return {
      ...item,
      rasio_markup: roundRatio(
        safeDivide(markupBulanIni, pembiayaanBulanIni) * 100
      ),
    };
  });

  const ratio_empat = [];
  for (let monthEnd = 1; monthEnd <= selectedMonth; monthEnd += 1) {
    const realisasiBungaMonth = toNumber(realisasiBungaByMonth.get(monthEnd) || 0);
    const saldoAkhirMonth = toNumber(saldoAkhirByMonth.get(monthEnd) || 0);
    const realisasiBungaTotal = cumulativeTotal(realisasiBungaByMonth, monthEnd);
    const saldoAkhirTotal = cumulativeTotal(saldoAkhirByMonth, monthEnd);
    const averageRealisasiBunga = realisasiBungaTotal / monthEnd;
    const averageSaldoAkhir = saldoAkhirTotal / monthEnd;

    ratio_empat.push({
      month_end: monthEnd,
      realisasi_bunga_bulan_ini: roundTwo(realisasiBungaMonth),
      saldo_akhir_bulan_ini: roundTwo(saldoAkhirMonth),
      total_realisasi_bunga: roundTwo(realisasiBungaTotal),
      total_saldo_akhir: roundTwo(saldoAkhirTotal),
      [`average_realisasi_bunga_r${monthEnd}`]: roundTwo(averageRealisasiBunga),
      [`average_saldo_akhir_r${monthEnd}`]: roundTwo(averageSaldoAkhir),
      rasio_realisasi_bunga_per_total_piutang: roundRatio(
        safeDivide(realisasiBungaMonth, saldoAkhirMonth) * 100
      ),
    });
  }

  let ratio_lima = buildAveragePercentSeries(
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
  ratio_lima = ratio_lima.map((item) => {
    const markupBulanIni = toNumber(item.markup_bulan_ini || 0);
    const jumlahPendapatanBulanIni = toNumber(item.jumlah_pendapatan_bulan_ini || 0);

    return {
      ...item,
      rasio_markup_per_jumlah_pendapatan: roundRatio(
        safeDivide(markupBulanIni, jumlahPendapatanBulanIni) * 100
      ),
    };
  });

  let ratio_enam = buildAveragePercentSeries(
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
  ratio_enam = ratio_enam.map((item) => {
    const realisasiBungaBulanIni = toNumber(item.realisasi_bunga_bulan_ini || 0);
    const jumlahPendapatanBulanIni = toNumber(item.jumlah_pendapatan_bulan_ini || 0);

    return {
      ...item,
      rasio_pendapatan_bunga_per_jumlah_pendapatan: roundRatio(
        safeDivide(realisasiBungaBulanIni, jumlahPendapatanBulanIni) * 100
      ),
    };
  });

  const ratio_tujuh = [];
  for (let monthEnd = 1; monthEnd <= selectedMonth; monthEnd += 1) {
    const pendapatanLainMonth = toNumber(
      pendapatanLainPendapatanByMonth.get(monthEnd) || 0
    );
    const jumlahPendapatanMonth = toNumber(jumlahPendapatanByMonth.get(monthEnd) || 0);
    const dendaMonth = toNumber(dendaByMonth.get(monthEnd) || 0);
    const administrasiMonth = toNumber(administrasiByMonth.get(monthEnd) || 0);

    const pendapatanLainTotal = cumulativeTotal(
      pendapatanLainPendapatanByMonth,
      monthEnd
    );
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
      rasio_pendapatan_lainnya_per_jumlah_pendapatan: roundRatio(
        safeDivide(pendapatanLainMonth, jumlahPendapatanMonth) * 100
      ),
    });
  }

  let ratio_delapan = buildAveragePercentSeries(
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
  ratio_delapan = ratio_delapan.map((item) => {
    const gajiBulanIni = toNumber(item.gaji_bulan_ini || 0);
    const jumlahPendapatanBulanIni = toNumber(item.jumlah_pendapatan_bulan_ini || 0);

    return {
      ...item,
      rasio_gaji_per_pendapatan: roundRatio(
        safeDivide(gajiBulanIni, jumlahPendapatanBulanIni) * 100
      ),
    };
  });

  let ratio_sembilan = buildAveragePercentSeries(
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
  ratio_sembilan = ratio_sembilan.map((item) => {
    const operasionalBulanIni = toNumber(item.operasional_bulan_ini || 0);
    const jumlahPendapatanBulanIni = toNumber(item.jumlah_pendapatan_bulan_ini || 0);

    return {
      ...item,
      rasio_operasional_per_pendapatan: roundRatio(
        safeDivide(operasionalBulanIni, jumlahPendapatanBulanIni) * 100
      ),
    };
  });

  let ratio_sepuluh = buildAveragePercentSeries(
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
  ratio_sepuluh = ratio_sepuluh.map((item) => {
    const penyusutanBulanIni = toNumber(item.penyusutan_bulan_ini || 0);
    const jumlahPendapatanBulanIni = toNumber(item.jumlah_pendapatan_bulan_ini || 0);

    return {
      ...item,
      rasio_penyusutan_per_pendapatan: roundRatio(
        safeDivide(penyusutanBulanIni, jumlahPendapatanBulanIni) * 100
      ),
    };
  });

  let ratio_sebelas = buildAveragePercentSeries(
    selectedMonth,
    bebanGabunganByMonth,
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
  ratio_sebelas = ratio_sebelas.map((item) => {
    const cadanganBulanIni = toNumber(item.cadangan_bulan_ini || 0);
    const jumlahPendapatanBulanIni = toNumber(item.jumlah_pendapatan_bulan_ini || 0);

    return {
      ...item,
      rasio_cadangan_per_pendapatan: roundRatio(
        safeDivide(cadanganBulanIni, jumlahPendapatanBulanIni) * 100
      ),
    };
  });

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

const buildRatesAndRatios = async (
  branchIds,
  yearInt,
  selectedMonth,
  increaseBranchIds
) => {
  const aggregates = await fetchRatesAndRatiosAggregates(
    branchIds,
    yearInt,
    selectedMonth
  );
  return buildRatesAndRatiosFromAggregates(
    aggregates,
    yearInt,
    selectedMonth,
    undefined,
    increaseBranchIds
  );
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
    const isRootUnit =
      String(rootEntity.entity_type || "").toUpperCase() === "UNIT";
    const branchIds = descendants
      .map((item) => Number(item?.id))
      .filter((id) => Number.isInteger(id));
    const unitEntities = descendants.filter((item) => item?.type === "UNIT");
    const unitIds = unitEntities
      .map((item) => Number(item?.id))
      .filter((id) => Number.isInteger(id));

    const metrics = await buildRatesAndRatios(
      branchIds,
      yearInt,
      selectedMonth,
      unitIds
    );

    const response = {
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
    };

    if (!isRootUnit) {
      const unitAggregates = unitIds.length
        ? await fetchRatesAndRatiosAggregates(unitIds, yearInt, selectedMonth, true)
        : null;
      const units = [];
      for (const unit of unitEntities) {
        const unitId = Number(unit.id);
        if (!Number.isInteger(unitId)) continue;

        const unitMetrics = buildRatesAndRatiosFromAggregates(
          unitAggregates,
          yearInt,
          selectedMonth,
          unitId,
          [unitId]
        );

        units.push({
          unit_id: unitId,
          unit_name: unit.name,
          ...unitMetrics,
        });
      }
      response.units = units;
    }

    return res.json(response);
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
  fetchRatesAndRatiosAggregates,
  buildRatesAndRatiosFromAggregates,
  buildRatesAndRatios,
};
