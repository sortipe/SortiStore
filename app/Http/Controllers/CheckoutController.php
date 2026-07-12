<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ShippingDistrict;
use App\Models\UserCourse;
use App\Services\DiscountService;
use App\Services\SortiCoinsService;
use App\Services\Payment\PaymentGatewayManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckoutController extends Controller
{
    /**
     * Show Checkout Page
     */
    public function index()
    {
        $cart = session('cart', []);
        if (empty($cart)) {
            return redirect()->route('cart.index')->with('error', 'El carrito está vacío.');
        }

        $discountService = new DiscountService();
        $totals = $discountService->calculateCartTotals($cart, null, auth()->user(), false, null, 'delivery');

        $districts = ShippingDistrict::where('is_active', true)->get();
        
        // Load initial payment gateway options (Yape & Transferencia)
        $yapeInstructions = PaymentGatewayManager::make('yape')->getPaymentInstructions();
        $bankInstructions = PaymentGatewayManager::make('bank_transfer')->getPaymentInstructions();

        return view('store.checkout', [
            'cartItems' => $totals['items'],
            'totals' => $totals,
            'districts' => $districts,
            'yapeInstructions' => $yapeInstructions,
            'bankInstructions' => $bankInstructions
        ]);
    }

    /**
     * Recalculate Checkout Totals on user configuration changes (AJAX)
     */
    public function recalculate(Request $request)
    {
        $cart = session('cart', []);
        $deliveryMethod = $request->get('delivery_method', 'delivery');
        $shippingDistrictId = $request->get('shipping_district_id');
        $couponCode = $request->get('coupon_code');
        $useSortiCoins = (bool)$request->get('use_sorti_coins', false);

        $discountService = new DiscountService();
        $totals = $discountService->calculateCartTotals(
            $cart,
            $couponCode,
            auth()->user(),
            $useSortiCoins,
            $shippingDistrictId,
            $deliveryMethod
        );

        return response()->json([
            'success' => true,
            'totals' => $totals
        ]);
    }

    /**
     * Place the order
     */
    public function place(Request $request)
    {
        $cart = session('cart', []);
        if (empty($cart)) {
            return redirect()->route('cart.index')->with('error', 'El carrito está vacío.');
        }

        $request->validate([
            'email' => auth()->check() ? 'nullable|email' : 'required|email',
            'phone' => 'required|string',
            'delivery_method' => 'required|string|in:delivery,pickup',
            'payment_method' => 'required|string|in:yape,bank_transfer',
            'payment_receipt_file' => 'required|image|max:4096', // receipt screenshot
            
            // Required if delivery
            'address' => 'required_if:delivery_method,delivery|nullable|string',
            'district_id' => 'required_if:delivery_method,delivery|nullable|integer',
        ]);

        return DB::transaction(function () use ($request, $cart) {
            $user = auth()->user();
            $deliveryMethod = $request->delivery_method;
            $districtId = $request->district_id;
            $couponCode = $request->coupon_code;
            $useCoins = (bool)$request->use_sorti_coins;

            // Recalculate totals to prevent client tampered prices
            $discountService = new DiscountService();
            $totals = $discountService->calculateCartTotals(
                $cart,
                $couponCode,
                $user,
                $useCoins,
                $districtId,
                $deliveryMethod
            );

            // Handle payment receipt upload
            $receiptPath = null;
            if ($request->hasFile('payment_receipt_file')) {
                $receiptPath = $request->file('payment_receipt_file')->store('receipts', 'public');
            }

            // Create Order
            $order = Order::create([
                'user_id' => $user ? $user->id : null,
                'guest_email' => $user ? null : $request->email,
                'guest_phone' => $request->phone,
                'total' => $totals['total'],
                'discount' => $totals['coupon'] ? $totals['coupon']['discount'] : 0.00,
                'shipping_cost' => $totals['shipping_cost'],
                'sorti_coins_spent' => $totals['sorti_coins_spent'],
                'sorti_coins_earned' => $totals['sorti_coins_earned'],
                'coupon_id' => null, // We could resolve the ID if needed
                'status' => 'pending',
                'delivery_method' => $deliveryMethod,
                'delivery_address' => $deliveryMethod === 'delivery' ? $request->address : 'Recojo en local',
                'delivery_district' => $deliveryMethod === 'delivery' ? $totals['shipping_district_name'] : null,
                'payment_method' => $request->payment_method,
                'payment_status' => 'pending',
                'payment_receipt' => $receiptPath,
                'payment_details' => json_encode([
                    'phone' => $request->phone,
                    'notes' => $request->notes ?? ''
                ])
            ]);

            // Save items & decrement stock
            foreach ($totals['items'] as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['discounted_price'],
                    'total' => $item['total'],
                ]);

                // Decrement stock for physical items
                $product = Product::find($item['product_id']);
                if ($product && $product->type === 'physical' && !$product->is_presale) {
                    $product->stock = max(0, $product->stock - $item['quantity']);
                    $product->save();
                }
            }

            // If user spent Sorti coins, deduct them
            if ($totals['sorti_coins_spent'] > 0 && $user) {
                $coinsService = new SortiCoinsService();
                $coinsService->deductCoins($user->id, $totals['sorti_coins_spent'], 'spent', "Canje de monedas en pedido #{$order->id}");
            }

            // If user is logged in, attach course enrollments if any item is a Course
            // Note: Access to LMS courses is granted in "pending" status but we can restrict playing lectures until the payment is confirmed.
            // Let's create the UserCourse progress tracking right away!
            if ($user) {
                foreach ($totals['items'] as $item) {
                    if ($item['type'] === 'course') {
                        UserCourse::firstOrCreate([
                            'user_id' => $user->id,
                            'product_id' => $item['product_id']
                        ], [
                            'completed_lectures' => json_encode([]),
                            'progress_percent' => 0
                        ]);
                    }
                }
            }

            // Clear cart session
            session()->forget('cart');

            return redirect()->route('checkout.success', $order->id)->with('success', '¡Pedido registrado con éxito!');
        });
    }

    /**
     * Show success page
     */
    public function success($id)
    {
        $order = Order::findOrFail($id);
        
        $paymentGateway = PaymentGatewayManager::make($order->payment_method);
        $instructions = $paymentGateway->getPaymentInstructions();

        return view('store.order-success', compact('order', 'instructions'));
    }
}
