"use strict";

module.exports = (sequelize, DataTypes) => {
  const Piutang = sequelize.define(
    "Piutang",
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
      saldo_awal: { type: DataTypes.BIGINT, defaultValue: 0 },
      tambahan: { type: DataTypes.BIGINT, defaultValue: 0 },
      realisasi_pokok: { type: DataTypes.BIGINT, defaultValue: 0 },
      realisasi_bunga: { type: DataTypes.BIGINT, defaultValue: 0 },
      jumlah_angsuran: { type: DataTypes.BIGINT, defaultValue: 0 },
      saldo_akhir: { type: DataTypes.BIGINT, defaultValue: 0 },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      version: { type: DataTypes.BIGINT, defaultValue: 1 },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
    },
    {
      tableName: "piutang",
      timestamps: false
    }
  );

  Piutang.associate = models => {
    Piutang.belongsTo(models.Piutang, { foreignKey: "branch_id", as: "branch" });
    Piutang.belongsTo(models.Period, { foreignKey: "period_id", as: "period" });
  };

  return Piutang;
};
