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

    const ensureCabang = async (name, aliases = []) => {
      let cabang = await getEntity(name, "CABANG");
      if (!cabang && aliases.length) {
        const [aliasCabang] = await queryInterface.sequelize.query(
          "SELECT id, name, parent_id FROM entities WHERE name IN (:aliases) AND entity_type = 'CABANG' LIMIT 1",
          { replacements: { aliases }, type: Sequelize.QueryTypes.SELECT }
        );
        if (aliasCabang) {
          await queryInterface.sequelize.query(
            "UPDATE entities SET name = ?, parent_id = NULL, updated_at = ?, version = version + 1 WHERE id = ?",
            { replacements: [name, now, aliasCabang.id], type: Sequelize.QueryTypes.UPDATE }
          );
          cabang = await getEntity(name, "CABANG");
        }
      }
      if (!cabang) {
        await insertEntity(name, "CABANG", null);
        cabang = await getEntity(name, "CABANG");
      }
      if (!cabang) {
        throw new Error(`Entity cabang "${name}" tidak ditemukan atau gagal dibuat`);
      }
      return cabang;
    };

    const ensureUnit = async (name, parentId) => {
      let unit = await getEntity(name, "UNIT");
      if (!unit) {
        await insertEntity(name, "UNIT", parentId);
        unit = await getEntity(name, "UNIT");
      } else if (unit.parent_id !== parentId) {
        await queryInterface.sequelize.query(
          "UPDATE entities SET parent_id = ?, updated_at = ?, version = version + 1 WHERE id = ?",
          { replacements: [parentId, now, unit.id], type: Sequelize.QueryTypes.UPDATE }
        );
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
      } else {
        await queryInterface.sequelize.query(
          "UPDATE users SET name = ?, entity_type = ?, entity_id = ? WHERE id = ?",
          {
            replacements: [name, entityType, entityId, user.id],
            type: Sequelize.QueryTypes.UPDATE
          }
        );
      }
    };

    const cabangSatu = await ensureCabang("Cabang 1", ["Cabang Utama"]);
    const cabangDua = await ensureCabang("Cabang 2", ["Cabang Kedua"]);

    await ensureUser(
      "Manager Cabang 1",
      "manager.cabang1@company.com",
      "CABANG",
      cabangSatu.id
    );
    await ensureUser(
      "Manager Cabang 2",
      "manager.cabang2@company.com",
      "CABANG",
      cabangDua.id
    );
    await ensureUser(
      "Manager Cabang 1",
      "manager.utama@company.com",
      "CABANG",
      cabangSatu.id
    );
    await ensureUser(
      "Manager Cabang 2",
      "manager.kedua@company.com",
      "CABANG",
      cabangDua.id
    );

    const unitCabangSatu = [
      "Kisaran",
      "Aek Kanopan",
      "Petatal",
      "Air Batu"
    ];
    const unitCabangDua = [
      "Perdagangan",
      "Serbelawan",
      "Simp Kopi",
      "Mandoge",
      "Tanah Jawa"
    ];

    const unitsByName = new Map();

    for (const unitName of unitCabangSatu) {
      const unit = await ensureUnit(unitName, cabangSatu.id);
      unitsByName.set(unitName, unit);
      const email = `unit.${unitName.toLowerCase().replace(/\s+/g, "")}@company.com`;
      await ensureUser(`Staff Unit ${unitName}`, email, "UNIT", unit.id);
    }

    for (const unitName of unitCabangDua) {
      const unit = await ensureUnit(unitName, cabangDua.id);
      unitsByName.set(unitName, unit);
      const email = `unit.${unitName.toLowerCase().replace(/\s+/g, "")}@company.com`;
      await ensureUser(`Staff Unit ${unitName}`, email, "UNIT", unit.id);
    }

    await ensureUser(
      "Staff Unit Kisaran 1",
      "unit.kisaran1@company.com",
      "UNIT",
      unitsByName.get("Kisaran").id
    );
    await ensureUser(
      "Staff Unit Aek Kanopan 1",
      "unit.aekkanopan1@company.com",
      "UNIT",
      unitsByName.get("Aek Kanopan").id
    );
  },

  async down(queryInterface, Sequelize) {
    const unitNames = [
      "Kisaran",
      "Petatal",
      "Aek Kanopan",
      "Air Batu",
      "Perdagangan",
      "Serbelawan",
      "Simp Kopi",
      "Mandoge",
      "Tanah Jawa"
    ];

    const emails = unitNames.map(
      name => `unit.${name.toLowerCase().replace(/\s+/g, "")}@company.com`
    );
    emails.push(
      "manager.cabang1@company.com",
      "manager.cabang2@company.com",
      "manager.utama@company.com",
      "manager.kedua@company.com",
      "unit.kisaran1@company.com",
      "unit.aekkanopan1@company.com"
    );

    await queryInterface.bulkDelete(
      "users",
      { email: emails },
      {}
    );
  }
};
