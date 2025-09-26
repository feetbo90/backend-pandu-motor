const fs = require("fs");
const path = require("path");
const { Pendapatan, Penjualan } = require("../../models");

// export pendapatan
exports.exportPendapatan = async (req, res) => {
  try {
    const data = await Pendapatan.findAll({ raw: true });
    const jsonData = { pendapatan: data };

    const filePath = path.join(__dirname, "../pendapatan.json");
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

    res.json({ message: "Data pendapatan berhasil diexport", file: "pendapatan.json" });
  } catch (err) {
    res.status(500).json({ message: "Gagal export pendapatan", error: err.message });
  }
};

// export penjualan
exports.exportPenjualan = async (req, res) => {
  try {
    const data = await Penjualan.findAll({ raw: true });
    const jsonData = { penjualan: data };

    const filePath = path.join(__dirname, "../penjualan.json");
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

    res.json({ message: "Data penjualan berhasil diexport", file: "penjualan.json" });
  } catch (err) {
    res.status(500).json({ message: "Gagal export penjualan", error: err.message });
  }
};
