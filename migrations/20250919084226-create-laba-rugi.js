"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("laba_rugi", {
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
      bulan_ini: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      kumulatif: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      penarikan: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      modal: {
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

    await queryInterface.addIndex("laba_rugi", ["branch_id", "period_id", "is_active"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("laba_rugi");
  }
};
