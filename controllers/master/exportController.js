const fs = require("fs");
const path = require("path");
const { Pendapatan, Penjualan, PendapatanLain, Piutang, SirkulasiPiutang } = require("../../models");

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

exports.exportAll = async (req, res) => {
  try {
    const pendapatan = await Pendapatan.findAll({ raw: true });
    const penjualan = await Penjualan.findAll({ raw: true });
    const pendapatanLain = await PendapatanLain.findAll({ raw: true });
    const piutang = await Piutang.findAll({ raw: true });
    const sirkulasiPiutang = await SirkulasiPiutang.findAll({ raw: true });

    const jsonData = {
      pendapatan,
      penjualan,
      pendapatanLain,
      piutang,
      sirkulasiPiutang
    };

    // Set header supaya browser download, bukan tampilkan JSON
    res.setHeader("Content-Disposition", "attachment; filename=data-export.json");
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(jsonData, null, 2));
  } catch (err) {
    res.status(500).json({
      message: "Gagal export data",
      error: err.message
    });
  }
};

