<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\ShippingDistrict;
use App\Models\Setting;
use App\Models\Coupon;
use App\Models\CourseModule;
use App\Models\CourseLecture;
use App\Models\QuantityDiscount;
use App\Models\PromotedOffer;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // 1. Users Seeder
        $admin = User::updateOrCreate(
            ['email' => 'jorgejoelifzyape@gmail.com'],
            [
                'name' => 'Administrador Sorti',
                'password' => Hash::make('admin1234'),
                'role' => 'admin',
                'sorti_coins_balance' => 0
            ]
        );

        $client = User::updateOrCreate(
            ['email' => 'client@sorti.com'],
            [
                'name' => 'Cliente Sorti Demo',
                'password' => Hash::make('client1234'),
                'role' => 'customer',
                'sorti_coins_balance' => 500 // Start with 500 Sorti Coins (worth S/ 5.00)
            ]
        );

        // 2. Settings Seeder
        Setting::set('yape_phone', '987 654 321');
        Setting::set('yape_holder', 'Joel Lopez - Sorti EIRL');
        Setting::set('yape_qr', 'settings/yape-default-qr.png');
        Setting::set('sorti_rate_equivalence', 100);
        Setting::set('sorti_rate_earning', 1.0);
        Setting::set('bank_accounts', [
            [
                'bank' => 'BCP (Banco de Crédito del Perú)',
                'account_number' => '191-99887766-0-55',
                'cci' => '002-191-99887766055-52',
                'holder' => 'Sorti Commerce S.C.A.'
            ],
            [
                'bank' => 'Interbank',
                'account_number' => '200-311223344-5',
                'cci' => '003-200-3112233445-88',
                'holder' => 'Sorti Commerce S.C.A.'
            ]
        ]);

        // 3. Shipping Districts Seeder
        $d1 = ShippingDistrict::updateOrCreate(
            ['name' => 'Miraflores'],
            ['cost' => 10.00, 'delivery_time' => '24 horas', 'is_active' => true]
        );
        $d2 = ShippingDistrict::updateOrCreate(
            ['name' => 'Lima Centro'],
            ['cost' => 8.00, 'delivery_time' => '24 a 48 horas', 'is_active' => true]
        );
        $d3 = ShippingDistrict::updateOrCreate(
            ['name' => 'San Isidro'],
            ['cost' => 10.00, 'delivery_time' => '24 horas', 'is_active' => true]
        );
        $d4 = ShippingDistrict::updateOrCreate(
            ['name' => 'Provincias (Agencia)'],
            ['cost' => 15.00, 'delivery_time' => '3 a 5 días útiles', 'is_active' => true]
        );

        // 4. Coupons Seeder
        Coupon::updateOrCreate(
            ['code' => 'WELCOME10'],
            [
                'type' => 'percentage',
                'value' => 10.00,
                'min_spend' => 50.00,
                'limit_uses' => 100,
                'used_uses' => 0,
                'is_active' => true,
                'expires_at' => Carbon::now()->addMonths(6)
            ]
        );
        Coupon::updateOrCreate(
            ['code' => 'FREEENVIO'],
            [
                'type' => 'free_shipping',
                'value' => 0,
                'min_spend' => 150.00,
                'limit_uses' => 50,
                'used_uses' => 0,
                'is_active' => true,
                'expires_at' => Carbon::now()->addMonths(6)
            ]
        );

        // 5. Categories Seeder
        $catTec = Category::updateOrCreate(
            ['slug' => 'tecnologia'],
            ['name' => 'Tecnología & Gadgets', 'type' => 'store', 'icon' => 'fa-laptop']
        );
        $catRopa = Category::updateOrCreate(
            ['slug' => 'ropa'],
            ['name' => 'Moda & Ropa', 'type' => 'store', 'icon' => 'fa-shirt']
        );
        $catSoft = Category::updateOrCreate(
            ['slug' => 'sistemas-crm'],
            ['name' => 'Sistemas y CRM', 'type' => 'software', 'icon' => 'fa-database']
        );
        $catCourses = Category::updateOrCreate(
            ['slug' => 'cursos-programacion'],
            ['name' => 'Desarrollo Web & Programación', 'type' => 'course', 'icon' => 'fa-graduation-cap']
        );

        // 6. Products Seeder
        
        // A. Physical Product (Smartphone)
        $p1 = Product::updateOrCreate(
            ['slug' => 'smartphone-sorti-x1'],
            [
                'name' => 'Smartphone Sorti X1 Pro',
                'type' => 'physical',
                'category_id' => $catTec->id,
                'price' => 999.00,
                'offer_price' => 899.00,
                'sorti_coins_price' => 80000, // can buy with 80k coins
                'stock' => 15,
                'sku' => 'SRT-X1-PRO',
                'brand' => 'Sorti Mobile',
                'description' => 'Un smartphone premium diseñado para ofrecer velocidad máxima, pantalla AMOLED fluida y cámaras de nivel cinematográfico.',
                'details' => "Pantalla: 6.7 pulg. AMOLED 120Hz\nProcesador: Octa-core 3.2GHz\nMemoria: 12GB RAM, 256GB Almacenamiento\nBatería: 5000 mAh carga súper rápida 67W",
                'is_featured' => true,
                'is_recommended' => true,
                'is_new' => true,
                'status' => 'active'
            ]
        );
        ProductImage::updateOrCreate(
            ['product_id' => $p1->id, 'is_primary' => true],
            ['image_path' => 'products/smartphone-default.jpg']
        );
        ProductVariant::updateOrCreate(
            ['product_id' => $p1->id, 'name' => 'Color', 'value' => 'Negro Carbono'],
            ['additional_price' => 0.00, 'stock' => 10]
        );
        ProductVariant::updateOrCreate(
            ['product_id' => $p1->id, 'name' => 'Color', 'value' => 'Azul Glaciar'],
            ['additional_price' => 30.00, 'stock' => 5]
        );

        // B. Software Product (CRM Systems)
        $p2 = Product::updateOrCreate(
            ['slug' => 'sorti-pos-express'],
            [
                'name' => 'Sorti POS Express',
                'type' => 'software',
                'category_id' => $catSoft->id,
                'price' => 399.00,
                'offer_price' => 299.00,
                'sorti_coins_price' => 25000,
                'stock' => 0, // unlimited
                'sku' => 'SRT-POS-EXP',
                'brand' => 'Sorti Soft',
                'description' => 'El sistema de punto de venta más rápido del mercado peruano, adaptado para boletas y facturas electrónicas.',
                'details' => 'Soporte multi-caja, control de inventario integrado, reportes visuales en PDF e integraciones directas con impresoras térmicas.',
                'download_file' => 'software/sorti_pos_express_v1.zip',
                'download_version' => '1.0.2',
                'download_size' => '48 MB',
                'is_featured' => true,
                'status' => 'active'
            ]
        );
        ProductImage::updateOrCreate(
            ['product_id' => $p2->id, 'is_primary' => true],
            ['image_path' => 'products/pos-express.jpg']
        );

        // C. LMS Course Product (Laravel Course)
        $p3 = Product::updateOrCreate(
            ['slug' => 'laravel-completo-2026'],
            [
                'name' => 'Laravel Completo de Cero a Master (LMS)',
                'type' => 'course',
                'category_id' => $catCourses->id,
                'price' => 199.00,
                'offer_price' => 149.00,
                'sorti_coins_price' => 12000,
                'stock' => 0,
                'sku' => 'LMS-LARAVEL-26',
                'brand' => 'Sorti Academy',
                'description' => 'Aprende Laravel paso a paso y construye proyectos de ecommerce reales, integrando pasarelas de pago y monederos virtuales.',
                'details' => 'Incluye: Acceso de por vida, foro de soporte, código fuente descargable y certificado oficial al completar todas las clases.',
                'is_featured' => true,
                'status' => 'active'
            ]
        );
        ProductImage::updateOrCreate(
            ['product_id' => $p3->id, 'is_primary' => true],
            ['image_path' => 'products/laravel-course.jpg']
        );

        // Build Course Syllabus Tree
        $m1 = CourseModule::updateOrCreate(
            ['product_id' => $p3->id, 'title' => 'Módulo 1: Introducción y Entorno'],
            ['sort_order' => 1]
        );
        CourseLecture::updateOrCreate(
            ['module_id' => $m1->id, 'title' => 'Clase 1: Instalación de PHP y Laravel en Windows'],
            [
                'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Demo Youtube video
                'content' => 'En esta clase instalaremos las herramientas iniciales como XAMPP, Composer y crearemos nuestro primer proyecto en Laravel utilizando Composer.',
                'sort_order' => 1
            ]
        );
        CourseLecture::updateOrCreate(
            ['module_id' => $m1->id, 'title' => 'Clase 2: Estructura del Framework y Configuración inicial'],
            [
                'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'content' => 'Analizaremos en profundidad la arquitectura del framework, carpetas, archivos de configuración .env y el ciclo de vida del request.',
                'sort_order' => 2
            ]
        );

        $m2 = CourseModule::updateOrCreate(
            ['product_id' => $p3->id, 'title' => 'Módulo 2: Controladores y Base de Datos'],
            ['sort_order' => 2]
        );
        CourseLecture::updateOrCreate(
            ['module_id' => $m2->id, 'title' => 'Clase 3: Rutas, Controladores y Respuestas'],
            [
                'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'content' => 'Aprenderemos a mapear rutas en web.php y redireccionar la lógica hacia controladores especializados.',
                'sort_order' => 1
            ]
        );

        // D. Pre-sale Countdown Product
        $p4 = Product::updateOrCreate(
            ['slug' => 'sorti-smartwatch-active'],
            [
                'name' => 'Sorti Smartwatch Active (Preventa)',
                'type' => 'physical',
                'category_id' => $catTec->id,
                'price' => 249.00,
                'offer_price' => 199.00,
                'stock' => 30,
                'sku' => 'SRT-WATCH-ACT',
                'brand' => 'Sorti Watch',
                'description' => 'El reloj inteligente deportivo definitivo. Con sensor cardíaco óptico avanzado, GPS integrado y pantalla AMOLED de alto brillo.',
                'is_presale' => true,
                'presale_launch_date' => Carbon::now()->addDays(5),
                'presale_delivery_date' => Carbon::now()->addDays(15),
                'status' => 'active'
            ]
        );
        ProductImage::updateOrCreate(
            ['product_id' => $p4->id, 'is_primary' => true],
            ['image_path' => 'products/smartwatch-active.jpg']
        );

        // 7. Quantity Discounts Seeder
        QuantityDiscount::updateOrCreate(
            ['product_id' => $p1->id, 'min_qty' => 3],
            ['discount_type' => 'percentage', 'discount_value' => 10.00] // 10% off for 3+
        );
        QuantityDiscount::updateOrCreate(
            ['product_id' => $p1->id, 'min_qty' => 5],
            ['discount_type' => 'percentage', 'discount_value' => 15.00] // 15% off for 5+
        );

        // 8. Promoted Offers Seeder (Main Carousels)
        PromotedOffer::updateOrCreate(
            ['product_id' => $p1->id],
            [
                'discount_percent' => 10,
                'start_date' => Carbon::now()->subDay(),
                'end_date' => Carbon::now()->addDays(10),
                'priority' => 1,
                'is_active' => true
            ]
        );
        PromotedOffer::updateOrCreate(
            ['product_id' => $p2->id],
            [
                'discount_percent' => 25,
                'start_date' => Carbon::now()->subDay(),
                'end_date' => Carbon::now()->addDays(10),
                'priority' => 2,
                'is_active' => true
            ]
        );
    }
}
