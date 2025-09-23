"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sirkulasi_stock", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      branch_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "entities", // FK ke entities
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      period_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "periods", // FK ke periods
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      unit_awal: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      unit_awal_data: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      pembelian_tambahan: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      pembelian_tambahan_data: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      mutasi_masuk: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      mutasi_keluar: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      terjual: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      terjual_data: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      unit_akhir: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      unit_akhir_data: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW")
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW")
      },
      version: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 1
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    });

    await queryInterface.addIndex("sirkulasi_stock", [
      "branch_id",
      "period_id",
      "is_active"
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("sirkulasi_stock");
  }
};
