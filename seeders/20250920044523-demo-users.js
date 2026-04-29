"use strict";
const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const passwordHash = await bcrypt.hash("password123", 10);

    const getEntity = async (names, entityType) => {
      const [entity] = await queryInterface.sequelize.query(
        "SELECT id FROM entities WHERE name IN (:names) AND entity_type = :entityType LIMIT 1",
        { replacements: { names, entityType }, type: Sequelize.QueryTypes.SELECT }
      );
      return entity;
    };

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

    const cabangSatu = await getEntity(["Cabang 1", "Cabang Utama"], "CABANG");
    const kisaran = await getEntity(["Kisaran"], "UNIT");
    const aekKanopan = await getEntity(["Aek Kanopan"], "UNIT");

    await ensureUser("Admin Pusat", "admin@pusat.com", null, null);

    if (cabangSatu) {
      await ensureUser(
        "Manager Cabang 1",
        "manager.utama@company.com",
        "CABANG",
        cabangSatu.id
      );
    }

    if (kisaran) {
      await ensureUser(
        "Staff Unit Kisaran 1",
        "unit.kisaran1@company.com",
        "UNIT",
        kisaran.id
      );
    }

    if (aekKanopan) {
      await ensureUser(
        "Staff Unit Aek Kanopan 1",
        "unit.aekkanopan1@company.com",
        "UNIT",
        aekKanopan.id
      );
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "users",
      {
        email: [
          "admin@pusat.com",
          "manager.utama@company.com",
          "unit.kisaran1@company.com",
          "unit.aekkanopan1@company.com"
        ]
      },
      {}
    );
  }
};
