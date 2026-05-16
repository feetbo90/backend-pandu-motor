# Rate Ratio Metrics API (Rate 1 - Rate 11, Ratio 1 - Ratio 11)

## Controller
- `controllers/transaction/rateRatioMetricsController.js`

## Endpoints
- `GET /api/rate-ratio/:entity_id/descendants/rates-ratios?year=2025&month=3`
- `GET /api/rate-ratio/:entity_id/descendants/pembiayaan-unit-penjualan?year=2025&month=3`

Kedua endpoint saat ini memakai handler yang sama (backward compatibility).

## Aturan Perhitungan
- Jika `entity_id` adalah `CABANG`, data dihitung dari **cabang itu sendiri + semua descendant**.
- Jika `month` tidak dikirim, default `12`.
- Perhitungan kumulatif:
  - `month_end = 1` -> data bulan 1
  - `month_end = 2` -> rata-rata bulan 1..2
  - dst sampai `month_end = N`
- Semua nilai dibulatkan 2 desimal.

## Sumber Data
- `Piutang`: `tambahan`, `realisasi_pokok`, `realisasi_bunga`, `saldo_akhir`
- `Penjualan`: `kontan`, `kredit`, `leasing`, `unit_jualkredit`, `unit_jualleasing`, `unit_jualkontan`
- `SumberDaya`: `jumlah_karyawan`, `jumlah_unit`
- `Pendapatan`: `markup_jumlah`, `jumlah_pendapatan`, `denda`, `administrasi`
- `PendapatanLain`: `jumlah_pendapatan_lain`
- `Beban`: `gaji`, `operasional`, `penyusutan_aktiva`, `cadangan_piutang`, `cadangan_stock`
- `SirkulasiPiutang`: `macet_lama`
- `LabaRugi`: `kumulatif`

## Formula Rate
1. `rate_satu`: `average_pembiayaan_rN / average_unit_penjualan_rN`
2. `rate_dua`: `average_penjualan_rN / average_unit_penjualan_rN`
3. `rate_tiga`: `average_penjualan_rN / average_karyawan_rN`
4. `rate_empat`: `average_markup_rN / average_karyawan_rN`
5. `rate_lima`: `average_gaji_rN / average_karyawan_rN`
6. `rate_enam`: `average_operasional_rN / average_karyawan_rN`
7. `rate_tujuh`: `average_penyusutan_rN / average_karyawan_rN`
8. `rate_delapan`: `average_penyusutan_rN / average_satuan_kerja_rN`
9. `rate_sembilan`: `average_beban_gabungan_rN / average_satuan_kerja_rN`
10. `rate_sepuluh`: `average_kumulatif_rN / average_satuan_kerja_rN`
11. `rate_sebelas`: `average_kumulatif_rN / average_karyawan_rN`

## Formula Ratio
1. `ratio_satu`: `(average_pembiayaan_rN / average_realisasi_pokok_rN) * 100`
2. `ratio_dua`: `(average_cadangan_piutang_rN / average_tambahan_rN) * 100`
3. `ratio_tiga`: `(average_markup_rN / average_pembiayaan_rN) * 100`
4. `ratio_empat`: `(average_realisasi_bunga_rN / average_saldo_akhir_rN) * 100`
5. `ratio_lima`: `(average_markup_rN / average_jumlah_pendapatan_rN) * 100`
6. `ratio_enam`: `(average_realisasi_bunga_rN / average_jumlah_pendapatan_rN) * 100`
7. `ratio_tujuh`: `(average_jumlah_pendapatan_lain_rN / average_jumlah_pendapatan_rN) * 100`
8. `ratio_delapan`: `(average_gaji_rN / average_jumlah_pendapatan_rN) * 100`
9. `ratio_sembilan`: `(average_operasional_rN / average_jumlah_pendapatan_rN) * 100`
10. `ratio_sepuluh`: `(average_penyusutan_rN / average_jumlah_pendapatan_rN) * 100`
11. `ratio_sebelas`: `(average_cadangan_rN / average_jumlah_pendapatan_rN) * 100`

## Struktur Response
- Root response berisi:
  - `rate_satu` ... `rate_sebelas`
  - `ratio_satu` ... `ratio_sebelas`
  - `units[]`
- Setiap `units[]` berisi metrik yang sama untuk masing-masing unit turunan.

Setiap item array metrik berisi:
- `month_end`
- nilai bulan ini (`*_bulan_ini`)
- nilai total kumulatif (`total_*`)
- nilai average dinamis (`average_*_r{month_end}`)
- nilai hasil akhir rate/ratio
