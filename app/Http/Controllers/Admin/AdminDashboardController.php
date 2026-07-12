<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'admin']); // Admin role checked in middleware or controller
    }

    /**
     * Show administrative dashboard panel
     */
    public function index()
    {
        // 1. Core KPIs
        $totalSales = Order::whereIn('status', ['paid', 'completed'])->sum('total');
        $pendingOrdersCount = Order::where('status', 'pending')->count();
        $totalCustomers = User::where('role', 'customer')->count();
        $totalProducts = Product::count();

        // 2. Recent orders
        $recentOrders = Order::orderBy('created_at', 'desc')
            ->with('user')
            ->take(8)
            ->get();

        // 3. Sales statistics by month (last 6 months)
        $salesStats = Order::select(
                DB::raw('Month(created_at) as month'),
                DB::raw('Sum(total) as total')
            )
            ->whereIn('status', ['paid', 'completed'])
            ->groupBy('month')
            ->orderBy('month')
            ->take(6)
            ->get();

        return view('admin.dashboard', compact(
            'totalSales',
            'pendingOrdersCount',
            'totalCustomers',
            'totalProducts',
            'recentOrders',
            'salesStats'
        ));
    }
}
