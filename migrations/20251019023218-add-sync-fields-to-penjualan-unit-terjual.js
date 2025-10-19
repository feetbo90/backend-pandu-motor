"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("penjualan", "unit_jualkontan", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });

    await queryInterface.addColumn("penjualan", "unit_jualkredit", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });

    await queryInterface.addColumn("penjualan", "unit_jualleasing", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });

    
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("penjualan", "unit_jualkontan");
    await queryInterface.removeColumn("penjualan", "unit_jualkredit");
    await queryInterface.removeColumn("penjualan", "unit_jualleasing");

  },
};
