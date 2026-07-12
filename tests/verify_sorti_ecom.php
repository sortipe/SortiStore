<?php

// Bootstrap Laravel
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\Coupon;
use App\Services\DiscountService;
use App\Services\SortiCoinsService;
use Illuminate\Support\Facades\DB;

echo "=== COMENZANDO VERIFICACIÓN DE LÓGICA DE NEGOCIO SORTI ===\n\n";

try {
    // Test DB connections and seeded items
    $category = Category::where('slug', 'tecnologia')->first();
    assert($category !== null, 'Fallo: La categoría Tecnologia no existe.');
    echo "✓ Categoría 'Tecnología' encontrada.\n";

    $user = User::where('email', 'client@sorti.com')->first();
    assert($user !== null, 'Fallo: El usuario client@sorti.com no existe.');
    assert($user->sorti_coins_balance === 500, 'Fallo: El saldo de monedas Sorti inicial del cliente no es 500.');
    echo "✓ Cliente demo encontrado con saldo de 500 monedas Sorti.\n";

    $product = Product::where('slug', 'smartphone-sorti-x1-pro')->first();
    if (!$product) {
        $product = Product::where('slug', 'smartphone-sorti-x1')->first();
    }
    assert($product !== null, 'Fallo: El producto Smartphone no existe.');
    assert($product->price == 999.00, 'Fallo: El precio del producto no coincide.');
    echo "✓ Producto 'Smartphone Sorti X1 Pro' verificado con precio de S/ 999.00.\n";

    // Test DiscountService
    $discountService = app(DiscountService::class);
    
    // Apply coupon WELCOME10 (10% off, min spend 50)
    $coupon = Coupon::where('code', 'WELCOME10')->first();
    assert($coupon !== null, 'Fallo: El cupón WELCOME10 no existe.');
    
    $cartItems = [
        [
            'product_id' => $product->id,
            'quantity' => 1,
            'price' => 899.00, // discounted price
            'variant_id' => null
        ]
    ];
    
    $totals = $discountService->calculateCartTotals($cartItems, 'WELCOME10', $user, false, 0);
    assert($totals['coupon'] !== null && $totals['coupon']['discount'] == 89.90, 'Fallo: El descuento del cupón no se calculó correctamente (debería ser 89.90).');
    echo "✓ Cupón 'WELCOME10' calculado correctamente (10% de descuento sobre S/ 899.00).\n";

    // Test Quantity discount tiers
    // leva 3+ units of product 1 -> 10% off
    $cartItemsQty = [
        [
            'product_id' => $product->id,
            'quantity' => 3,
            'price' => 999.00, // original price
            'variant_id' => null
        ]
    ];
    $totalsQty = $discountService->calculateCartTotals($cartItemsQty, null, $user, false, 0);
    assert($totalsQty['quantity_discount_savings'] == 269.70, 'Fallo: El descuento por cantidad no se aplicó (debería ser 269.70).');
    echo "✓ Descuento por cantidad calculado correctamente (10% de descuento en 3 unidades sobre precio de oferta).\n";

    // Test SortiCoinsService
    $coinsService = app(SortiCoinsService::class);
    
    // Test conversion
    $solesEquivalent = $coinsService->coinsToCash(500);
    assert($solesEquivalent == 5.00, 'Fallo: La equivalencia en soles no es correcta.');
    echo "✓ Equivalencia de 500 monedas en soles = S/ 5.00.\n";

    // Award coins to user
    $coinsService->addCoins($user->id, 100, 'credit', 'Abono de prueba automatizado');
    $user->refresh();
    assert($user->sorti_coins_balance === 600, 'Fallo: Las monedas no se abonaron correctamente.');
    echo "✓ Abono manual verificado: Saldo incrementado a 600 monedas.\n";

    // Deduct coins from user
    $coinsService->deductCoins($user->id, 200, 'debit', 'Débito de prueba automatizado');
    $user->refresh();
    assert($user->sorti_coins_balance === 400, 'Fallo: Las monedas no se debitaron correctamente.');
    echo "✓ Débito manual verificado: Saldo disminuido a 400 monedas.\n";

    echo "\n=== ¡TODAS LAS VERIFICACIONES PASARON CON ÉXITO! ===\n";

} catch (Exception $e) {
    echo "\n❌ ERROR EN LA VERIFICACIÓN: " . $e->getMessage() . "\n";
    exit(1);
}
