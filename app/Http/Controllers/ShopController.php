<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    /**
     * Store browsing page with dynamic filters
     */
    public function index(Request $request)
    {
        $query = Product::where('status', 'active');

        // Filter by text search
        if ($request->has('q') && !empty($request->q)) {
            $q = $request->q;
            $query->where(function($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhere('sku', 'like', "%{$q}%")
                    ->orWhere('brand', 'like', "%{$q}%");
            });
        }

        // Filter by category slug/id
        if ($request->has('category') && !empty($request->category)) {
            $catSlug = $request->category;
            $category = Category::where('slug', $catSlug)->first();
            if ($category) {
                // Get all subcategories as well
                $catIds = Category::where('parent_id', $category->id)->pluck('id')->toArray();
                $catIds[] = $category->id;
                $query->whereIn('category_id', $catIds);
            }
        }

        // Filter by product type
        if ($request->has('type') && !empty($request->type)) {
            $query->where('type', $request->type);
        }

        // Filter for dynamic offers / promos
        if ($request->has('promo') && $request->promo == '1') {
            $query->where(function($q) {
                $q->whereNotNull('offer_price')->orWhereHas('promotedOffers');
            });
        }

        // Sorting
        $sort = $request->get('sort', 'newest');
        if ($sort === 'price_low') {
            $query->orderBy('price', 'asc');
        } elseif ($sort === 'price_high') {
            $query->orderBy('price', 'desc');
        } else {
            $query->orderBy('is_featured', 'desc')->orderBy('created_at', 'desc');
        }

        $products = $query->with('images')->paginate(12)->appends($request->all());
        $categories = Category::whereNull('parent_id')->with('children')->get();

        return view('store.shop', compact('products', 'categories'));
    }

    /**
     * Product details page
     */
    public function show($slug)
    {
        $product = Product::where('slug', $slug)
            ->where('status', 'active')
            ->with(['images', 'variants', 'category', 'quantityDiscounts'])
            ->firstOrFail();

        // Related products
        $relatedProducts = Product::where('status', 'active')
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->take(4)
            ->get();

        return view('store.product-detail', compact('product', 'relatedProducts'));
    }

    /**
     * Search Autocomplete endpoint (JSON output)
     */
    public function searchSuggest(Request $request)
    {
        $query = $request->get('q', '');
        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $products = Product::where('status', 'active')
            ->where('name', 'like', "%{$query}%")
            ->take(6)
            ->get();

        $suggestions = [];
        foreach ($products as $p) {
            $suggestions[] = [
                'name' => $p->name,
                'slug' => $p->slug,
                'price' => $p->final_price,
                'coins_price' => $p->sorti_coins_price,
                'image' => $p->primary_image_url,
            ];
        }

        return response()->json($suggestions);
    }
}
