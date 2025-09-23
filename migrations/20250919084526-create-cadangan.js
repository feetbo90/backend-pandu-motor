"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("cadangan", {
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
      cadangan_piutang: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      macet_real: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      surplus_devist: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      cadangan_stock: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      cadangan_stock_data: {
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

    await queryInterface.addIndex("cadangan", ["branch_id", "period_id", "is_active"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("cadangan");
  }
};
