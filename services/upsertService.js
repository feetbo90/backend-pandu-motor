const { sequelize } = require("../models");

// config mapping model ke tabel + unique constraint
const modelConfig = {
  pendapatan: {
    table: "pendapatan",
    conflict: ["branch_id", "year", "month"],
    columns: [
      "branch_id", "period_id", "year", "month",
      "markup_kontan", "markup_kredit", "markup_jumlah",
      "realisasi_bunga", "diskon_bunga", "denda", "administrasi",
      "jumlah_pendapatan", "version", "is_active"
    ]
  },
  // contoh model lain (bisa ditambah sesuai kebutuhan)
  penjualan: {
    table: "penjualan",
    conflict: ["branch_id", "year", "month"],
    columns: [
      "branch_id", "period_id", "year", "month",
      "kontan", "kredit", "leasing", "jumlah",
      "version", "is_active"
    ]
  }
};

async function upsertGeneric(modelName, records) {
  const config = modelConfig[modelName];
  if (!config) throw new Error(`Model '${modelName}' belum dikonfigurasi`);

  const { table, conflict, columns } = config;

  for (const r of records) {
    const colList = columns.join(", ");
    const valList = columns.map(c => `:${c}`).join(", ");
    const updateList = columns
      .filter(c => c !== "branch_id" && c !== "year" && c !== "month") // jangan update PK
      .map(c => `${c} = EXCLUDED.${c}`)
      .join(",\n        ");

    const sql = `
      INSERT INTO ${table} (
        ${colList}, created_at, updated_at
      )
      VALUES (
        ${valList}, NOW(), NOW()
      )
      ON CONFLICT (${conflict.join(", ")})
      DO UPDATE SET
        ${updateList},
        updated_at = NOW()
      WHERE ${table}.version < EXCLUDED.version
    `;

    await sequelize.query(sql, { replacements: r });
  }
}

module.exports = { upsertGeneric };
