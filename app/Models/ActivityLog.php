<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class ActivityLog extends Model
{
    public const CATEGORIES = [
        'Layanan sirkulasi', 'Layanan referensi', 'Pengolahan bahan pustaka', 'Pengembangan koleksi',
        'Digitalisasi & repositori', 'Bebas pustaka', 'Pemeliharaan koleksi', 'Administrasi', 'Lainnya',
    ];

    public const STATUSES = ['Selesai', 'Berlanjut'];

    protected $fillable = ['employee_id', 'date', 'starts_at', 'ends_at', 'category', 'description', 'output', 'status', 'created_by'];

    protected function casts(): array
    {
        return ['date' => 'date'];
    }

    public function minutes(): int
    {
        return max(0, (int) Carbon::parse($this->starts_at)->diffInMinutes(Carbon::parse($this->ends_at), false));
    }

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
