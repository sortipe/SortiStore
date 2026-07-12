<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShippingDistrict;
use Illuminate\Http\Request;

class AdminShippingController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'admin']);
    }

    public function index()
    {
        $districts = ShippingDistrict::orderBy('name')->get();
        return view('admin.shipping.index', compact('districts'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:shipping_districts',
            'cost' => 'required|numeric|min:0',
            'delivery_time' => 'required|string'
        ]);

        ShippingDistrict::create([
            'name' => $request->name,
            'cost' => $request->cost,
            'delivery_time' => $request->delivery_time,
            'is_active' => true
        ]);

        return redirect()->route('admin.shipping.index')->with('success', 'Zona de envío agregada.');
    }

    public function destroy($id)
    {
        $district = ShippingDistrict::findOrFail($id);
        $district->delete();
        return redirect()->route('admin.shipping.index')->with('success', 'Zona de envío eliminada.');
    }
}
