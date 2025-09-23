"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      entity_type: {
        type: Sequelize.ENUM("CABANG", "UNIT"),
        allowNull: true
      },
      entity_id: {
        type: Sequelize.BIGINT,
        allowNull: true
        // Tidak bisa foreign key langsung (polymorphic)
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW")
      }
    });

    // index untuk kombinasi entity_type + entity_id
    await queryInterface.addIndex("users", ["entity_type", "entity_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("users");
    // drop enum type di Postgres agar bisa migrate ulang
    if (queryInterface.sequelize.options.dialect === "postgres") {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_users_entity_type";'
      );
    }
  }
};
