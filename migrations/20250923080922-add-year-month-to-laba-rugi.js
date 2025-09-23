"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("laba_rugi", "year", {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: "period_id"
    });
    await queryInterface.addColumn("laba_rugi", "month", {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: "year"
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("laba_rugi", "year");
    await queryInterface.removeColumn("laba_rugi", "month");
  }
};