"use strict";
module.exports = (sequelize, DataTypes) => {
  const Penjualan = sequelize.define(
    "Penjualan",
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
      kontan: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      kredit: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      leasing: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      unit_jualkontan: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      unit_jualkredit: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      unit_jualleasing: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      jumlah: {
        type: DataTypes.INTEGER,
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
      },
      change_id: { type: DataTypes.UUID, allowNull: true }
    },
    {
      tableName: "penjualan",
      timestamps: false // karena pakai created_at & updated_at manual
    }
  );

  // Relasi
  Penjualan.associate = models => {
    Penjualan.belongsTo(models.Entities, {
      foreignKey: "branch_id",
      as: "entities"
    });

    Penjualan.belongsTo(models.Period, {
      foreignKey: "period_id",
      as: "period"
    });
  };

  return Penjualan;
};
