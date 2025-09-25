"use strict";

module.exports = (sequelize, DataTypes) => {
  const SirkulasiStock = sequelize.define(
    "SirkulasiStock",
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
      year: { type: DataTypes.INTEGER },
      month: { type: DataTypes.INTEGER },
      unit_awal: { type: DataTypes.INTEGER, defaultValue: 0 },
      unit_awal_data: { type: DataTypes.BIGINT, defaultValue: 0 },
      pembelian_tambahan: { type: DataTypes.INTEGER, defaultValue: 0 },
      pembelian_tambahan_data: { type: DataTypes.BIGINT, defaultValue: 0 },
      mutasi_masuk: { type: DataTypes.INTEGER, defaultValue: 0 },
      mutasi_keluar: { type: DataTypes.INTEGER, defaultValue: 0 },
      terjual: { type: DataTypes.INTEGER, defaultValue: 0 },
      terjual_data: { type: DataTypes.BIGINT, defaultValue: 0 },
      unit_akhir: { type: DataTypes.INTEGER, defaultValue: 0 },
      unit_akhir_data: { type: DataTypes.BIGINT, defaultValue: 0 },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      version: { type: DataTypes.BIGINT, defaultValue: 1 },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
    },
    {
      tableName: "sirkulasi_stock",
      timestamps: false
    }
  );

  SirkulasiStock.associate = models => {
    SirkulasiStock.belongsTo(models.Entities, { foreignKey: "branch_id", as: "branch" });
    SirkulasiStock.belongsTo(models.Period, { foreignKey: "period_id", as: "period" });
  };

  return SirkulasiStock;
};
