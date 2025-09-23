"use strict";

module.exports = (sequelize, DataTypes) => {
  const BarangPk = sequelize.define(
    "BarangPk",
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
      unit_awal: { type: DataTypes.INTEGER, defaultValue: 0 },
      unit_awal_data: { type: DataTypes.BIGINT, defaultValue: 0 },
      pk_tambahan: { type: DataTypes.INTEGER, defaultValue: 0 },
      pk_tambahan_data: { type: DataTypes.BIGINT, defaultValue: 0 },
      terjual: { type: DataTypes.INTEGER, defaultValue: 0 },
      terjual_data: { type: DataTypes.BIGINT, defaultValue: 0 },
      jumlah_pk: { type: DataTypes.INTEGER, defaultValue: 0 },
      jumlah_pk_data: { type: DataTypes.BIGINT, defaultValue: 0 },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      version: { type: DataTypes.BIGINT, defaultValue: 1 },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
    },
    {
      tableName: "barang_pk",
      timestamps: false
    }
  );

  BarangPk.associate = models => {
    BarangPk.belongsTo(models.Entities, { foreignKey: "branch_id", as: "branch" });
    BarangPk.belongsTo(models.Period, { foreignKey: "period_id", as: "period" });
  };

  return BarangPk;
};
