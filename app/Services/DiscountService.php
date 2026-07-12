<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Coupon;
use App\Models\QuantityDiscount;
use App\Models\ShippingDistrict;
use App\Models\User;

class DiscountService
{
    /**
     * Apply volume / quantity discounts to cart items
     * Returns array with updated items and total quantity discount savings
     */
    public function applyQuantityDiscounts(array $items): array
    {
        $processedItems = [];
        $totalSavings = 0.00;

        foreach ($items as $item) {
            $productId = $item['product_id'];
            $qty = $item['quantity'];
            $product = Product::find($productId);

            if (!$product) {
                continue;
            }

            $originalPrice = $product->final_price;
            $itemSubtotal = $originalPrice * $qty;
            $discountAmount = 0.00;

            // Find applicable quantity discount rule (prioritize product-specific, then category-specific)
            $rule = QuantityDiscount::where('product_id', $productId)
                ->where('min_qty', '<=', $qty)
                ->orderBy('min_qty', 'desc')
                ->first();

            if (!$rule && $product->category_id) {
                $rule = QuantityDiscount::where('category_id', $product->category_id)
                    ->where('min_qty', '<=', $qty)
                    ->orderBy('min_qty', 'desc')
                    ->first();
            }

            if ($rule) {
                if ($rule->discount_type === 'percentage') {
                    // Percentage discount on this item
                    $discountAmount = round(($itemSubtotal * $rule->discount_value) / 100, 2);
                } elseif ($rule->discount_type === 'fixed') {
                    // Fixed discount per unit or on subtotal
                    $discountAmount = min($rule->discount_value * $qty, $itemSubtotal);
                } elseif ($rule->discount_type === 'free_items') {
                    // "Buy X pay Y" (e.g. Buy 10 pay 9, min_qty = 10, discount_value = 1 free item price)
                    // Calculate how many times the group of min_qty fits
                    $groups = floor($qty / $rule->min_qty);
                    $freeQty = $groups * $rule->discount_value;
                    $discountAmount = min($freeQty * $originalPrice, $itemSubtotal);
                }
            }

            $finalItemTotal = $itemSubtotal - $discountAmount;
            $totalSavings += $discountAmount;

            $processedItems[] = [
                'product_id' => $productId,
                'name' => $product->name,
                'slug' => $product->slug,
                'image' => $product->primary_image_url,
                'type' => $product->type,
                'quantity' => $qty,
                'original_price' => $originalPrice,
                'discounted_price' => round($finalItemTotal / $qty, 2),
                'subtotal' => $itemSubtotal,
                'discount' => $discountAmount,
                'total' => $finalItemTotal,
                'variant_id' => $item['variant_id'] ?? null,
                'variant_name' => $item['variant_name'] ?? null,
            ];
        }

        return [
            'items' => $processedItems,
            'quantity_discount_savings' => $totalSavings
        ];
    }

    /**
     * Calculate cart totals combining all discounts, coupons, shipping and Sorti coins
     */
    public function calculateCartTotals(
        array $items,
        ?string $couponCode = null,
        ?User $user = null,
        bool $useSortiCoins = false,
        ?int $shippingDistrictId = null,
        string $deliveryMethod = 'delivery'
    ): array {
        // 1. Quantity discounts
        $qResult = $this->applyQuantityDiscounts($items);
        $processedItems = $qResult['items'];
        $qtySavings = $qResult['quantity_discount_savings'];

        // Subtotal after quantity discounts
        $subtotal = 0.00;
        foreach ($processedItems as $item) {
            $subtotal += $item['total'];
        }

        // 2. Coupon discount
        $couponDiscount = 0.00;
        $coupon = null;
        $couponError = null;

        if ($couponCode) {
            $coupon = Coupon::where('code', $couponCode)->first();
            if ($coupon) {
                list($isValid, $msg) = $coupon->isValidFor($user, $subtotal, $processedItems);
                if ($isValid) {
                    $couponDiscount = $coupon->calculateDiscount($subtotal);
                } else {
                    $couponError = $msg;
                }
            } else {
                $couponError = 'El cupón ingresado no existe.';
            }
        }

        // Subtotal after coupon
        $subtotalAfterCoupon = max(0.00, $subtotal - $couponDiscount);

        // 3. Shipping cost
        $shippingCost = 0.00;
        $districtName = null;
        if ($deliveryMethod === 'delivery') {
            if ($coupon && $coupon->type === 'free_shipping') {
                $shippingCost = 0.00;
            } elseif ($shippingDistrictId) {
                $district = ShippingDistrict::find($shippingDistrictId);
                if ($district && $district->is_active) {
                    $shippingCost = $district->cost;
                    $districtName = $district->name;
                }
            }
        }

        // 4. Sorti Coins calculation
        $sortiCoinsSpent = 0;
        $sortiCoinsDiscount = 0.00;
        $sortiCoinsEarned = 0;

        $coinsService = new SortiCoinsService();

        // Coins earned: calculated based on subtotal cash paid (subtotal after coupon)
        $sortiCoinsEarned = $coinsService->calculateCoinsEarned($subtotalAfterCoupon);

        if ($useSortiCoins && $user && $user->sorti_coins_balance > 0) {
            $userCoins = $user->sorti_coins_balance;
            // Cash value of all user coins
            $maxCoinsCash = $coinsService->coinsToCash($userCoins);

            if ($maxCoinsCash >= $subtotalAfterCoupon) {
                // Coins can cover the entire subtotal
                $sortiCoinsDiscount = $subtotalAfterCoupon;
                $sortiCoinsSpent = $coinsService->cashToCoins($subtotalAfterCoupon);
            } else {
                // Coins cover part of the subtotal
                $sortiCoinsDiscount = $maxCoinsCash;
                $sortiCoinsSpent = $userCoins;
            }
        }

        // 5. Grand Total
        $total = max(0.00, $subtotalAfterCoupon - $sortiCoinsDiscount + $shippingCost);

        // Total savings = quantity savings + coupon discount + sorti coins discount + free shipping (if applicable)
        $totalSavings = $qtySavings + $couponDiscount + $sortiCoinsDiscount;

        return [
            'items' => $processedItems,
            'subtotal' => round($subtotal, 2),
            'quantity_discount_savings' => round($qtySavings, 2),
            'coupon' => $coupon ? [
                'code' => $coupon->code,
                'discount' => round($couponDiscount, 2)
            ] : null,
            'coupon_error' => $couponError,
            'shipping_cost' => round($shippingCost, 2),
            'shipping_district_name' => $districtName,
            'sorti_coins_spent' => $sortiCoinsSpent,
            'sorti_coins_discount' => round($sortiCoinsDiscount, 2),
            'sorti_coins_earned' => $sortiCoinsEarned,
            'total' => round($total, 2),
            'total_savings' => round($totalSavings, 2)
        ];
    }
}
