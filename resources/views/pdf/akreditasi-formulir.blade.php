<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><title>Formulir Pengajuan Akreditasi</title></head>
<body>
    @include('pdf.partials.kop')

    <h1>FORMULIR PENGAJUAN AKREDITASI PERPUSTAKAAN</h1>

    <p>Dengan ini kami mengajukan permohonan akreditasi perpustakaan sesuai Keputusan Kepala Perpustakaan Nasional Nomor 197 Tahun 2025 tentang Instrumen Akreditasi Perpustakaan Institut, Sekolah Tinggi, dan Politeknik, dengan data sebagai berikut:</p>

    <table class="kv">
        <tr><td>Nama perpustakaan</td><td>:</td><td><b>Perpustakaan Politeknik Agraria STPN</b></td></tr>
        <tr><td>Lembaga induk</td><td>:</td><td>Politeknik Agraria STPN, Kementerian ATR/BPN</td></tr>
        <tr><td>Alamat</td><td>:</td><td>Jl. Tata Bumi No. 5, Banyuraden, Gamping, Sleman, D.I. Yogyakarta 55293</td></tr>
        <tr><td>Telepon / email</td><td>:</td><td>(0274) 587239 · perpustakaan@stpn.ac.id</td></tr>
        <tr><td>Kepala perpustakaan</td><td>:</td><td>{{ $head?->name ?? '—' }}</td></tr>
        <tr><td>Jenis perpustakaan</td><td>:</td><td>Perpustakaan perguruan tinggi (politeknik)</td></tr>
    </table>

    <h2>Hasil penilaian mandiri</h2>
    <table class="data">
        <thead><tr><th>Komponen</th><th>Bobot</th><th>Skor</th><th>Kontribusi NA</th></tr></thead>
        <tbody>
            @foreach ($summary['components'] as $c)
                <tr>
                    <td>{{ $c['number'] }}. {{ $c['name'] }}</td>
                    <td>{{ $c['weight'] }}</td>
                    <td>{{ $c['score'] }} / {{ $c['max'] }}</td>
                    <td>{{ number_format($c['contribution'], 2, ',', '.') }}</td>
                </tr>
            @endforeach
            <tr>
                <th colspan="3">Nilai akhir (NA) simulasi</th>
                <th>{{ number_format($summary['finalScore'], 2, ',', '.') }} · {{ $summary['predicate']['letter'] }} ({{ $summary['predicate']['label'] }})</th>
            </tr>
        </tbody>
    </table>

    <p class="note">Nilai di atas adalah simulasi penilaian mandiri dari sistem informasi perpustakaan, bukan hasil resmi asesor.</p>

    @include('pdf.partials.ttd')
</body>
</html>
