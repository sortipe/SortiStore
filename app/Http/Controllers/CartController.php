<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\DiscountService;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /**
     * View cart page
     */
    public function index()
    {
        $cart = session('cart', []);
        
        $discountService = new DiscountService();
        $totals = $discountService->calculateCartTotals($cart, null, auth()->user(), false, null, 'pickup');

        return view('store.cart', [
            'cartItems' => $totals['items'],
            'totals' => $totals
        ]);
    }

    /**
     * Add product to cart (AJAX)
     */
    public function add(Request $request)
    {
        $request->validate([
            'product_id' => 'required|integer',
            'quantity' => 'required|integer|min:1',
            'variant_id' => 'nullable|integer'
        ]);

        $productId = $request->product_id;
        $qty = (int)$request->quantity;
        $variantId = $request->variant_id;

        $product = Product::find($productId);
        if (!$product || $product->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Producto no disponible.'], 404);
        }

        // Verify stock
        if (!$product->is_presale && !$product->is_soon && $product->type === 'physical') {
            if ($product->stock < $qty) {
                return response()->json(['success' => false, 'message' => "Stock insuficiente. Stock disponible: {$product->stock}."], 400);
            }
        }

        // Handle variant if selected
        $variantName = null;
        if ($variantId) {
            $variant = ProductVariant::where('product_id', $productId)->find($variantId);
            if ($variant) {
                if ($variant->stock < $qty && $product->type === 'physical') {
                    return response()->json(['success' => false, 'message' => "Stock de variante insuficiente."], 400);
                }
                $variantName = "{$variant->name}: {$variant->value}";
            }
        }

        // Add to session cart
        $cart = session('cart', []);
        $cartKey = $productId . ($variantId ? '_' . $variantId : '');

        if (isset($cart[$cartKey])) {
            $cart[$cartKey]['quantity'] += $qty;
        } else {
            $cart[$cartKey] = [
                'product_id' => $productId,
                'variant_id' => $variantId,
                'variant_name' => $variantName,
                'quantity' => $qty,
            ];
        }

        session(['cart' => $cart]);

        return response()->json([
            'success' => true,
            'cart_count' => count($cart),
            'message' => 'Producto agregado al carrito.'
        ]);
    }

    /**
     * Update cart item quantity
     */
    public function update(Request $request)
    {
        $request->validate([
            'key' => 'required|string',
            'quantity' => 'required|integer|min:1'
        ]);

        $cart = session('cart', []);
        $key = $request->key;
        $qty = (int)$request->quantity;

        if (isset($cart[$key])) {
            // Verify stock
            $productId = $cart[$key]['product_id'];
            $product = Product::find($productId);
            if ($product && $product->type === 'physical' && !$product->is_presale) {
                if ($product->stock < $qty) {
                    return redirect()->back()->with('error', "Stock insuficiente para {$product->name}.");
                }
            }
            $cart[$key]['quantity'] = $qty;
            session(['cart' => $cart]);
        }

        return redirect()->route('cart.index')->with('success', 'Carrito actualizado.');
    }

    /**
     * Remove item from cart
     */
    public function remove($key)
    {
        $cart = session('cart', []);
        if (isset($cart[$key])) {
            unset($cart[$key]);
            session(['cart' => $cart]);
        }

        return redirect()->route('cart.index')->with('success', 'Producto removido del carrito.');
    }
}
