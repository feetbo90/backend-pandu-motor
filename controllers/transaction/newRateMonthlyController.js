const newRateRangeController = require("./newRateRangeController");

const METRIC_KEYS = [
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

const toMonthMap = (items = []) => {
  const map = new Map();
  items.forEach((item) => {
    const monthEnd = Number(item?.month_end);
    if (Number.isInteger(monthEnd)) {
      map.set(monthEnd, item);
    }
  });
  return map;
};

module.exports = {
  // GET /rate-ratio/:entity_id/descendants/new-rate-by-month?year=2025&month=3
  async getNewRateByMonth(req, res) {
    try {
      let statusCode = 200;
      let payload;

      const captureRes = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          payload = data;
          return data;
        },
      };

      await newRateRangeController.getNewRateRange(req, captureRes);

      if (statusCode >= 400) {
        return res.status(statusCode).json(payload);
      }

      const selectedMonth = Number(payload?.selected_month || 0);
      const monthDataByKey = {};
      METRIC_KEYS.forEach((key) => {
        monthDataByKey[key] = toMonthMap(payload?.[key]);
      });

      const months = [];
      for (let monthEnd = 1; monthEnd <= selectedMonth; monthEnd += 1) {
        const monthlyItem = { month_end: monthEnd };
        METRIC_KEYS.forEach((key) => {
          monthlyItem[key] = monthDataByKey[key].get(monthEnd) || null;
        });
        months.push(monthlyItem);
      }

      return res.json({
        success: true,
        entity_id: payload.entity_id,
        entity_name: payload.entity_name,
        year: payload.year,
        selected_month: selectedMonth,
        unit_count: payload.unit_count,
        komentar:
          "Data disusun per bulan: tiap month_end berisi rate_satu sampai ratio_sebelas.",
        data_by_month: months,
      });
    } catch (error) {
      console.error("Error in getNewRateByMonth:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};
