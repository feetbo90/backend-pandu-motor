"use strict";
const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash("password123", 10);

    const [cabangKedua] = await queryInterface.sequelize.query(
      "SELECT id FROM entities WHERE name = ? AND entity_type = 'CABANG' LIMIT 1",
      { replacements: ["Cabang Kedua"], type: Sequelize.QueryTypes.SELECT }
    );

    if (!cabangKedua) {
      throw new Error("Entity Cabang Kedua tidak ditemukan");
    }

    const [petatal] = await queryInterface.sequelize.query(
      "SELECT id FROM entities WHERE name = ? AND entity_type = 'UNIT' LIMIT 1",
      { replacements: ["Petatal"], type: Sequelize.QueryTypes.SELECT }
    );

    if (!petatal) {
      throw new Error("Entity Petatal tidak ditemukan");
    }

    await queryInterface.bulkInsert("users", [
      {
        name: "Manager Cabang Kedua",
        email: "manager.kedua@company.com",
        password: passwordHash,
        entity_type: "CABANG",
        entity_id: cabangKedua.id,
        created_at: new Date()
      },
      {
        name: "Staff Unit Petatal",
        email: "unit.petatal@company.com",
        password: passwordHash,
        entity_type: "UNIT",
        entity_id: petatal.id,
        created_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "users",
      {
        email: ["manager.kedua@company.com", "unit.petatal@company.com"]
      },
      {}
    );
  }
};
