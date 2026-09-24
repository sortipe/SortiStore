const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const client = new Client({
    host: 'aws-0-ca-central-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.lsbymgreuuattsxpyexf',
    password: '@Vyjys140601',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
});

function translateSchemaToPostgres(sql) {
    let pgSql = sql;
    pgSql = pgSql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
    pgSql = pgSql.replace(/DATETIME/gi, 'TIMESTAMP');
    pgSql = pgSql.replace(/BOOLEAN DEFAULT 0/gi, 'BOOLEAN DEFAULT FALSE');
    pgSql = pgSql.replace(/BOOLEAN DEFAULT 1/gi, 'BOOLEAN DEFAULT TRUE');
    return pgSql;
}

async function rebuild() {
    try {
        console.log('1. Conectando a Supabase (Canada ca-central-1)...');
        await client.connect();

        console.log('2. Limpiando esquema anterior en Supabase (DROP public)...');
        await client.query('DROP SCHEMA public CASCADE;');
        await client.query('CREATE SCHEMA public;');
        
        await client.query('GRANT ALL ON SCHEMA public TO postgres;');
        await client.query('GRANT ALL ON SCHEMA public TO anon;');
        await client.query('GRANT ALL ON SCHEMA public TO authenticated;');
        await client.query('GRANT ALL ON SCHEMA public TO service_role;');
        console.log('Esquema limpio.');

        console.log('3. Creando tablas en Supabase...');
        const schemaPath = path.join(__dirname, '../server/db/schema.sql');
        let schemaSql = fs.readFileSync(schemaPath, 'utf8');
        schemaSql = translateSchemaToPostgres(schemaSql);
        await client.query(schemaSql);
        console.log('Tablas creadas con éxito.');

        console.log('4. Sembrando catálogo completo de demos en Supabase...');
        const adminPass = bcrypt.hashSync('@Vyjys140601', 10);
        const employeePass = bcrypt.hashSync('empleado123', 10);
        const clientPass = bcrypt.hashSync('cliente123', 10);

        const adminRes = await client.query(`
            INSERT INTO users (name, email, password_hash, role, is_vip, vip_coins, vip_last_renovation)
            VALUES ($1, $2, $3, 'admin', TRUE, 10, CURRENT_TIMESTAMP) RETURNING id
        `, ['Administrador Jorge', 'jorgejoelifzyape@gmail.com', adminPass]);

        await client.query(`
            INSERT INTO users (name, email, password_hash, role)
            VALUES ($1, $2, $3, 'employee') RETURNING id
        `, ['Empleado Juan', 'empleado@sortistore.com', employeePass]);

        const clientRes = await client.query(`
            INSERT INTO users (name, email, password_hash, role, is_vip, vip_coins, vip_last_renovation)
            VALUES ($1, $2, $3, 'client', TRUE, 5, CURRENT_TIMESTAMP) RETURNING id
        `, ['Cliente Premium', 'cliente@sortistore.com', clientPass]);

        const clientUserId = clientRes.rows[0].id;

        // Billetera
        await client.query('INSERT INTO user_wallets (user_id, sorti_balance) VALUES ($1, $2)', [clientUserId, 75000]);
        await client.query("INSERT INTO sorti_transactions (user_id, amount, type, description) VALUES ($1, 50000, 'earn', 'Bono de bienvenida VIP')", [clientUserId]);
        await client.query("INSERT INTO sorti_transactions (user_id, amount, type, description) VALUES ($1, 25000, 'earn', 'Bonificación de recarga por compra')", [clientUserId]);

        // Configuración
        await client.query("INSERT INTO system_settings (key, value) VALUES ('sorti_rate', '100')");
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
                description: 'Aprende Desarrollo Web con Next.js 14, Arquitectura de Agentes IA y Marketing Digital.',
                link: '#/category/cursos-y-masterclasses',
                bg_y: 50
            }
        ];
        await client.query("INSERT INTO system_settings (key, value) VALUES ('home_banners', $1)", [JSON.stringify(defaultBanners)]);
        
        const defaultBranding = { site_name: 'SortiStore', primary_color: '#6366f1', accent_color: '#f59e0b' };
        await client.query("INSERT INTO system_settings (key, value) VALUES ('site_branding', $1)", [JSON.stringify(defaultBranding)]);
        
        const bankAccounts = [
            { bank: 'BCP', account: '191-98765432-0-99', CCI: '002-19198765432099-54', owner: 'SortiStore Perú S.A.C.' },
            { bank: 'BBVA', account: '0011-0123-0200456789', CCI: '001-101230200456789-21', owner: 'SortiStore Perú S.A.C.' }
        ];
        await client.query("INSERT INTO system_settings (key, value) VALUES ('bank_accounts', $1)", [JSON.stringify(bankAccounts)]);
        await client.query("INSERT INTO system_settings (key, value) VALUES ('yape_qr', 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=400')");

        const deliveryDistricts = [
            { name: 'Miraflores', cost: 7.00, time: '24-48 horas' },
            { name: 'San Isidro', cost: 7.00, time: '24-48 horas' },
            { name: 'Santiago de Surco', cost: 9.00, time: '24-48 horas' },
            { name: 'San Borja', cost: 8.00, time: '24-48 horas' },
            { name: 'La Molina', cost: 12.00, time: '48-72 horas' },
            { name: 'Lima Centro', cost: 10.00, time: '48-72 horas' }
        ];
        await client.query("INSERT INTO system_settings (key, value) VALUES ('delivery_districts', $1)", [JSON.stringify(deliveryDistricts)]);

        // Categorías
        const c1 = await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Tecnología', 'tecnologia', null) RETURNING id");
        const c2 = await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Hogar & Confort', 'hogar-y-confort', null) RETURNING id");
        const c3 = await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Ropa & Moda', 'ropa-y-moda', null) RETURNING id");
        const c4 = await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Contenido Digital', 'contenido-digital', null) RETURNING id");
        const c5 = await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Sistemas & Software', 'sistemas-y-software', null) RETURNING id");
        const c6 = await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Proyectos & IA', 'proyectos-y-ia', null) RETURNING id");
        const c7 = await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Cursos & Masterclasses', 'cursos-y-masterclasses', null) RETURNING id");
        const c8 = await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Mascotas', 'mascotas', null) RETURNING id");

        const catTec = c1.rows[0].id;
        const catHogar = c2.rows[0].id;
        const catRopa = c3.rows[0].id;
        const catDigital = c4.rows[0].id;
        const catSoftware = c5.rows[0].id;
        const catProyectos = c6.rows[0].id;
        const catCursos = c7.rows[0].id;
        const catMascotas = c8.rows[0].id;

        // Subcategorías
        const subAudio = (await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Audio Hi-Fi', 'audio-hifi', $1) RETURNING id", [catTec])).rows[0].id;
        const subSmart = (await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Smartwatches', 'smartwatches', $1) RETURNING id", [catTec])).rows[0].id;
        const subEbooks = (await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('E-books', 'ebooks', $1) RETURNING id", [catDigital])).rows[0].id;
        const subCRM = (await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('CRM & ERP', 'crm-erp', $1) RETURNING id", [catSoftware])).rows[0].id;

        // Productos Demos
        // 1. Auriculares
        const p1 = await client.query(`
            INSERT INTO products (
                name, slug, description, type, sku, stock, category_id, subcategory_id, brand,
                price_normal, price_offer, price_sorti, is_featured, is_recommended, is_new,
                features
            ) VALUES (
                'Auriculares Híbridos ANC SoundMax X1', 'auriculares-hibridos-anc-soundmax-x1',
                'Auriculares inalámbricos con cancelación activa de ruido 40dB, códec Hi-Res y batería de 60 horas.',
                'physical', 'TECH-ANC-001', 45, $1, $2, 'SoundMax',
                349.90, 249.90, 12000, TRUE, TRUE, TRUE,
                $3
            ) RETURNING id
        `, [catTec, subAudio, JSON.stringify({ "Cancelación de Ruido": "Híbrida ANC 40dB", "Batería": "60 horas", "Conectividad": "Bluetooth 5.3" })]);
        const p1Id = p1.rows[0].id;
        await client.query("INSERT INTO product_media (product_id, media_url, is_video) VALUES ($1, $2, FALSE)", [p1Id, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800']);
        await client.query("INSERT INTO product_media (product_id, media_url, is_video) VALUES ($1, $2, FALSE)", [p1Id, 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800']);
        await client.query("INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES ($1, 'color', 'Negro Mate', 0, 0.0)", [p1Id]);
        await client.query("INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES ($1, 'color', 'Blanco Glaciar', 0, 0.0)", [p1Id]);

        // 2. Smartwatch
        const p2 = await client.query(`
            INSERT INTO products (
                name, slug, description, type, sku, stock, category_id, subcategory_id, brand,
                price_normal, price_offer, price_sorti, is_featured, is_recommended, is_new,
                features
            ) VALUES (
                'Smartwatch Ultra Titanium Series 9', 'smartwatch-ultra-titanium-series-9',
                'Reloj inteligente todoterreno con caja de titanio 49mm, pantalla AMOLED HD de 2.02 pulgadas.',
                'physical', 'TECH-WATCH-002', 30, $1, $2, 'SortiTech',
                499.00, 389.00, 18000, TRUE, TRUE, TRUE,
                $3
            ) RETURNING id
        `, [catTec, subSmart, JSON.stringify({ "Pantalla": "AMOLED 2.02", "Caja": "Titanio 49mm", "Batería": "10 días" })]);
        const p2Id = p2.rows[0].id;
        await client.query("INSERT INTO product_media (product_id, media_url, is_video) VALUES ($1, $2, FALSE)", [p2Id, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800']);
        await client.query("INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES ($1, 'color', 'Titanio Naranja Alpine', 0, 0.0)", [p2Id]);
        await client.query("INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES ($1, 'color', 'Negro Estelar Ocean', 0, 0.0)", [p2Id]);

        // 3. Cafetera
        const p3 = await client.query(`
            INSERT INTO products (
                name, slug, description, type, sku, stock, category_id, brand,
                price_normal, price_offer, price_sorti, is_featured
            ) VALUES (
                'Cafetera Espresso Retro Barista Pro 15 Bar', 'cafetera-espresso-retro-barista-pro-15-bar',
                'Cafetera de bomba de presión de 15 bares con manómetro térmico vintage.',
                'physical', 'HOG-CAFE-003', 15, $1, 'BaristaPro', 599.00, 479.00, 25000, TRUE
            ) RETURNING id
        `, [catHogar]);
        await client.query("INSERT INTO product_media (product_id, media_url, is_video) VALUES ($1, $2, FALSE)", [p3.rows[0].id, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800']);

        // 4. E-book
        const p4 = await client.query(`
            INSERT INTO products (
                name, slug, description, type, sku, stock, category_id, subcategory_id,
                price_normal, price_offer, price_sorti, is_featured, is_recommended, is_new,
                download_url, download_file_size, download_version
            ) VALUES (
                'E-book: La Senda del Desarrollador Fullstack 2026', 'e-book-la-senda-del-desarrollador-fullstack-2026',
                'Manual completo en PDF y ePub de más de 450 páginas. React, Next.js 14, Node.js y Postgres.',
                'digital', 'DIG-BOOK-007', 9999, $1, $2,
                79.00, 39.00, 2000, TRUE, TRUE, TRUE,
                'https://example.com/downloads/fullstack-path-2026.pdf', '28.4 MB', 'v3.1 2026'
            ) RETURNING id
        `, [catDigital, subEbooks]);
        await client.query("INSERT INTO product_media (product_id, media_url, is_video) VALUES ($1, $2, FALSE)", [p4.rows[0].id, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800']);

        // 5. CRM Software
        const p5 = await client.query(`
            INSERT INTO products (
                name, slug, description, type, sku, stock, category_id, subcategory_id,
                price_normal, price_offer, price_sorti, is_featured, is_recommended,
                download_url, download_file_size, download_version
            ) VALUES (
                'CRM SortiEnterprise v4.2 - Licencia Ilimitada', 'crm-sortienterprise-v42-licencia-ilimitada',
                'Sistema CRM completo auto-hospedado para gestión de clientes, embudos y facturación.',
                'software', 'SOFT-CRM-009', 9999, $1, $2,
                899.00, 599.00, 30000, TRUE, TRUE,
                'https://example.com/downloads/sorti-crm-v4.2-setup.exe', '185 MB', 'v4.2.0 Enterprise'
            ) RETURNING id
        `, [catSoftware, subCRM]);
        await client.query("INSERT INTO product_media (product_id, media_url, is_video) VALUES ($1, $2, FALSE)", [p5.rows[0].id, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800']);

        // 6. Bot IA Trading
        const p6 = await client.query(`
            INSERT INTO products (
                name, slug, description, type, sku, stock, category_id,
                price_normal, price_offer, price_sorti, is_featured,
                download_url, download_file_size, download_version
            ) VALUES (
                'Bot Autónomo de Trading & Análisis Cripto AI', 'bot-autonomo-de-trading-and-analisis-cripto-ai',
                'Código fuente completo en Python + Docker. Bot ejecutable con alertas en Telegram.',
                'software', 'PROJ-CRYPTO-011', 9999, $1,
                799.00, 499.00, 28000, TRUE,
                'https://example.com/downloads/crypto-ai-agent-v3.0.tar.gz', '45 MB', 'v3.0.1'
            ) RETURNING id
        `, [catProyectos]);
        await client.query("INSERT INTO product_media (product_id, media_url, is_video) VALUES ($1, $2, FALSE)", [p6.rows[0].id, 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800']);

        // 7. Curso LMS Next.js
        const p7 = await client.query(`
            INSERT INTO products (
                name, slug, description, type, sku, stock, category_id,
                price_normal, price_offer, price_sorti, is_featured, is_recommended
            ) VALUES (
                'Curso Completo Next.js 14 & Node.js: De Cero a Experto', 'curso-completo-nextjs-14-and-nodejs-de-cero-a-experto',
                'Aprende a construir plataformas web modernas de alto rendimiento con Next.js 14.',
                'course', 'CUR-NEXT-012', 9999, $1,
                299.00, 149.00, 6000, TRUE, TRUE
            ) RETURNING id
        `, [catCursos]);
        const p7Id = p7.rows[0].id;
        await client.query("INSERT INTO product_media (product_id, media_url, is_video) VALUES ($1, $2, FALSE)", [p7Id, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800']);

        const courseNext = await client.query(`
            INSERT INTO courses (product_id, title, description, cover_image)
            VALUES ($1, $2, $3, $4) RETURNING id
        `, [p7Id, 'Curso Completo Next.js 14 & Node.js: De Cero a Experto', 'Aprende Next.js 14.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800']);
        const courseId = courseNext.rows[0].id;

        const mod1 = await client.query("INSERT INTO course_modules (course_id, title, sort_order) VALUES ($1, 'Módulo 1: Introducción a Next.js 14', 1) RETURNING id", [courseId]);
        const mod2 = await client.query("INSERT INTO course_modules (course_id, title, sort_order) VALUES ($1, 'Módulo 2: Autenticación y Supabase', 2) RETURNING id", [courseId]);

        const l1 = await client.query(`
            INSERT INTO course_lessons (module_id, title, video_url, duration, pdf_url, resources_url, has_exam, sort_order)
            VALUES ($1, '1.1 Bienvenida al Curso y Configuración', 'https://www.w3schools.com/html/mov_bbb.mp4', '12:30', 'https://example.com/slides.pdf', 'https://example.com/repo.zip', FALSE, 1) RETURNING id
        `, [mod1.rows[0].id]);

        const examQuestions = [
            {
                question: "¿Cuál es la principal ventaja de utilizar Server Components en Next.js 14?",
                options: ["Reducir el tamaño del bundle enviado al cliente", "Permite manipular directamente el DOM del navegador", "Ejecuta estilos CSS más rápido"],
                correctAnswer: 0
            }
        ];
        await client.query(`
            INSERT INTO course_lessons (module_id, title, video_url, duration, pdf_url, has_exam, exam_questions, sort_order)
            VALUES ($1, '2.1 Conexión a Supabase y Examen Módulo 2', 'https://www.w3schools.com/html/mov_bbb.mp4', '22:15', 'https://example.com/slides-mod2.pdf', TRUE, $2, 1)
        `, [mod2.rows[0].id, JSON.stringify(examQuestions)]);

        await client.query("INSERT INTO user_lesson_progress (user_id, lesson_id, completed) VALUES ($1, $2, TRUE)", [clientUserId, l1.rows[0].id]);

        // Cupones
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 45);
        await client.query("INSERT INTO coupons (code, type, value, min_spend, max_uses, expires_at) VALUES ('BIENVENIDA10', 'percent', 10, 50.00, 500, $1)", [expiryDate.toISOString()]);
        await client.query("INSERT INTO coupons (code, type, value, min_spend, max_uses, expires_at) VALUES ('ENVIOGRATIS', 'free_shipping', 0.00, 0.00, 300, $1)", [expiryDate.toISOString()]);
        await client.query("INSERT INTO coupons (code, type, value, min_spend, max_uses, expires_at) VALUES ('SORTI50OFF', 'fixed', 50.00, 200.00, 100, $1)", [expiryDate.toISOString()]);

        // Secciones VIP
        await client.query(`
            INSERT INTO vip_suppliers (name, phone, address, map_url, courses)
            VALUES ('Importaciones Wilson Perú Tech', '+51 987 654 321', 'Av. Garcilaso de la Vega 1250, Tienda 204, Lima', 'https://maps.google.com', 'Curso Importación Hardware China')
        `);
        await client.query(`
            INSERT INTO vip_suppliers (name, phone, address, map_url, courses)
            VALUES ('Distribuidora Textil Gamarra Mayoristas', '+51 912 345 678', 'Jr. Huánuco 1580, La Victoria, Lima', 'https://maps.google.com', 'Curso Marcas de Ropa')
        `);

        await client.query("INSERT INTO vip_gifts (title, code, type, status) VALUES ('Cuenta Netflix Premium VIP (1 Mes)', 'Usuario: netflixvip@sortistore.com | Clave: NetflixVIP2026!', 'streaming', 'available')");
        await client.query("INSERT INTO vip_gifts (title, code, type, status) VALUES ('Licencia Canva Pro 1 Año', 'CANVA-PRO-VIP-2026-X8392-LMS', 'coupon', 'available')");

        const raffle1 = await client.query(`
            INSERT INTO vip_raffles (title, description, image_url, coin_cost, draw_date, status)
            VALUES ('Sorteo VIP: iPhone 15 Pro Max 256GB Titanium', 'Exclusivo miembros VIP. Ticket: 1 Moneda VIP.', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800', 1, $1, 'active') RETURNING id
        `, [new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()]);

        if (raffle1.rows[0] && raffle1.rows[0].id) {
            await client.query("INSERT INTO vip_raffle_entries (raffle_id, user_id) VALUES ($1, $2)", [raffle1.rows[0].id, clientUserId]);
        }

        console.log('¡¡¡ RECONSTRUCCIÓN Y SIEMBRA COMPLETA EN SUPABASE EXITOSA !!!');
    } catch (e) {
        console.error('ERROR DURANTE LA SIEMBRA EN SUPABASE:', e.message);
        console.error(e.stack);
    } finally {
        await client.end();
    }
}

rebuild();
