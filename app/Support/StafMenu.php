<?php

namespace App\Support;

use App\Http\Controllers\Staf\Master;
use App\Models\User;

/**
 * Single source of truth for the staff portal navigation.
 *
 * Mirrors the sidebar of design/Portal Staf.dc.html. routes/staf.php builds
 * one route per page from this list, and the filtered tree is shared with
 * the frontend, so a page hidden from a role is also blocked on the server.
 *
 * Page keys double as route names under the "staf." prefix and their path
 * under /staf (dots become slashes): "aset.ruang" => /staf/aset/ruang.
 * Pages with a "controller" are built; the rest show a placeholder.
 */
class StafMenu
{
    /**
     * @var list<array{label: string, items: list<array<string, mixed>>}>
     */
    private const GROUPS = [
        ['label' => 'Utama', 'items' => [
            ['key' => 'dashboard', 'label' => 'Dashboard', 'icon' => 'layout-dashboard', 'stage' => 1],
        ]],
        ['label' => 'Master data', 'items' => [
            ['key' => 'buku', 'controller' => Master\BookController::class, 'label' => 'Buku & e-book', 'title' => 'Master buku & e-book', 'icon' => 'book-copy', 'stage' => 2,
                'description' => 'Katalog buku cetak dan e-book: bibliografi, eksemplar, klasifikasi DDC, dan lokasi rak.'],
            ['key' => 'pengarang', 'controller' => Master\AuthorController::class, 'label' => 'Pengarang', 'title' => 'Master pengarang', 'icon' => 'pen-tool', 'stage' => 2,
                'description' => 'Daftar pengarang untuk entri katalog dan pencarian.'],
            ['key' => 'penerbit', 'controller' => Master\PublisherController::class, 'label' => 'Penerbit', 'title' => 'Master penerbit', 'icon' => 'building-2', 'stage' => 2,
                'description' => 'Daftar penerbit beserta kota terbit.'],
            ['key' => 'penyedia', 'controller' => Master\SupplierController::class, 'label' => 'Penyedia buku', 'title' => 'Master penyedia buku', 'icon' => 'truck', 'stage' => 2,
                'description' => 'Toko dan distributor yang dipakai untuk pengadaan.'],
            ['key' => 'aset', 'label' => 'Manajemen aset', 'icon' => 'boxes', 'children' => [
                ['key' => 'aset.ruang', 'label' => 'Ruang & denah', 'title' => 'Manajemen aset · ruang & denah', 'icon' => 'layout-grid', 'stage' => 4,
                    'description' => 'Denah lantai, ruang, dan rak beserta kapasitasnya.'],
                ['key' => 'aset.inventaris', 'label' => 'Inventaris & lisensi', 'title' => 'Manajemen aset · inventaris & lisensi', 'icon' => 'package', 'stage' => 4,
                    'description' => 'Inventaris perangkat, perabot, dan lisensi perangkat lunak.'],
            ]],
            ['key' => 'pemustaka', 'controller' => Master\MemberController::class, 'label' => 'Pemustaka', 'title' => 'Master pemustaka', 'icon' => 'id-card', 'stage' => 2,
                'description' => 'Data anggota perpustakaan: mahasiswa, dosen, dan tamu.'],
            ['key' => 'pustakawan', 'controller' => Master\EmployeeController::class, 'label' => 'Pustakawan', 'title' => 'Master pustakawan', 'icon' => 'user-cog', 'stage' => 2, 'admin_only' => true,
                'description' => 'Akun dan jabatan fungsional pustakawan.'],
            ['key' => 'tendik', 'controller' => Master\EmployeeController::class, 'label' => 'Tendik', 'title' => 'Master tendik', 'icon' => 'briefcase', 'stage' => 2, 'admin_only' => true,
                'description' => 'Tenaga kependidikan yang bertugas di perpustakaan.'],
        ]],
        ['label' => 'Layanan', 'items' => [
            ['key' => 'kunjungan', 'label' => 'Kunjungan & presensi', 'icon' => 'qr-code', 'stage' => 3,
                'description' => 'Presensi masuk dan keluar dengan QR, buku tamu, dan log kunjungan.'],
            ['key' => 'sirkulasi', 'label' => 'Sirkulasi', 'icon' => 'repeat', 'stage' => 3,
                'description' => 'Peminjaman, pengembalian, perpanjangan, dan denda.'],
            ['key' => 'pencarian', 'label' => 'Pencarian & denah', 'title' => 'Pencarian buku & denah rak', 'icon' => 'map', 'stage' => 3,
                'description' => 'Cari koleksi dan tunjukkan posisinya di denah rak.'],
            ['key' => 'cctv', 'label' => 'Pantau CCTV', 'title' => 'Pantau CCTV · sirkulasi & referensi', 'icon' => 'cctv', 'stage' => 4,
                'description' => 'Pantauan kamera area sirkulasi dan referensi.'],
        ]],
        ['label' => 'Koleksi', 'items' => [
            ['key' => 'opname', 'label' => 'Stock opname', 'icon' => 'clipboard-check', 'stage' => 4,
                'description' => 'Pencocokan koleksi di rak dengan data katalog.'],
            ['key' => 'pengadaan', 'label' => 'Pengadaan buku', 'icon' => 'shopping-cart', 'stage' => 4,
                'description' => 'Usulan pemustaka, terbitan baru, dan daftar pengadaan sesuai pagu.'],
        ]],
        ['label' => 'Kepegawaian', 'items' => [
            ['key' => 'kegiatan', 'label' => 'Kegiatan harian', 'icon' => 'notebook-pen', 'stage' => 4,
                'description' => 'Catatan harian dan rekap bulanan kegiatan petugas.'],
            ['key' => 'lembur', 'label' => 'Lembur petugas', 'icon' => 'clock-4', 'stage' => 4,
                'description' => 'Jadwal, presensi, dan laporan lembur.'],
        ]],
        ['label' => 'Akademik', 'items' => [
            ['key' => 'bebas-pustaka', 'label' => 'Bebas pustaka', 'title' => 'Verifikasi bebas pustaka', 'icon' => 'file-check-2', 'stage' => 3,
                'description' => 'Verifikasi pengajuan bebas pustaka, sumbangan buku, dan hardcopy skripsi.'],
        ]],
        ['label' => 'Akreditasi', 'items' => [
            ['key' => 'akreditasi', 'label' => 'Akreditasi', 'icon' => 'award', 'children' => [
                ['key' => 'akreditasi.dasbor', 'label' => 'Dasbor skor', 'title' => 'Akreditasi · dasbor skor', 'icon' => 'gauge', 'stage' => 5,
                    'description' => 'Ringkasan skor akreditasi per komponen.'],
                ['key' => 'akreditasi.indikator', 'label' => 'Indikator (56 IK)', 'title' => 'Akreditasi · indikator kunci', 'icon' => 'list-checks', 'stage' => 5,
                    'description' => 'Penilaian mandiri untuk 56 indikator kunci.'],
                ['key' => 'akreditasi.gap', 'label' => 'Analisis gap', 'title' => 'Akreditasi · analisis gap', 'icon' => 'trending-up', 'stage' => 5,
                    'description' => 'Selisih skor saat ini dengan target dan rencana perbaikannya.'],
                ['key' => 'akreditasi.bukti', 'label' => 'Bank bukti', 'title' => 'Akreditasi · bank bukti fisik', 'icon' => 'folder-check', 'stage' => 5,
                    'description' => 'Dokumen bukti fisik untuk setiap indikator.'],
                ['key' => 'akreditasi.berkas', 'label' => 'Berkas pengajuan', 'title' => 'Akreditasi · berkas pengajuan SiPAPI', 'icon' => 'file-output', 'stage' => 5,
                    'description' => 'Penyusunan berkas pengajuan akreditasi ke SiPAPI.'],
            ]],
        ]],
        ['label' => 'Sistem', 'items' => [
            ['key' => 'cms', 'label' => 'CMS website', 'icon' => 'layout-template', 'stage' => 5, 'admin_only' => true,
                'description' => 'Konten website perpustakaan: berita, jadwal, dan fasilitas.'],
            ['key' => 'laporan', 'label' => 'Laporan', 'icon' => 'clipboard-list', 'stage' => 5,
                'description' => 'Laporan statistik koleksi, layanan, dan kunjungan.'],
            ['key' => 'pengaturan', 'label' => 'Pengaturan', 'icon' => 'settings', 'stage' => 3, 'admin_only' => true,
                'description' => 'Aturan peminjaman, denda, jam layanan, dan konfigurasi sistem.'],
        ]],
    ];

