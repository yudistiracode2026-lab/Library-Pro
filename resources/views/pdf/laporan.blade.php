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

    <table class="data">
        <thead><tr>@foreach ($columns as $c)<th>{{ $c }}</th>@endforeach</tr></thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>@foreach ($row as $cell)<td>{{ $cell }}</td>@endforeach</tr>
            @empty
                <tr><td colspan="{{ count($columns) }}">Tidak ada data pada periode ini.</td></tr>
            @endforelse
        </tbody>
    </table>

    <p class="note">Dicetak dari sistem informasi perpustakaan PUSTAGRA pada {{ now()->translatedFormat('j F Y, H.i') }} WIB.</p>

    @include('pdf.partials.ttd')
</body>
</html>
