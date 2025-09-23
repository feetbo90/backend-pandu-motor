"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("penjualan", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      branch_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "entities", // foreign key ke entities.id
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      period_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "periods", // foreign key ke periods.id
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      kontan: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      kredit: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      leasing: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      jumlah: {
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

    await queryInterface.addIndex("penjualan", ["branch_id", "period_id", "is_active"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("penjualan");
  }
};
