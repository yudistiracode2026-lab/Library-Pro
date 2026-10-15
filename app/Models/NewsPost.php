<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class NewsPost extends Model
{
    public const TAGS = ['Pengumuman', 'Koleksi baru', 'Kegiatan'];

    protected $fillable = ['title', 'tag', 'excerpt', 'published_at', 'author_id'];

    protected function casts(): array
    {
        return ['published_at' => 'datetime'];
    }

    /**
     * @param  Builder<NewsPost>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->whereNotNull('published_at')->where('published_at', '<=', now());
    }
}
