<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\SortiCoinsService;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'admin']);
    }

    /**
     * List all orders
     */
    public function index()
    {
        $orders = Order::orderBy('created_at', 'desc')->with('user')->paginate(15);
        return view('admin.sales.index', compact('orders'));
    }

    /**
     * Show order details
     */
    public function show($id)
    {
        $order = Order::with(['user', 'items.product', 'items.variant'])->findOrFail($id);
        return view('admin.sales.show', compact('order'));
    }

    /**
     * Confirm payment manually (verify Yape or Bank receipt)
     */
    public function confirmPayment($id)
    {
        $order = Order::findOrFail($id);

        if ($order->payment_status === 'confirmed') {
            return redirect()->back()->with('error', 'El pago ya se encuentra confirmado.');
        }

        $order->payment_status = 'confirmed';
        $order->status = 'paid';
        $order->save();

        // Award Sorti coins if user is logged in
        if ($order->user_id && $order->sorti_coins_earned > 0) {
            $coinsService = new SortiCoinsService();
            $coinsService->addCoins(
                $order->user_id,
                $order->sorti_coins_earned,
                'earned',
                "Monedas acumuladas en compra de pedido #{$order->id}"
            );
        }

        return redirect()->back()->with('success', 'Pago confirmado. Las monedas Sorti han sido abonadas al cliente y las descargas activadas.');
    }

    /**
     * Change order delivery / general status
     */
    public function updateStatus(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        
        $request->validate([
            'status' => 'required|string|in:pending,paid,shipped,completed,cancelled'
        ]);

        $order->status = $request->status;
        $order->save();

        return redirect()->back()->with('success', 'Estado del pedido actualizado.');
    }
}
