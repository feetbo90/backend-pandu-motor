"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint("pendapatan", { // cek nama tabel kamu (jamak/singular)
      fields: ["branch_id", "year", "month"],
      type: "unique",
      name: "unique_pendapatan_periode"
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("pendapatan", "unique_pendapatan_periode");
  }
};
