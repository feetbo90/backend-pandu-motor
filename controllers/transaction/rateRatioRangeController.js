const {
  Penjualan,
  SumberDaya,
  Pendapatan,
  Beban,
  Entities,
  Piutang,
  LabaRugi,
} = require("../../models");
const { Sequelize, Op } = require("sequelize");
const { getAllDescendants } = require("../../utils/getDescendants.js");

const toNumber = (value) => parseFloat(value || 0);
const sumBy = (items, field) =>
  items.reduce((total, item) => total + toNumber(item[field]), 0);
const average = (total, monthCount) => (monthCount > 0 ? total / monthCount : 0);

// GET /rate-ratio/:entity_id/descendants/range?year=2025&month_start=1&month_end=4

module.exports = {
  async getRateDescendantsRange(req, res) {
    try {
      const { entity_id } = req.params;
      const { year, month_start, month_end } = req.query;

      const entityId = parseInt(entity_id, 10);
      const yearInt = year ? parseInt(year, 10) : undefined;
      const monthStart = month_start ? parseInt(month_start, 10) : undefined;
      const monthEnd = month_end ? parseInt(month_end, 10) : undefined;

      if (!entityId || !yearInt || !monthStart || !monthEnd) {
        return res.status(400).json({
          success: false,
          message: "entity_id, year, month_start, month_end wajib diisi",
        });
      }

      if (monthStart < 1 || monthStart > 12 || monthEnd < 1 || monthEnd > 12) {
        return res.status(400).json({
          success: false,
          message: "month_start dan month_end harus di antara 1 sampai 12",
        });
      }

      if (monthStart > monthEnd) {
        return res.status(400).json({
          success: false,
          message: "month_start tidak boleh lebih besar dari month_end",
        });
      }

      const monthCount = monthEnd - monthStart + 1;

      const entityIds = await getAllDescendants(entityId);
      const unitCount = entityIds.filter((entity) => entity?.type === "UNIT").length;
      const rootEntity = await Entities.findOne({
        where: { id: entityId, is_active: true },
        attributes: ["entity_type", "name"],
        raw: true,
      });

      const rateSatu = {};
      const rateDua = {};
      const rateTiga = {};
      const rateEmpat = {};
      const rateLima = {};
      const rateEnam = {};
      const rateTujuh = {};
      const rateSepuluh = {};
      const rateSebelas = {};

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
        if (!id) continue;
        if (parseInt(id, 10) === entityId && type === "CABANG") continue;

        const where = {
          branch_id: id,
          year: yearInt,
          month: { [Op.between]: [monthStart, monthEnd] },
          is_active: true,
        };

        const dataBulan = await Penjualan.findAll({
          where,
          attributes: [
            "year",
            "month",
            [
              Sequelize.fn("SUM", Sequelize.literal("kredit + leasing")),
              "total_pembiayaan",
            ],
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
          group: ["year", "month"],
          order: [
            ["year", "ASC"],
            ["month", "ASC"],
          ],
          raw: true,
        });

        const piutangData = await Piutang.findAll({
          where,
          attributes: [
            "year",
            "month",
            [Sequelize.fn("SUM", Sequelize.col("tambahan")), "total_tambahan"],
          ],
          group: ["year", "month"],
          order: [
            ["year", "ASC"],
            ["month", "ASC"],
          ],
          raw: true,
        });

        const entity = await Entities.findOne({
          where: { id, is_active: true },
          attributes: ["entity_type"],
          raw: true,
        });
        const entityType = entity?.entity_type?.toLowerCase() || "unknown";

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
            jumlah_karyawan: toNumber(sd.jumlah_karyawan),
          });
        });

        const pendapatan = await Pendapatan.findAll({
          where,
          attributes: [
            "year",
            "month",
            [Sequelize.fn("SUM", Sequelize.col("markup_jumlah")), "total_markup"],
          ],
          group: ["year", "month"],
          raw: true,
        });

        const bebanData = await Beban.findAll({
          where,
          attributes: [
            "year",
            "month",
            [Sequelize.fn("SUM", Sequelize.col("gaji")), "gaji"],
            [Sequelize.fn("SUM", Sequelize.col("operasional")), "beban_umum_operasional"],
            [Sequelize.fn("SUM", Sequelize.col("penyusutan_aktiva")), "penyusutan_aktiva"],
            [Sequelize.fn("SUM", Sequelize.col("cadangan_piutang")), "cadangan_piutang"],
            [Sequelize.fn("SUM", Sequelize.col("cadangan_stock")), "cadangan_stock"],
          ],
          group: ["year", "month"],
          raw: true,
        });

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

        dataBulan.forEach((row) => {
          const monthAgg = ensureAgregatMonth(Number(row.year), Number(row.month));
          monthAgg.total_unit_jual += toNumber(row.total_unit_jual);
          monthAgg.total_penjualan += toNumber(row.total_penjualan);
          monthAgg.total_unit += toNumber(row.total_unit);
        });

        piutangData.forEach((row) => {
          const monthAgg = ensureAgregatMonth(Number(row.year), Number(row.month));
          monthAgg.total_pembiayaan += toNumber(row.total_tambahan);
        });

        sumberDaya.forEach((sd) => {
          const monthAgg = ensureAgregatMonth(Number(sd.year), Number(sd.month));
          monthAgg.total_karyawan += toNumber(sd.jumlah_karyawan);
        });

        pendapatan.forEach((p) => {
          const monthAgg = ensureAgregatMonth(Number(p.year), Number(p.month));
          monthAgg.total_markup += toNumber(p.total_markup);
        });

        bebanData.forEach((b) => {
          const monthAgg = ensureAgregatMonth(Number(b.year), Number(b.month));
          monthAgg.total_gaji += toNumber(b.gaji);
          monthAgg.total_beban_umum_operasional += toNumber(b.beban_umum_operasional);
          monthAgg.total_penyusutan_aktiva += toNumber(b.penyusutan_aktiva);
          monthAgg.total_cadangan_piutang += toNumber(b.cadangan_piutang);
          monthAgg.total_cadangan_stock += toNumber(b.cadangan_stock);
        });

        const totalPembiayaanSum = sumBy(dataBulan, "total_pembiayaan");
        const totalUnitJualSum = sumBy(dataBulan, "total_unit_jual");
        const totalPenjualanSum = sumBy(dataBulan, "total_penjualan");
        const totalUnitSum = sumBy(dataBulan, "total_unit");
        const totalKaryawanSum = sumBy(sumberDaya, "jumlah_karyawan");
        const totalMarkupSum = sumBy(pendapatan, "total_markup");
        const totalGajiSum = sumBy(bebanData, "gaji");
        const totalBebanUmumSum = sumBy(bebanData, "beban_umum_operasional");
        const totalPenyusutanSum = sumBy(bebanData, "penyusutan_aktiva");
        const totalKumulatifSum = sumBy(labaRugiData, "kumulatif");

        const avgPembiayaan = average(totalPembiayaanSum, monthCount);
        const avgUnitJual = average(totalUnitJualSum, monthCount);
        const avgPenjualan = average(totalPenjualanSum, monthCount);
        const avgUnit = average(totalUnitSum, monthCount);
        const avgKaryawan = average(totalKaryawanSum, monthCount);
        const avgMarkup = average(totalMarkupSum, monthCount);
        const avgGaji = average(totalGajiSum, monthCount);
        const avgBebanUmum = average(totalBebanUmumSum, monthCount);
        const avgPenyusutan = average(totalPenyusutanSum, monthCount);
        const avgKumulatif = average(totalKumulatifSum, monthCount);

        rateSatu[name] = [
          {
            type: entityType,
            year: yearInt,
            month_start: monthStart,
            month_end: monthEnd,
            total_pembiayaan: avgPembiayaan,
            total_unit_jual: avgUnitJual,
            pembiayaan_per_unit: avgUnitJual > 0 ? avgPembiayaan / avgUnitJual : 0,
          },
        ];

        rateDua[name] = [
          {
            type: entityType,
            year: yearInt,
            month_start: monthStart,
            month_end: monthEnd,
            total_penjualan: avgPenjualan,
            total_unit: avgUnit,
            penjualan_per_unit: avgUnit > 0 ? avgPenjualan / avgUnit : 0,
          },
        ];

        rateTiga[name] = [
          {
            type: entityType,
            year: yearInt,
            month_start: monthStart,
            month_end: monthEnd,
            total_penjualan: avgPenjualan,
            total_karyawan: avgKaryawan,
            penjualan_per_karyawan:
              avgKaryawan > 0 ? avgPenjualan / avgKaryawan : 0,
          },
        ];

        rateEmpat[name] = [
          {
            type: entityType,
            year: yearInt,
            month_start: monthStart,
            month_end: monthEnd,
            total_markup: avgMarkup,
            total_karyawan: avgKaryawan,
            markup_per_karyawan: avgKaryawan > 0 ? avgMarkup / avgKaryawan : 0,
          },
        ];

        rateLima[name] = [
          {
            type: entityType,
            year: yearInt,
            month_start: monthStart,
            month_end: monthEnd,
            gaji: avgGaji,
            jumlah_karyawan: avgKaryawan,
            rate_gaji_per_karyawan: avgKaryawan > 0 ? avgGaji / avgKaryawan : 0,
          },
        ];

        rateEnam[name] = [
          {
            type: entityType,
            year: yearInt,
            month_start: monthStart,
            month_end: monthEnd,
            beban_umum_operasional: avgBebanUmum,
            jumlah_karyawan: avgKaryawan,
            rate_beban_umum_operasional_per_karyawan:
              avgKaryawan > 0 ? avgBebanUmum / avgKaryawan : 0,
          },
        ];

        rateTujuh[name] = [
          {
            type: entityType,
            year: yearInt,
            month_start: monthStart,
            month_end: monthEnd,
            penyusutan: avgPenyusutan,
            jumlah_karyawan: avgKaryawan,
            rate_penyusutan_aktiva_per_karyawan:
              avgKaryawan > 0 ? avgPenyusutan / avgKaryawan : 0,
          },
        ];

        const entityUnitCount = entityType === "unit" ? 1 : 1;
        rateSepuluh[name] = [
          {
            type: entityType,
            year: yearInt,
            month_start: monthStart,
            month_end: monthEnd,
            total_kumulatif: avgKumulatif,
            total_unit: entityUnitCount,
            kumulatif_per_unit:
              entityUnitCount > 0 ? avgKumulatif / entityUnitCount : 0,
          },
        ];

        rateSebelas[name] = [
          {
            type: entityType,
            year: yearInt,
            month_start: monthStart,
            month_end: monthEnd,
            total_kumulatif: avgKumulatif,
            total_karyawan: avgKaryawan,
            kumulatif_per_karyawan:
              avgKaryawan > 0 ? avgKumulatif / avgKaryawan : 0,
          },
        ];
      }

      if (rootEntity?.entity_type === "CABANG") {
        const cabangWhere = {
          branch_id: entityId,
          year: yearInt,
          month: { [Op.between]: [monthStart, monthEnd] },
          is_active: true,
        };

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
          monthAgg.total_karyawan += toNumber(sd.jumlah_karyawan);
        });

        const cabangPiutang = await Piutang.findAll({
          where: cabangWhere,
          attributes: [
            "year",
            "month",
            [Sequelize.fn("SUM", Sequelize.col("tambahan")), "total_tambahan"],
          ],
          group: ["year", "month"],
          raw: true,
        });
        cabangPiutang.forEach((row) => {
          const monthAgg = ensureAgregatMonth(Number(row.year), Number(row.month));
          monthAgg.total_pembiayaan += toNumber(row.total_tambahan);
        });

        const cabangBeban = await Beban.findAll({
          where: cabangWhere,
          attributes: [
            "year",
            "month",
            [Sequelize.fn("SUM", Sequelize.col("gaji")), "gaji"],
            [Sequelize.fn("SUM", Sequelize.col("operasional")), "beban_umum_operasional"],
            [Sequelize.fn("SUM", Sequelize.col("penyusutan_aktiva")), "penyusutan_aktiva"],
            [Sequelize.fn("SUM", Sequelize.col("cadangan_piutang")), "cadangan_piutang"],
            [Sequelize.fn("SUM", Sequelize.col("cadangan_stock")), "cadangan_stock"],
          ],
          group: ["year", "month"],
          raw: true,
        });
        cabangBeban.forEach((b) => {
          const monthAgg = ensureAgregatMonth(Number(b.year), Number(b.month));
          monthAgg.total_gaji += toNumber(b.gaji);
          monthAgg.total_beban_umum_operasional += toNumber(b.beban_umum_operasional);
          monthAgg.total_penyusutan_aktiva += toNumber(b.penyusutan_aktiva);
          monthAgg.total_cadangan_piutang += toNumber(b.cadangan_piutang);
          monthAgg.total_cadangan_stock += toNumber(b.cadangan_stock);
        });
      }

      const allBranchIds = entityIds.map((entity) => entity.id).filter(Boolean);
      if (allBranchIds.length) {
        Object.values(agregatByMonth).forEach((agg) => {
          agg.total_kumulatif = 0;
        });

        const semuaLabaRugi = await LabaRugi.findAll({
          where: {
            branch_id: allBranchIds,
            is_active: true,
            year: yearInt,
            month: { [Op.between]: [monthStart, monthEnd] },
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
          monthAgg.total_kumulatif += toNumber(row.kumulatif);
        });
      }

      const cabangTotals = Object.values(agregatByMonth).reduce(
        (acc, item) => {
          acc.total_pembiayaan += toNumber(item.total_pembiayaan);
          acc.total_unit_jual += toNumber(item.total_unit_jual);
          acc.total_penjualan += toNumber(item.total_penjualan);
          acc.total_unit += toNumber(item.total_unit);
          acc.total_karyawan += toNumber(item.total_karyawan);
          acc.total_markup += toNumber(item.total_markup);
          acc.total_gaji += toNumber(item.total_gaji);
          acc.total_beban_umum_operasional += toNumber(
            item.total_beban_umum_operasional
          );
          acc.total_penyusutan_aktiva += toNumber(item.total_penyusutan_aktiva);
          acc.total_cadangan_piutang += toNumber(item.total_cadangan_piutang);
          acc.total_cadangan_stock += toNumber(item.total_cadangan_stock);
          acc.total_kumulatif += toNumber(item.total_kumulatif);
          return acc;
        },
        {
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
        }
      );

      const cabangAvgPembiayaan = average(cabangTotals.total_pembiayaan, monthCount);
      const cabangAvgUnitJual = average(cabangTotals.total_unit_jual, monthCount);
      const cabangAvgPenjualan = average(cabangTotals.total_penjualan, monthCount);
      const cabangAvgUnit = average(cabangTotals.total_unit, monthCount);
      const cabangAvgKaryawan = average(cabangTotals.total_karyawan, monthCount);
      const cabangAvgMarkup = average(cabangTotals.total_markup, monthCount);
      const cabangAvgGaji = average(cabangTotals.total_gaji, monthCount);
      const cabangAvgBebanUmum = average(
        cabangTotals.total_beban_umum_operasional,
        monthCount
      );
      const cabangAvgPenyusutan = average(
        cabangTotals.total_penyusutan_aktiva,
        monthCount
      );
      const cabangAvgCadanganPiutang = average(
        cabangTotals.total_cadangan_piutang,
        monthCount
      );
      const cabangAvgCadanganStock = average(
        cabangTotals.total_cadangan_stock,
        monthCount
      );
      const cabangAvgKumulatif = average(cabangTotals.total_kumulatif, monthCount);

      const cabangRateSatu = [
        {
          type: "cabang",
          year: yearInt,
          month_start: monthStart,
          month_end: monthEnd,
          total_pembiayaan: cabangAvgPembiayaan,
          total_unit_jual: cabangAvgUnitJual,
          pembiayaan_per_unit:
            cabangAvgUnitJual > 0 ? cabangAvgPembiayaan / cabangAvgUnitJual : 0,
        },
      ];

      const cabangRateDua = [
        {
          type: "cabang",
          year: yearInt,
          month_start: monthStart,
          month_end: monthEnd,
          total_penjualan: cabangAvgPenjualan,
          total_unit: cabangAvgUnit,
          penjualan_per_unit:
            cabangAvgUnit > 0 ? cabangAvgPenjualan / cabangAvgUnit : 0,
        },
      ];

      const cabangRateTiga = [
        {
          type: "cabang",
          year: yearInt,
          month_start: monthStart,
          month_end: monthEnd,
          total_penjualan: cabangAvgPenjualan,
          total_karyawan: cabangAvgKaryawan,
          penjualan_per_karyawan:
            cabangAvgKaryawan > 0 ? cabangAvgPenjualan / cabangAvgKaryawan : 0,
        },
      ];

      const cabangRateEmpat = [
        {
          type: "cabang",
          year: yearInt,
          month_start: monthStart,
          month_end: monthEnd,
          total_markup: cabangAvgMarkup,
          total_karyawan: cabangAvgKaryawan,
          markup_per_karyawan:
            cabangAvgKaryawan > 0 ? cabangAvgMarkup / cabangAvgKaryawan : 0,
        },
      ];

      const cabangRateLima = [
        {
          type: "cabang",
          year: yearInt,
          month_start: monthStart,
          month_end: monthEnd,
          total_gaji: cabangAvgGaji,
          total_karyawan: cabangAvgKaryawan,
          rate_gaji_per_karyawan:
            cabangAvgKaryawan > 0 ? cabangAvgGaji / cabangAvgKaryawan : 0,
        },
      ];

      const cabangRateEnam = [
        {
          type: "cabang",
          year: yearInt,
          month_start: monthStart,
          month_end: monthEnd,
          total_beban_umum_operasional: cabangAvgBebanUmum,
          total_karyawan: cabangAvgKaryawan,
          rate_beban_umum_operasional_per_karyawan:
            cabangAvgKaryawan > 0 ? cabangAvgBebanUmum / cabangAvgKaryawan : 0,
        },
      ];

      const cabangRateTujuh = [
        {
          type: "cabang",
          year: yearInt,
          month_start: monthStart,
          month_end: monthEnd,
          total_penyusutan_aktiva: cabangAvgPenyusutan,
          total_karyawan: cabangAvgKaryawan,
          rate_penyusutan_aktiva_per_karyawan:
            cabangAvgKaryawan > 0 ? cabangAvgPenyusutan / cabangAvgKaryawan : 0,
        },
      ];

      const cabangRateDelapan = [
        {
          type: "cabang",
          year: yearInt,
          month_start: monthStart,
          month_end: monthEnd,
          total_penyusutan_aktiva: cabangAvgPenyusutan,
          total_unit: unitCount,
          rate_penyusutan_aktiva_per_unit:
            unitCount > 0 ? cabangAvgPenyusutan / unitCount : 0,
        },
      ];

      const cabangRateSembilan = [
        {
          type: "cabang",
          year: yearInt,
          month_start: monthStart,
          month_end: monthEnd,
          total_penyusutan_aktiva: cabangAvgPenyusutan,
          total_cadangan_piutang: cabangAvgCadanganPiutang,
          total_cadangan_stock: cabangAvgCadanganStock,
          total_unit: unitCount,
          rate_penyusutan_dan_cadangan_per_unit:
            unitCount > 0
              ? (cabangAvgPenyusutan +
                  cabangAvgCadanganPiutang +
                  cabangAvgCadanganStock) /
                unitCount
              : 0,
        },
      ];

      const cabangRateSepuluh = [
        {
          type: "cabang",
          year: yearInt,
          month_start: monthStart,
          month_end: monthEnd,
          total_kumulatif: cabangAvgKumulatif,
          total_unit: unitCount,
          kumulatif_per_unit:
            unitCount > 0 ? cabangAvgKumulatif / unitCount : 0,
        },
      ];

      const cabangRateSebelas = [
        {
          type: "cabang",
          year: yearInt,
          month_start: monthStart,
          month_end: monthEnd,
          total_kumulatif: cabangAvgKumulatif,
          total_karyawan: cabangAvgKaryawan,
          kumulatif_per_karyawan:
            cabangAvgKaryawan > 0 ? cabangAvgKumulatif / cabangAvgKaryawan : 0,
        },
      ];

      return res.json({
        success: true,
        entity_id: entity_id,
        entityIds,
        cabang: {
          name: rootEntity?.name || "CABANG",
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
      console.error("Error in getRateDescendantsRange:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },
};
