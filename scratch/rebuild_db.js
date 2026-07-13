const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const client = new Client({
    host: 'aws-1-us-west-2.pooler.supabase.com',
    port: 5432,
    user: 'postgres.ekqguywfuqykisjtzaxz',
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
        console.log('1. Conectando a Supabase...');
        await client.connect();

        console.log('2. Limpiando esquema anterior (DROP public)...');
        await client.query('DROP SCHEMA public CASCADE;');
        await client.query('CREATE SCHEMA public;');
        
        // Re-otorgar permisos estándar en Supabase
        await client.query('GRANT ALL ON SCHEMA public TO postgres;');
        await client.query('GRANT ALL ON SCHEMA public TO anon;');
        await client.query('GRANT ALL ON SCHEMA public TO authenticated;');
        await client.query('GRANT ALL ON SCHEMA public TO service_role;');
        console.log('Esquema limpio y permisos otorgados.');

        console.log('3. Creando nuevas tablas...');
        const schemaPath = path.join(__dirname, '../server/db/schema.sql');
        let schemaSql = fs.readFileSync(schemaPath, 'utf8');
        schemaSql = translateSchemaToPostgres(schemaSql);
        await client.query(schemaSql);
        console.log('Tablas creadas con éxito.');

        console.log('4. Sembrando datos iniciales...');
        // Crear Usuarios
        const adminPass = bcrypt.hashSync('@Vyjys140601', 10);
        const employeePass = bcrypt.hashSync('empleado123', 10);
        const clientPass = bcrypt.hashSync('cliente123', 10);

        const adminRes = await client.query(`
            INSERT INTO users (name, email, password_hash, role)
            VALUES ($1, $2, $3, 'admin') RETURNING id
        `, ['Administrador Jorge', 'jorgejoelifzyape@gmail.com', adminPass]);

        await client.query(`
            INSERT INTO users (name, email, password_hash, role)
            VALUES ($1, $2, $3, 'employee') RETURNING id
        `, ['Empleado Juan', 'empleado@sortistore.com', employeePass]);

        const clientRes = await client.query(`
            INSERT INTO users (name, email, password_hash, role)
            VALUES ($1, $2, $3, 'client') RETURNING id
        `, ['Cliente Premium', 'cliente@sortistore.com', clientPass]);

        const clientUserId = clientRes.rows[0].id;

        // Inicializar Billetera
        await client.query('INSERT INTO user_wallets (user_id, sorti_balance) VALUES ($1, $2)', [clientUserId, 550]);
        await client.query(`
            INSERT INTO sorti_transactions (user_id, amount, type, description)
            VALUES ($1, $2, 'earn', $3)
        `, [clientUserId, 500, 'Bono de bienvenida por registro']);
        await client.query(`
            INSERT INTO sorti_transactions (user_id, amount, type, description)
            VALUES ($1, $2, 'earn', $3)
        `, [clientUserId, 50, 'Bonificación de campaña de fidelización']);

        // Ajustes de Sistema
        await client.query("INSERT INTO system_settings (key, value) VALUES ('sorti_rate', '100')");
        const defaultBanners = [
            {
                image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600',
                badge: 'Campaña de Julio',
                title: 'Tecnología y Software en un solo lugar',
                description: 'Descubre hardware premium, cursos interactivos LMS y software empresarial con entrega instantánea.',
                link: '#/category/tecnologia',
                bg_y: 50
            },
            {
                image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1600',
                badge: 'Nuevos Lanzamientos',
                title: 'Cursos LMS de Nivel Avanzado',
                description: 'Domina Next.js, Node.js y bases de datos con nuestros módulos autodidactas.',
                link: '#/category/cursos',
                bg_y: 50
            }
        ];
        await client.query("INSERT INTO system_settings (key, value) VALUES ('home_banners', $1)", [JSON.stringify(defaultBanners)]);
        
        const defaultBranding = {
            site_name: 'SortiStore',
            primary_color: '#6366f1',
            accent_color: '#f59e0b'
        };
        await client.query("INSERT INTO system_settings (key, value) VALUES ('site_branding', $1)", [JSON.stringify(defaultBranding)]);
        
        const bankAccounts = [
            { bank: 'BCP', account: '191-98765432-0-99', CCI: '002-19198765432099-54', owner: 'Sortistore SAC' },
            { bank: 'BBVA', account: '0011-0123-0200456789', CCI: '001-101230200456789-21', owner: 'Sortistore SAC' }
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
        const c1 = await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Hogar', 'hogar', null) RETURNING id");
        const c2 = await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Tecnología', 'tecnologia', null) RETURNING id");
        const c3 = await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Ropa', 'ropa', null) RETURNING id");
        const c4 = await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Mascotas', 'mascotas', null) RETURNING id");
        const c5 = await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Contenido Digital', 'contenido-digital', null) RETURNING id");
        const c6 = await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Sistemas y Software', 'sistemas-y-software', null) RETURNING id");
        const c7 = await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Proyectos', 'proyectos', null) RETURNING id");
        const c8 = await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Cursos', 'cursos', null) RETURNING id");

        const catHogar = c1.rows[0].id;
        const catTecnologia = c2.rows[0].id;
        const catRopa = c3.rows[0].id;
        const catMascotas = c4.rows[0].id;
        const catDigital = c5.rows[0].id;
        const catSoftware = c6.rows[0].id;
        const catProyectos = c7.rows[0].id;
        const catCursos = c8.rows[0].id;

        // Subcategorías
        await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Hombre', 'ropa-hombre', $1)", [catRopa]);
        await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Mujer', 'ropa-mujer', $1)", [catRopa]);
        await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Ropa de Mascota', 'ropa-mascota', $1)", [catMascotas]);
        await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Libros y E-books', 'libros-ebooks', $1)", [catDigital]);
        await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('CRM', 'crm', $1)", [catSoftware]);
        await client.query("INSERT INTO categories (name, slug, parent_id) VALUES ('Inteligencia Artificial', 'ia-proyectos', $1)", [catProyectos]);

        // Productos de Prueba
        // 1. Auriculares
        const p1 = await client.query(`
            INSERT INTO products (
                name, slug, description, type, sku, stock, category_id,
                price_normal, price_offer, price_sorti, is_featured, is_recommended,
                is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date
            ) VALUES ($1, $2, $3, 'physical', 'TECH-ANC-001', 50, $4, 349.90, 249.90, 12000, true, true, true, false, false, false, null)
            RETURNING id
        `, ['Auriculares Híbridos ANC SoundMax X1', 'auriculares-hibridos-anc-soundmax-x1', 'Auriculares inalámbricos premium con cancelación activa de ruido híbrida de 40dB, audio Hi-Res y batería de 60 horas.', catTecnologia]);
        
        const p1Id = p1.rows[0].id;
        await client.query("INSERT INTO product_media (product_id, media_url, is_video) VALUES ($1, $2, false)", [p1Id, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800']);
        await client.query("INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES ($1, 'color', 'Negro Mate', 0, 0.0)", [p1Id]);
        await client.query("INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES ($1, 'color', 'Blanco Glaciar', 0, 0.0)", [p1Id]);

        // 2. Cafetera
        const p2 = await client.query(`
            INSERT INTO products (
                name, slug, description, type, sku, stock, category_id,
                price_normal, price_offer, price_sorti, is_featured, is_recommended,
                is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date
            ) VALUES ($1, $2, $3, 'physical', 'HOG-CAFE-002', 20, $4, 599.00, 479.00, 25000, true, false, false, false, false, false, null)
            RETURNING id
        `, ['Cafetera Espresso Retro Barista Pro', 'cafetera-espresso-retro-barista-pro', 'Cafetera de bomba de presión de 15 bares con espumador.', catHogar]);
        
        const p2Id = p2.rows[0].id;
        await client.query("INSERT INTO product_media (product_id, media_url, is_video) VALUES ($1, $2, false)", [p2Id, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800']);

        // 3. E-book
        const p3 = await client.query(`
            INSERT INTO products (
                name, slug, description, type, sku, stock, category_id,
                price_normal, price_offer, price_sorti, is_featured, is_recommended,
                is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date,
                download_url, download_file_size, download_version
            ) VALUES ($1, $2, $3, 'digital', 'DIG-BOOK-004', 9999, $4, 79.00, 39.00, 2000, false, true, true, false, false, false, null, $5, $6, $7)
            RETURNING id
        `, [
            'E-book: La Senda del Desarrollador JavaScript', 'la-senda-del-desarrollador-javascript', 
            'Guía definitiva y práctica para dominar JavaScript moderno.', 
            catDigital, 'https://example.com/downloads/js-path-ebook.pdf', '24.5 MB', 'v2.1'
        ]);
        await client.query("INSERT INTO product_media (product_id, media_url, is_video) VALUES ($1, $2, false)", [p3.rows[0].id, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800']);

        // 4. Curso NextJS
        const p4 = await client.query(`
            INSERT INTO products (
                name, slug, description, type, sku, stock, category_id,
                price_normal, price_offer, price_sorti, is_featured, is_recommended,
                is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date
            ) VALUES ($1, $2, $3, 'course', 'CUR-NEXT-008', 9999, $4, 299.00, 149.00, 6000, true, true, false, false, false, false, null)
            RETURNING id
        `, ['Curso Completo Next.js 14: De Cero a Experto', 'curso-completo-nextjs-14-de-cero-a-experto', 'Aprende a construir aplicaciones web rápidas.', catCursos]);
        
        const p4Id = p4.rows[0].id;
        await client.query("INSERT INTO product_media (product_id, media_url, is_video) VALUES ($1, $2, false)", [p4Id, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800']);

        // Estructura LMS del Curso
        const course = await client.query(`
            INSERT INTO courses (product_id, title, description, cover_image) 
            VALUES ($1, $2, $3, $4) RETURNING id
        `, [p4Id, 'Curso Completo Next.js 14: De Cero a Experto', 'Aprende a construir aplicaciones modernas y rápidas.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800']);
        
        const courseId = course.rows[0].id;
        const m1 = await client.query("INSERT INTO course_modules (course_id, title, sort_order) VALUES ($1, 'Módulo 1: Introducción y Fundamentos', 1) RETURNING id", [courseId]);
        const moduleId = m1.rows[0].id;

        const l1 = await client.query(`
            INSERT INTO course_lessons (module_id, title, video_url, duration, pdf_url, resources_url, has_exam, exam_questions, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6, false, null, 1) RETURNING id
        `, [moduleId, '1.1 Bienvenido al Curso y Configuración', 'https://www.w3schools.com/html/mov_bbb.mp4', '08:45', 'https://example.com/slides.pdf', 'https://example.com/repo.zip']);

        // Progreso lección cliente
        await client.query("INSERT INTO user_lesson_progress (user_id, lesson_id, completed) VALUES ($1, $2, true)", [clientUserId, l1.rows[0].id]);

        // Cupones
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        await client.query(`
            INSERT INTO coupons (code, type, value, min_spend, max_uses, expires_at)
            VALUES ($1, 'percent', 10, 50.00, 100, $2)
        `, ['BIENVENIDA10', expiryDate.toISOString()]);
        await client.query(`
            INSERT INTO coupons (code, type, value, min_spend, max_uses, expires_at)
            VALUES ($1, 'free_shipping', 0.00, 0.00, 200, $2)
        `, ['ENVIOGRATIS', expiryDate.toISOString()]);

        console.log('¡Siembra completada con éxito!');
    } catch (e) {
        console.error('ERROR DURANTE RECONSTRUCCIÓN:', e.message);
        console.error(e.stack);
    } finally {
        await client.end();
    }
}

rebuild();
