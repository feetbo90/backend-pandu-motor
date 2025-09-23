"use strict";
module.exports = (sequelize, DataTypes) => {
  const Period = sequelize.define(
    "Period",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false
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
      tableName: "periods",
      timestamps: false // karena kita pakai created_at & updated_at manual
    }
  );

  // Relasi
  Period.associate = models => {
    if (models.Penjualan) {
      Period.hasMany(models.Penjualan, {
        foreignKey: "period_id",
        as: "penjualans"
      });
    }
    // Bisa juga tambahkan relasi ke tabel lain (Pendapatan, Piutang, dll)
  };

  return Period;
};
