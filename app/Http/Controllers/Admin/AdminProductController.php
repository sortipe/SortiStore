<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminProductController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'admin']);
    }

    public function index()
    {
        $products = Product::with('category')->orderBy('created_at', 'desc')->paginate(15);
        return view('admin.products.index', compact('products'));
    }

    public function create()
    {
        $categories = Category::all();
        return view('admin.products.create', compact('categories'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'price' => 'required|numeric|min:0',
            'offer_price' => 'nullable|numeric|min:0',
            'sorti_coins_price' => 'nullable|integer|min:0',
            'stock' => 'required|integer|min:0',
            'category_id' => 'nullable|integer',
            'image' => 'nullable|image|max:2048',
            'download_file' => 'nullable|file|max:51200', // 50MB
        ]);

        $slug = Str::slug($request->name);
        // Ensure slug is unique
        $originalSlug = $slug;
        $count = 1;
        while (Product::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count++;
        }

        // Handle download file
        $downloadPath = null;
        $size = null;
        if ($request->hasFile('download_file')) {
            $file = $request->file('download_file');
            $downloadPath = $file->store('downloads', 'public');
            $size = round($file->getSize() / 1024 / 1024, 2) . ' MB';
        }

        // Create product
        $product = Product::create([
            'name' => $request->name,
            'slug' => $slug,
            'type' => $request->type,
            'sku' => $request->sku,
            'stock' => $request->stock,
            'price' => $request->price,
            'offer_price' => $request->offer_price,
            'sorti_coins_price' => $request->sorti_coins_price,
            'category_id' => $request->category_id,
            'brand' => $request->brand,
            'is_featured' => $request->has('is_featured'),
            'is_recommended' => $request->has('is_recommended'),
            'is_new' => $request->has('is_new'),
            'is_soon' => $request->has('is_soon'),
            'is_presale' => $request->has('is_presale'),
            'presale_launch_date' => $request->presale_launch_date,
            'presale_delivery_date' => $request->presale_delivery_date,
            'description' => $request->description,
            'details' => $request->details,
            'download_file' => $downloadPath,
            'download_size' => $size,
            'download_version' => $request->download_version,
            'status' => 'active',
        ]);

        // Upload primary image
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
            ProductImage::create([
                'product_id' => $product->id,
                'image_path' => $imagePath,
                'is_primary' => true,
            ]);
        }

        // Save variants (if present)
        if ($request->has('variant_names') && is_array($request->variant_names)) {
            foreach ($request->variant_names as $index => $varName) {
                if (!empty($varName) && !empty($request->variant_values[$index])) {
                    ProductVariant::create([
                        'product_id' => $product->id,
                        'name' => $varName,
                        'value' => $request->variant_values[$index],
                        'additional_price' => $request->variant_prices[$index] ?? 0.00,
                        'stock' => $request->variant_stocks[$index] ?? 0,
                    ]);
                }
            }
        }

        return redirect()->route('admin.products.index')->with('success', 'Producto creado exitosamente.');
    }

    public function edit($id)
    {
        $product = Product::with(['images', 'variants'])->findOrFail($id);
        $categories = Category::all();
        return view('admin.products.edit', compact('product', 'categories'));
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'price' => 'required|numeric|min:0',
            'offer_price' => 'nullable|numeric|min:0',
            'sorti_coins_price' => 'nullable|integer|min:0',
            'stock' => 'required|integer|min:0',
            'category_id' => 'nullable|integer',
            'image' => 'nullable|image|max:2048',
            'download_file' => 'nullable|file|max:51200',
        ]);

        // Handle download file
        $downloadPath = $product->download_file;
        $size = $product->download_size;
        if ($request->hasFile('download_file')) {
            $file = $request->file('download_file');
            $downloadPath = $file->store('downloads', 'public');
            $size = round($file->getSize() / 1024 / 1024, 2) . ' MB';
        }

        $product->update([
            'name' => $request->name,
            'type' => $request->type,
            'sku' => $request->sku,
            'stock' => $request->stock,
            'price' => $request->price,
            'offer_price' => $request->offer_price,
            'sorti_coins_price' => $request->sorti_coins_price,
            'category_id' => $request->category_id,
            'brand' => $request->brand,
            'is_featured' => $request->has('is_featured'),
            'is_recommended' => $request->has('is_recommended'),
            'is_new' => $request->has('is_new'),
            'is_soon' => $request->has('is_soon'),
            'is_presale' => $request->has('is_presale'),
            'presale_launch_date' => $request->presale_launch_date,
            'presale_delivery_date' => $request->presale_delivery_date,
            'description' => $request->description,
            'details' => $request->details,
            'download_file' => $downloadPath,
            'download_size' => $size,
            'download_version' => $request->download_version,
        ]);

        // Upload primary image
        if ($request->hasFile('image')) {
            // Delete old primary images
            ProductImage::where('product_id', $product->id)->where('is_primary', true)->delete();

            $imagePath = $request->file('image')->store('products', 'public');
            ProductImage::create([
                'product_id' => $product->id,
                'image_path' => $imagePath,
                'is_primary' => true,
            ]);
        }

        // Sync variants
        ProductVariant::where('product_id', $product->id)->delete();
        if ($request->has('variant_names') && is_array($request->variant_names)) {
            foreach ($request->variant_names as $index => $varName) {
                if (!empty($varName) && !empty($request->variant_values[$index])) {
                    ProductVariant::create([
                        'product_id' => $product->id,
                        'name' => $varName,
                        'value' => $request->variant_values[$index],
                        'additional_price' => $request->variant_prices[$index] ?? 0.00,
                        'stock' => $request->variant_stocks[$index] ?? 0,
                    ]);
                }
            }
        }

        return redirect()->route('admin.products.index')->with('success', 'Producto actualizado exitosamente.');
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();
        return redirect()->route('admin.products.index')->with('success', 'Producto eliminado exitosamente.');
    }
}
