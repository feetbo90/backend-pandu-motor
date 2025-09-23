"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("barang_pk", {
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
      unit_awal: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      unit_awal_data: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      pk_tambahan: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      pk_tambahan_data: {
        type: Sequelize.BIGINT,
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
      jumlah_pk: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      jumlah_pk_data: {
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

    await queryInterface.addIndex("barang_pk", [
      "branch_id",
      "period_id",
      "is_active"
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("barang_pk");
  }
};