    /**
     * Every navigable page (parents with children are not pages).
     *
     * @return list<array<string, mixed>>
     */
    public static function pages(): array
    {
        $pages = [];

        foreach (self::GROUPS as $group) {
            foreach ($group['items'] as $item) {
                foreach ($item['children'] ?? [$item] as $page) {
                    $pages[] = [
                        'admin_only' => false,
                        'controller' => null,
                        'title' => $page['label'],
                        'description' => null,
                        ...$page,
                        'group' => $group['label'],
                        'path' => str_replace('.', '/', $page['key']),
                    ];
                }
            }
        }

        return $pages;
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function find(string $key): ?array
    {
        foreach (self::pages() as $page) {
            if ($page['key'] === $key) {
                return $page;
            }
        }

        return null;
    }

    /**
     * The navigation tree visible to the given user, with resolved URLs.
     *
     * @return list<array{label: string, items: list<array<string, mixed>>}>
     */
    public static function for(User $user): array
    {
        $visible = fn (array $item) => $user->isAdmin() || ! ($item['admin_only'] ?? false);

        $present = fn (array $item) => [
            'key' => $item['key'],
            'label' => $item['label'],
            'icon' => $item['icon'],
            'href' => isset($item['children']) ? null : route('staf.'.$item['key'], absolute: false),
            'children' => isset($item['children'])
                ? array_values(array_map(fn ($child) => [
                    'key' => $child['key'],
                    'label' => $child['label'],
                    'icon' => $child['icon'],
                    'href' => route('staf.'.$child['key'], absolute: false),
                ], array_filter($item['children'], $visible)))
                : null,
        ];

        $groups = [];

        foreach (self::GROUPS as $group) {
            $items = array_values(array_map($present, array_filter($group['items'], $visible)));

            if ($items !== []) {
                $groups[] = ['label' => $group['label'], 'items' => $items];
            }
        }

        return $groups;
    }
}
