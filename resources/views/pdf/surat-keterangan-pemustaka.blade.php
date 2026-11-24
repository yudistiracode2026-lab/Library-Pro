<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Surat Keterangan · {{ $member->name }}</title>
    <style>
        @page { margin: 1.2cm 2.1cm 1.5cm 2.3cm; }
        body { font-family: 'DejaVu Serif', serif; font-size: 11.5pt; color: #000; line-height: 1.22; }
        .kop { width: 100%; border-collapse: collapse; }
        .kop td { vertical-align: middle; }
        .kop .logo { width: 104px; text-align: left; }
        .kop .text { text-align: center; font-family: 'DejaVu Sans', sans-serif; }
        .kop .l1 { font-size: 14.5pt; line-height: 1.3; }
        .kop .l2 { font-size: 12.5pt; line-height: 1.35; }
        .kop .addr { font-size: 7.6pt; line-height: 1.35; white-space: nowrap; }
        .kop a { color: #1a4fd6; text-decoration: underline; }
        .rule-thick { border-top: 3px solid #000; margin-top: 14px; }
        .rule-thin { border-top: 1px solid #000; margin-top: 2px; margin-bottom: 20px; }
        h1 { text-align: center; font-size: 12.5pt; font-weight: bold; text-decoration: underline; margin: 0; }
        .nomor { text-align: center; margin: 2px 0 20px; }
        .nomor .blank { display: inline-block; width: 90px; }
        p { margin: 0 0 6px; }
        table.data { width: 14.6cm; margin: 3px 0 12px 48px; border-collapse: collapse; }
        table.data td { padding: 1px 0; vertical-align: top; }
        table.data td.key { width: 175px; }
        table.data td.colon { width: 22px; }
        ol { margin: 4px 0 12px 0; padding-left: 74px; }
        ol li { text-align: justify; margin-bottom: 2px; padding-left: 4px; }
        .justify { text-align: justify; }
        .ttd { margin-left: 56%; margin-top: 26px; line-height: 1.3; }
        .ttd .space { height: 78px; }
        .ttd .name { font-weight: bold; text-decoration: underline; }
    </style>
</head>
<body>
    <table class="kop">
        <tr>
            <td class="logo"><img src="{{ $logo }}" width="98" height="98" alt=""></td>
            <td class="text">
                <div class="l1">KEMENTERIAN AGRARIA DAN TATA RUANG/</div>
                <div class="l1">BADAN PERTANAHAN NASIONAL</div>
                <div class="l2">POLITEKNIK AGRARIA STPN</div>
                <div class="addr">Jl. Tata Bumi No. 5 Banyuraden, Gamping, Sleman, Daerah Istimewa Yogyakarta 55293</div>
                <div class="addr">Telp. (0274) 587239 Fax. (0274) 587138 <i>website:</i> <a href="https://www.stpn.ac.id">www.stpn.ac.id</a>, <a href="mailto:umum.stpn@stpn.ac.id">Email: umum.stpn@stpn.ac.id</a></div>
            </td>
        </tr>
    </table>
    <div class="rule-thick"></div>
    <div class="rule-thin"></div>

    <h1>SURAT KETERANGAN</h1>
    <p class="nomor">Nomor :<span class="blank"></span>{{ $nomor }}</p>

    <p>Yang bertanda tangan di bawah ini:</p>
    <table class="data">
        <tr><td class="key">Nama</td><td class="colon">:</td><td>{{ $head?->name ?? '..............................' }}</td></tr>
        <tr><td class="key">NIP</td><td class="colon">:</td><td>{{ $head?->nip ?? '..............................' }}</td></tr>
        <tr><td class="key">Jabatan</td><td class="colon">:</td><td>Kepala UPA Perpustakaan Politeknik Agraria STPN</td></tr>
    </table>

    <p>menerangkan dengan sebenarnya bahwa:</p>
    <table class="data">
        <tr><td class="key">Nama</td><td class="colon">:</td><td>{{ $member->name }}</td></tr>
        <tr><td class="key">NIT</td><td class="colon">:</td><td>{{ $member->member_number }}</td></tr>
        <tr><td class="key">Semester</td><td class="colon">:</td><td>{{ $semester }}</td></tr>
        <tr><td class="key">Kelas</td><td class="colon">:</td><td>{{ $kelas }}</td></tr>
    </table>

    <p class="justify">adalah benar taruna Politeknik Agraria STPN yang terdaftar sebagai anggota UPA Perpustakaan Politeknik Agraria STPN dan telah:</p>
    <ol>
        <li>Mengunjungi UPA Perpustakaan Politeknik Agraria STPN;</li>
        <li>Meminjam koleksi bahan pustaka perpustakaan dan telah mengembalikannya sesuai ketentuan;</li>
        <li>Menggunakan fasilitas perpustakaan, antara lain ruang baca, layanan referensi, katalog daring (OPAC), dan akses jaringan internet.</li>
    </ol>

    <p class="justify">Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>

    <div class="ttd">
        Yogyakarta, {{ $date }}<br>
        Kepala UPA Perpustakaan<br>
        Politeknik Agraria STPN,
        <div class="space"></div>
        <span class="name">{{ $head?->name ?? '..............................' }}</span><br>
        NIP {{ $head?->nip ?? '..............................' }}
    </div>
</body>
</html>
