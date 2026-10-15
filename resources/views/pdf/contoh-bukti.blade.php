<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $label }}</title>
    <style>
        @page { margin: 2.5cm; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11pt; color: #0F0E0A; line-height: 1.6; }
        .box { border: 2px dashed #9A958A; border-radius: 8px; padding: 28px; text-align: center; margin-top: 80px; }
        h1 { font-size: 16pt; margin: 0 0 8px; }
        .muted { color: #6B675D; font-size: 9.5pt; }
    </style>
</head>
<body>
    <div class="box">
        <p class="muted">Bukti fisik · IK {{ $number }} · {{ $indicator }}</p>
        <h1>{{ $label }}</h1>
        <p>Perpustakaan Politeknik Agraria STPN</p>
        <p class="muted">Contoh berkas untuk demonstrasi sistem. Ganti dengan dokumen asli sebelum pengajuan.</p>
    </div>
</body>
</html>
