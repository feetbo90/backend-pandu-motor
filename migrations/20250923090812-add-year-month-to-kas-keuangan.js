"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("kas_keuangan", "year", {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: "period_id"
    });
    await queryInterface.addColumn("kas_keuangan", "month", {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: "year"
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("kas_keuangan", "year");
    await queryInterface.removeColumn("kas_keuangan", "month");
  }
};