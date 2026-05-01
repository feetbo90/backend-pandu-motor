"use strict";

const TABLES_WITH_PERIOD_ID = [
  "penjualan",
  "pendapatan",
  "pendapatan_lain",
  "piutang",
  "sirkulasi_piutang",
  "sirkulasi_stock",
  "barang_pk",
  "beban",
  "sumber_daya",
  "laba_rugi",
  "cadangan",
  "kas_keuangan",
  "rasio_produksi",
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableList = TABLES_WITH_PERIOD_ID.map((table) => `'${table}'`).join(", ");

    await queryInterface.sequelize.query(`
      DO $$
      DECLARE
        target_table text;
        constraint_name text;
      BEGIN
        FOREACH target_table IN ARRAY ARRAY[${tableList}]
        LOOP
          FOR constraint_name IN
            SELECT c.conname
            FROM pg_constraint c
            JOIN pg_class source_table ON source_table.oid = c.conrelid
            JOIN pg_namespace source_schema ON source_schema.oid = source_table.relnamespace
            JOIN pg_class target_ref_table ON target_ref_table.oid = c.confrelid
            JOIN pg_attribute source_column
              ON source_column.attrelid = source_table.oid
              AND source_column.attnum = ANY(c.conkey)
            WHERE c.contype = 'f'
              AND source_schema.nspname = current_schema()
              AND source_table.relname = target_table
              AND target_ref_table.relname = 'periods'
              AND source_column.attname = 'period_id'
          LOOP
            EXECUTE format(
              'ALTER TABLE %I.%I DROP CONSTRAINT %I',
              current_schema(),
              target_table,
              constraint_name
            );
          END LOOP;
        END LOOP;
      END $$;
    `);
  },

  async down(queryInterface, Sequelize) {
    await Promise.all(
      TABLES_WITH_PERIOD_ID.map((table) =>
        queryInterface.addConstraint(table, {
          fields: ["period_id"],
          type: "foreign key",
          name: `${table}_period_id_fkey`,
          references: {
            table: "periods",
            field: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        })
      )
    );
  },
};
