"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("kas_keuangan", {
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
      kas_tunai: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      rekening_bank: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      jumlah_kas_lancar: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      bon_karyawan: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      bon_pusat: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      bon_operasional: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      bon_gantung: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      jumlah_kas_macet: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      saldo_akhir: {
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
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    });

    await queryInterface.addIndex("kas_keuangan", ["branch_id", "period_id", "is_active"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("kas_keuangan");
  }
};
