const { sequelize } = require("../models");

async function upsertPendapatan(records) {
  for (const r of records) {
    await sequelize.query(
      `
      INSERT INTO pendapatan (
        branch_id, period_id, year, month,
        markup_kontan, markup_kredit, markup_jumlah,
        realisasi_bunga, diskon_bunga, denda, administrasi,
        jumlah_pendapatan, version, is_active,
        created_at, updated_at
      )
      VALUES (
        :branch_id, :period_id, :year, :month,
        :markup_kontan, :markup_kredit, :markup_jumlah,
        :realisasi_bunga, :diskon_bunga, :denda, :administrasi,
        :jumlah_pendapatan, :version, :is_active,
        NOW(), NOW()
      )
      ON CONFLICT (branch_id, year, month)
      DO UPDATE SET
        markup_kontan      = EXCLUDED.markup_kontan,
        markup_kredit      = EXCLUDED.markup_kredit,
        markup_jumlah      = EXCLUDED.markup_jumlah,
        realisasi_bunga    = EXCLUDED.realisasi_bunga,
        diskon_bunga       = EXCLUDED.diskon_bunga,
        denda              = EXCLUDED.denda,
        administrasi       = EXCLUDED.administrasi,
        jumlah_pendapatan  = EXCLUDED.jumlah_pendapatan,
        version            = EXCLUDED.version,
        is_active          = EXCLUDED.is_active,
        updated_at         = NOW()
      WHERE pendapatan.version < EXCLUDED.version
      `,
      { replacements: r }
    );
  }
}

module.exports = { upsertPendapatan };
