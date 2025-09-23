"use strict";
module.exports = (sequelize, DataTypes) => {
  const Entities = sequelize.define(
    "Entities",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      entity_type: {
        type: DataTypes.ENUM("CABANG", "UNIT"),
        allowNull: false
      },
      parent_id: {
        type: DataTypes.BIGINT,
        allowNull: true
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
      tableName: "entities",
      timestamps: false // karena sudah pakai created_at & updated_at manual
    }
  );

  // Relasi
  Entities.associate = models => {
    // self reference: Cabang bisa punya banyak Unit
    Entities.hasMany(models.Entities, {
      foreignKey: "parent_id",
      as: "units"
    });

    Entities.belongsTo(models.Entities, {
      foreignKey: "parent_id",
      as: "parent"
    });

    // ke tabel Penjualan (dan tabel lain)
    Entities.hasMany(models.Penjualan, {
      foreignKey: "branch_id",
      as: "penjualan"
    });
  };

  return Entities;
};
