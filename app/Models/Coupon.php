<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'type',
        'value',
        'min_spend',
        'expires_at',
        'limit_uses',
        'used_uses',
        'is_active',
        'applicable_type',
        'applicable_id',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'min_spend' => 'decimal:2',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
        'limit_uses' => 'integer',
        'used_uses' => 'integer',
    ];

    public function isValidFor($user, $cartTotal, $items = [])
    {
        if (!$this->is_active) {
            return [false, 'El cupón no está activo.'];
        }

        if ($this->expires_at && Carbon::now()->gt($this->expires_at)) {
            return [false, 'El cupón ha expirado.'];
        }

        if ($this->limit_uses !== null && $this->used_uses >= $this->limit_uses) {
            return [false, 'El cupón ha superado el límite de usos.'];
        }

        if ($cartTotal < $this->min_spend) {
            return [false, "La compra mínima para este cupón es S/ {$this->min_spend}."];
        }

        // Coupon scopes
        if ($this->applicable_type === 'user') {
            if (!$user || $user->id != $this->applicable_id) {
                return [false, 'Este cupón no es válido para tu usuario.'];
            }
        } elseif ($this->applicable_type === 'category') {
            $hasCategory = false;
            foreach ($items as $item) {
                $product = Product::find($item['product_id']);
                if ($product && ($product->category_id == $this->applicable_id || 
                    ($product->category && $product->category->parent_id == $this->applicable_id))) {
                    $hasCategory = true;
                    break;
                }
            }
            if (!$hasCategory) {
                return [false, 'El cupón solo es válido para ciertos productos de la categoría correspondiente.'];
            }
        } elseif ($this->applicable_type === 'product') {
            $hasProduct = false;
            foreach ($items as $item) {
                if ($item['product_id'] == $this->applicable_id) {
                    $hasProduct = true;
                    break;
                }
            }
            if (!$hasProduct) {
                return [false, 'El cupón no aplica a ninguno de los productos en tu carrito.'];
            }
        }

        return [true, 'Cupón válido.'];
    }

    public function calculateDiscount($cartTotal)
    {
        if ($this->type === 'percentage') {
            return round(($cartTotal * $this->value) / 100, 2);
        } elseif ($this->type === 'fixed') {
            return min($this->value, $cartTotal);
        } else { // free_shipping
            return 0.00;
        }
    }
}
