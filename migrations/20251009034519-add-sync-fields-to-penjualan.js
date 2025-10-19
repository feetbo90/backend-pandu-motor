"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("penjualan");

    if (!tableDesc.change_id) {
      await queryInterface.addColumn("penjualan", "change_id", {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }

    // Tambahkan created_at & updated_at kalau belum ada di tabel

    if (!tableDesc.created_at) {
      await queryInterface.addColumn("penjualan", "created_at", {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      });
    }

    if (!tableDesc.updated_at) {
      await queryInterface.addColumn("penjualan", "updated_at", {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      });
    }
  },

  async down(queryInterface, Sequelize) {

    const tableDesc = await queryInterface.describeTable("penjualan");
    if (tableDesc.change_id) {
      await queryInterface.removeColumn("penjualan", "change_id");
    } 
    if (tableDesc.created_at) {
      await queryInterface.removeColumn("penjualan", "created_at");
    }
    if (tableDesc.updated_at) {
      await queryInterface.removeColumn("penjualan", "updated_at");
    }
  },
};
