const db = require('../config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

function translateSchemaToPostgres(sql) {
    let pgSql = sql;
    pgSql = pgSql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
    pgSql = pgSql.replace(/DATETIME/gi, 'TIMESTAMP');
    pgSql = pgSql.replace(/BOOLEAN DEFAULT 0/gi, 'BOOLEAN DEFAULT FALSE');
    pgSql = pgSql.replace(/BOOLEAN DEFAULT 1/gi, 'BOOLEAN DEFAULT TRUE');
    return pgSql;
}

async function runSeed() {
    console.log('--- INICIANDO SIEMBRA DE BASE DE DATOS (SORTISTORE COMPLETO) ---');

    // 1. Crear tablas si no existen
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    if (db.isPostgres) {
        schemaSql = translateSchemaToPostgres(schemaSql);
    }

    await db.exec(schemaSql);
    console.log('1. Tablas y esquema verificados.');

    // 2. Verificar si ya existen usuarios
    const userCheck = await db.querySingle('SELECT COUNT(*) as count FROM users');
    if (userCheck && Number(userCheck.count) > 0) {
        console.log('La base de datos ya contiene datos. Omitiendo la siembra inicial.');
        return;
    }

    // 3. Crear Usuarios por Defecto
    const adminPass = bcrypt.hashSync('@Vyjys140601', 10);
    const employeePass = bcrypt.hashSync('empleado123', 10);
    const clientPass = bcrypt.hashSync('cliente123', 10);

    const userAdmin = await db.querySingle(`
        INSERT INTO users (name, email, password_hash, role, is_vip, vip_coins, vip_last_renovation)
        VALUES (?, ?, ?, 'admin', 1, 10, ?) RETURNING id
    `, ['Administrador Jorge', 'jorgejoelifzyape@gmail.com', adminPass, new Date().toISOString()]);

    await db.querySingle(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES (?, ?, ?, 'employee') RETURNING id
    `, ['Empleado Juan', 'empleado@sortistore.com', employeePass]);

    const userClient = await db.querySingle(`
        INSERT INTO users (name, email, password_hash, role, is_vip, vip_coins, vip_last_renovation)
        VALUES (?, ?, ?, 'client', 1, 5, ?) RETURNING id
    `, ['Cliente Premium', 'cliente@sortistore.com', clientPass, new Date().toISOString()]);

    const clientUserId = userClient.id;

    // Billetera del Cliente
    await db.execute('INSERT INTO user_wallets (user_id, sorti_balance) VALUES (?, ?)', [clientUserId, 75000]);
    await db.execute(`
        INSERT INTO sorti_transactions (user_id, amount, type, description)
        VALUES (?, 50000, 'earn', 'Bono de bienvenida VIP')
    `, [clientUserId]);
    await db.execute(`
        INSERT INTO sorti_transactions (user_id, amount, type, description)
        VALUES (?, 25000, 'earn', 'Bonificación de recarga por compra premium')
    `, [clientUserId]);

    // 4. Ajustes del Sistema
    await db.execute("INSERT INTO system_settings (key, value) VALUES ('sorti_rate', '100')");

    const defaultBanners = [
        {
            image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600',
            badge: 'EDICIÓN ESPECIAL 2026',
            title: 'Tecnología, Cursos LMS y Software en SortiStore',
            description: 'Explora nuestros productos físicos de alta gama, licencias de software, proyectos con IA y cursos certificados con entrega digital instantánea.',
            link: '#/category/tecnologia',
            bg_y: 50
        },
        {
            image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1600',
            badge: 'ACADEMIA ONLINE',
            title: 'Cursos & Masterclasses de Nivel Profesional',
            description: 'Aprende Desarrollo Web con Next.js 14, Arquitectura de Agentes IA y Marketing Digital con lecciones interactivas y exámenes.',
            link: '#/category/cursos-y-masterclasses',
            bg_y: 50
        }
    ];
    await db.execute("INSERT INTO system_settings (key, value) VALUES ('home_banners', ?)", [JSON.stringify(defaultBanners)]);

    const defaultBranding = {
        site_name: 'SortiStore',
        primary_color: '#6366f1',
        accent_color: '#f59e0b'
    };
    await db.execute("INSERT INTO system_settings (key, value) VALUES ('site_branding', ?)", [JSON.stringify(defaultBranding)]);

    const bankAccounts = [
        { bank: 'BCP', account: '191-98765432-0-99', CCI: '002-19198765432099-54', owner: 'SortiStore Perú S.A.C.' },
        { bank: 'BBVA', account: '0011-0123-0200456789', CCI: '001-101230200456789-21', owner: 'SortiStore Perú S.A.C.' }
    ];
    await db.execute("INSERT INTO system_settings (key, value) VALUES ('bank_accounts', ?)", [JSON.stringify(bankAccounts)]);
    await db.execute("INSERT INTO system_settings (key, value) VALUES ('yape_qr', 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=400')");

    const deliveryDistricts = [
        { name: 'Miraflores', cost: 7.00, time: '24-48 horas' },
        { name: 'San Isidro', cost: 7.00, time: '24-48 horas' },
        { name: 'Santiago de Surco', cost: 9.00, time: '24-48 horas' },
        { name: 'San Borja', cost: 8.00, time: '24-48 horas' },
        { name: 'La Molina', cost: 12.00, time: '48-72 horas' },
        { name: 'Lima Centro', cost: 10.00, time: '48-72 horas' }
    ];
    await db.execute("INSERT INTO system_settings (key, value) VALUES ('delivery_districts', ?)", [JSON.stringify(deliveryDistricts)]);

    // 5. Categorías y Productos Demos
    const c1 = await db.querySingle("INSERT INTO categories (name, slug, parent_id) VALUES ('Tecnología', 'tecnologia', null) RETURNING id");
    const c2 = await db.querySingle("INSERT INTO categories (name, slug, parent_id) VALUES ('Hogar & Confort', 'hogar-y-confort', null) RETURNING id");
    const c3 = await db.querySingle("INSERT INTO categories (name, slug, parent_id) VALUES ('Contenido Digital', 'contenido-digital', null) RETURNING id");
    const c4 = await db.querySingle("INSERT INTO categories (name, slug, parent_id) VALUES ('Sistemas & Software', 'sistemas-y-software', null) RETURNING id");
    const c5 = await db.querySingle("INSERT INTO categories (name, slug, parent_id) VALUES ('Cursos & Masterclasses', 'cursos-y-masterclasses', null) RETURNING id");

    const catTec = c1.id;
    const catHogar = c2.id;
    const catDigital = c3.id;
    const catSoftware = c4.id;
    const catCursos = c5.id;

    // Productos Demos
    const p1 = await db.querySingle(`
        INSERT INTO products (
            name, slug, description, type, sku, stock, category_id, brand,
            price_normal, price_offer, price_sorti, is_featured, is_recommended, is_new
        ) VALUES (
            'Auriculares Híbridos ANC SoundMax X1', 'auriculares-hibridos-anc-soundmax-x1',
            'Auriculares de diadema con cancelación activa de ruido 40dB y batería de 60 horas.',
            'physical', 'TECH-ANC-001', 45, ?, 'SoundMax', 349.90, 249.90, 12000, 1, 1, 1
        ) RETURNING id
    `, [catTec]);
    await db.execute("INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, 0)", [p1.id, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800']);

    const p2 = await db.querySingle(`
        INSERT INTO products (
            name, slug, description, type, sku, stock, category_id, brand,
            price_normal, price_offer, price_sorti, is_featured, is_recommended, is_new
        ) VALUES (
            'Smartwatch Ultra Titanium Series 9', 'smartwatch-ultra-titanium-series-9',
            'Smartwatch todoterreno con pantalla AMOLED de 2.02 pulgadas y GPS satelital.',
            'physical', 'TECH-WATCH-002', 30, ?, 'SortiTech', 499.00, 389.00, 18000, 1, 1, 1
        ) RETURNING id
    `, [catTec]);
    await db.execute("INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, 0)", [p2.id, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800']);

    const p3 = await db.querySingle(`
        INSERT INTO products (
            name, slug, description, type, sku, stock, category_id,
            price_normal, price_offer, price_sorti, is_featured, is_recommended,
            download_url, download_file_size, download_version
        ) VALUES (
            'CRM SortiEnterprise v4.2 - Licencia Ilimitada', 'crm-sortienterprise-v42-licencia-ilimitada',
            'Sistema CRM auto-hospedado para gestión de clientes y facturación electrónica.',
            'software', 'SOFT-CRM-009', 9999, ?, 899.00, 599.00, 30000, 1, 1,
            'https://example.com/downloads/sorti-crm-v4.2-setup.exe', '185 MB', 'v4.2.0 Enterprise'
        ) RETURNING id
    `, [catSoftware]);
    await db.execute("INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, 0)", [p3.id, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800']);

    const p4 = await db.querySingle(`
        INSERT INTO products (
            name, slug, description, type, sku, stock, category_id,
            price_normal, price_offer, price_sorti, is_featured, is_recommended
        ) VALUES (
            'Curso Completo Next.js 14 & Node.js: De Cero a Experto', 'curso-completo-nextjs-14-and-nodejs-de-cero-a-experto',
            'Aprende a construir plataformas web modernas de alto rendimiento con Next.js 14.',
            'course', 'CUR-NEXT-012', 9999, ?, 299.00, 149.00, 6000, 1, 1
        ) RETURNING id
    `, [catCursos]);
    await db.execute("INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, 0)", [p4.id, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800']);

    const courseNext = await db.querySingle(`
        INSERT INTO courses (product_id, title, description, cover_image)
        VALUES (?, ?, ?, ?) RETURNING id
    `, [p4.id, 'Curso Completo Next.js 14 & Node.js: De Cero a Experto', 'Aprende Next.js 14.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800']);

    const mod1 = await db.querySingle("INSERT INTO course_modules (course_id, title, sort_order) VALUES (?, 'Módulo 1: Fundamentos Next.js 14', 1) RETURNING id", [courseNext.id]);
    await db.querySingle(`
        INSERT INTO course_lessons (module_id, title, video_url, duration, pdf_url, resources_url, has_exam, sort_order)
        VALUES (?, '1.1 Bienvenida y Configuración', 'https://www.w3schools.com/html/mov_bbb.mp4', '12:30', 'https://example.com/slides.pdf', 'https://example.com/repo.zip', 0, 1)
    `, [mod1.id]);

    // Cupones
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    await db.execute("INSERT INTO coupons (code, type, value, min_spend, max_uses, expires_at) VALUES ('BIENVENIDA10', 'percent', 10, 50.00, 100, ?)", [expiryDate.toISOString()]);
    await db.execute("INSERT INTO coupons (code, type, value, min_spend, max_uses, expires_at) VALUES ('ENVIOGRATIS', 'free_shipping', 0.00, 0.00, 200, ?)", [expiryDate.toISOString()]);

    console.log('--- ¡SIEMBRA DE DATOS INICIALES FINALIZADA! ---');
}

module.exports = runSeed;

if (require.main === module) {
    (async () => {
        try {
            await runSeed();
        } catch (error) {
            console.error('Error al realizar la siembra:', error);
        }
    })();
}
