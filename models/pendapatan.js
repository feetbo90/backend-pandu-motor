"use strict";

module.exports = (sequelize, DataTypes) => {
  const Pendapatan = sequelize.define(
    "Pendapatan",
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
      markup_kontan: { type: DataTypes.BIGINT, defaultValue: 0 },
      markup_kredit: { type: DataTypes.BIGINT, defaultValue: 0 },
      markup_jumlah: { type: DataTypes.BIGINT, defaultValue: 0 },
      realisasi_bunga: { type: DataTypes.BIGINT, defaultValue: 0 },
      diskon_bunga: { type: DataTypes.BIGINT, defaultValue: 0 },
      denda: { type: DataTypes.BIGINT, defaultValue: 0 },
      administrasi: { type: DataTypes.BIGINT, defaultValue: 0 },
      jumlah_pendapatan: { type: DataTypes.BIGINT, defaultValue: 0 },
      change_id: { type: DataTypes.UUID, allowNull: true },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      version: { type: DataTypes.BIGINT, defaultValue: 1 },
      change_id: { type: DataTypes.UUID, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
    },
    {
      tableName: "pendapatan",
      timestamps: false
    }
  );

  Pendapatan.associate = models => {
    Pendapatan.belongsTo(models.Entities, { foreignKey: "branch_id", as: "branch" });
    Pendapatan.belongsTo(models.Period, { foreignKey: "period_id", as: "period" });
  };

  return Pendapatan;
};
