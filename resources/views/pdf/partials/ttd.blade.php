<div class="ttd">
    Yogyakarta, {{ now()->translatedFormat('j F Y') }}<br>
    Kepala Perpustakaan,
    <div class="space"></div>
    <b>{{ $head?->name ?? '..............................' }}</b><br>
    NIP. {{ $head?->nip ?? '..............................' }}
</div>
