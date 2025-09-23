"use strict";
module.exports = (sequelize, DataTypes) => {
  const KasKeuangan = sequelize.define(
    "KasKeuangan",
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
      kas_tunai: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      rekening_bank: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      jumlah_kas_lancar: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      bon_karyawan: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      bon_pusat: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      bon_operasional: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      bon_gantung: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      jumlah_kas_macet: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      saldo_akhir: {
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
      tableName: "kas_keuangan",
      timestamps: false
    }
  );

  KasKeuangan.associate = function(models) {
    KasKeuangan.belongsTo(models.Period, { foreignKey: "period_id" });
    KasKeuangan.belongsTo(models.Entities, { foreignKey: "branch_id" });
  };

  return KasKeuangan;
};