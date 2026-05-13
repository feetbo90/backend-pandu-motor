const { Entities } = require("../../models");
const { getAllDescendants } = require("../../utils/getDescendants.js");
const {
  fetchRatesAndRatiosAggregates,
  buildRatesAndRatiosFromAggregates,
  buildRatesAndRatios,
} = require("./rateRatioMetricsController");

const RATE_KEYS = [
  "rate_satu",
  "rate_dua",
  "rate_tiga",
  "rate_empat",
  "rate_lima",
  "rate_enam",
  "rate_tujuh",
  "rate_delapan",
  "rate_sembilan",
  "rate_sepuluh",
  "rate_sebelas",
];

const RATIO_KEYS = [
  "ratio_satu",
  "ratio_dua",
  "ratio_tiga",
  "ratio_empat",
  "ratio_lima",
  "ratio_enam",
  "ratio_tujuh",
  "ratio_delapan",
  "ratio_sembilan",
  "ratio_sepuluh",
  "ratio_sebelas",
];

const parseInteger = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : undefined;
};

const toNumber = (value) => parseFloat(value || 0);
const safeDivide = (numerator, denominator) =>
  denominator !== 0 ? numerator / denominator : 0;
const roundTwo = (value) => Math.round(toNumber(value));
const roundRatio = (value) => Number(toNumber(value).toFixed(2));

const uniqueIntegers = (values) => [
  ...new Set(
    values
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value))
  ),
];

const pickMetrics = (metrics, keys) =>
  keys.reduce((result, key) => {
    result[key] = metrics?.[key] || [];
    return result;
  }, {});

const withRateRatioGroups = (target, metrics) => ({
  ...target,
  rate: pickMetrics(metrics, RATE_KEYS),
  ratio: pickMetrics(metrics, RATIO_KEYS),
});

const sumCabangMetricByMonth = (cabangResults, groupKey, metricKey, fieldName) => {
  const valuesByMonth = new Map();

  cabangResults.forEach((cabang) => {
    const items = cabang?.[groupKey]?.[metricKey] || [];
    items.forEach((item) => {
      const monthEnd = Number(item.month_end);
      const currentValue = toNumber(valuesByMonth.get(monthEnd) || 0);
      valuesByMonth.set(monthEnd, currentValue + toNumber(item[fieldName]));
    });
  });

  return valuesByMonth;
};

const cumulativeTotal = (monthMap, monthEnd) => {
  let total = 0;
  for (let month = 1; month <= monthEnd; month += 1) {
    total += toNumber(monthMap.get(month) || 0);
  }
  return total;
};

const applyCenterCabangSums = (metrics, cabangResults) => {
  const bebanGabunganByMonth = sumCabangMetricByMonth(
    cabangResults,
    "rate",
    "rate_sembilan",
    "beban_gabungan_bulan_ini"
  );
  const cadanganByMonth = sumCabangMetricByMonth(
    cabangResults,
    "ratio",
    "ratio_sebelas",
    "cadangan_bulan_ini"
  );

  metrics.rate_sembilan = (metrics.rate_sembilan || []).map((item) => {
    const monthEnd = Number(item.month_end);
    const bebanGabunganBulanIni = bebanGabunganByMonth.get(monthEnd) || 0;
    const totalBebanGabungan = cumulativeTotal(bebanGabunganByMonth, monthEnd);
    const averageBebanGabungan = totalBebanGabungan / monthEnd;
    const averageSatuanKerja = toNumber(item[`average_satuan_kerja_r${monthEnd}`]);

    return {
      ...item,
      beban_gabungan_bulan_ini: roundTwo(bebanGabunganBulanIni),
      total_beban_gabungan: roundTwo(totalBebanGabungan),
      [`average_beban_gabungan_r${monthEnd}`]: roundTwo(averageBebanGabungan),
      beban_gabungan_per_satuan_kerja: roundTwo(
        safeDivide(averageBebanGabungan, averageSatuanKerja)
      ),
    };
  });

  metrics.ratio_sebelas = (metrics.ratio_sebelas || []).map((item) => {
    const monthEnd = Number(item.month_end);
    const cadanganBulanIni = cadanganByMonth.get(monthEnd) || 0;
    const totalCadangan = cumulativeTotal(cadanganByMonth, monthEnd);
    const averageCadangan = totalCadangan / monthEnd;
    const jumlahPendapatanBulanIni = toNumber(item.jumlah_pendapatan_bulan_ini);

    return {
      ...item,
      cadangan_bulan_ini: roundTwo(cadanganBulanIni),
      total_cadangan: roundTwo(totalCadangan),
      [`average_cadangan_r${monthEnd}`]: roundTwo(averageCadangan),
      rasio_cadangan_per_pendapatan: roundRatio(
        safeDivide(cadanganBulanIni, jumlahPendapatanBulanIni) * 100
      ),
    };
  });

  return metrics;
};

