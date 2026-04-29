const { Entities } = require("../../models");
const {
  fetchRatesAndRatiosAggregates,
  buildRatesAndRatiosFromAggregates,
  buildRatesAndRatios,
} = require("./rateRatioMetricsController");

const parseInteger = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : undefined;
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

    const unitEntities = await Entities.findAll({
      where: { entity_type: "UNIT", is_active: true },
      attributes: ["id", "name", "entity_type", "parent_id"],
      order: [["name", "ASC"]],
      raw: true,
    });

    const unitIds = unitEntities
      .map((item) => Number(item.id))
      .filter((id) => Number.isInteger(id));

    const metrics = await buildRatesAndRatios(
      unitIds,
      yearInt,
      selectedMonth,
      unitIds
    );

    const response = {
      success: true,
      pusat_name: "Pusat",
      pusat_type: "PUSAT",
      year: yearInt,
      selected_month: selectedMonth,
      included_pusat_ids: unitIds,
      unit_count: unitEntities.length,
      komentar:
        "Perhitungan PUSAT memakai semua UNIT aktif.",
      ...metrics,
    };

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
        [unitId]
      );

      return {
        unit_id: unitId,
        unit_name: unit.name,
        parent_id: unit.parent_id,
        ...unitMetrics,
      };
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
