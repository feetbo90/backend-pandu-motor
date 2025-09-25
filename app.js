const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 3000;
// routes
const authRoutes = require("./routes/authRoutes");
const entityRoutes = require("./routes/entityRoutes");
const periodRoutes = require("./routes/periodRoutes");
const inputUnitRoutes = require("./routes/inputUnitRoutes");
const penjualanRoutes = require("./routes/penjualanRoutes");
const pendapatanRoutes = require("./routes/pendapatanRoutes");
const pendapatanLainRoutes = require("./routes/pendapatanLainRoutes");
const piutangRoutes = require("./routes/piutangRoutes");
const sirkulasiPiutangRoutes = require("./routes/sirkulasiPiutangRoutes");
const sirkulasiStockRoutes = require("./routes/sirkulasiStockRoutes");
const barangPkRoutes = require("./routes/barangPkRoutes");
const bebanRoutes = require("./routes/bebanRoutes");
const sumberDayaRoutes = require("./routes/sumberDayaRoutes");
const labaRugiRoutes = require("./routes/labaRugiRoutes");
const kasKeuanganRoutes = require("./routes/kasKeuanganRoutes");
const cadanganRoutes = require("./routes/cadanganRoutes");
// const pembiayaanRoutes = require("./routes/pembiayaanRoutes"); --- IGNORE ---

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pandu Motor Clean API",
      version: "1.0.0",
      description: "Dokumentasi API untuk backend Pandu Motor Clean"
    },
    servers: [
      { url: "http://localhost:3000/api" }
    ]
  },
  apis: ["./routes/*.js"], // path ke file route Anda
};

const swaggerSpec = swaggerJSDoc(options);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// test endpoint
app.get("/", (req, res) => {
  res.json({ message: "API berjalan 🚀" });
});

// register routes
app.use("/api/auth", authRoutes);
app.use("/api/entities", entityRoutes);
app.use("/api/periods", periodRoutes);
app.use("/api/units", inputUnitRoutes);
app.use("/api/penjualan", penjualanRoutes);
app.use("/api/pendapatan", pendapatanRoutes);
app.use("/api/pendapatan-lain", pendapatanLainRoutes);
app.use("/api/piutang", piutangRoutes);
app.use("/api/sirkulasi-piutang", sirkulasiPiutangRoutes);
app.use("/api/sirkulasi-stock", sirkulasiStockRoutes);
app.use("/api/barang-pk", barangPkRoutes);
app.use("/api/beban", bebanRoutes);
app.use("/api/sumber-daya", sumberDayaRoutes);
app.use("/api/laba-rugi", labaRugiRoutes);
app.use("/api/kas-keuangan", kasKeuanganRoutes);
app.use("/api/cadangan", cadanganRoutes);
// app.use("/api/pembiayaan", pembiayaanRoutes); --- IGNORE ---

// Endpoint untuk docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// jalankan server setelah DB connect
sequelize.authenticate()
  .then(() => {
    console.log("Database connected ✅");
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("DB connection error ❌", err);
  });
