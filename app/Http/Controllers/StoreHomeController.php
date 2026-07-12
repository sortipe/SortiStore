<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\PromotedOffer;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Http\Request;

class StoreHomeController extends Controller
{
    /**
     * Show the public storefront landing page
     */
    public function index()
    {
        // 1. Fetch featured products
        $featuredProducts = Product::where('status', 'active')
            ->where('is_featured', true)
            ->with('images')
            ->take(8)
            ->get();

        // 2. Fetch recommended products
        $recommendedProducts = Product::where('status', 'active')
            ->where('is_recommended', true)
            ->with('images')
            ->take(8)
            ->get();

        // 3. Fetch pre-sales
        $preSales = Product::where('status', 'active')
            ->where('is_presale', true)
            ->with('images')
            ->take(6)
            ->get();

        // 4. Fetch promoted active offers
        $now = Carbon::now();
        $promotedOffers = PromotedOffer::where('is_active', true)
            ->where(function($q) use ($now) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $now);
            })
            ->where(function($q) use ($now) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $now);
            })
            ->orderBy('priority', 'desc')
            ->with('product.images')
            ->take(8)
            ->get();

        // Banners configurable
        $banners = Setting::get('home_banners', [
            [
                'title' => 'Nueva Era de Comercio Electrónico',
                'subtitle' => 'Encuentra productos físicos, cursos LMS, software empresarial y proyectos premium en un solo lugar.',
                'image' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
                'link' => '/store'
            ],
            [
                'title' => 'Gana y Canjea Monedas Sorti',
                'subtitle' => 'Cada compra acumula monedas virtuales Sorti. ¡Utilízalas para canjear productos exclusivos!',
                'image' => 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=1200&q=80',
                'link' => '/dashboard/coins'
            ]
        ]);

        return view('store.index', compact(
            'featuredProducts',
            'recommendedProducts',
            'preSales',
            'promotedOffers',
            'banners'
        ));
    }
}
