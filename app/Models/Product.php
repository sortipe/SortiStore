<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'type',
        'sku',
        'stock',
        'price',
        'offer_price',
        'sorti_coins_price',
        'category_id',
        'brand',
        'is_featured',
        'is_recommended',
        'is_new',
        'is_soon',
        'is_presale',
        'presale_launch_date',
        'presale_delivery_date',
        'description',
        'details',
        'metadata',
        'download_file',
        'download_size',
        'download_version',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'offer_price' => 'decimal:2',
        'sorti_coins_price' => 'integer',
        'is_featured' => 'boolean',
        'is_recommended' => 'boolean',
        'is_new' => 'boolean',
        'is_soon' => 'boolean',
        'is_presale' => 'boolean',
        'presale_launch_date' => 'datetime',
        'presale_delivery_date' => 'datetime',
    ];

    // Helpers
    public function getFinalPriceAttribute()
    {
        return $this->offer_price !== null ? $this->offer_price : $this->price;
    }

    public function getPrimaryImageUrlAttribute()
    {
        $primary = $this->images()->where('is_primary', true)->first();
        if ($primary) {
            return asset('storage/' . $primary->image_path);
        }
        $any = $this->images()->first();
        if ($any) {
            return asset('storage/' . $any->image_path);
        }
        return asset('images/default-product.png');
    }

    public function getMetadataArrayAttribute()
    {
        return json_decode($this->metadata, true) ?? [];
    }

    // Relations
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function modules()
    {
        return $this->hasMany(CourseModule::class)->orderBy('sort_order');
    }

    public function promotedOffers()
    {
        return $this->hasMany(PromotedOffer::class);
    }

    public function quantityDiscounts()
    {
        return $this->hasMany(QuantityDiscount::class);
    }
}
