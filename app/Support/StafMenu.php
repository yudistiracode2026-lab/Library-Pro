<?php

namespace App\Support;

use App\Http\Controllers\Staf\Master;
use App\Models\Camera;
use App\Models\ClearanceRequest;
use App\Models\CollectionSuggestion;
use App\Models\Loan;
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
 * Pages with a "controller" get CRUD routes; "custom" pages declare their
 * own routes in routes/staf.php.
 */
class StafMenu
{
    /**
     * @var list<array{label: string, items: list<array<string, mixed>>}>
     */
    private const GROUPS = [
        ['label' => 'Utama', 'items' => [
            ['key' => 'dashboard', 'label' => 'Dashboard', 'icon' => 'layout-dashboard'],
        ]],
        ['label' => 'Master data', 'items' => [
            ['key' => 'buku', 'controller' => Master\BookController::class, 'label' => 'Buku & e-book', 'title' => 'Master buku & e-book', 'icon' => 'book-copy'],
            ['key' => 'pengarang', 'controller' => Master\AuthorController::class, 'label' => 'Pengarang', 'title' => 'Master pengarang', 'icon' => 'pen-tool'],
            ['key' => 'penerbit', 'controller' => Master\PublisherController::class, 'label' => 'Penerbit', 'title' => 'Master penerbit', 'icon' => 'building-2'],
            ['key' => 'penyedia', 'controller' => Master\SupplierController::class, 'label' => 'Penyedia buku', 'title' => 'Master penyedia buku', 'icon' => 'truck'],
            ['key' => 'pemustaka', 'controller' => Master\MemberController::class, 'label' => 'Pemustaka', 'title' => 'Master pemustaka', 'icon' => 'id-card'],
            ['key' => 'pustakawan', 'controller' => Master\EmployeeController::class, 'label' => 'Pustakawan', 'title' => 'Master pustakawan', 'icon' => 'user-cog', 'admin_only' => true],
            ['key' => 'tendik', 'controller' => Master\EmployeeController::class, 'label' => 'Tendik', 'title' => 'Master tendik', 'icon' => 'briefcase', 'admin_only' => true],
            ['key' => 'aset', 'label' => 'Manajemen aset', 'icon' => 'boxes', 'children' => [
                ['key' => 'aset.ruang', 'custom' => true, 'label' => 'Ruang & denah', 'title' => 'Manajemen aset · ruang & denah', 'icon' => 'layout-grid'],
                ['key' => 'aset.inventaris', 'custom' => true, 'label' => 'Inventaris & lisensi', 'title' => 'Manajemen aset · inventaris & lisensi', 'icon' => 'package'],
            ]],
        ]],
        ['label' => 'Layanan', 'items' => [
            ['key' => 'kunjungan', 'custom' => true, 'label' => 'Kunjungan & presensi', 'icon' => 'qr-code'],
            ['key' => 'sirkulasi', 'custom' => true, 'label' => 'Sirkulasi', 'icon' => 'repeat'],
            ['key' => 'pencarian', 'custom' => true, 'label' => 'Pencarian & denah', 'title' => 'Pencarian buku & denah rak', 'icon' => 'map'],
            ['key' => 'cctv', 'custom' => true, 'label' => 'Pantau CCTV', 'title' => 'Pantau CCTV · sirkulasi & referensi', 'icon' => 'cctv'],
        ]],
        ['label' => 'Koleksi', 'items' => [
            ['key' => 'opname', 'custom' => true, 'label' => 'Stock opname', 'icon' => 'clipboard-check'],
            ['key' => 'pengadaan', 'custom' => true, 'label' => 'Pengadaan buku', 'icon' => 'shopping-cart'],
        ]],
        ['label' => 'Kepegawaian', 'items' => [
            ['key' => 'kegiatan', 'custom' => true, 'label' => 'Kegiatan harian', 'icon' => 'notebook-pen'],
            ['key' => 'lembur', 'custom' => true, 'label' => 'Lembur petugas', 'icon' => 'clock-4'],
        ]],
        ['label' => 'Akademik', 'items' => [
            ['key' => 'bebas-pustaka', 'custom' => true, 'label' => 'Bebas pustaka', 'title' => 'Verifikasi bebas pustaka', 'icon' => 'file-check-2'],
        ]],
        ['label' => 'Akreditasi', 'items' => [
            ['key' => 'akreditasi', 'label' => 'Akreditasi', 'icon' => 'award', 'children' => [
                ['key' => 'akreditasi.dasbor', 'custom' => true, 'label' => 'Dasbor skor', 'title' => 'Akreditasi · dasbor skor', 'icon' => 'gauge'],
                ['key' => 'akreditasi.indikator', 'custom' => true, 'label' => 'Indikator (56 IK)', 'title' => 'Akreditasi · indikator kunci', 'icon' => 'list-checks'],
                ['key' => 'akreditasi.gap', 'custom' => true, 'label' => 'Analisis gap', 'title' => 'Akreditasi · analisis gap', 'icon' => 'trending-up'],
                ['key' => 'akreditasi.bukti', 'custom' => true, 'label' => 'Bank bukti', 'title' => 'Akreditasi · bank bukti fisik', 'icon' => 'folder-check'],
                ['key' => 'akreditasi.berkas', 'custom' => true, 'label' => 'Berkas pengajuan', 'title' => 'Akreditasi · berkas pengajuan SiPAPI', 'icon' => 'file-output'],
            ]],
        ]],
        ['label' => 'Sistem', 'items' => [
            ['key' => 'cms', 'custom' => true, 'label' => 'CMS website', 'icon' => 'layout-template', 'admin_only' => true],
            ['key' => 'laporan', 'custom' => true, 'label' => 'Laporan', 'icon' => 'clipboard-list'],
            ['key' => 'pengaturan', 'custom' => true, 'label' => 'Pengaturan', 'icon' => 'settings', 'admin_only' => true],
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
                        'custom' => false,
                        'title' => $page['label'],
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
     * Counters shown next to menu items, as in the prototype: late loans,
     * offline cameras, suggestions awaiting review, and pending clearances.
     *
     * @return array<string, int|null>
     */
    private static function badges(): array
    {
        return [
            'sirkulasi' => Loan::overdue()->count() ?: null,
            'cctv' => Camera::where('online', false)->count() ?: null,
            'pengadaan' => CollectionSuggestion::where('status', CollectionSuggestion::PROPOSED)->count() ?: null,
            'bebas-pustaka' => ClearanceRequest::where('status', ClearanceRequest::PENDING)->count() ?: null,
        ];
    }

    /**
     * The navigation tree visible to the given user, with resolved URLs.
     *
     * @return list<array{label: string, items: list<array<string, mixed>>}>
     */
    public static function for(User $user): array
    {
        $visible = fn (array $item) => $user->isAdmin() || ! ($item['admin_only'] ?? false);
        $badges = self::badges();

        $present = fn (array $item) => [
            'key' => $item['key'],
            'label' => $item['label'],
            'icon' => $item['icon'],
            'badge' => $badges[$item['key']] ?? null,
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
