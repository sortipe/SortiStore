<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;

class AdminCouponController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'admin']);
    }

    public function index()
    {
        $coupons = Coupon::orderBy('created_at', 'desc')->get();
        return view('admin.coupons.index', compact('coupons'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:50|unique:coupons',
            'type' => 'required|string|in:fixed,percentage,free_shipping',
            'value' => 'required|numeric|min:0',
            'min_spend' => 'required|numeric|min:0',
            'limit_uses' => 'nullable|integer|min:1',
            'expires_at' => 'nullable|date'
        ]);

        Coupon::create([
            'code' => strtoupper($request->code),
            'type' => $request->type,
            'value' => $request->value,
            'min_spend' => $request->min_spend,
            'limit_uses' => $request->limit_uses,
            'expires_at' => $request->expires_at,
            'is_active' => true
        ]);

        return redirect()->route('admin.coupons.index')->with('success', 'Cupón creado.');
    }

    public function destroy($id)
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();
        return redirect()->route('admin.coupons.index')->with('success', 'Cupón eliminado.');
    }
}
