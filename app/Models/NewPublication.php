<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Recent titles not yet in the collection, offered as procurement candidates.
 */
class NewPublication extends Model
{
    protected $fillable = ['title', 'author', 'publisher', 'year', 'ddc_class', 'price', 'reason'];

    protected function casts(): array
    {
        return ['year' => 'integer', 'price' => 'integer'];
    }

    /**
     * @return HasOne<ProcurementItem, $this>
     */
    public function procurementItem(): HasOne
    {
        return $this->hasOne(ProcurementItem::class);
    }
}
