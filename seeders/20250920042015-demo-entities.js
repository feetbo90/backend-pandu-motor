"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert Cabang
    const [cabang1, cabang2] = await queryInterface.bulkInsert(
      "entities",
      [
        {
          name: "Cabang Utama",
          entity_type: "CABANG",
          parent_id: null,
          created_at: new Date(),
          updated_at: new Date(),
          version: 1,
          is_active: true
        },
        {
          name: "Cabang Kedua",
          entity_type: "CABANG",
          parent_id: null,
          created_at: new Date(),
          updated_at: new Date(),
          version: 1,
          is_active: true
        }
      ],
      { returning: true } // biar dapat id cabang
    );

    // Insert Unit, pakai parent_id dari cabang
    await queryInterface.bulkInsert("entities", [
      {
        name: "Kisaran",
        entity_type: "UNIT",
        parent_id: cabang1.id,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        is_active: true
      },
      {
        name: "Aek Kanopan",
        entity_type: "UNIT",
        parent_id: cabang1.id,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        is_active: true
      },
      {
        name: "Petatal",
        entity_type: "UNIT",
        parent_id: cabang2.id,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        is_active: true
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("entities", null, {});
  }
};
