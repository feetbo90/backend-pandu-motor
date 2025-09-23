"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("sumber_daya", "year", {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: "period_id"
    });
    await queryInterface.addColumn("sumber_daya", "month", {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: "year"
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("sumber_daya", "year");
    await queryInterface.removeColumn("sumber_daya", "month");
  }
};