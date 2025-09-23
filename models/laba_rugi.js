"use strict";
module.exports = (sequelize, DataTypes) => {
  const LabaRugi = sequelize.define(
    "LabaRugi",
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
      year: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      bulan_ini: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      kumulatif: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      penarikan: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      modal: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      version: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 1
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      tableName: "laba_rugi",
      timestamps: false
    }
  );

  // Relasi jika diperlukan
  LabaRugi.associate = function(models) {
    LabaRugi.belongsTo(models.Period, { foreignKey: "period_id" });
    LabaRugi.belongsTo(models.Entities, { foreignKey: "branch_id" });
  };

  return LabaRugi;
};