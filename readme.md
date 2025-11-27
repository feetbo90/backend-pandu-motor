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

## Menjalankan dengan Docker

1. (Satu kali di mesin) buat shared network untuk komunikasi lintas proyek:
   ```bash
   docker network create pandu_shared_net
   ```
2. Pastikan file `.env` terisi (JWT, DB_USER, DB_PASS, DB_NAME, dll). Nilai `DB_HOST` di-override menjadi `db` oleh `docker-compose`.
3. Build dan jalankan kontainer:
   ```bash
   docker compose up -d --build
   ```
4. Setelah Postgres siap, jalankan migrasi (dan seeder bila perlu):
   ```bash
   docker compose exec api npm run migrate
   docker compose exec api npm run seed   # opsional
   ```
5. API jalan di `http://localhost:3000`, dokumentasi swagger di `http://localhost:3000/api-docs`.

Catatan:
- Service DB menggunakan `postgres:latest` dengan data persisten di volume `db_data`.
- Folder `uploads/` di-host di-mount ke `/app/uploads` agar file tersimpan di host.
- Shared network bernama `pandu_shared_net` (external). Pastikan proyek lain yang ingin terhubung juga memakai nama network yang sama.

### Contoh docker-compose untuk frontend (berbagi network)

Gunakan `pandu_shared_net` supaya frontend bisa memanggil service `api`:

```yaml
version: "3.9"

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL:-http://api:3000/api/}
    container_name: pandu_motor_frontend
    restart: unless-stopped
    environment:
      VITE_API_URL: ${VITE_API_URL:-http://api:3000/api/}
    ports:
      - "8080:80"
    depends_on:
      - api
    networks:
      - pandu_shared_net

networks:
  pandu_shared_net:
    external: true
```

Pastikan network sudah dibuat terlebih dahulu:
```bash
docker network create pandu_shared_net
```

## Struktur API

- Semua endpoint tersedia di folder `routes/`.
- Logic bisnis ada di folder `controllers/` (terbagi menjadi `auth`, `master`, dan `transaction`).
- Model database di folder `models/`.

## Kontribusi

Silakan buat pull request atau issue untuk perbaikan dan pengembangan fitur.

---

**Pandu Motor Clean** &copy; 2025
