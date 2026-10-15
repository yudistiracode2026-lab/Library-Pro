<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><title>Pernyataan Penulisan Sertifikat</title></head>
<body>
    @include('pdf.partials.kop')

    <h1>SURAT PERNYATAAN PENULISAN SERTIFIKAT AKREDITASI</h1>

    <p>Yang bertanda tangan di bawah ini:</p>
    <table class="kv">
        <tr><td>Nama</td><td>:</td><td>{{ $head?->name ?? '..............................' }}</td></tr>
        <tr><td>NIP</td><td>:</td><td>{{ $head?->nip ?? '..............................' }}</td></tr>
        <tr><td>Jabatan</td><td>:</td><td>Kepala Perpustakaan</td></tr>
    </table>

    <p>menyatakan bahwa penulisan nama lembaga dan nama kepala perpustakaan pada sertifikat akreditasi adalah sebagai berikut:</p>

    <table class="kv">
        <tr><td>Nama perpustakaan</td><td>:</td><td><b>Perpustakaan Politeknik Agraria STPN</b></td></tr>
        <tr><td>Lembaga induk</td><td>:</td><td><b>Politeknik Agraria STPN</b></td></tr>
        <tr><td>Kepala perpustakaan</td><td>:</td><td><b>{{ $head?->name ?? '..............................' }}</b></td></tr>
        <tr><td>Alamat</td><td>:</td><td>Jl. Tata Bumi No. 5, Banyuraden, Gamping, Sleman, D.I. Yogyakarta 55293</td></tr>
    </table>

    <p>Demikian pernyataan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.</p>

    @include('pdf.partials.ttd')
</body>
</html>
