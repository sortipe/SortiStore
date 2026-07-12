const db = require('../config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

function runSeed() {
    console.log('Iniciando la siembra de la base de datos...');

    // 1. Ejecutar el esquema SQL para crear las tablas
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
    console.log('Tablas creadas con éxito.');

    // 2. Comprobar si ya existen usuarios para evitar duplicados
    const userCheck = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCheck.count > 0) {
        console.log('La base de datos ya contiene datos. Omitiendo la siembra de prueba.');
        return;
    }

    // 3. Crear Usuarios por Defecto
    const adminPass = bcrypt.hashSync('admin123', 10);
    const employeePass = bcrypt.hashSync('empleado123', 10);
    const clientPass = bcrypt.hashSync('cliente123', 10);

    const insertUser = db.prepare(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES (?, ?, ?, ?)
    `);

    insertUser.run('Administrador Sorti', 'admin@sortistore.com', adminPass, 'admin');
    insertUser.run('Empleado Juan', 'empleado@sortistore.com', employeePass, 'employee');
    insertUser.run('Cliente Premium', 'cliente@sortistore.com', clientPass, 'client');
    console.log('Usuarios creados (admin, empleado, cliente).');

    // Inicializar billetera del cliente con 500 monedas Sorti
    const clientUser = db.prepare('SELECT id FROM users WHERE email = ?').get('cliente@sortistore.com');
    
    db.prepare('INSERT INTO user_wallets (user_id, sorti_balance) VALUES (?, ?)').run(clientUser.id, 550);
    
    const insertTransaction = db.prepare(`
        INSERT INTO sorti_transactions (user_id, amount, type, description)
        VALUES (?, ?, ?, ?)
    `);
    insertTransaction.run(clientUser.id, 500, 'earn', 'Bono de bienvenida por registro');
    insertTransaction.run(clientUser.id, 50, 'earn', 'Bonificación de campaña de fidelización');
    console.log('Billetera de cliente inicializada con 550 monedas Sorti.');

    // 4. Insertar Configuraciones del Sistema
    const insertSetting = db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)');
    
    // Equivalencia: 100 Monedas Sorti = S/. 1.00
    insertSetting.run('sorti_rate', '100');
    
    // Cuentas Bancarias
    const bankAccounts = [
        { bank: 'BCP', account: '191-98765432-0-99', CCI: '002-19198765432099-54', owner: 'Sortistore SAC' },
        { bank: 'BBVA', account: '0011-0123-0200456789', CCI: '001-101230200456789-21', owner: 'Sortistore SAC' }
    ];
    insertSetting.run('bank_accounts', JSON.stringify(bankAccounts));

    // Código QR de Yape
    insertSetting.run('yape_qr', 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=400'); // QR mockup

    // Distritos y Costos de Delivery
    const deliveryDistricts = [
        { name: 'Miraflores', cost: 7.00, time: '24-48 horas' },
        { name: 'San Isidro', cost: 7.00, time: '24-48 horas' },
        { name: 'Santiago de Surco', cost: 9.00, time: '24-48 horas' },
        { name: 'San Borja', cost: 8.00, time: '24-48 horas' },
        { name: 'La Molina', cost: 12.00, time: '48-72 horas' },
        { name: 'Lima Centro', cost: 10.00, time: '48-72 horas' }
    ];
    insertSetting.run('delivery_districts', JSON.stringify(deliveryDistricts));
    console.log('Configuraciones generales insertadas.');

    // 5. Insertar Categorías y Subcategorías
    const insertCategory = db.prepare('INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)');
    
    // Categorías principales
    const catHogar = insertCategory.run('Hogar', 'hogar', null).lastInsertRowid;
    const catTecnologia = insertCategory.run('Tecnología', 'tecnologia', null).lastInsertRowid;
    const catRopa = insertCategory.run('Ropa', 'ropa', null).lastInsertRowid;
    const catMascotas = insertCategory.run('Mascotas', 'mascotas', null).lastInsertRowid;
    
    const catDigital = insertCategory.run('Contenido Digital', 'contenido-digital', null).lastInsertRowid;
    const catSoftware = insertCategory.run('Sistemas y Software', 'sistemas-y-software', null).lastInsertRowid;
    const catProyectos = insertCategory.run('Proyectos', 'proyectos', null).lastInsertRowid;
    const catCursos = insertCategory.run('Cursos', 'cursos', null).lastInsertRowid;

    // Subcategorías
    // Ropa
    insertCategory.run('Hombre', 'ropa-hombre', catRopa);
    insertCategory.run('Mujer', 'ropa-mujer', catRopa);
    insertCategory.run('Niños', 'ropa-ninos', catRopa);
    insertCategory.run('Bebés', 'ropa-bebes', catRopa);
    
    // Mascotas
    insertCategory.run('Ropa de Mascota', 'ropa-mascota', catMascotas);
    insertCategory.run('Juguetes', 'juguetes-mascota', catMascotas);
    insertCategory.run('Accesorios', 'accesorios-mascota', catMascotas);

    // Contenido Digital
    insertCategory.run('Libros y E-books', 'libros-ebooks', catDigital);
    insertCategory.run('Plugins y Temas', 'plugins-temas', catDigital);
    insertCategory.run('Streaming', 'streaming', catDigital);

    // Software
    insertCategory.run('CRM', 'crm', catSoftware);
    insertCategory.run('ERP', 'erp', catSoftware);
    insertCategory.run('Sistemas POS', 'sistemas-pos', catSoftware);

    // Proyectos
    insertCategory.run('Inteligencia Artificial', 'ia-proyectos', catProyectos);
    insertCategory.run('Apps Móviles', 'apps-moviles', catProyectos);
    console.log('Categorías y subcategorías inicializadas.');

    // 6. Insertar Productos Premium de Prueba
    const insertProduct = db.prepare(`
        INSERT INTO products (
            name, slug, description, type, sku, stock, category_id,
            price_normal, price_offer, price_sorti, is_featured, is_recommended,
            is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date,
            download_url, download_file_size, download_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMedia = db.prepare('INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, ?)');
    const insertVariant = db.prepare('INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES (?, ?, ?, ?, ?)');

    // -- PRODUCTO 1: Físico - Auriculares Inalámbricos (Tecnología)
    const p1Id = insertProduct.run(
        'Auriculares Híbridos ANC SoundMax X1',
        'auriculares-hibridos-anc-soundmax-x1',
        'Auriculares inalámbricos premium con cancelación activa de ruido híbrida de 40dB, audio Hi-Res y batería de 60 horas. Almohadillas de espuma viscoelástica para máxima comodidad.',
        'physical', 'TECH-ANC-001', 50, catTecnologia,
        349.90, 249.90, 12000,
        1, 1, 1, 0, 0, 0, null,
        null, null, null
    ).lastInsertRowid;
    insertMedia.run(p1Id, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 0);
    insertMedia.run(p1Id, 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800', 0);
    insertVariant.run(p1Id, 'color', 'Negro Mate', 0, 0);
    insertVariant.run(p1Id, 'color', 'Blanco Glaciar', 0, 0);
    insertVariant.run(p1Id, 'color', 'Azul Marino', -5, 10.0);

    // -- PRODUCTO 2: Físico - Cafetera Espresso Italiana (Hogar)
    const p2Id = insertProduct.run(
        'Cafetera Espresso Retro Barista Pro',
        'cafetera-espresso-retro-barista-pro',
        'Disfruta de un auténtico café italiano en casa. Cafetera de bomba de presión de 15 bares, espumador de leche premium y diseño retro elegante en acero inoxidable.',
        'physical', 'HOG-CAFE-002', 20, catHogar,
        599.00, 479.00, 25000,
        1, 0, 0, 0, 0, 0, null,
        null, null, null
    ).lastInsertRowid;
    insertMedia.run(p2Id, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800', 0);
    insertVariant.run(p2Id, 'color', 'Rojo Vintage', 0, 0);
    insertVariant.run(p2Id, 'color', 'Crema Clásico', 0, 0);

    // -- PRODUCTO 3: Preventa Física - Consola SortiConsole NextGen
    const launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + 15); // Lanza en 15 días
    const p3Id = insertProduct.run(
        'Consola SortiConsole Pro 8K (Preventa)',
        'consola-sorticonsole-pro-8k',
        'La consola de próxima generación ya está aquí en preventa exclusiva. Gráficos 8K a 120 FPS, almacenamiento SSD ultra rápido de 2TB y compatibilidad con realidad virtual de última generación.',
        'physical', 'TECH-CONS-003', 10, catTecnologia,
        2499.00, 2199.00, 100000,
        1, 1, 0, 0, 0, 1, launchDate.toISOString(),
        null, null, null
    ).lastInsertRowid;
    insertMedia.run(p3Id, 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800', 0);

    // -- PRODUCTO 4: Digital - E-book "Mastering JavaScript & Node.js"
    const p4Id = insertProduct.run(
        'E-book: La Senda del Desarrollador JavaScript',
        'la-senda-del-desarrollador-javascript',
        'Guía definitiva y práctica para dominar JavaScript moderno, TypeScript, patrones de diseño y arquitecturas escalables con Node.js y Express. Más de 400 páginas con ejemplos prácticos.',
        'digital', 'DIG-BOOK-004', 9999, catDigital,
        79.00, 39.00, 2000,
        0, 1, 1, 0, 0, 0, null,
        'https://example.com/downloads/js-path-ebook.pdf', '24.5 MB', 'v2.1'
    ).lastInsertRowid;
    insertMedia.run(p4Id, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800', 0);

    // -- PRODUCTO 5: Streaming Digital - Suscripción Premium 1 Pantalla
    const p5Id = insertProduct.run(
        'Suscripción SortiFlix 30 días - 1 Pantalla UHD',
        'suscripcion-sortiflix-30-dias-1-pantalla',
        'Acceso ilimitado al mejor contenido por 30 días. Calidad Ultra HD (4K), soporte continuo y garantía durante todo el mes. Se entrega perfil y PIN privado.',
        'digital', 'STR-FLIX-005', 150, catDigital,
        25.00, 18.00, 900,
        0, 1, 0, 0, 0, 0, null,
        '{"platform":"SortiFlix", "duration_days":30, "screens":1, "type":"perfil"}', 'N/A', 'Activo'
    ).lastInsertRowid;
    insertMedia.run(p5Id, 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800', 0);

    // -- PRODUCTO 6: Software - CRM SortiEnterprise Lite
    const p6Id = insertProduct.run(
        'Sistema CRM SortiEnterprise Lite (Licencia de por vida)',
        'sistema-crm-sortienterprise-lite',
        'Potencia las ventas de tu negocio. CRM completo con embudo de ventas, envío masivo de correos, facturación rápida, reportería inteligente e integraciones con WhatsApp API.',
        'software', 'SOFT-CRM-006', 9999, catSoftware,
        999.00, 699.00, 35000,
        1, 0, 0, 0, 0, 0, null,
        'https://example.com/downloads/sorticrm-setup.zip', '180 MB', 'v1.4.2-beta'
    ).lastInsertRowid;
    insertMedia.run(p6Id, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', 0);
    insertVariant.run(p6Id, 'license', 'Licencia Comercial 1 PC', 0, 0);
    insertVariant.run(p6Id, 'license', 'Licencia Corporativa 5 PCs', 0, 400.0);

    // -- PRODUCTO 7: Proyecto - App Móvil Delivery Premium
    const p7Id = insertProduct.run(
        'Proyecto de Código: App de Delivery con Geolocalización',
        'proyecto-app-delivery-geolocalizacion',
        'Código fuente completo de una app móvil de delivery desarrollada en React Native y Node.js. Incluye pasarela de pagos integrada, rastreo GPS en tiempo real para repartidores y panel administrativo.',
        'software', 'PROJ-DELIV-007', 9999, catProyectos,
        1500.00, 1200.00, 60000,
        1, 1, 1, 0, 0, 0, null,
        'https://example.com/downloads/delivery-app-source.zip', '340 MB', 'v1.0.0'
    ).lastInsertRowid;
    insertMedia.run(p7Id, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', 0);

    // -- PRODUCTO 8: Curso - Curso Completo Next.js
    const p8Id = insertProduct.run(
        'Curso Completo Next.js 14: De Cero a Experto',
        'curso-completo-nextjs-14-de-cero-a-experto',
        'Aprende a construir aplicaciones web ultra rápidas y optimizadas para SEO utilizando Next.js 14, React Server Components, Server Actions, Tailwind CSS y Prisma ORM.',
        'course', 'CUR-NEXT-008', 9999, catCursos,
        299.00, 149.00, 6000,
        1, 1, 0, 0, 0, 0, null,
        null, null, null
    ).lastInsertRowid;
    insertMedia.run(p8Id, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800', 0);

    console.log('Productos de prueba creados.');

    // 7. Estructurar el Curso en el LMS (Línea de Módulos y Clases)
    const c1Id = db.prepare('INSERT INTO courses (product_id, title, description, cover_image) VALUES (?, ?, ?, ?)')
        .run(p8Id, 'Curso Completo Next.js 14: De Cero a Experto', 'Aprende a construir aplicaciones modernas y rápidas.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800')
        .lastInsertRowid;

    const m1Id = db.prepare('INSERT INTO course_modules (course_id, title, sort_order) VALUES (?, ?, ?)').run(c1Id, 'Módulo 1: Introducción y Fundamentos', 1).lastInsertRowid;
    const m2Id = db.prepare('INSERT INTO course_modules (course_id, title, sort_order) VALUES (?, ?, ?)').run(c1Id, 'Módulo 2: Routing y Server Components', 2).lastInsertRowid;

    // Clases Módulo 1
    const l1Id = db.prepare(`
        INSERT INTO course_lessons (module_id, title, video_url, duration, pdf_url, resources_url, has_exam, exam_questions, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(m1Id, '1.1 Bienvenido al Curso y Configuración', 'https://www.w3schools.com/html/mov_bbb.mp4', '08:45', 'https://example.com/slides-m1-1.pdf', 'https://example.com/repo-m1-1.zip', 0, null, 1).lastInsertRowid;

    const l2Id = db.prepare(`
        INSERT INTO course_lessons (module_id, title, video_url, duration, pdf_url, resources_url, has_exam, exam_questions, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(m1Id, '1.2 Creando el primer proyecto con create-next-app', 'https://www.w3schools.com/html/mov_bbb.mp4', '12:20', null, 'https://example.com/repo-m1-2.zip', 1, JSON.stringify([
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
    ]), 2).lastInsertRowid;

    // Clases Módulo 2
    const l3Id = db.prepare(`
        INSERT INTO course_lessons (module_id, title, video_url, duration, pdf_url, resources_url, has_exam, exam_questions, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(m2Id, '2.1 App Router vs Pages Router', 'https://www.w3schools.com/html/mov_bbb.mp4', '15:10', 'https://example.com/slides-m2-1.pdf', null, 0, null, 1).lastInsertRowid;

    const l4Id = db.prepare(`
        INSERT INTO course_lessons (module_id, title, video_url, duration, pdf_url, resources_url, has_exam, exam_questions, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(m2Id, '2.2 Server Components y Client Components', 'https://www.w3schools.com/html/mov_bbb.mp4', '18:40', 'https://example.com/slides-m2-2.pdf', 'https://example.com/code-m2-2.zip', 0, null, 2).lastInsertRowid;

    console.log('Módulos y clases de LMS creados.');

    // Simular que el cliente ya tiene el 50% del curso progresado (lección 1 completada)
    db.prepare('INSERT INTO user_lesson_progress (user_id, lesson_id, completed) VALUES (?, ?, 1)').run(clientUser.id, l1Id);
    console.log('Progreso de curso simulado para el cliente.');

    // 8. Crear Cupones de Descuento
    const insertCoupon = db.prepare(`
        INSERT INTO coupons (code, type, value, min_spend, max_uses, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // Vence en 30 días
    
    insertCoupon.run('BIENVENIDA10', 'percent', 10, 50.00, 100, expiryDate.toISOString());
    insertCoupon.run('SORTSUMMER25', 'fixed', 25.00, 100.00, 50, expiryDate.toISOString());
    insertCoupon.run('ENVIOGRATIS', 'free_shipping', 0.00, 0.00, 200, expiryDate.toISOString());
    console.log('Cupones creados (BIENVENIDA10, SORTSUMMER25, ENVIOGRATIS).');

    console.log('Siembra de la base de datos completada con éxito.');
}

try {
    runSeed();
} catch (error) {
    console.error('Error al realizar la siembra:', error);
}
