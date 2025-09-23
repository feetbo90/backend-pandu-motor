const { Entities } = require("../../models");

module.exports = {
  // GET /api/entities
  async getAll(req, res) {
    try {
      const entities = await Entities.findAll({
        where: { is_active: true },
        include: [{ model: Entities, as: "units" }, { model: Entities, as: "parent" }]
      });
      res.json(entities);
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },

  // GET /api/entities/:id
  async getById(req, res) {
    try {
      const entity = await Entity.findByPk(req.params.id, {
        include: [{ model: Entity, as: "units" }, { model: Entity, as: "parent" }]
      });
      if (!entity) return res.status(404).json({ message: "Entity tidak ditemukan" });
      res.json(entity);
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },

  // POST /api/entities
  async create(req, res) {
    try {
      const { name, entity_type, parent_id } = req.body;

      if (!name || !entity_type) {
        return res.status(400).json({ message: "Name dan entity_type wajib diisi" });
      }

      const entity = await Entity.create({
        name,
        entity_type,
        parent_id: parent_id || null,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        is_active: true
      });

      res.status(201).json({ message: "Entity berhasil dibuat", data: entity });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },

  // PUT /api/entities/:id
  async update(req, res) {
    try {
      const { name, entity_type, parent_id, is_active } = req.body;

      const entity = await Entity.findByPk(req.params.id);
      if (!entity) return res.status(404).json({ message: "Entity tidak ditemukan" });

      await entity.update({
        name: name ?? entity.name,
        entity_type: entity_type ?? entity.entity_type,
        parent_id: parent_id ?? entity.parent_id,
        is_active: is_active ?? entity.is_active,
        updated_at: new Date(),
        version: entity.version + 1
      });

      res.json({ message: "Entity berhasil diperbarui", data: entity });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },

  // DELETE /api/entities/:id (soft delete dengan is_active = false)
  async remove(req, res) {
    try {
      const entity = await Entity.findByPk(req.params.id);
      if (!entity) return res.status(404).json({ message: "Entity tidak ditemukan" });

      await entity.update({ is_active: false, updated_at: new Date(), version: entity.version + 1 });

      res.json({ message: "Entity berhasil di-nonaktifkan" });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  },

  // DELETE /api/entities (hapus semua entity)
  async removeAll(req, res) {
    try {
      await Entities.destroy({
        where: {},          // semua data
        truncate: true,     // kosongkan tabel
        restartIdentity: true, // reset auto increment ID
        cascade: true
      });

      res.json({ message: "Semua entities berhasil dihapus" });
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  }
};
