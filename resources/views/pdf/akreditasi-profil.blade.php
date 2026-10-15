<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><title>Data Profil Perpustakaan</title></head>
<body>
    @include('pdf.partials.kop')

    <h1>DATA PROFIL PERPUSTAKAAN</h1>

    <h2>A. Gedung dan layanan</h2>
    <table class="kv">
        <tr><td>Luas area perpustakaan</td><td>:</td><td>{{ number_format($profile['area'], 0, ',', '.') }} m²</td></tr>
        <tr><td>Jumlah sivitas akademika</td><td>:</td><td>{{ number_format($profile['sivitas'], 0, ',', '.') }} orang</td></tr>
        <tr><td>Luas per sivitas</td><td>:</td><td>{{ number_format($profile['area'] / max(1, $profile['sivitas']), 2, ',', '.') }} m²</td></tr>
        <tr><td>Jam layanan per minggu</td><td>:</td><td>{{ number_format($profile['hours'], 1, ',', '.') }} jam</td></tr>
    </table>
    <table class="data" style="margin-top:8px">
        <thead><tr><th>Hari</th><th>Jam</th><th>Keterangan</th></tr></thead>
        <tbody>
            @foreach ($profile['schedule'] as $row)
                <tr>
                    <td>{{ $row['label'] }}</td>
                    <td>{{ $row['open'] ? str_replace(':', '.', $row['open']).' – '.str_replace(':', '.', $row['close']) : 'Tutup' }}</td>
                    <td>{{ $row['note'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <h2>B. Koleksi</h2>
    <table class="kv">
        <tr><td>Judul buku cetak</td><td>:</td><td>{{ number_format($profile['printed'], 0, ',', '.') }} judul ({{ number_format($profile['copies'], 0, ',', '.') }} eksemplar)</td></tr>
        <tr><td>Judul e-book</td><td>:</td><td>{{ number_format($profile['ebooks'], 0, ',', '.') }} judul</td></tr>
        <tr><td>Anggota terdaftar</td><td>:</td><td>{{ number_format($profile['members'], 0, ',', '.') }} orang</td></tr>
    </table>

    <h2>C. Tenaga perpustakaan</h2>
    <table class="data">
        <thead><tr><th style="width:24px">No</th><th>Nama</th><th>Jabatan</th></tr></thead>
        <tbody>
            @foreach ($profile['librarians'] as $i => $l)
                <tr><td>{{ $i + 1 }}</td><td>{{ $l->name }}</td><td>{{ $l->position }}</td></tr>
            @endforeach
        </tbody>
    </table>
    <p>Tenaga teknis/tendik: {{ $profile['support'] }} orang.</p>

    <p class="note">Data diambil dari sistem informasi perpustakaan PUSTAGRA pada {{ now()->translatedFormat('j F Y, H.i') }} WIB.</p>

    @include('pdf.partials.ttd')
</body>
</html>
