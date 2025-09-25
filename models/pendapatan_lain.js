"use strict";

module.exports = (sequelize, DataTypes) => {
  const PendapatanLain = sequelize.define(
    "PendapatanLain",
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
      penjualan_pk: { type: DataTypes.BIGINT, defaultValue: 0 },
      komisi: { type: DataTypes.BIGINT, defaultValue: 0 },
      denda_keterlambatan: { type: DataTypes.BIGINT, defaultValue: 0 },
      diskon_denda: { type: DataTypes.BIGINT, defaultValue: 0 },
      jumlah_pendapatan_lain: { type: DataTypes.BIGINT, defaultValue: 0 },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      version: { type: DataTypes.BIGINT, defaultValue: 1 },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
    },
    {
      tableName: "pendapatan_lain",
      timestamps: false
    }
  );

  PendapatanLain.associate = models => {
    PendapatanLain.belongsTo(models.Entities, { foreignKey: "branch_id", as: "branch" });
    PendapatanLain.belongsTo(models.Period, { foreignKey: "period_id", as: "period" });
  };

  return PendapatanLain;
};
