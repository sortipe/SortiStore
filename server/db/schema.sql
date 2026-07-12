-- Tabla de Usuarios (roles: admin, employee, client)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'employee', 'client')) DEFAULT 'client',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Billetera Virtual para Monedas Sorti
CREATE TABLE IF NOT EXISTS user_wallets (
    user_id INTEGER PRIMARY KEY,
    sorti_balance INTEGER DEFAULT 0 CHECK(sorti_balance >= 0),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Historial de Transacciones de Monedas Sorti
CREATE TABLE IF NOT EXISTS sorti_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL, -- Positivo (acumulado) o Negativo (canjeado)
    type TEXT CHECK(type IN ('earn', 'redeem', 'admin_adjust')) NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categorías y Subcategorías
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    parent_id INTEGER,
    FOREIGN KEY(parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Productos (Físicos, Digitales, Software, Cursos)
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('physical', 'digital', 'software', 'course')) NOT NULL,
    sku TEXT UNIQUE,
    stock INTEGER DEFAULT 0,
    category_id INTEGER,
    subcategory_id INTEGER,
    brand TEXT,
    price_normal REAL NOT NULL,
    price_offer REAL,
    price_sorti INTEGER, -- Precio pagadero 100% con monedas Sorti (opcional)
    is_featured BOOLEAN DEFAULT 0,
    is_recommended BOOLEAN DEFAULT 0,
    is_new BOOLEAN DEFAULT 0,
    is_sold_out BOOLEAN DEFAULT 0,
    is_upcoming BOOLEAN DEFAULT 0,
    is_presale BOOLEAN DEFAULT 0,
    presale_launch_date DATETIME,
    download_url TEXT, -- URL de descarga para software/productos digitales
    download_file_size TEXT,
    download_version TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY(subcategory_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Galería de Imágenes / Videos de los productos
CREATE TABLE IF NOT EXISTS product_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    media_url TEXT NOT NULL,
    is_video BOOLEAN DEFAULT 0,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Variantes del Producto (Tallas, Colores, Licencias, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'color', 'size', 'license', etc.
    value TEXT NOT NULL, -- 'Rojo', 'XL', 'Anual', etc.
    stock_offset INTEGER DEFAULT 0,
    price_offset REAL DEFAULT 0.0,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Cupones de Descuento
CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    type TEXT CHECK(type IN ('fixed', 'percent', 'free_shipping')) NOT NULL,
    value REAL NOT NULL,
    min_spend REAL DEFAULT 0.0,
    max_uses INTEGER DEFAULT 9999,
    uses_count INTEGER DEFAULT 0,
    user_id INTEGER, -- Específico para un usuario (opcional)
    category_id INTEGER, -- Exclusivo para una categoría (opcional)
    product_id INTEGER, -- Exclusivo para un producto (opcional)
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Relación de Cupones Utilizados
CREATE TABLE IF NOT EXISTS user_coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coupon_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Pedidos (Checkout)
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, -- NULL para compras como invitado
    guest_email TEXT,
    guest_name TEXT,
    status TEXT CHECK(status IN ('pending_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled')) DEFAULT 'pending_payment',
    delivery_type TEXT CHECK(delivery_type IN ('delivery', 'pickup')) NOT NULL,
    delivery_address TEXT,
    delivery_cost REAL DEFAULT 0.0,
    coupon_id INTEGER,
    sorti_coins_used INTEGER DEFAULT 0,
    total_amount REAL NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('yape', 'bank_transfer')) NOT NULL,
    payment_proof_url TEXT, -- Comprobante de pago subido por el cliente
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY(coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
);

-- Detalle del Pedido
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL, -- Precio al momento de la venta
    variant_info TEXT, -- Almacenará un JSON string de variantes elegidas
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Cursos (LMS)
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Módulos de los Cursos
CREATE TABLE IF NOT EXISTS course_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Lecciones/Clases de los Módulos
CREATE TABLE IF NOT EXISTS course_lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    video_url TEXT,
    duration TEXT,
    pdf_url TEXT,
    resources_url TEXT,
    has_exam BOOLEAN DEFAULT 0,
    exam_questions TEXT, -- JSON string de preguntas de examen
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY(module_id) REFERENCES course_modules(id) ON DELETE CASCADE
);

-- Progreso del Usuario por Lección
CREATE TABLE IF NOT EXISTS user_lesson_progress (
    user_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    completed BOOLEAN DEFAULT 0,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, lesson_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE
);

-- Configuración del Sistema (Parámetros Dinámicos)
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
