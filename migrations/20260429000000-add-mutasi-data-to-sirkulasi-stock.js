"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("sirkulasi_stock", "mutasi_masuk_data", {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn("sirkulasi_stock", "mutasi_keluar_data", {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("sirkulasi_stock", "mutasi_keluar_data");
    await queryInterface.removeColumn("sirkulasi_stock", "mutasi_masuk_data");
  }
};