const buildCabangMetrics = async (cabang, yearInt, selectedMonth) => {
  const descendants = await getAllDescendants(cabang.id);
  const branchIds = uniqueIntegers(descendants.map((item) => item?.id));
  const unitEntities = descendants.filter((item) => item?.type === "UNIT");
  const unitIds = uniqueIntegers(unitEntities.map((item) => item?.id));

  const metrics = await buildRatesAndRatios(
    branchIds,
    yearInt,
    selectedMonth,
    unitIds
  );

  return withRateRatioGroups(
    {
      cabang_id: Number(cabang.id),
      cabang_name: cabang.name,
      cabang_type: cabang.entity_type,
      parent_id: cabang.parent_id,
      included_branch_ids: branchIds,
      included_unit_ids: unitIds,
      unit_count: unitEntities.length,
    },
    metrics
  );
};

const handleGetRatesRatiosCenter = async (req, res) => {
  try {
    const { year, month } = req.query;

    const yearInt = parseInteger(year);
    const selectedMonth = month ? parseInteger(month) : 12;

    if (!yearInt) {
      return res.status(400).json({
        success: false,
        message: "year wajib diisi",
      });
    }

    if (!selectedMonth || selectedMonth < 1 || selectedMonth > 12) {
      return res.status(400).json({
        success: false,
        message: "month harus di antara 1 sampai 12",
      });
    }

    const cabangEntities = await Entities.findAll({
      where: { entity_type: "CABANG", is_active: true },
      attributes: ["id", "name", "entity_type", "parent_id"],
      order: [["id", "ASC"]],
      raw: true,
    });

    const unitEntities = await Entities.findAll({
      where: { entity_type: "UNIT", is_active: true },
      attributes: ["id", "name", "entity_type", "parent_id"],
      order: [["name", "ASC"]],
      raw: true,
    });

    const unitIds = unitEntities
      .map((item) => Number(item.id))
      .filter((id) => Number.isInteger(id));

    const cabangResults = [];
    for (const cabang of cabangEntities) {
      cabangResults.push(await buildCabangMetrics(cabang, yearInt, selectedMonth));
    }

    const centerBranchIds = cabangResults.length
      ? uniqueIntegers(
          cabangResults.flatMap((cabang) => cabang.included_branch_ids || [])
        )
      : unitIds;
    const centerUnitIds = cabangResults.length
      ? uniqueIntegers(
          cabangResults.flatMap((cabang) => cabang.included_unit_ids || [])
        )
      : unitIds;

    const metrics = await buildRatesAndRatios(
      centerBranchIds,
      yearInt,
      selectedMonth,
      centerUnitIds
    );
    applyCenterCabangSums(metrics, cabangResults);

    const response = withRateRatioGroups(
      {
        success: true,
        pusat_name: "Pusat",
        pusat_type: "PUSAT",
        year: yearInt,
        selected_month: selectedMonth,
        included_pusat_ids: centerBranchIds,
        included_cabang_ids: cabangResults.map((cabang) => cabang.cabang_id),
        included_unit_ids: centerUnitIds,
        cabang_count: cabangResults.length,
        unit_count: unitEntities.length,
        komentar:
          "Perhitungan PUSAT memakai gabungan semua CABANG aktif beserta UNIT turunannya.",
      },
      metrics
    );

    response.cabangs = cabangResults;

    const unitAggregates = unitIds.length
      ? await fetchRatesAndRatiosAggregates(unitIds, yearInt, selectedMonth, true)
      : null;

    response.units = unitEntities.map((unit) => {
      const unitId = Number(unit.id);
      const unitMetrics = buildRatesAndRatiosFromAggregates(
        unitAggregates,
        yearInt,
        selectedMonth,
        unitId,
        [unitId],
        { bebanGabunganScope: "unit" }
      );

      return withRateRatioGroups(
        {
          unit_id: unitId,
          unit_name: unit.name,
          parent_id: unit.parent_id,
        },
        unitMetrics
      );
    });

    return res.json(response);
  } catch (error) {
    console.error("Error in getRatesRatiosCenter:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  // GET /rate-ratio/center/rates-ratios?year=2025&month=3
  async getRatesRatiosCenter(req, res) {
    return handleGetRatesRatiosCenter(req, res);
  },
};
