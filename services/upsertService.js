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
  },
  pendapatanLain: {
    table: "pendapatan_lain",
    conflict: ["branch_id", "year", "month"],
    columns: [
      "branch_id", "period_id", "year", "month",
      "penjualan_pk", "komisi", "denda_keterlambatan", "diskon_denda", "jumlah_pendapatan_lain",
      "version", "is_active"
    ]
  },
  piutang: {
    table: "piutang",
    conflict: ["branch_id", "year", "month"],
    columns: [
      "branch_id", "period_id", "year", "month",
      "saldo_awal", "tambahan", "realisasi_pokok", "realisasi_bunga", "jumlah_angsuran", "saldo_akhir",
      "version", "is_active"
    ]
  },
  sirkulasiPiutang: {
    table: "sirkulasi_piutang",
    conflict: ["branch_id", "year", "month"],
    columns: [
      "branch_id", "period_id", "year", "month",
      "lancar", "lancar_persen", "kurang_lancar", "kurang_lancar_persen",
      "ragu_ragu", "ragu_ragu_persen", "macet_baru", "macet_baru_persen",
      "macet_lama", "macet_lama_persen", "total", "total_persen", "version", "is_active"
    ]
  },
  sirkulasiStock: {
    table: "sirkulasi_stock",
    conflict: ["branch_id", "year", "month"],
    columns: [
      "branch_id", "period_id", "year", "month",
      "unit_awal", "unit_awal_data", "pembelian_tambahan", "pembelian_tambahan_data",
      "mutasi_masuk", "mutasi_keluar", "terjual", "terjual_data", "unit_akhir", "unit_akhir_data",
      "version", "is_active"
    ]
  },
  barangPk: {
    table: "barang_pk",
    conflict: ["branch_id", "year", "month"],
    columns: [
      "branch_id", "period_id", "year", "month",
      "unit_awal", "unit_awal_data", "pk_tambahan", "pk_tambahan_data",
      "terjual", "terjual_data", "jumlah_pk", "jumlah_pk_data",
      "version", "is_active"
    ]
  },
  beban: {
    table: "beban",
    conflict: ["branch_id", "year", "month"],
    columns: [
      "branch_id", "period_id", "year", "month",
      "gaji", "admin", "operasional", "beban_umum_operasional", "penyusutan_aktiva",
      "cadangan_piutang", "cadangan_stock", "total",
      "version", "is_active"
    ]
  },
  sumberDaya: {
    table: "sumber_daya",
    conflict: ["branch_id", "year", "month"],
    columns: [
      "branch_id", "period_id", "year", "month",
      "jumlah_karyawan", "formasi_tenaga", "pimpinan", "kasir", "administrasi", "pdl", "kontrak_kantor", "inventaris_mobil",
      "inventaris_mobil_ket", "sisa_inventaris_pendirian", "penyusutan_bulan",
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
