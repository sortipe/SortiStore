<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PromotedOffer extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'discount_percent',
        'start_date',
        'end_date',
        'priority',
        'is_active',
    ];

    protected $casts = [
        'discount_percent' => 'decimal:2',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'priority' => 'integer',
        'is_active' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
