<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        @page { margin: 3cm 2.5cm; }
        body { font-family: 'DejaVu Serif', serif; font-size: 12pt; line-height: 1.7; color: #111; }
        .page { page-break-after: always; }
        .page:last-child { page-break-after: auto; }
        .center { text-align: center; }
        h1 { font-size: 15pt; margin: 0 0 30px; text-transform: uppercase; }
        h2 { font-size: 13pt; text-align: center; margin: 0 0 24px; }
        .note { font-size: 9pt; color: #777; text-align: center; margin-top: 40px; }
        .sign { width: 45%; display: inline-block; text-align: center; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="page center">
        <h1>{{ $title }}</h1>
        <p><b>SKRIPSI</b></p>
        <p>Diajukan sebagai salah satu syarat untuk memperoleh gelar<br>Sarjana Terapan Pertanahan</p>
        <p style="margin:50px 0;"><img src="{{ $logo }}" width="110" height="110" alt=""></p>
        <p>Disusun oleh:<br><b>{{ $name }}</b><br>NIM. {{ $nim }}</p>
        <p style="margin-top:50px;">PROGRAM STUDI DIPLOMA IV PERTANAHAN<br>POLITEKNIK AGRARIA STPN<br>YOGYAKARTA<br>{{ now()->year }}</p>
    </div>

    <div class="page">
        <h2>LEMBAR PENGESAHAN</h2>
        <p>Skripsi berjudul <b>{{ $title }}</b> yang disusun oleh {{ $name }} (NIM {{ $nim }}) telah diuji dan dinyatakan lulus di hadapan dewan penguji.</p>
        <div class="sign">Penguji I<br><br><br>(ttd)</div>
        <div class="sign">Penguji II<br><br><br>(ttd)</div>
        <div class="sign">Pembimbing<br><br><br>(ttd)</div>
        <div class="sign">Ketua Program Studi<br><br><br>(ttd &amp; cap)</div>
    </div>

    <div class="page">
        <h2>ABSTRAK</h2>
        <p>Penelitian ini mengkaji {{ mb_strtolower($title) }}. Pendekatan yang digunakan adalah kualitatif deskriptif melalui wawancara, observasi lapangan, dan studi dokumen pertanahan di kantor pertanahan setempat.</p>
        <p>Hasil penelitian menunjukkan bahwa pelaksanaan kegiatan telah sesuai dengan ketentuan, namun masih terdapat kendala pada aspek data fisik dan data yuridis. Penelitian ini merekomendasikan penguatan koordinasi dan pemutakhiran basis data bidang tanah.</p>
        <p><b>Kata kunci:</b> pertanahan, pendaftaran tanah, kebijakan agraria</p>
    </div>

    <div class="page">
        <h2>BAB I<br>PENDAHULUAN</h2>
        <p><b>A. Latar belakang</b></p>
        <p>Tanah merupakan sumber daya yang memiliki nilai strategis bagi kehidupan masyarakat. Pengelolaan pertanahan yang tertib menjadi prasyarat bagi kepastian hukum hak atas tanah dan pembangunan yang berkelanjutan.</p>
        <p>Bagian ini menguraikan konteks penelitian mengenai {{ mb_strtolower($title) }}, termasuk permasalahan yang ditemukan di lapangan serta alasan pemilihan lokasi penelitian.</p>
        <p class="note">Contoh berkas untuk demonstrasi sistem. Bukan dokumen skripsi sebenarnya.</p>
    </div>
</body>
</html>
