<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        @page { margin: 2.5cm 2.2cm; }
        body { font-family: 'DejaVu Serif', serif; font-size: 11.5pt; line-height: 1.65; color: #111; }
        .page { page-break-after: always; }
        .page:last-child { page-break-after: auto; }
        h1 { font-size: 22pt; margin: 120px 0 12px; }
        h2 { font-size: 15pt; margin: 0 0 18px; }
        p { text-align: justify; }
        .muted { color: #666; }
    </style>
</head>
<body>
    {{-- Sample e-book for the demo data; a real one is uploaded under Buku & e-book. --}}
    <div class="page">
        <h1>{{ $title }}</h1>
        <p class="muted">{{ $author }} · {{ $publisher }}, {{ $year }}</p>
    </div>
    <div class="page">
        <h2>Kata pengantar</h2>
        <p>Buku ini disusun sebagai bahan bacaan bagi mahasiswa dan praktisi pertanahan. Isi setiap bab dapat dibaca berurutan maupun sebagai rujukan tersendiri.</p>
    </div>
    @foreach (range(1, $chapters) as $n)
        <div class="page">
            <h2>Bab {{ $n }}</h2>
            @foreach (range(1, 3) as $p)
                <p>Bab {{ $n }} membahas pokok bahasan {{ mb_strtolower($title) }} dari sisi konsep, regulasi, dan praktik di lapangan. Pembaca diajak memahami latar belakang, kerangka hukum, serta contoh penerapannya di Indonesia.</p>
            @endforeach
        </div>
    @endforeach
</body>
</html>
