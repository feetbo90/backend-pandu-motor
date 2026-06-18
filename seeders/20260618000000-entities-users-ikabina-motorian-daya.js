"use strict";
const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const passwordHash = await bcrypt.hash("password123", 10);

    const getEntity = async (name, entityType) => {
      const [entity] = await queryInterface.sequelize.query(
        "SELECT id, parent_id FROM entities WHERE name = ? AND entity_type = ? LIMIT 1",
        { replacements: [name, entityType], type: Sequelize.QueryTypes.SELECT }
      );
      return entity;
    };

    const insertEntity = async (name, entityType, parentId) => {
      await queryInterface.bulkInsert("entities", [
        {
          name,
          entity_type: entityType,
          parent_id: parentId ?? null,
          created_at: now,
          updated_at: now,
          version: 1,
          is_active: true
        }
      ]);
    };

    const ensureCabang = async name => {
      let cabang = await getEntity(name, "CABANG");

      if (!cabang) {
        await insertEntity(name, "CABANG", null);
        cabang = await getEntity(name, "CABANG");
      } else if (cabang.parent_id !== null) {
        await queryInterface.sequelize.query(
          "UPDATE entities SET parent_id = NULL, updated_at = ?, version = version + 1 WHERE id = ?",
          { replacements: [now, cabang.id], type: Sequelize.QueryTypes.UPDATE }
        );
        cabang = await getEntity(name, "CABANG");
      }

      if (!cabang) {
        throw new Error(`Entity cabang "${name}" tidak ditemukan atau gagal dibuat`);
      }

      return cabang;
    };

    const ensureUnit = async (name, parentId) => {
      let unit = await getEntity(name, "UNIT");
      const currentParentId = unit?.parent_id == null ? null : String(unit.parent_id);
      const nextParentId = parentId == null ? null : String(parentId);

      if (!unit) {
        await insertEntity(name, "UNIT", parentId);
        unit = await getEntity(name, "UNIT");
      } else if (currentParentId !== nextParentId) {
        await queryInterface.sequelize.query(
          "UPDATE entities SET parent_id = ?, updated_at = ?, version = version + 1 WHERE id = ?",
          { replacements: [parentId, now, unit.id], type: Sequelize.QueryTypes.UPDATE }
        );
        unit = await getEntity(name, "UNIT");
      }

      if (!unit) {
        throw new Error(`Entity unit "${name}" tidak ditemukan atau gagal dibuat`);
      }

      return unit;
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

    const cabangConfigs = [
      {
        name: "Ikabina",
        managerEmail: "manager.ikabina@company.com",
        units: [
          { name: "Cikampak", email: "unit.cikampak@company.com" },
          { name: "Mahato", email: "unit.mahato@company.com" },
          { name: "Teluk Panji", email: "unit.telukpanji@company.com" },
          { name: "Aek Nabara", email: "unit.aeknabara@company.com" }
        ]
      },
      {
        name: "Motorian Daya",
        managerEmail: "manager.motoriandaya@company.com",
        units: [
          { name: "Bukit Kapur", email: "unit.bukitkapur@company.com" },
          { name: "Lubuk Gaung", email: "unit.lubukgaung@company.com" }
        ]
      }
    ];

    for (const cabangConfig of cabangConfigs) {
      const cabang = await ensureCabang(cabangConfig.name);

      await ensureUser(
        `Manager ${cabangConfig.name}`,
        cabangConfig.managerEmail,
        "CABANG",
        cabang.id
      );

      for (const unitConfig of cabangConfig.units) {
        const unit = await ensureUnit(unitConfig.name, cabang.id);

        await ensureUser(
          `Staff Unit ${unitConfig.name}`,
          unitConfig.email,
          "UNIT",
          unit.id
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const emails = [
      "manager.ikabina@company.com",
      "unit.cikampak@company.com",
      "unit.mahato@company.com",
      "unit.telukpanji@company.com",
      "unit.aeknabara@company.com",
      "manager.motoriandaya@company.com",
      "unit.bukitkapur@company.com",
      "unit.lubukgaung@company.com"
    ];

    const unitNames = [
      "Cikampak",
      "Mahato",
      "Teluk Panji",
      "Aek Nabara",
      "Bukit Kapur",
      "Lubuk Gaung"
    ];

    const cabangNames = ["Ikabina", "Motorian Daya"];

    await queryInterface.bulkDelete("users", { email: emails }, {});
    await queryInterface.bulkDelete(
      "entities",
      { name: unitNames, entity_type: "UNIT" },
      {}
    );
    await queryInterface.bulkDelete(
      "entities",
      { name: cabangNames, entity_type: "CABANG" },
      {}
    );
  }
};
