const db = require('../config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Traducir sintaxis SQLite a PostgreSQL para compatibilidad con Supabase
function translateSchemaToPostgres(sql) {
    let pgSql = sql;
    pgSql = pgSql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
    pgSql = pgSql.replace(/DATETIME/gi, 'TIMESTAMP');
    pgSql = pgSql.replace(/BOOLEAN DEFAULT 0/gi, 'BOOLEAN DEFAULT FALSE');
    pgSql = pgSql.replace(/BOOLEAN DEFAULT 1/gi, 'BOOLEAN DEFAULT TRUE');
    return pgSql;
}

async function runSeed() {
    console.log('Iniciando la siembra de la base de datos...');

    // 1. Ejecutar el esquema SQL para crear las tablas
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    if (db.isPostgres) {
        schemaSql = translateSchemaToPostgres(schemaSql);
    }
    
    await db.exec(schemaSql);
    console.log('Tablas creadas con éxito en base de datos.');

    // 2. Comprobar si ya existen usuarios para evitar duplicados
    const userCheck = await db.querySingle('SELECT COUNT(*) as count FROM users');
    if (userCheck && Number(userCheck.count) > 0) {
        console.log('La base de datos ya contiene datos. Omitiendo la siembra de prueba.');
        return;
    }

    // 3. Crear Usuarios por Defecto
    const adminPass = bcrypt.hashSync('@Vyjys140601', 10);
    const employeePass = bcrypt.hashSync('empleado123', 10);
    const clientPass = bcrypt.hashSync('cliente123', 10);

    const userAdmin = await db.querySingle(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES (?, ?, ?, 'admin') RETURNING id
    `, ['Administrador Jorge', 'jorgejoelifzyape@gmail.com', adminPass]);

    await db.querySingle(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES (?, ?, ?, 'employee') RETURNING id
    `, ['Empleado Juan', 'empleado@sortistore.com', employeePass]);

    const userClient = await db.querySingle(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES (?, ?, ?, 'client') RETURNING id
    `, ['Cliente Premium', 'cliente@sortistore.com', clientPass]);

    const clientUserId = userClient.id;
    console.log('Usuarios creados (admin, empleado, cliente).');

    // Inicializar billetera del cliente con 550 monedas Sorti
    await db.execute('INSERT INTO user_wallets (user_id, sorti_balance) VALUES (?, ?)', [clientUserId, 550]);
    
    await db.execute(`
        INSERT INTO sorti_transactions (user_id, amount, type, description)
        VALUES (?, ?, 'earn', ?)
    `, [clientUserId, 500, 'Bono de bienvenida por registro']);
    
    await db.execute(`
        INSERT INTO sorti_transactions (user_id, amount, type, description)
        VALUES (?, ?, 'earn', ?)
    `, [clientUserId, 50, 'Bonificación de campaña de fidelización']);
    console.log('Billetera de cliente inicializada con 550 monedas Sorti.');

    // 4. Insertar Configuraciones del Sistema
    await db.execute('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['sorti_rate', '100']);
    
    // Cuentas Bancarias
    const bankAccounts = [
        { bank: 'BCP', account: '191-98765432-0-99', CCI: '002-19198765432099-54', owner: 'Sortistore SAC' },
        { bank: 'BBVA', account: '0011-0123-0200456789', CCI: '001-101230200456789-21', owner: 'Sortistore SAC' }
    ];
    await db.execute('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['bank_accounts', JSON.stringify(bankAccounts)]);

    // Código QR de Yape
    await db.execute('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['yape_qr', 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=400']);

    // Distritos y Costos de Delivery
    const deliveryDistricts = [
        { name: 'Miraflores', cost: 7.00, time: '24-48 horas' },
        { name: 'San Isidro', cost: 7.00, time: '24-48 horas' },
        { name: 'Santiago de Surco', cost: 9.00, time: '24-48 horas' },
        { name: 'San Borja', cost: 8.00, time: '24-48 horas' },
        { name: 'La Molina', cost: 12.00, time: '48-72 horas' },
        { name: 'Lima Centro', cost: 10.00, time: '48-72 horas' }
    ];
    await db.execute('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['delivery_districts', JSON.stringify(deliveryDistricts)]);
    console.log('Configuraciones generales insertadas.');

    // 5. Insertar Categorías y Subcategorías
    const catHogarRow = await db.querySingle('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, null) RETURNING id', ['Hogar', 'hogar']);
    const catTecnologiaRow = await db.querySingle('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, null) RETURNING id', ['Tecnología', 'tecnologia']);
    const catRopaRow = await db.querySingle('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, null) RETURNING id', ['Ropa', 'ropa']);
    const catMascotasRow = await db.querySingle('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, null) RETURNING id', ['Mascotas', 'mascotas']);
    
    const catDigitalRow = await db.querySingle('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, null) RETURNING id', ['Contenido Digital', 'contenido-digital']);
    const catSoftwareRow = await db.querySingle('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, null) RETURNING id', ['Sistemas y Software', 'sistemas-y-software']);
    const catProyectosRow = await db.querySingle('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, null) RETURNING id', ['Proyectos', 'proyectos']);
    const catCursosRow = await db.querySingle('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, null) RETURNING id', ['Cursos', 'cursos']);

    const catHogar = catHogarRow.id;
    const catTecnologia = catTecnologiaRow.id;
    const catRopa = catRopaRow.id;
    const catMascotas = catMascotasRow.id;
    const catDigital = catDigitalRow.id;
    const catSoftware = catSoftwareRow.id;
    const catProyectos = catProyectosRow.id;
    const catCursos = catCursosRow.id;

    // Subcategorías
    await db.execute('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)', ['Hombre', 'ropa-hombre', catRopa]);
    await db.execute('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)', ['Mujer', 'ropa-mujer', catRopa]);
    await db.execute('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)', ['Niños', 'ropa-ninos', catRopa]);
    await db.execute('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)', ['Bebés', 'ropa-bebes', catRopa]);
    
    await db.execute('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)', ['Ropa de Mascota', 'ropa-mascota', catMascotas]);
    await db.execute('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)', ['Juguetes', 'juguetes-mascota', catMascotas]);
    await db.execute('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)', ['Accesorios', 'accesorios-mascota', catMascotas]);

    await db.execute('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)', ['Libros y E-books', 'libros-ebooks', catDigital]);
    await db.execute('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)', ['Plugins y Temas', 'plugins-temas', catDigital]);
    await db.execute('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)', ['Streaming', 'streaming', catDigital]);

    await db.execute('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)', ['CRM', 'crm', catSoftware]);
    await db.execute('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)', ['ERP', 'erp', catSoftware]);
    await db.execute('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)', ['Sistemas POS', 'sistemas-pos', catSoftware]);

    await db.execute('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)', ['Inteligencia Artificial', 'ia-proyectos', catProyectos]);
    await db.execute('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)', ['Apps Móviles', 'apps-moviles', catProyectos]);
    console.log('Categorías y subcategorías inicializadas.');

    // 6. Insertar Productos Premium de Prueba
    // -- PRODUCTO 1: Físico - Auriculares Inalámbricos (Tecnología)
    const p1Row = await db.querySingle(`
        INSERT INTO products (
            name, slug, description, type, sku, stock, category_id,
            price_normal, price_offer, price_sorti, is_featured, is_recommended,
            is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date
        ) VALUES (?, ?, ?, 'physical', 'TECH-ANC-001', 50, ?, 349.90, 249.90, 12000, 1, 1, 1, 0, 0, 0, null)
        RETURNING id
    `, ['Auriculares Híbridos ANC SoundMax X1', 'auriculares-hibridos-anc-soundmax-x1', 'Auriculares inalámbricos premium con cancelación activa de ruido híbrida de 40dB, audio Hi-Res y batería de 60 horas. Almohadillas de espuma viscoelástica para máxima comodidad.', catTecnologia]);
    
    const p1Id = p1Row.id;
    await db.execute('INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, 0)', [p1Id, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800']);
    await db.execute('INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, 0)', [p1Id, 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800']);
    await db.execute("INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES (?, 'color', 'Negro Mate', 0, 0.0)", [p1Id]);
    await db.execute("INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES (?, 'color', 'Blanco Glaciar', 0, 0.0)", [p1Id]);
    await db.execute("INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES (?, 'color', 'Azul Marino', -5, 10.0)", [p1Id]);

    // -- PRODUCTO 2: Físico - Cafetera Espresso Italiana (Hogar)
    const p2Row = await db.querySingle(`
        INSERT INTO products (
            name, slug, description, type, sku, stock, category_id,
            price_normal, price_offer, price_sorti, is_featured, is_recommended,
            is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date
        ) VALUES (?, ?, ?, 'physical', 'HOG-CAFE-002', 20, ?, 599.00, 479.00, 25000, 1, 0, 0, 0, 0, 0, null)
        RETURNING id
    `, ['Cafetera Espresso Retro Barista Pro', 'cafetera-espresso-retro-barista-pro', 'Disfruta de un auténtico café italiano en casa. Cafetera de bomba de presión de 15 bares, espumador de leche premium y diseño retro elegante en acero inoxidable.', catHogar]);
    
    const p2Id = p2Row.id;
    await db.execute('INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, 0)', [p2Id, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800']);
    await db.execute("INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES (?, 'color', 'Rojo Vintage', 0, 0.0)", [p2Id]);
    await db.execute("INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES (?, 'color', 'Crema Clásico', 0, 0.0)", [p2Id]);

    // -- PRODUCTO 3: Preventa Física - Consola SortiConsole NextGen
    const launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + 15);
    const p3Row = await db.querySingle(`
        INSERT INTO products (
            name, slug, description, type, sku, stock, category_id,
            price_normal, price_offer, price_sorti, is_featured, is_recommended,
            is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date
        ) VALUES (?, ?, ?, 'physical', 'TECH-CONS-003', 10, ?, 2499.00, 2199.00, 100000, 1, 1, 0, 0, 0, 1, ?)
        RETURNING id
    `, ['Consola SortiConsole Pro 8K (Preventa)', 'consola-sorticonsole-pro-8k', 'La consola de próxima generación ya está aquí en preventa exclusiva. Gráficos 8K a 120 FPS, almacenamiento SSD ultra rápido de 2TB y compatibilidad con realidad virtual de última generación.', catTecnologia, launchDate.toISOString()]);
    
    await db.execute('INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, 0)', [p3Row.id, 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800']);

    // -- PRODUCTO 4: Digital - E-book "Mastering JavaScript"
    const p4Row = await db.querySingle(`
        INSERT INTO products (
            name, slug, description, type, sku, stock, category_id,
            price_normal, price_offer, price_sorti, is_featured, is_recommended,
            is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date,
            download_url, download_file_size, download_version
        ) VALUES (?, ?, ?, 'digital', 'DIG-BOOK-004', 9999, ?, 79.00, 39.00, 2000, 0, 1, 1, 0, 0, 0, null, ?, ?, ?)
        RETURNING id
    `, [
        'E-book: La Senda del Desarrollador JavaScript', 'la-senda-del-desarrollador-javascript', 
        'Guía definitiva y práctica para dominar JavaScript moderno, TypeScript, patrones de diseño y arquitecturas escalables con Node.js y Express. Más de 400 páginas con ejemplos prácticos.', 
        catDigital, 'https://example.com/downloads/js-path-ebook.pdf', '24.5 MB', 'v2.1'
    ]);
    
    await db.execute('INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, 0)', [p4Row.id, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800']);

    // -- PRODUCTO 5: Streaming Digital - Suscripción Premium 1 Pantalla
    const p5Row = await db.querySingle(`
        INSERT INTO products (
            name, slug, description, type, sku, stock, category_id,
            price_normal, price_offer, price_sorti, is_featured, is_recommended,
            is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date,
            download_url, download_file_size, download_version
        ) VALUES (?, ?, ?, 'digital', 'STR-FLIX-005', 150, ?, 25.00, 18.00, 900, 0, 1, 0, 0, 0, 0, null, ?, ?, ?)
        RETURNING id
    `, [
        'Suscripción SortiFlix 30 días - 1 Pantalla UHD', 'suscripcion-sortiflix-30-dias-1-pantalla', 
        'Acceso ilimitado al mejor contenido por 30 días. Calidad Ultra HD (4K), soporte continuo y garantía durante todo el mes. Se entrega perfil y PIN privado.', 
        catDigital, '{"platform":"SortiFlix", "duration_days":30, "screens":1, "type":"perfil"}', 'N/A', 'Activo'
    ]);
    
    await db.execute('INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, 0)', [p5Row.id, 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800']);

    // -- PRODUCTO 6: Software - CRM SortiEnterprise Lite
    const p6Row = await db.querySingle(`
        INSERT INTO products (
            name, slug, description, type, sku, stock, category_id,
            price_normal, price_offer, price_sorti, is_featured, is_recommended,
            is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date,
            download_url, download_file_size, download_version
        ) VALUES (?, ?, ?, 'software', 'SOFT-CRM-006', 9999, ?, 999.00, 699.00, 35000, 1, 0, 0, 0, 0, 0, null, ?, ?, ?)
        RETURNING id
    `, [
        'Sistema CRM SortiEnterprise Lite (Licencia de por vida)', 'sistema-crm-sortienterprise-lite', 
        'Potencia las ventas de tu negocio. CRM completo con embudo de ventas, envío masivo de correos, facturación rápida, reportería inteligente e integraciones con WhatsApp API.', 
        catSoftware, 'https://example.com/downloads/sorticrm-setup.zip', '180 MB', 'v1.4.2-beta'
    ]);
    
    const p6Id = p6Row.id;
    await db.execute('INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, 0)', [p6Id, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800']);
    await db.execute("INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES (?, 'license', 'Licencia Comercial 1 PC', 0, 0.0)", [p6Id]);
    await db.execute("INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES (?, 'license', 'Licencia Corporativa 5 PCs', 0, 400.0)", [p6Id]);

    // -- PRODUCTO 7: Proyecto - App Móvil Delivery Premium
    const p7Row = await db.querySingle(`
        INSERT INTO products (
            name, slug, description, type, sku, stock, category_id,
            price_normal, price_offer, price_sorti, is_featured, is_recommended,
            is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date,
            download_url, download_file_size, download_version
        ) VALUES (?, ?, ?, 'software', 'PROJ-DELIV-007', 9999, ?, 1500.00, 1200.00, 60000, 1, 1, 1, 0, 0, 0, null, ?, ?, ?)
        RETURNING id
    `, [
        'Proyecto de Código: App de Delivery con Geolocalización', 'proyecto-app-delivery-geolocalizacion', 
        'Código fuente completo de una app móvil de delivery desarrollada en React Native y Node.js. Incluye pasarela de pagos integrada, rastreo GPS en tiempo real para repartidores y panel administrativo.', 
        catProyectos, 'https://example.com/downloads/delivery-app-source.zip', '340 MB', 'v1.0.0'
    ]);
    
    await db.execute('INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, 0)', [p7Row.id, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800']);

    // -- PRODUCTO 8: Curso - Curso Completo Next.js
    const p8Row = await db.querySingle(`
        INSERT INTO products (
            name, slug, description, type, sku, stock, category_id,
            price_normal, price_offer, price_sorti, is_featured, is_recommended,
            is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date
        ) VALUES (?, ?, ?, 'course', 'CUR-NEXT-008', 9999, ?, 299.00, 149.00, 6000, 1, 1, 0, 0, 0, 0, null)
        RETURNING id
    `, ['Curso Completo Next.js 14: De Cero a Experto', 'curso-completo-nextjs-14-de-cero-a-experto', 'Aprende a construir aplicaciones web ultra rápidas y optimizadas para SEO utilizando Next.js 14, React Server Components, Server Actions, Tailwind CSS y Prisma ORM.', catCursos]);
    
    const p8Id = p8Row.id;
    await db.execute('INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, 0)', [p8Id, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800']);

    console.log('Productos de prueba creados.');

    // 7. Estructurar el Curso en el LMS (Línea de Módulos y Clases)
    const c1Row = await db.querySingle(`
        INSERT INTO courses (product_id, title, description, cover_image) 
        VALUES (?, ?, ?, ?) RETURNING id
    `, [p8Id, 'Curso Completo Next.js 14: De Cero a Experto', 'Aprende a construir aplicaciones modernas y rápidas.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800']);
    
    const c1Id = c1Row.id;

    const m1Row = await db.querySingle('INSERT INTO course_modules (course_id, title, sort_order) VALUES (?, ?, 1) RETURNING id', [c1Id, 'Módulo 1: Introducción y Fundamentos']);
    const m2Row = await db.querySingle('INSERT INTO course_modules (course_id, title, sort_order) VALUES (?, ?, 2) RETURNING id', [c1Id, 'Módulo 2: Routing y Server Components']);
    
    const m1Id = m1Row.id;
    const m2Id = m2Row.id;

    // Clases Módulo 1
    const l1Row = await db.querySingle(`
        INSERT INTO course_lessons (module_id, title, video_url, duration, pdf_url, resources_url, has_exam, exam_questions, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, 0, null, 1) RETURNING id
    `, [m1Id, '1.1 Bienvenido al Curso y Configuración', 'https://www.w3schools.com/html/mov_bbb.mp4', '08:45', 'https://example.com/slides-m1-1.pdf', 'https://example.com/repo-m1-1.zip']);

    const l2Row = await db.querySingle(`
        INSERT INTO course_lessons (module_id, title, video_url, duration, pdf_url, resources_url, has_exam, exam_questions, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, 2) RETURNING id
    `, [m1Id, '1.2 Creando el primer proyecto con create-next-app', 'https://www.w3schools.com/html/mov_bbb.mp4', '12:20', null, 'https://example.com/repo-m1-2.zip', JSON.stringify([
        {
            question: '¿Qué comando se utiliza para inicializar un proyecto Next.js?',
            options: ['npm init next-app', 'npx create-next-app@latest', 'node create-next'],
            answer: 1
        },
        {
            question: '¿Next.js utiliza React por debajo?',
            options: ['No, es independiente', 'Sí, siempre', 'Solo si se configura'],
            answer: 1
        }
    ])]);

    // Clases Módulo 2
    await db.execute(`
        INSERT INTO course_lessons (module_id, title, video_url, duration, pdf_url, resources_url, has_exam, exam_questions, sort_order)
        VALUES (?, ?, ?, ?, ?, null, 0, null, 1)
    `, [m2Id, '2.1 App Router vs Pages Router', 'https://www.w3schools.com/html/mov_bbb.mp4', '15:10', 'https://example.com/slides-m2-1.pdf']);

    await db.execute(`
        INSERT INTO course_lessons (module_id, title, video_url, duration, pdf_url, resources_url, has_exam, exam_questions, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, 0, null, 2)
    `, [m2Id, '2.2 Server Components y Client Components', 'https://www.w3schools.com/html/mov_bbb.mp4', '18:40', 'https://example.com/slides-m2-2.pdf', 'https://example.com/code-m2-2.zip']);

    console.log('Módulos y clases de LMS creados.');

    // Simular que el cliente ya tiene el 50% del curso progresado (lección 1 completada)
    await db.execute('INSERT INTO user_lesson_progress (user_id, lesson_id, completed) VALUES (?, ?, 1)', [clientUserId, l1Row.id]);
    console.log('Progreso de curso simulado para el cliente.');

    // 8. Crear Cupones de Descuento
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    await db.execute(`
        INSERT INTO coupons (code, type, value, min_spend, max_uses, expires_at)
        VALUES (?, 'percent', 10, 50.00, 100, ?)
    `, ['BIENVENIDA10', expiryDate.toISOString()]);
    
    await db.execute(`
        INSERT INTO coupons (code, type, value, min_spend, max_uses, expires_at)
        VALUES (?, 'fixed', 25.00, 100.00, 50, ?)
    `, ['SORTSUMMER25', expiryDate.toISOString()]);
    
    await db.execute(`
        INSERT INTO coupons (code, type, value, min_spend, max_uses, expires_at)
        VALUES (?, 'free_shipping', 0.00, 0.00, 200, ?)
    `, ['ENVIOGRATIS', expiryDate.toISOString()]);
    console.log('Cupones creados (BIENVENIDA10, SORTSUMMER25, ENVIOGRATIS).');

    // 6. Sembrar Datos de Prueba para la Zona VIP
    console.log('Sembrando datos de prueba para la Zona VIP...');

    // Asegurar que el usuario cliente sea VIP en la base de datos de prueba para facilitar tests
    await db.execute('UPDATE users SET is_vip = 1, vip_coins = 5, vip_last_renovation = ? WHERE id = ?', [new Date().toISOString(), clientUserId]);
    console.log('Usuario cliente@sortistore.com configurado como VIP con 5 monedas.');

    // Proveedores VIP
    await db.execute(`
        INSERT INTO vip_suppliers (name, phone, address, map_url, courses)
        VALUES (?, ?, ?, ?, ?)
    `, [
        'Importaciones Wilson Perú',
        '+51 987 654 321',
        'Av. Garcilaso de la Vega 1250, Tienda 204, Lima Centro',
        'https://maps.google.com/maps?q=Av.%20Garcilaso%20de%20la%20Vega%201250,%20Lima&t=&z=15&ie=UTF8&iwloc=&output=embed',
        'Curso de Importación de Hardware y Componentes de PC de China'
    ]);

    await db.execute(`
        INSERT INTO vip_suppliers (name, phone, address, map_url, courses)
        VALUES (?, ?, ?, ?, ?)
    `, [
        'Distribuidora Textil Gamarra Mayoristas',
        '+51 912 345 678',
        'Jr. Huánuco 1580, Interior B, La Victoria, Lima',
        'https://maps.google.com/maps?q=Gamarra,%20La%20Victoria,%20Lima&t=&z=15&ie=UTF8&iwloc=&output=embed',
        'Curso de Creación de Marcas de Ropa y Logística Nacional'
    ]);

    await db.execute(`
        INSERT INTO vip_suppliers (name, phone, address, map_url, courses)
        VALUES (?, ?, ?, ?, ?)
    `, [
        'Celulares y Gadgets Asia-Lima',
        '+51 999 888 777',
        'C.C. Polvos Azules, Sótano Pasaje 10, Tienda 5, La Victoria',
        'https://maps.google.com/maps?q=Polvos%20Azules,%20Lima&t=&z=15&ie=UTF8&iwloc=&output=embed',
        'Curso de E-commerce Móvil y Distribución de Accesorios de Telefonía'
    ]);

    // Regalos VIP / Cuentas Streaming
    await db.execute(`
        INSERT INTO vip_gifts (title, code, type, status)
        VALUES (?, ?, 'streaming', 'available')
    `, ['Cuenta Netflix Premium VIP (1 Mes)', 'Usuario: netflixvip@sortistore.com | Contraseña: NetflixVIP2026!']);

    await db.execute(`
        INSERT INTO vip_gifts (title, code, type, status)
        VALUES (?, ?, 'streaming', 'available')
    `, ['Acceso HBO Max Compartido', 'Usuario: hbomaxvip@sortistore.com | Contraseña: HBOMaxSorti2026']);

    await db.execute(`
        INSERT INTO vip_gifts (title, code, type, status)
        VALUES (?, ?, 'coupon', 'available')
    `, ['Código Canva Pro 1 Año', 'CANVA-PRO-VIP-2026-X8392-LMS']);

    await db.execute(`
        INSERT INTO vip_gifts (title, code, type, status, claimed_by_user_id, claimed_at)
        VALUES (?, ?, 'gift_card', 'claimed', ?, ?)
    `, ['Tarjeta de Regalo Spotify Premium (Reclamada)', 'SPOTIFY-GIFT-REDEEMED-9921', clientUserId, new Date().toISOString()]);

    // Sorteos VIP
    const raffle1 = await db.querySingle(`
        INSERT INTO vip_raffles (title, description, image_url, coin_cost, draw_date, status)
        VALUES (?, ?, ?, 1, ?, 'active') RETURNING id
    `, [
        'Sorteo Mensual: iPhone 15 Pro Max 256GB',
        'Participa en nuestro espectacular sorteo exclusivo para miembros VIP. Cada ticket cuesta solo 1 moneda VIP. ¡Puedes comprar todos los que quieras para aumentar tus posibilidades!',
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // En 30 días
    ]);

    const raffle2 = await db.querySingle(`
        INSERT INTO vip_raffles (title, description, image_url, coin_cost, draw_date, status)
        VALUES (?, ?, ?, 2, ?, 'active') RETURNING id
    `, [
        'Sorteo Especial: Consola PlayStation 5 Slim',
        'Llévate la mejor consola de videojuegos a casa. Cada entrada cuesta 2 monedas VIP. ¡Sorteo exclusivo con pocos cupos!',
        'https://images.unsplash.com/photo-1606813907291-d86edd9b94db?w=800',
        new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // En 15 días
    ]);

    // Sorteo Finalizado
    const raffle3 = await db.querySingle(`
        INSERT INTO vip_raffles (title, description, image_url, coin_cost, draw_date, status, winner_id)
        VALUES (?, ?, ?, 1, ?, 'drawn', ?) RETURNING id
    `, [
        'Sorteo Anterior: Silla Gamer Ergonómica Premium',
        'Silla premium de alta densidad con soporte lumbar y reposabrazos 4D. El sorteo ha concluido y el ganador ha sido seleccionado.',
        'https://images.unsplash.com/photo-1598550476439-6847785fce6e?w=800',
        new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Hace 5 días
        clientUserId
    ]);

    // Insertar participaciones de prueba
    if (raffle1 && raffle1.id) {
        await db.execute('INSERT INTO vip_raffle_entries (raffle_id, user_id) VALUES (?, ?)', [raffle1.id, clientUserId]);
    }
    if (raffle3 && raffle3.id) {
        await db.execute('INSERT INTO vip_raffle_entries (raffle_id, user_id) VALUES (?, ?)', [raffle3.id, clientUserId]);
    }

    console.log('Datos de prueba VIP creados con éxito.');
    console.log('Siembra de la base de datos completada con éxito.');
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
