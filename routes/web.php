<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\StoreHomeController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\CustomerDashboardController;
use App\Http\Controllers\LMSController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Admin\AdminCustomerController;
use App\Http\Controllers\Admin\AdminProductController;
use App\Http\Controllers\Admin\AdminCategoryController;
use App\Http\Controllers\Admin\AdminCouponController;
use App\Http\Controllers\Admin\AdminDiscountController;
use App\Http\Controllers\Admin\AdminOfferController;
use App\Http\Controllers\Admin\AdminShippingController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Controllers\Admin\AdminCourseController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Auth Routes (login, register, logout, resets)
Auth::routes();

// Home/Storefront
Route::get('/', [StoreHomeController::class, 'index'])->name('store.home');
Route::get('/store', [ShopController::class, 'index'])->name('shop.index');
Route::get('/product/{slug}', [ShopController::class, 'show'])->name('shop.show');
Route::get('/api/search-suggest', [ShopController::class, 'searchSuggest']);

// Cart
Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::post('/cart/add', [CartController::class, 'add'])->name('cart.add');
Route::post('/cart/update', [CartController::class, 'update'])->name('cart.update');
Route::get('/cart/remove/{key}', [CartController::class, 'remove'])->name('cart.remove');

// Checkout
Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout.index');
Route::post('/checkout/recalculate', [CheckoutController::class, 'recalculate'])->name('checkout.recalculate');
Route::post('/checkout/place', [CheckoutController::class, 'place'])->name('checkout.place');
Route::get('/order-success/{id}', [CheckoutController::class, 'success'])->name('checkout.success');

// Customer Dashboard (Authenticated Only)
Route::group(['prefix' => 'dashboard', 'middleware' => 'auth'], function () {
    Route::get('/', [CustomerDashboardController::class, 'index'])->name('dashboard.index');
    Route::get('/purchases', [CustomerDashboardController::class, 'purchases'])->name('dashboard.purchases');
    Route::get('/downloads', [CustomerDashboardController::class, 'downloads'])->name('dashboard.downloads');
    Route::get('/downloads/file/{id}', [CustomerDashboardController::class, 'downloadFile'])->name('dashboard.download');
    Route::get('/coins', [CustomerDashboardController::class, 'coins'])->name('dashboard.coins');
    Route::get('/coupons', [CustomerDashboardController::class, 'coupons'])->name('dashboard.coupons');
    
    Route::get('/account', [CustomerDashboardController::class, 'account'])->name('dashboard.account');
    Route::post('/account/update', [CustomerDashboardController::class, 'updateAccount'])->name('dashboard.account.update');
    Route::post('/account/password', [CustomerDashboardController::class, 'updatePassword'])->name('dashboard.account.password');

    // LMS Courses
    Route::get('/courses', [LMSController::class, 'index'])->name('dashboard.courses.index');
    Route::get('/courses/{id}', [LMSController::class, 'show'])->name('dashboard.courses.show');
    Route::get('/courses/{course_id}/lectures/{lecture_id}', [LMSController::class, 'viewLecture'])->name('dashboard.courses.lecture');
    Route::post('/courses/{course_id}/lectures/{lecture_id}/complete', [LMSController::class, 'completeLecture'])->name('dashboard.courses.complete');
    Route::post('/courses/tasks/submit', [LMSController::class, 'submitTask'])->name('dashboard.courses.submit-task');
});

// Admin Panel (Authenticated and Admin/Employee roles)
Route::group(['prefix' => 'admin', 'middleware' => ['auth', 'admin']], function () {
    Route::get('/', [AdminDashboardController::class, 'index'])->name('admin.dashboard');

    // Sales & Orders
    Route::get('/sales', [AdminOrderController::class, 'index'])->name('admin.sales.index');
    Route::get('/sales/{id}', [AdminOrderController::class, 'show'])->name('admin.sales.show');
    Route::post('/sales/{id}/confirm', [AdminOrderController::class, 'confirmPayment'])->name('admin.sales.confirm');
    Route::post('/sales/{id}/status', [AdminOrderController::class, 'updateStatus'])->name('admin.sales.status');

    // Customers
    Route::get('/customers', [AdminCustomerController::class, 'index'])->name('admin.customers.index');
    Route::get('/customers/{id}', [AdminCustomerController::class, 'show'])->name('admin.customers.show');
    Route::post('/customers/{id}/coins', [AdminCustomerController::class, 'adjustCoins'])->name('admin.customers.coins');

    // Product Catalog (Resource)
    Route::resource('products', AdminProductController::class, ['names' => 'admin.products']);
    
    // Categories
    Route::get('/categories', [AdminCategoryController::class, 'index'])->name('admin.categories.index');
    Route::post('/categories', [AdminCategoryController::class, 'store'])->name('admin.categories.store');
    Route::put('/categories/{id}', [AdminCategoryController::class, 'update'])->name('admin.categories.update');
    Route::delete('/categories/{id}', [AdminCategoryController::class, 'destroy'])->name('admin.categories.destroy');

    // Coupons
    Route::get('/coupons', [AdminCouponController::class, 'index'])->name('admin.coupons.index');
    Route::post('/coupons', [AdminCouponController::class, 'store'])->name('admin.coupons.store');
    Route::delete('/coupons/{id}', [AdminCouponController::class, 'destroy'])->name('admin.coupons.destroy');

    // Quantity Discounts
    Route::get('/discounts', [AdminDiscountController::class, 'index'])->name('admin.discounts.index');
    Route::post('/discounts', [AdminDiscountController::class, 'store'])->name('admin.discounts.store');
    Route::delete('/discounts/{id}', [AdminDiscountController::class, 'destroy'])->name('admin.discounts.destroy');

    // Offers
    Route::get('/offers', [AdminOfferController::class, 'index'])->name('admin.offers.index');
    Route::post('/offers', [AdminOfferController::class, 'store'])->name('admin.offers.store');
    Route::delete('/offers/{id}', [AdminOfferController::class, 'destroy'])->name('admin.offers.destroy');

    // Shipping Districts
    Route::get('/shipping', [AdminShippingController::class, 'index'])->name('admin.shipping.index');
    Route::post('/shipping', [AdminShippingController::class, 'store'])->name('admin.shipping.store');
    Route::delete('/shipping/{id}', [AdminShippingController::class, 'destroy'])->name('admin.shipping.destroy');

    // LMS Syllabus Builder
    Route::get('/courses', [AdminCourseController::class, 'index'])->name('admin.courses.index');
    Route::get('/courses/{id}', [AdminCourseController::class, 'show'])->name('admin.courses.show');
    Route::post('/courses/{id}/modules', [AdminCourseController::class, 'storeModule'])->name('admin.courses.store-module');
    Route::post('/courses/{id}/lectures', [AdminCourseController::class, 'storeLecture'])->name('admin.courses.store-lecture');
    Route::delete('/courses/{id}/modules/{moduleId}', [AdminCourseController::class, 'destroyModule'])->name('admin.courses.destroy-module');
    Route::delete('/courses/{id}/lectures/{lectureId}', [AdminCourseController::class, 'destroyLecture'])->name('admin.courses.destroy-lecture');

    // Settings
    Route::get('/settings', [AdminSettingsController::class, 'index'])->name('admin.settings.index');
    Route::post('/settings', [AdminSettingsController::class, 'store'])->name('admin.settings.store');
});
