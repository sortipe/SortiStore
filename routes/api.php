<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Mobile App REST API Stubs (Readiness Showcase)
Route::group(['prefix' => 'v1'], function () {
    // Public Catalog
    Route::get('/products', function () {
        return response()->json(\App\Models\Product::where('status', 'active')->with('images')->paginate(20));
    });
    
    Route::get('/products/{slug}', function ($slug) {
        return response()->json(\App\Models\Product::where('slug', $slug)->with(['images', 'variants', 'quantityDiscounts'])->firstOrFail());
    });

    Route::get('/categories', function () {
        return response()->json(\App\Models\Category::whereNull('parent_id')->with('children')->get());
    });

    // Authenticated Mobile Endpoints
    Route::group(['middleware' => 'auth:sanctum'], function () {
        // Customer Profile & Wallet
        Route::get('/profile', function (Request $request) {
            return response()->json($request->user());
        });

        Route::get('/wallet/transactions', function (Request $request) {
            return response()->json($request->user()->sortiTransactions()->orderBy('created_at', 'desc')->get());
        });

        // LMS Course Progression
        Route::get('/courses', function (Request $request) {
            return response()->json($request->user()->courses()->with('course')->get());
        });

        // Checkout
        Route::post('/checkout', function (Request $request) {
            return response()->json(['success' => true, 'message' => 'Pedido en cola de procesamiento vía API.']);
        });
    });
});

