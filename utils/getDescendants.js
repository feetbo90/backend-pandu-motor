// utils/getDescendants.js
const { Entities } = require("../models"); // sesuaikan path kamu

async function getAllDescendants(entityId) {
  const result = [];
  const stack = [entityId];

  while (stack.length) {
    const currentId = stack.pop();

    // Ambil entity sekarang (pastikan aktif)
    const currentEntity = await Entities.findOne({
      where: { id: currentId, is_active: true },
      attributes: ["id", "entity_type", "name"],
      raw: true,
    });

    if (!currentEntity) continue;

    result.push({
      id: currentEntity.id,
      type: currentEntity.entity_type,
      name: currentEntity.name,
    });

    // Cari anak-anaknya
    const children = await Entities.findAll({
      where: { parent_id: currentId, is_active: true },
      attributes: ["id"],
      raw: true,
    });

    for (const child of children) {
      stack.push(child.id);
    }
  }

  return result;
}

module.exports = { getAllDescendants };
