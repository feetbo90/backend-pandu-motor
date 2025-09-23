"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("periods", [
      {
        month: 1,
        year: 2025,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        is_active: true
      },
      {
        month: 2,
        year: 2025,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        is_active: true
      },
      {
        month: 6,
        year: 2025,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        is_active: true
      },
      {
        month: 7,
        year: 2025,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        is_active: true
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("periods", null, {});
  }
};
