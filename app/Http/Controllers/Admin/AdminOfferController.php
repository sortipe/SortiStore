<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PromotedOffer;
use App\Models\Product;
use Illuminate\Http\Request;

class AdminOfferController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'admin']);
    }

    public function index()
    {
        $offers = PromotedOffer::with('product')->orderBy('priority', 'desc')->get();
        $products = Product::all();
        return view('admin.offers.index', compact('offers', 'products'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|integer',
            'discount_percent' => 'required|numeric|min:0|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'priority' => 'required|integer'
        ]);

        PromotedOffer::create([
            'product_id' => $request->product_id,
            'discount_percent' => $request->discount_percent,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'priority' => $request->priority,
            'is_active' => true
        ]);

        return redirect()->route('admin.offers.index')->with('success', 'Oferta especial programada.');
    }

    public function destroy($id)
    {
        $offer = PromotedOffer::findOrFail($id);
        $offer->delete();
        return redirect()->route('admin.offers.index')->with('success', 'Oferta eliminada.');
    }
}
