"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sumber_daya", {
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
      jumlah_karyawan: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      formasi_tenaga: {
        type: Sequelize.STRING,
        allowNull: true
      },
      pimpinan: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      kasir: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      administrasi: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      pdl: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      kontrak_kantor: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      inventaris_mobil: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      inventaris_mobil_ket: {
        type: Sequelize.STRING,
        allowNull: true
      },
      sisa_inventaris_pendirian: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      penyusutan_bulan: {
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

    await queryInterface.addIndex("sumber_daya", ["branch_id", "period_id", "is_active"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("sumber_daya");
  }
};
