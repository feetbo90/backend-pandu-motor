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

    const ensureUser = async (name, email, entityId) => {
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
            entity_type: "UNIT",
            entity_id: entityId,
            created_at: now
          }
        ]);
      }
    };

    const cabangUtama = await ensureCabang("Cabang Utama");
    const cabangKedua = await ensureCabang("Cabang Kedua");

    const unitCabangUtama = [
      "Kisaran",
      "Petatal",
      "Aek Kanopan",
      "Air Batu"
    ];
    const unitCabangKedua = [
      "Perdagangan",
      "Serbelawan",
      "Simp Kopi",
      "Mandoge",
      "Tanah Jawa"
    ];

    for (const unitName of unitCabangUtama) {
      const unit = await ensureUnit(unitName, cabangUtama.id);
      const email = `unit.${unitName.toLowerCase().replace(/\s+/g, "")}@company.com`;
      await ensureUser(`Staff Unit ${unitName}`, email, unit.id);
    }

    for (const unitName of unitCabangKedua) {
      const unit = await ensureUnit(unitName, cabangKedua.id);
      const email = `unit.${unitName.toLowerCase().replace(/\s+/g, "")}@company.com`;
      await ensureUser(`Staff Unit ${unitName}`, email, unit.id);
    }
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

    await queryInterface.bulkDelete(
      "users",
      { email: emails },
      {}
    );
  }
};
