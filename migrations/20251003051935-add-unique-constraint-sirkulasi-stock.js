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
    await queryInterface.addConstraint("sirkulasi_stock", {
      fields: ["branch_id", "year", "month"],
      type: "unique",
      name: "unique_sirkulasi_stock_periode"
    });
  },

  async down(queryInterface, Sequelize) {
    // await queryInterface.removeConstraint("pendapatan", "unique_pendapatan_periode");
    await queryInterface.removeConstraint("sirkulasi_stock", "unique_sirkulasi_stock_periode");
  }
};
