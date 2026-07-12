<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuantityDiscount extends Model
{
    use HasFactory;

    protected $fillable = [
        'min_qty',
        'discount_type',
        'discount_value',
        'product_id',
        'category_id',
    ];

    protected $casts = [
        'min_qty' => 'integer',
        'discount_value' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
