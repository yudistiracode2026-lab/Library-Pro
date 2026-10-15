<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Surat Perintah Lembur · {{ $month->translatedFormat('F Y') }}</title>
    <style>
        @page { margin: 2cm 2.2cm; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10pt; color: #0F0E0A; line-height: 1.5; }
        .kop { width: 100%; border-bottom: 3px double #0F0E0A; padding-bottom: 8px; margin-bottom: 18px; }
        .kop td { vertical-align: middle; }
        .kop .text { text-align: center; }
        .kop .inst { font-size: 12pt; font-weight: bold; }
        .kop .unit { font-size: 14pt; font-weight: bold; }
        .kop .addr { font-size: 8.5pt; color: #4B473F; }
        h1 { text-align: center; font-size: 12pt; text-decoration: underline; margin: 0 0 14px; }
        table.list { width: 100%; border-collapse: collapse; margin: 12px 0; }
        table.list th, table.list td { border: 1px solid #9A958A; padding: 5px 6px; vertical-align: top; }
        table.list th { background: #F2F1ED; font-weight: bold; text-align: left; }
        .ttd { width: 46%; margin-left: 54%; margin-top: 26px; }
        .ttd .space { height: 64px; }
    </style>
</head>
<body>
    <table class="kop">
        <tr>
            <td style="width:64px"><img src="{{ $logo }}" width="62" height="62" alt=""></td>
            <td class="text">
                <div class="inst">POLITEKNIK AGRARIA STPN</div>
                <div class="unit">PERPUSTAKAAN</div>
                <div class="addr">Jl. Tata Bumi No. 5, Banyuraden, Gamping, Sleman, D.I. Yogyakarta 55293</div>
            </td>
            <td style="width:64px"></td>
        </tr>
    </table>

    <h1>SURAT PERINTAH LEMBUR</h1>
    <p>Kepala Perpustakaan Politeknik Agraria STPN memerintahkan petugas berikut untuk melaksanakan kerja lembur pada bulan {{ $month->translatedFormat('F Y') }}:</p>

    <table class="list">
        <thead>
            <tr><th style="width:24px">No</th><th>Hari, tanggal</th><th>Waktu</th><th>Kegiatan</th><th>Petugas</th></tr>
        </thead>
        <tbody>
            @forelse ($sessions as $i => $session)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $session->date->translatedFormat('l, j M Y') }}</td>
                    <td>{{ substr($session->starts_at, 0, 5) }}–{{ substr($session->ends_at, 0, 5) }}</td>
                    <td>{{ $session->activity }}</td>
                    <td>{!! $session->assignments->map(fn ($a) => e($a->employee->name))->join('<br>') !!}</td>
                </tr>
            @empty
                <tr><td colspan="5">Tidak ada jadwal lembur.</td></tr>
            @endforelse
        </tbody>
    </table>

    <p>Demikian surat perintah ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.</p>

    <div class="ttd">
        Yogyakarta, {{ now()->translatedFormat('j F Y') }}<br>
        Kepala Perpustakaan,
        <div class="space"></div>
        <b>{{ $head?->name ?? '..............................' }}</b><br>
        NIP. {{ $head?->nip ?? '..............................' }}
    </div>
</body>
</html>
