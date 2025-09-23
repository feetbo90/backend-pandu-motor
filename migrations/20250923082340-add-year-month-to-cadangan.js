"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("cadangan", "year", {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: "period_id"
    });
    await queryInterface.addColumn("cadangan", "month", {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: "year"
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("cadangan", "year");
    await queryInterface.removeColumn("cadangan", "month");
  }
};