# Pandu Motor Clean

Aplikasi manajemen data keuangan dan operasional untuk cabang Pandu Motor.

## Struktur Folder

```
app.js
package.json
config/
  config.js
controllers/
  auth/
    authController.js
  master/
    entityController.js
    periodController.js
  transaction/
    penjualanController.js
    pendapatanController.js
    pendapatanLainController.js
    piutangController.js
    bebanController.js
    sirkulasiPiutangController.js
    sirkulasiStockController.js
    sumberDayaController.js
    barangPkController.js
middlewares/
  authMiddleware.js
migrations/
  ... (file migrasi Sequelize)
models/
  ... (file model Sequelize)
routes/
  ... (file route Express)
seeders/
  ... (file seeder demo data)
```

## Fitur Utama

- **Autentikasi**: Login dan proteksi endpoint.
- **Master Data**: Manajemen entitas, periode, barang PK, sumber daya.
- **Transaksi**: Pendapatan, penjualan, piutang, beban, sirkulasi piutang, sirkulasi stock.
- **Paginasi**: Semua endpoint utama mendukung paginasi data.
- **Soft Delete**: Data tidak dihapus permanen, hanya dinonaktifkan.

## Cara Menjalankan

1. Install dependencies:
   ```bash
   npm install
   ```
2. Konfigurasi database di `config/config.js`.
3. Jalankan migrasi dan seeder:
   ```bash
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```
4. Start aplikasi:
   ```bash
   npm run dev
   ```

## Struktur API

- Semua endpoint tersedia di folder `routes/`.
- Logic bisnis ada di folder `controllers/` (terbagi menjadi `auth`, `master`, dan `transaction`).
- Model database di folder `models/`.

## Kontribusi

Silakan buat pull request atau issue untuk perbaikan dan pengembangan fitur.

---

**Pandu Motor Clean** &copy; 2025