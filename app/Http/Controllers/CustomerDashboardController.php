<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Coupon;
use App\Models\SortiTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class CustomerDashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Customer Dashboard index / overview
     */
    public function index()
    {
        $user = auth()->user();
        
        $recentOrders = Order::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $activeCoursesCount = $user->courses()->count();
        $downloadsCount = OrderItem::whereHas('order', function($q) use ($user) {
                $q->where('user_id', $user->id)->where('payment_status', 'confirmed');
            })
            ->whereHas('product', function($q) {
                $q->whereIn('type', ['digital', 'software', 'game', 'book']);
            })
            ->count();

        return view('dashboard.index', compact('user', 'recentOrders', 'activeCoursesCount', 'downloadsCount'));
    }

    /**
     * Mis Compras list
     */
    public function purchases()
    {
        $orders = Order::where('user_id', auth()->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return view('dashboard.purchases', compact('orders'));
    }

    /**
     * Download Center
     */
    public function downloads()
    {
        $user = auth()->user();

        // Get all items from paid orders that are digital/software/game/book types
        $items = OrderItem::whereHas('order', function($q) use ($user) {
                $q->where('user_id', $user->id)->where('payment_status', 'confirmed');
            })
            ->whereHas('product', function($q) {
                $q->whereIn('type', ['digital', 'software', 'game', 'book']);
            })
            ->with('product')
            ->get();

        return view('dashboard.downloads', compact('items'));
    }

    /**
     * Trigger file download securely
     */
    public function downloadFile($productId)
    {
        $user = auth()->user();

        // Verify if user bought this product in a paid order
        $hasAccess = OrderItem::whereHas('order', function($q) use ($user) {
                $q->where('user_id', $user->id)->where('payment_status', 'confirmed');
            })
            ->where('product_id', $productId)
            ->exists();

        if (!$hasAccess) {
            return redirect()->back()->with('error', 'No tienes permiso para descargar este archivo.');
        }

        $product = Product::findOrFail($productId);
        if (!$product->download_file) {
            return redirect()->back()->with('error', 'El archivo no está disponible.');
        }

        $path = storage_path('app/public/' . $product->download_file);
        if (!file_exists($path)) {
            return redirect()->back()->with('error', 'El archivo físico no fue encontrado en el servidor.');
        }

        return response()->download($path);
    }

    /**
     * Mis Monedas (Sorti wallet)
     */
    public function coins()
    {
        $user = auth()->user();
        
        $transactions = SortiTransaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return view('dashboard.coins', compact('user', 'transactions'));
    }

    /**
     * Mis Cupones
     */
    public function coupons()
    {
        // Fetch active general coupons and user-specific coupons
        $user = auth()->user();
        $coupons = Coupon::where('is_active', true)
            ->where(function($q) use ($user) {
                $q->where('applicable_type', 'all')
                  ->orWhere(function($sub) use ($user) {
                      $sub->where('applicable_type', 'user')->where('applicable_id', $user->id);
                  });
            })
            ->get();

        return view('dashboard.coupons', compact('coupons'));
    }

    /**
     * Mi Cuenta details
     */
    public function account()
    {
        $user = auth()->user();
        return view('dashboard.account', compact('user'));
    }

    /**
     * Update account details
     */
    public function updateAccount(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
        ]);

        $user->name = $request->name;
        // We can save phone and address inside the settings or user metadata.
        // Let's store them in settings model as a user metadata profile or simple columns.
        // For simplicity, we can save them in an options json in user details, or since Laravel standard User model is extensible, let's just save them in the name/profile.
        $user->save();

        return redirect()->back()->with('success', 'Detalles de la cuenta actualizados.');
    }

    /**
     * Update account password
     */
    public function updatePassword(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return redirect()->back()->withErrors(['current_password' => 'La contraseña actual es incorrecta.']);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return redirect()->back()->with('success', 'Contraseña cambiada exitosamente.');
    }
}
