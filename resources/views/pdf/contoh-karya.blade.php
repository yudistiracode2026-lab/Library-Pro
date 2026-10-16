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
        h3 { font-size: 12pt; margin: 18px 0 6px; }
        p { text-align: justify; }
        .note { font-size: 9pt; color: #777; text-align: center; margin-top: 40px; }
    </style>
</head>
<body>
    {{-- Sample repository work for the demo data; a real one is the author's PDF. --}}
    <div class="page center">
        <h1>{{ $title }}</h1>
        <p class="center"><b>{{ mb_strtoupper($type) }}</b></p>
        <p class="center" style="margin:50px 0;"><img src="{{ $logo }}" width="110" height="110" alt=""></p>
        <p class="center">Disusun oleh:<br><b>{{ $author }}</b>@if ($nim)<br>NIM. {{ $nim }}@endif</p>
        <p class="center" style="margin-top:50px;">{{ mb_strtoupper($program) }}<br>{{ $year }}</p>
    </div>

    <div class="page">
        <h2>ABSTRAK</h2>
        <p>{{ $abstract }}</p>
        <p><b>Kata kunci:</b> {{ $keywords }}</p>
    </div>

    @foreach ([
        'BAB I PENDAHULUAN' => ['A. Latar belakang', 'B. Rumusan masalah', 'C. Tujuan dan manfaat penelitian'],
        'BAB II TINJAUAN PUSTAKA' => ['A. Penelitian terdahulu', 'B. Kerangka teori', 'C. Kerangka pemikiran'],
        'BAB III METODE PENELITIAN' => ['A. Jenis dan pendekatan', 'B. Lokasi dan waktu', 'C. Teknik pengumpulan dan analisis data'],
        'BAB IV HASIL DAN PEMBAHASAN' => ['A. Gambaran umum lokasi', 'B. Hasil penelitian', 'C. Pembahasan'],
        'BAB V PENUTUP' => ['A. Kesimpulan', 'B. Saran'],
    ] as $chapter => $sections)
        <div class="page">
            <h2>{{ $chapter }}</h2>
            @foreach ($sections as $section)
                <h3>{{ $section }}</h3>
                <p>Bagian ini menguraikan {{ mb_strtolower(substr($section, 3)) }} dalam penelitian tentang {{ mb_strtolower($title) }}. Tanah merupakan sumber daya strategis bagi kehidupan masyarakat, sehingga pengelolaan pertanahan yang tertib menjadi prasyarat bagi kepastian hukum hak atas tanah dan pembangunan yang berkelanjutan.</p>
                <p>Uraian disusun berdasarkan data primer dan sekunder yang dikumpulkan selama masa penelitian, termasuk wawancara dengan pemangku kepentingan dan telaah dokumen di kantor pertanahan setempat.</p>
            @endforeach
        </div>
    @endforeach

    <div class="page">
        <h2>DAFTAR PUSTAKA</h2>
        <p>Harsono, B. (2008). <i>Hukum Agraria Indonesia</i>. Jakarta: Djambatan.</p>
        <p>Wiradi, G. (2017). <i>Reforma Agraria dan Keadilan Sosial</i>. Yogyakarta: STPN Press.</p>
        <p>Sutedi, A. (2020). <i>Pendaftaran Tanah di Indonesia</i>. Jakarta: Sinar Grafika.</p>
        <p class="note">Contoh berkas untuk data demonstrasi PUSTAGRA.</p>
    </div>
</body>
</html>
