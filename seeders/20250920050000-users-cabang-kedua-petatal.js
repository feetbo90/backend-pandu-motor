"use strict";
const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const passwordHash = await bcrypt.hash("password123", 10);

    const [cabangKedua] = await queryInterface.sequelize.query(
      "SELECT id FROM entities WHERE name IN (:names) AND entity_type = 'CABANG' LIMIT 1",
      {
        replacements: { names: ["Pandu II", "Cabang 2", "Cabang Kedua"] },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (!cabangKedua) {
      throw new Error("Entity Pandu II tidak ditemukan");
    }

    const [petatal] = await queryInterface.sequelize.query(
      "SELECT id FROM entities WHERE name = ? AND entity_type = 'UNIT' LIMIT 1",
      { replacements: ["Petatal"], type: Sequelize.QueryTypes.SELECT }
    );

    if (!petatal) {
      throw new Error("Entity Petatal tidak ditemukan");
    }

    const ensureUser = async (name, email, entityType, entityId) => {
      const [user] = await queryInterface.sequelize.query(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        { replacements: [email], type: Sequelize.QueryTypes.SELECT }
      );

      if (!user) {
        await queryInterface.bulkInsert("users", [
          {
            name,
            email,
            password: passwordHash,
            entity_type: entityType,
            entity_id: entityId,
            created_at: now
          }
        ]);
        return;
      }

      await queryInterface.sequelize.query(
        "UPDATE users SET name = ?, entity_type = ?, entity_id = ? WHERE id = ?",
        {
          replacements: [name, entityType, entityId, user.id],
          type: Sequelize.QueryTypes.UPDATE
        }
      );
    };

    await ensureUser(
      "Manager Pandu II",
      "manager.kedua@company.com",
      "CABANG",
      cabangKedua.id
    );
    await ensureUser(
      "Staff Unit Petatal",
      "unit.petatal@company.com",
      "UNIT",
      petatal.id
    );
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
