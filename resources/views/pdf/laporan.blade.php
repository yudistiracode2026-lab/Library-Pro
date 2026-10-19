<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><title>{{ $title }} · {{ $period }}</title></head>
<body>
    @include('pdf.partials.kop')

    <h1>{{ strtoupper($title) }}</h1>
    <p style="text-align:center; margin-top:-10px;">Periode: {{ $period }}</p>

    <table class="kv" style="margin-bottom:12px">
        @foreach ($summary as $s)
            <tr><td>{{ $s['label'] }}</td><td>:</td><td><b>{{ $s['value'] }}</b></td></tr>
        @endforeach
    </table>

    {{-- Long lists print compact; a report may give column widths and columns that never wrap. --}}
    @php($compact = count($rows) > 40)
    @if ($compact)
        <style>
            table.data.compact { font-size: 8pt; line-height: 1.25; }
            table.data.compact th, table.data.compact td { padding: 3px 5px; }
        </style>
    @endif
    <table class="data {{ $compact ? 'compact' : '' }}">
        <thead><tr>@foreach ($columns as $i => $c)<th style="{{ isset($widths[$i]) ? 'width:'.$widths[$i].';' : '' }}">{{ $c }}</th>@endforeach</tr></thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>@foreach ($row as $i => $cell)<td style="{{ in_array($i, $nowrap ?? [], true) ? 'white-space:nowrap;' : '' }}">{{ $cell }}</td>@endforeach</tr>
            @empty
                <tr><td colspan="{{ count($columns) }}">Tidak ada data pada periode ini.</td></tr>
            @endforelse
        </tbody>
    </table>

    <p class="note">Dicetak dari sistem informasi perpustakaan PUSTAGRA pada {{ now()->translatedFormat('j F Y, H.i') }} WIB.</p>

    @include('pdf.partials.ttd')
</body>
</html>
