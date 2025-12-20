"use strict";
const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash("password123", 10);

    await queryInterface.bulkInsert("users", [
      {
        name: "Admin Pusat",
        email: "admin@pusat.com",
        password: passwordHash,
        entity_type: null, // admin pusat tidak terikat cabang/unit
        entity_id: null,
        created_at: new Date()
      },
      {
        name: "Manager Cabang Utama",
        email: "manager.utama@company.com",
        password: passwordHash,
        entity_type: "CABANG",
        entity_id: 1, // pastikan sesuai id cabang di tabel entities
        created_at: new Date()
      },
      {
        name: "Staff Unit Kisaran 1",
        email: "unit.kisaran1@company.com",
        password: passwordHash,
        entity_type: "UNIT",
        entity_id: 3, // pastikan sesuai id unit
        created_at: new Date()
      },
      {
        name: "Staff Unit Aek Kanopan 1",
        email: "unit.aekkanopan1@company.com",
        password: passwordHash,
        entity_type: "UNIT",
        entity_id: 4, // pastikan sesuai id unit
        created_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", null, {});
  }
};
