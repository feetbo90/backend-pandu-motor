"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("barang_pk", "year", {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: "period_id"
    });
    await queryInterface.addColumn("barang_pk", "month", {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: "year"
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("barang_pk", "year");
    await queryInterface.removeColumn("barang_pk", "month");
  }
};