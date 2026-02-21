const {
  Penjualan,
  Piutang,
  SumberDaya,
  Pendapatan,
  Beban,
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

const buildRatesSatuSampaiSebelas = async (
  branchIds,
  yearInt,
  selectedMonth,
  unitCount
) => {
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
  const unitPenjualanByMonth = buildMonthMap(penjualanRows, "total_unit_penjualan");
  const penjualanByMonth = buildMonthMap(penjualanRows, "total_penjualan");
  const karyawanByMonth = buildMonthMap(sumberDayaRows, "total_karyawan");
  const markupByMonth = buildMonthMap(pendapatanRows, "total_markup");
  const gajiByMonth = buildMonthMap(bebanRows, "total_gaji");
  const operasionalByMonth = buildMonthMap(bebanRows, "total_operasional");
  const penyusutanByMonth = buildMonthMap(bebanRows, "total_penyusutan");
  const cadanganPiutangByMonth = buildMonthMap(bebanRows, "total_cadangan_piutang");
  const cadanganStockByMonth = buildMonthMap(bebanRows, "total_cadangan_stock");
  const kumulatifByMonth = buildMonthMap(labaRugiRows, "total_kumulatif");

  const bebanGabunganByMonth = new Map();
  for (let monthIdx = 1; monthIdx <= selectedMonth; monthIdx += 1) {
    bebanGabunganByMonth.set(
      monthIdx,
      (penyusutanByMonth.get(monthIdx) || 0) +
        (cadanganPiutangByMonth.get(monthIdx) || 0) +
        (cadanganStockByMonth.get(monthIdx) || 0)
    );
  }

  return {
    rate_satu: buildAverageRateSeries(
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
    ),
    rate_dua: buildAverageRateSeries(
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
    ),
    rate_tiga: buildAverageRateSeries(
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
    ),
    rate_empat: buildAverageRateSeries(
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
    ),
    rate_lima: buildAverageRateSeries(
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
    ),
    rate_enam: buildAverageRateSeries(
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
    ),
    rate_tujuh: buildAverageRateSeries(
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
    ),
    rate_delapan: buildUnitCountRateSeries(
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
    ),
    rate_sembilan: buildUnitCountRateSeries(
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
    ),
    rate_sepuluh: buildUnitCountRateSeries(
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
    ),
    rate_sebelas: buildAverageRateSeries(
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
    ),
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

    const rates = await buildRatesSatuSampaiSebelas(
      branchIds,
      yearInt,
      selectedMonth,
      unitEntities.length
    );

    const units = [];
    for (const unit of unitEntities) {
      const unitId = Number(unit.id);
      if (!Number.isInteger(unitId)) continue;

      const unitRates = await buildRatesSatuSampaiSebelas(
        [unitId],
        yearInt,
        selectedMonth,
        1
      );

      units.push({
        unit_id: unitId,
        unit_name: unit.name,
        ...unitRates,
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
      ...rates,
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
