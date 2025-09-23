"use strict";

module.exports = (sequelize, DataTypes) => {
  const Beban = sequelize.define(
    "Beban",
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
      gaji: { type: DataTypes.BIGINT, defaultValue: 0 },
      admin: { type: DataTypes.BIGINT, defaultValue: 0 },
      operasional: { type: DataTypes.BIGINT, defaultValue: 0 },
      beban_umum_operasional: { type: DataTypes.BIGINT, defaultValue: 0 },
      penyusutan_aktiva: { type: DataTypes.BIGINT, defaultValue: 0 },
      cadangan_piutang: { type: DataTypes.BIGINT, defaultValue: 0 },
      cadangan_stock: { type: DataTypes.BIGINT, defaultValue: 0 },
      total: { type: DataTypes.BIGINT, defaultValue: 0 },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      version: { type: DataTypes.BIGINT, defaultValue: 1 },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
    },
    {
      tableName: "beban",
      timestamps: false
    }
  );

  Beban.associate = models => {
    Beban.belongsTo(models.Entities, { foreignKey: "branch_id", as: "branch" });
    Beban.belongsTo(models.Period, { foreignKey: "period_id", as: "period" });
  };

  return Beban;
};
