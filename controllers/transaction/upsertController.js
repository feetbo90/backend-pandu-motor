const fs = require("fs");
const path = require("path");
const { upsertGeneric } = require("../../services/upsertService");

class UpsertController {
  // versi upload file .json
  async bulkUpsert(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File JSON wajib diupload" });
    }

    // baca isi file json
    const rawData = fs.readFileSync(req.file.path, "utf-8");
    const jsonData = JSON.parse(rawData);

    let results = {};

    // jalankan upsert untuk setiap key di JSON
    for (const modelName of Object.keys(jsonData)) {
      const records = jsonData[modelName];

      // kalau data kosong → skip
      if (!Array.isArray(records) || records.length === 0) {
        results[modelName] = "skip (kosong)";
        continue;
      }

      try {
        await upsertGeneric(modelName, records);
        results[modelName] = `success (${records.length} records)`;
      } catch (err) {
        results[modelName] = `error: ${err.message}`;
      }
    }

    res.json({
      message: "Proses bulk upsert selesai",
      results
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
  }
}


  // versi langsung body JSON tanpa upload file
  async bulkUpsertFromBody(req, res) {
    try {
      const jsonData = req.body;

      for (const modelName of Object.keys(jsonData)) {
        const records = jsonData[modelName];

        if (!Array.isArray(records) || records.length === 0) {
          return res.status(400).json({
            message: `Data ${modelName} kosong atau tidak valid`
          });
        }

        await upsertGeneric(modelName, records);
      }

      res.json({ message: "Data berhasil disimpan / diupdate" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
  }
}

module.exports = new UpsertController();
