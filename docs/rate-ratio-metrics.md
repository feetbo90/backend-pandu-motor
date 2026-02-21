# Rate Ratio Metrics API (Rate 1 - Rate 11)

## Controller
- `controllers/transaction/rateRatioMetricsController.js`

## Endpoints
- `GET /api/rate-ratio/:entity_id/descendants/rates-ratios?year=2025&month=3`
- `GET /api/rate-ratio/:entity_id/descendants/pembiayaan-unit-penjualan?year=2025&month=3`

Kedua endpoint saat ini menggunakan handler yang sama (backward compatibility).

## Aturan Perhitungan
- Jika `entity_id` adalah `CABANG`, data dihitung dari **cabang itu sendiri + semua descendant**.
- Jika `month` tidak dikirim, default `12`.
- Perhitungan menggunakan metode kumulatif:
  - `month_end = 1` -> data bulan 1
  - `month_end = 2` -> rata-rata dari bulan 1..2
  - dst sampai `month_end = N`
- Semua nilai dibulatkan 2 angka desimal.

## Sumber Data
- `Piutang.tambahan` -> pembiayaan
- `Penjualan.kontan + kredit + leasing` -> penjualan
- `Penjualan.unit_jualkredit + unit_jualleasing` -> unit penjualan
- `SumberDaya.jumlah_karyawan` -> karyawan
- `Pendapatan.markup_jumlah` -> markup
- `Beban.gaji` -> gaji
- `Beban.operasional` -> operasional
- `Beban.penyusutan_aktiva` -> penyusutan
- `Beban.cadangan_piutang + cadangan_stock` -> cadangan gabungan
- `LabaRugi.kumulatif` -> kumulatif laba/rugi

## Formula Rate
1. `rate_satu`
   - `pembiayaan_per_unit_penjualan = average_pembiayaan_rN / average_unit_penjualan_rN`
2. `rate_dua`
   - `penjualan_per_unit_penjualan = average_penjualan_rN / average_unit_penjualan_rN`
3. `rate_tiga`
   - `penjualan_per_karyawan = average_penjualan_rN / average_karyawan_rN`
4. `rate_empat`
   - `markup_per_karyawan = average_markup_rN / average_karyawan_rN`
5. `rate_lima`
   - `gaji_per_karyawan = average_gaji_rN / average_karyawan_rN`
6. `rate_enam`
   - `operasional_per_karyawan = average_operasional_rN / average_karyawan_rN`
7. `rate_tujuh`
   - `penyusutan_per_karyawan = average_penyusutan_rN / average_karyawan_rN`
8. `rate_delapan`
   - `penyusutan_per_satuan_kerja = average_penyusutan_rN / total_satuan_kerja`
9. `rate_sembilan`
   - `beban_gabungan_per_satuan_kerja = average_beban_gabungan_rN / total_satuan_kerja`
   - `beban_gabungan = penyusutan + cadangan_piutang + cadangan_stock`
10. `rate_sepuluh`
   - `kumulatif_per_satuan_kerja = average_kumulatif_rN / total_satuan_kerja`
11. `rate_sebelas`
   - `kumulatif_per_karyawan = average_kumulatif_rN / average_karyawan_rN`

## Struktur Response (ringkas)
- root:
  - `rate_satu` ... `rate_sebelas`
  - `units[]`
- `units[]`:
  - `unit_id`, `unit_name`
  - `rate_satu` ... `rate_sebelas`

Setiap item array rate menyertakan:
- `month_end`
- nilai bulan ini (`*_bulan_ini`)
- nilai total kumulatif (`total_*`)
- nilai average dinamis (`average_*_r{month_end}`)
- nilai hasil rate akhir
