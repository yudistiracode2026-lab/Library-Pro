<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Asset extends Model
{
    public const CATEGORIES = ['Perabot', 'Komputer', 'Multimedia', 'Keamanan', 'Fasilitas umum'];

    public const CONDITIONS = ['Baik', 'Rusak ringan', 'Rusak berat'];

    /** Suggested functions per category; staff may type others. */
    public const FUNCTIONS = [
        'Perabot' => ['Penyimpanan koleksi', 'Membaca', 'Layanan sirkulasi', 'Kerja pengolahan', 'Display koleksi baru', 'Troli buku', 'Area baca santai', 'Papan informasi', 'Diskusi kelompok'],
        'Komputer' => ['Sirkulasi', 'OPAC', 'Referensi', 'Pengolahan', 'Repositori', 'Baca di tempat', 'Akses internet'],
        'Multimedia' => ['Proyektor', 'Layar TV', 'Sound system', 'Kamera', 'Scanner', 'Printer', 'Video conference'],
        'Keamanan' => ['CCTV', 'APAR', 'Security gate', 'Detektor asap', 'Alarm kebakaran', 'Jalur evakuasi', 'P3K'],
        'Fasilitas umum' => self::REQUIRED_FACILITIES,
    ];

    /** Public facilities the accreditation expects (IK 2.10). */
    public const REQUIRED_FACILITIES = ['Toilet', 'Mushola', 'Loker', 'Parkir', 'Pantry', 'Ruang laktasi', 'Akses disabilitas'];

    protected $fillable = ['name', 'category', 'function', 'room_id', 'quantity', 'condition', 'acquired_year', 'inventory_code'];

    protected function casts(): array
    {
        return ['quantity' => 'integer', 'acquired_year' => 'integer'];
    }

    /**
     * @return BelongsTo<Room, $this>
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
