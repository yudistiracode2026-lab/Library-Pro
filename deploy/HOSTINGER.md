# Deploy PUSTAGRA ke Hostinger (uji coba / UAT)

Panduan ini memasang PUSTAGRA di shared hosting Hostinger (paket **Business**
atau setara) memakai paket rilis siap pakai, jadi server tidak perlu Node.js.

Yang dibutuhkan dari komputer lokal:

| Berkas | Cara membuat | Ukuran kira-kira |
|---|---|---|
| `dist/pustagra-<commit>.tar.gz` | `bash scripts/release.sh` | ±10 MB |
| `library_pro.sql.gz` | lihat langkah 2 | ±8 MB |
| `sampul.tar.gz` | lihat langkah 2 | ±600 MB |

---

## 1. Siapkan hPanel

1. **Website → Add website → Empty PHP/HTML website**, pilih domain atau
   subdomain (mis. `pustaka.domainkamu.id`).
2. **Advanced → PHP Configuration**
   - PHP version: **8.3** (minimal 8.2).
   - PHP options: `upload_max_filesize` dan `post_max_size` **64M**,
     `memory_limit` **512M**, `max_execution_time` **120**.
   - Pastikan ekstensi `gd`, `intl`, `zip`, `fileinfo`, `pdo_mysql`, `mbstring` aktif.
3. **Databases → MySQL Databases**: buat database + user. Catat nama
   database, user, dan password (formatnya `u123456789_pustagra`).
4. **Advanced → SSH Access**: aktifkan, catat host, port (biasanya 65002),
   dan username.
5. **Security → SSL**: pasang SSL gratis untuk domain itu. HTTPS wajib supaya
   scan QR kamera di portal pemustaka berjalan.

## 2. Siapkan berkas di komputer lokal

Di Git Bash, dari folder `Library-Pro`:

```bash
# Paket aplikasi (kode + vendor + tampilan yang sudah di-build)
bash scripts/release.sh

# Database yang sudah berisi data hasil impor SLiMS
/c/xampp/mysql/bin/mysqldump -uroot --single-transaction --default-character-set=utf8mb4 \
    library_pro | gzip > dist/library_pro.sql.gz

# Gambar sampul
tar -czf dist/sampul.tar.gz -C storage/app/private sampul
```

## 3. Upload dan pasang

Upload ketiga berkas ke folder home (`/home/u123456789/`) lewat **Files →
File Manager** atau `scp`:

```bash
scp -P 65002 dist/pustagra-*.tar.gz dist/library_pro.sql.gz dist/sampul.tar.gz u123456789@HOST:~/
```

Lalu masuk SSH (`ssh -p 65002 u123456789@HOST`) dan jalankan:

```bash
DOMAIN=pustaka.domainkamu.id
APP=~/domains/$DOMAIN/pustagra

mkdir -p $APP && tar -xzf ~/pustagra-*.tar.gz -C $APP
tar -xzf ~/sampul.tar.gz -C $APP/storage/app/private

# public_html menunjuk ke folder public aplikasi
mv ~/domains/$DOMAIN/public_html ~/domains/$DOMAIN/public_html.bak
ln -s $APP/public ~/domains/$DOMAIN/public_html

cd $APP
cp deploy/env.hosting .env
nano .env        # isi APP_URL, DB_DATABASE, DB_USERNAME, DB_PASSWORD, MAIL_*
php artisan key:generate --force

# Database
gunzip -c ~/library_pro.sql.gz | mysql -u u123456789_pustagra -p u123456789_pustagra
php artisan migrate --force

php artisan optimize
chmod -R ug+rwX storage bootstrap/cache
```

Buka `https://pustaka.domainkamu.id` — website publik harus tampil.

> Kalau `ln -s` ditolak, salin isi folder `public/` ke `public_html/` lalu ubah
> dua baris di `public_html/index.php` agar menunjuk ke `../pustagra/vendor/autoload.php`
> dan `../pustagra/bootstrap/app.php`.

## 4. Setelah terpasang

1. Login dengan akun admin di `https://pustaka.domainkamu.id/staf/masuk` (halaman login staf; `/login` khusus pemustaka), lalu **ganti password** (menu profil).
2. **Pengaturan → Jaringan perpustakaan**: isi dengan IP publik Wi-Fi
   perpustakaan (buka https://ifconfig.me dari Wi-Fi perpustakaan), mis.
   `103.10.20.30/32`. Ini syarat Baca di tempat.
3. Buat akun pustakawan/tendik di menu **Pustakawan** dan **Tendik**, dan akun
   portal untuk pemustaka penguji di menu **Pemustaka**.
4. **Email** (untuk lupa password): buat akun email di **Emails** hPanel,
   lalu isi `MAIL_*` di `.env` dan jalankan `php artisan optimize` lagi.

## 5. Backup

Hostinger Business membuat backup harian otomatis (**Files → Backups**).
Tetap simpan salinan sendiri seminggu sekali:

```bash
cd ~/domains/$DOMAIN/pustagra
mysqldump -u u123456789_pustagra -p u123456789_pustagra | gzip > ~/backup-$(date +%F).sql.gz
tar -czf ~/berkas-$(date +%F).tar.gz storage/app/private
```

Unduh kedua berkas itu ke komputer kantor.

## 6. Memperbarui aplikasi

```bash
# lokal
bash scripts/release.sh
scp -P 65002 dist/pustagra-<commit>.tar.gz u123456789@HOST:~/

# server
cd ~/domains/$DOMAIN/pustagra
php artisan down
tar -xzf ~/pustagra-<commit>.tar.gz -C .      # .env dan storage tidak tertimpa
php artisan migrate --force
php artisan optimize
php artisan up
```

## Masalah umum

| Gejala | Penyebab |
|---|---|
| Halaman putih / error 500 | Lihat `storage/logs/laravel-*.log`; biasanya `.env` salah atau izin `storage` |
| Tampilan tanpa gaya | `public_html` belum menunjuk ke `pustagra/public` |
| "419 Page expired" saat login | `APP_URL` tidak sama dengan alamat yang dibuka (http vs https) |
| Scan QR tidak bisa membuka kamera | Situs belum HTTPS |
| Baca di tempat selalu terkunci | IP Wi-Fi perpustakaan belum diisi di Pengaturan |
