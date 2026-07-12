<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSortiEcomTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // 1. Categories
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('icon')->nullable();
            $table->string('type')->default('store'); // store, software, projects, courses, digital
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('categories')->onDelete('cascade');
        });

        // 2. Products
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('type'); // physical, digital, software, game, book, course, project, streaming, pre-sale
            $table->string('sku')->nullable();
            $table->integer('stock')->default(0);
            $table->decimal('price', 10, 2);
            $table->decimal('offer_price', 10, 2)->nullable();
            $table->integer('sorti_coins_price')->nullable();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->string('brand')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_recommended')->default(false);
            $table->boolean('is_new')->default(false);
            $table->boolean('is_soon')->default(false);
            $table->boolean('is_presale')->default(false);
            $table->timestamp('presale_launch_date')->nullable();
            $table->timestamp('presale_delivery_date')->nullable();
            $table->text('description')->nullable();
            $table->text('details')->nullable();
            $table->text('metadata')->nullable(); // JSON for tech stack, duration, streaming screens, etc.
            $table->string('download_file')->nullable();
            $table->string('download_size')->nullable();
            $table->string('download_version')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();

            $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');
        });

        // 3. Product Images
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->string('image_path');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });

        // 4. Product Variants
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->string('name'); // e.g. Talla, Color, Licencia
            $table->string('value'); // e.g. XL, Rojo, Personal
            $table->decimal('additional_price', 10, 2)->default(0.00);
            $table->integer('stock')->default(0);
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });

        // 5. Coupons
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('type'); // fixed, percentage, free_shipping
            $table->decimal('value', 10, 2);
            $table->decimal('min_spend', 10, 2)->default(0.00);
            $table->timestamp('expires_at')->nullable();
            $table->integer('limit_uses')->nullable();
            $table->integer('used_uses')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('applicable_type')->default('all'); // all, category, product, user
            $table->unsignedBigInteger('applicable_id')->nullable();
            $table->timestamps();
        });

        // 6. Sorti Transactions
        Schema::create('sorti_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->integer('amount'); // positive or negative
            $table->string('type'); // earned, spent, manual_admin
            $table->string('description')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 7. Orders
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('guest_email')->nullable();
            $table->string('guest_phone')->nullable();
            $table->decimal('total', 10, 2);
            $table->decimal('discount', 10, 2)->default(0.00);
            $table->decimal('shipping_cost', 10, 2)->default(0.00);
            $table->integer('sorti_coins_spent')->default(0);
            $table->integer('sorti_coins_earned')->default(0);
            $table->unsignedBigInteger('coupon_id')->nullable();
            $table->string('status')->default('pending'); // pending, paid, shipped, completed, cancelled
            $table->string('delivery_method'); // delivery, pickup
            $table->text('delivery_address')->nullable();
            $table->string('delivery_district')->nullable();
            $table->string('payment_method'); // yape, bank_transfer, stripe, paypal, etc.
            $table->string('payment_status')->default('pending'); // pending, confirmed, rejected
            $table->string('payment_receipt')->nullable(); // path to uploaded screenshot
            $table->text('payment_details')->nullable(); // JSON configuration
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });

        // 8. Order Items
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->integer('quantity')->default(1);
            $table->decimal('price', 10, 2);
            $table->decimal('total', 10, 2);
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });

        // 9. Course Modules
        Schema::create('course_modules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id'); // course product
            $table->string('title');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });

        // 10. Course Lectures
        Schema::create('course_lectures', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('module_id');
            $table->string('title');
            $table->string('video_url')->nullable();
            $table->text('content')->nullable();
            $table->string('pdf_file')->nullable();
            $table->string('resource_file')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('module_id')->references('id')->on('course_modules')->onDelete('cascade');
        });

        // 11. User Courses
        Schema::create('user_courses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('product_id'); // course product
            $table->text('completed_lectures')->nullable(); // JSON list of lecture_ids
            $table->integer('progress_percent')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });

        // 12. User Tasks
        Schema::create('user_tasks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lecture_id');
            $table->unsignedBigInteger('user_id');
            $table->string('file_path');
            $table->string('grade')->nullable();
            $table->text('feedback')->nullable();
            $table->timestamps();

            $table->foreign('lecture_id')->references('id')->on('course_lectures')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 13. User Exams
        Schema::create('user_exams', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lecture_id'); // or exam linked to lecture
            $table->unsignedBigInteger('user_id');
            $table->decimal('score', 5, 2);
            $table->boolean('passed')->default(false);
            $table->timestamps();

            $table->foreign('lecture_id')->references('id')->on('course_lectures')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 14. Quantity Discounts
        Schema::create('quantity_discounts', function (Blueprint $table) {
            $table->id();
            $table->integer('min_qty');
            $table->string('discount_type'); // percentage, fixed
            $table->decimal('discount_value', 10, 2);
            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('cascade');
        });

        // 15. Promoted Offers
        Schema::create('promoted_offers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->decimal('discount_percent', 5, 2);
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->integer('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });

        // 16. Shipping Districts
        Schema::create('shipping_districts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('cost', 10, 2);
            $table->string('delivery_time');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 17. Settings
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('shipping_districts');
        Schema::dropIfExists('promoted_offers');
        Schema::dropIfExists('quantity_discounts');
        Schema::dropIfExists('user_exams');
        Schema::dropIfExists('user_tasks');
        Schema::dropIfExists('user_courses');
        Schema::dropIfExists('course_lectures');
        Schema::dropIfExists('course_modules');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('sorti_transactions');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
    }
}
