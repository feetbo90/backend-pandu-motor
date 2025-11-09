"use strict";

const { Entities } = require("../models");

/**
 * Controller untuk operasi terkait entities yang spesifik ke kebutuhan cabang.
 */
module.exports = {
  /**
   * GET /api/entities/cabang
   * Mengambil seluruh daftar entity dengan tipe CABANG.
   */
  async getCabang(req, res) {
    try {
      const cabang = await Entities.findAll({
        where: { entity_type: "CABANG", is_active: true },
        include: [
          {
            model: Entities,
            as: "units",
            required: false
          },
          {
            model: Entities,
            as: "parent",
            required: false
          }
        ],
        order: [["name", "ASC"]]
      });

      return res.json({
        message: "Data cabang berhasil diambil",
        data: cabang
      });
    } catch (error) {
      return res.status(500).json({
        message: "Terjadi kesalahan saat mengambil data cabang",
        error: error.message
      });
    }
  }
};
