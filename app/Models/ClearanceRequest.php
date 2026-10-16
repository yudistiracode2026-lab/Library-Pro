<?php

namespace App\Models;

use App\Support\LibrarySettings;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClearanceRequest extends Model
{
    public const PENDING = 'Menunggu';

    public const APPROVED = 'Disetujui';

    public const RETURNED = 'Dikembalikan';

    /** Parts of the thesis PDF staff tick before accepting it. */
    public const THESIS_CHECKS = [
        'cover' => 'Halaman sampul',
        'pengesahan' => 'Lembar pengesahan bertanda tangan',
        'abstrak' => 'Abstrak',
        'format' => 'Format dan sistematika penulisan',
    ];

    protected $fillable = [
        'member_id', 'thesis_title', 'thesis_advisor', 'thesis_abstract', 'submitted_at', 'status', 'note',
        'thesis_file', 'thesis_checks', 'thesis_verified_at', 'thesis_verified_by',
        'donation_title', 'donation_author', 'donation_publisher', 'donation_year', 'donation_isbn',
        'donation_copies', 'donation_status', 'donation_book_id',
        'hardcopy_scheduled_at', 'hardcopy_received_at',
        'approved_at', 'approved_by', 'letter_number',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'thesis_checks' => 'array',
            'thesis_verified_at' => 'datetime',
            'hardcopy_scheduled_at' => 'datetime',
            'hardcopy_received_at' => 'datetime',
            'approved_at' => 'datetime',
            'donation_year' => 'integer',
            'donation_copies' => 'integer',
        ];
    }

    /**
     * The four requirements, skipping any switched off in Pengaturan.
     *
     * @return array<string, array{label: string, ok: bool}>
     */
    public function requirements(): array
    {
        $settings = LibrarySettings::all();
        $all = [
            'loans' => ['setting' => 'clearance_no_loans', 'label' => 'Tidak ada pinjaman aktif', 'ok' => ! $this->member->loans()->open()->exists()],
            'thesis' => ['setting' => 'clearance_thesis', 'label' => 'Skripsi digital di-ACC', 'ok' => $this->thesis_verified_at !== null],
            'donation' => ['setting' => 'clearance_donation', 'label' => 'Buku sumbangan diterima', 'ok' => $this->donation_status === 'Diterima'],
            'hardcopy' => ['setting' => 'clearance_hardcopy', 'label' => 'Hardcopy skripsi diterima', 'ok' => $this->hardcopy_received_at !== null],
        ];

        return array_map(
            fn (array $r) => ['label' => $r['label'], 'ok' => $r['ok']],
            array_filter($all, fn (array $r) => (bool) $settings[$r['setting']]),
        );
    }

    public function isComplete(): bool
    {
        return collect($this->requirements())->every(fn (array $r) => $r['ok']);
    }

    public function thesisChecksComplete(): bool
    {
        $checks = $this->thesis_checks ?? [];

        return collect(array_keys(self::THESIS_CHECKS))->every(fn (string $k) => ! empty($checks[$k]));
    }

    /**
     * @return BelongsTo<Member, $this>
     */
    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    /**
     * @return BelongsTo<Book, $this>
     */
    public function donationBook(): BelongsTo
    {
        return $this->belongsTo(Book::class, 'donation_book_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
