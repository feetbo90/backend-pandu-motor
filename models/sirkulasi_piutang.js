"use strict";

module.exports = (sequelize, DataTypes) => {
  const SirkulasiPiutang = sequelize.define(
    "SirkulasiPiutang",
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
      lancar: { type: DataTypes.BIGINT, defaultValue: 0 },
      lancar_persen: { type: DataTypes.INTEGER, defaultValue: 0 },
      kurang_lancar: { type: DataTypes.BIGINT, defaultValue: 0 },
      kurang_lancar_persen: { type: DataTypes.INTEGER, defaultValue: 0 },
      ragu_ragu: { type: DataTypes.BIGINT, defaultValue: 0 },
      ragu_ragu_persen: { type: DataTypes.INTEGER, defaultValue: 0 },
      macet_baru: { type: DataTypes.BIGINT, defaultValue: 0 },
      macet_baru_persen: { type: DataTypes.INTEGER, defaultValue: 0 },
      macet_lama: { type: DataTypes.BIGINT, defaultValue: 0 },
      macet_lama_persen: { type: DataTypes.INTEGER, defaultValue: 0 },
      total: { type: DataTypes.BIGINT, defaultValue: 0 },
      total_persen: { type: DataTypes.INTEGER, defaultValue: 0 },
      change_id: { type: DataTypes.UUID, allowNull: true },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      version: { type: DataTypes.BIGINT, defaultValue: 1 },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
    },
    {
      tableName: "sirkulasi_piutang",
      timestamps: false
    }
  );

  SirkulasiPiutang.associate = models => {
    SirkulasiPiutang.belongsTo(models.Entities, { foreignKey: "branch_id", as: "branch" });
    SirkulasiPiutang.belongsTo(models.Period, { foreignKey: "period_id", as: "period" });
  };

  return SirkulasiPiutang;
};
