<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Surat Keterangan Bebas Pustaka · {{ $clearance->member->name }}</title>
    <style>
        @page { margin: 2.2cm 2.4cm; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11pt; color: #0F0E0A; line-height: 1.55; }
        .kop { width: 100%; border-bottom: 3px double #0F0E0A; padding-bottom: 10px; margin-bottom: 22px; }
        .kop td { vertical-align: middle; }
        .kop .logo { width: 72px; }
        .kop .text { text-align: center; }
        .kop .inst { font-size: 13pt; font-weight: bold; letter-spacing: .5px; }
        .kop .unit { font-size: 15pt; font-weight: bold; }
        .kop .addr { font-size: 9pt; color: #4B473F; }
        h1 { text-align: center; font-size: 13pt; text-decoration: underline; margin: 0; }
        .nomor { text-align: center; margin: 2px 0 22px; }
        table.data { margin: 10px 0 14px 24px; }
        table.data td { padding: 2px 8px 2px 0; vertical-align: top; }
        .ttd { width: 46%; margin-left: 54%; margin-top: 34px; }
        .ttd .space { height: 72px; }
        .footer { position: fixed; bottom: -1.2cm; left: 0; right: 0; font-size: 8pt; color: #6B675D; }
    </style>
</head>
<body>
    <table class="kop">
        <tr>
            <td class="logo"><img src="{{ $logo }}" width="70" height="70" alt=""></td>
            <td class="text">
                <div class="inst">POLITEKNIK AGRARIA STPN</div>
                <div class="unit">PERPUSTAKAAN</div>
                <div class="addr">Jl. Tata Bumi No. 5, Banyuraden, Gamping, Sleman, D.I. Yogyakarta 55293 · (0274) 587239 · perpustakaan@stpn.ac.id</div>
            </td>
            <td class="logo"></td>
        </tr>
    </table>

    <h1>SURAT KETERANGAN BEBAS PUSTAKA</h1>
    <p class="nomor">Nomor: {{ $clearance->letter_number }}</p>

    <p>Kepala Perpustakaan Politeknik Agraria STPN menerangkan bahwa:</p>

    <table class="data">
        <tr><td>Nama</td><td>:</td><td><b>{{ $clearance->member->name }}</b></td></tr>
        <tr><td>NIM</td><td>:</td><td>{{ $clearance->member->member_number }}</td></tr>
        <tr><td>Program studi</td><td>:</td><td>{{ $clearance->member->study_program }}</td></tr>
        <tr><td>Judul skripsi</td><td>:</td><td>{{ $clearance->thesis_title }}</td></tr>
    </table>

    <p>
        telah memenuhi seluruh kewajiban kepada Perpustakaan Politeknik Agraria STPN, yaitu tidak memiliki pinjaman koleksi,
        telah menyerahkan skripsi dalam bentuk digital dan cetak, serta telah menyumbangkan buku untuk koleksi perpustakaan.
    </p>
    <p>Surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.</p>

    <div class="ttd">
        Yogyakarta, {{ $clearance->approved_at->translatedFormat('j F Y') }}<br>
        Kepala Perpustakaan,
        <div class="space"></div>
        <b>{{ $head?->name ?? '..............................' }}</b><br>
        NIP. {{ $head?->nip ?? '..............................' }}
    </div>

    <div class="footer">Dokumen ini diterbitkan oleh sistem informasi perpustakaan PUSTAGRA.</div>
</body>
</html>
