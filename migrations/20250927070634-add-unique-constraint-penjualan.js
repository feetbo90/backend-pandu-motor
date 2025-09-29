"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Unique constraint pendapatan
    // await queryInterface.addConstraint("pendapatan", {
    //   fields: ["branch_id", "year", "month"],
    //   type: "unique",
    //   name: "unique_pendapatan_periode"
    // });

    // Unique constraint penjualan
    await queryInterface.addConstraint("penjualan", {
      fields: ["branch_id", "year", "month"],
      type: "unique",
      name: "unique_penjualan_periode"
    });
  },

  async down(queryInterface, Sequelize) {
    // await queryInterface.removeConstraint("pendapatan", "unique_pendapatan_periode");
    await queryInterface.removeConstraint("penjualan", "unique_penjualan_periode");
  }
};
