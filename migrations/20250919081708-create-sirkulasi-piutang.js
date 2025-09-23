"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sirkulasi_piutang", {
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
      lancar: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      lancar_persen: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      kurang_lancar: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      kurang_lancar_persen: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      ragu_ragu: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      ragu_ragu_persen: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      macet_baru: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      macet_baru_persen: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      macet_lama: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      macet_lama_persen: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      total_persen: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addIndex("sirkulasi_piutang", [
      "branch_id",
      "period_id",
      "is_active"
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("sirkulasi_piutang");
  }
};
