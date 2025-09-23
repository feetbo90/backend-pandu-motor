"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("piutang", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      branch_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "entities", // FK ke branches
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
      saldo_awal: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      tambahan: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      realisasi_pokok: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      realisasi_bunga: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      jumlah_angsuran: {
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

    await queryInterface.addIndex("piutang", ["branch_id", "period_id", "is_active"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("piutang");
  }
};
