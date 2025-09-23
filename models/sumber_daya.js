"use strict";

module.exports = (sequelize, DataTypes) => {
  const SumberDaya = sequelize.define(
    "SumberDaya",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      branch_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      period_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      jumlah_karyawan: { type: DataTypes.INTEGER, defaultValue: 0 },
      formasi_tenaga: { type: DataTypes.STRING, allowNull: true },
      pimpinan: { type: DataTypes.INTEGER, defaultValue: 0 },
      kasir: { type: DataTypes.INTEGER, defaultValue: 0 },
      administrasi: { type: DataTypes.INTEGER, defaultValue: 0 },
      pdl: { type: DataTypes.INTEGER, defaultValue: 0 },
      kontrak_kantor: { type: DataTypes.INTEGER, defaultValue: 0 },
      inventaris_mobil: { type: DataTypes.INTEGER, defaultValue: 0 },
      inventaris_mobil_ket: { type: DataTypes.STRING, allowNull: true },
      sisa_inventaris_pendirian: { type: DataTypes.BIGINT, defaultValue: 0 },
      penyusutan_bulan: { type: DataTypes.BIGINT, defaultValue: 0 },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      version: { type: DataTypes.BIGINT, defaultValue: 1 },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
    },
    {
      tableName: "sumber_daya",
      timestamps: false
    }
  );

  SumberDaya.associate = models => {
    SumberDaya.belongsTo(models.Entities, { foreignKey: "branch_id", as: "branch" });
    SumberDaya.belongsTo(models.Period, { foreignKey: "period_id", as: "period" });
  };

  return SumberDaya;
};
