<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\QuantityDiscount;
use App\Models\Product;
use Illuminate\Http\Request;

class AdminDiscountController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'admin']);
    }

    public function index()
    {
        $discounts = QuantityDiscount::with('product')->orderBy('min_qty')->get();
        $products = Product::all();
        return view('admin.discounts.index', compact('discounts', 'products'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'min_qty' => 'required|integer|min:2',
            'discount_type' => 'required|string|in:percentage,fixed,free_items',
            'discount_value' => 'required|numeric|min:0',
            'product_id' => 'nullable|integer'
        ]);

        QuantityDiscount::create($request->all());

        return redirect()->route('admin.discounts.index')->with('success', 'Regla de descuento por cantidad creada.');
    }

    public function destroy($id)
    {
        $discount = QuantityDiscount::findOrFail($id);
        $discount->delete();
        return redirect()->route('admin.discounts.index')->with('success', 'Regla eliminada.');
    }
}
