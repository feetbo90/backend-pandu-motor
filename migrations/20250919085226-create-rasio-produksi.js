"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("rasio_produksi", {
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

      // Rata-rata
      rata2_pembiayaan_unit: { type: Sequelize.BIGINT, defaultValue: 0 },
      rata2_penjualan_unit: { type: Sequelize.BIGINT, defaultValue: 0 },
      rata2_penjualan_karyawan: { type: Sequelize.BIGINT, defaultValue: 0 },
      rata2_markup_karyawan: { type: Sequelize.BIGINT, defaultValue: 0 },
      rata2_gaji_karyawan: { type: Sequelize.BIGINT, defaultValue: 0 },
      rata2_operasional_karyawan: { type: Sequelize.BIGINT, defaultValue: 0 },
      rata2_beban_tetap_karyawan: { type: Sequelize.BIGINT, defaultValue: 0 },
      rata2_beban_tetap_satuan: { type: Sequelize.BIGINT, defaultValue: 0 },
      rata2_beban_penyusutan_satuan: { type: Sequelize.BIGINT, defaultValue: 0 },
      rata2_laba_rugi_satuan: { type: Sequelize.BIGINT, defaultValue: 0 },
      rata2_laba_rugi_karyawan: { type: Sequelize.BIGINT, defaultValue: 0 },

      // Ratio
      ratio_pembiayaan_pokok: { type: Sequelize.BIGINT, defaultValue: 0 },
      ratio_kemacetan_pembiayaan: { type: Sequelize.BIGINT, defaultValue: 0 },
      ratio_markup_pembiayaan: { type: Sequelize.BIGINT, defaultValue: 0 },
      ratio_bunga_piutang: { type: Sequelize.BIGINT, defaultValue: 0 },
      ratio_markup_pendapatan: { type: Sequelize.BIGINT, defaultValue: 0 },
      ratio_bunga_pendapatan: { type: Sequelize.BIGINT, defaultValue: 0 },
      ratio_pendapatan_lain_pendapatan: { type: Sequelize.BIGINT, defaultValue: 0 },
      ratio_gaji_pendapatan: { type: Sequelize.BIGINT, defaultValue: 0 },
      ratio_admin_operasi_pendapatan: { type: Sequelize.BIGINT, defaultValue: 0 },
      ratio_penyusutan_pendapatan: { type: Sequelize.BIGINT, defaultValue: 0 },
      ratio_cadangan_pendapatan: { type: Sequelize.BIGINT, defaultValue: 0 },

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

    await queryInterface.addIndex("rasio_produksi", ["branch_id", "period_id", "is_active"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("rasio_produksi");
  }
};
