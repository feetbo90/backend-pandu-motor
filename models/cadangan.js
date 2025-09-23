"use strict";
module.exports = (sequelize, DataTypes) => {
  const Cadangan = sequelize.define(
    "Cadangan",
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
      cadangan_piutang: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      macet_real: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      surplus_devist: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      cadangan_stock: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      cadangan_stock_data: {
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
        type: DataTypes.INTEGER,
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
      tableName: "cadangan",
      timestamps: false
    }
  );

  // Relasi jika diperlukan
  Cadangan.associate = function(models) {
    Cadangan.belongsTo(models.Period, { foreignKey: "period_id" });
    Cadangan.belongsTo(models.Entities, { foreignKey: "branch_id" });
  };

  return Cadangan;
};