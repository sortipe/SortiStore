<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'guest_email',
        'guest_phone',
        'total',
        'discount',
        'shipping_cost',
        'sorti_coins_spent',
        'sorti_coins_earned',
        'coupon_id',
        'status',
        'delivery_method',
        'delivery_address',
        'delivery_district',
        'payment_method',
        'payment_status',
        'payment_receipt',
        'payment_details',
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'discount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'sorti_coins_spent' => 'integer',
        'sorti_coins_earned' => 'integer',
    ];

    // Helpers
    public function getPaymentReceiptUrlAttribute()
    {
        return $this->payment_receipt ? asset('storage/' . $this->payment_receipt) : null;
    }

    public function getPaymentDetailsArrayAttribute()
    {
        return json_decode($this->payment_details, true) ?? [];
    }

    // Relations
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }
}
