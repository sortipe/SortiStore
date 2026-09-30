const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function seedDemoSalesAndStreaming() {
    console.log('=== CREANDO PRODUCTOS DEMO DE STREAMING Y VENTAS FICTICIAS ===');

    // 1. Obtener o crear usuario cliente
    let clientUser = await db.querySingle("SELECT id FROM users WHERE email = 'cliente@sortistore.com'");
    let clientUserId;
    if (!clientUser) {
        const clientPass = bcrypt.hashSync('cliente123', 10);
        const newClient = await db.querySingle(`
            INSERT INTO users (name, email, password_hash, role, is_vip, vip_coins, vip_last_renovation)
            VALUES (?, ?, ?, 'client', 1, 15, ?) RETURNING id
        `, ['Cliente Demo Premium', 'cliente@sortistore.com', clientPass, new Date().toISOString()]);
        clientUserId = newClient.id;
    } else {
        clientUserId = clientUser.id;
    }

    // 2. Obtener o crear categoría Contenido Digital / Streaming
    let catDigital = await db.querySingle("SELECT id FROM categories WHERE slug = 'contenido-digital'");
    let catId;
    if (!catDigital) {
        const newCat = await db.querySingle("INSERT INTO categories (name, slug) VALUES ('Streaming & Digital', 'contenido-digital') RETURNING id");
        catId = newCat.id;
    } else {
        catId = catDigital.id;
    }

    // 3. Productos Demo de Streaming
    const demoStreamingProducts = [
        {
            name: 'Netflix Premium Ultra HD 4K (Perfil Privado con PIN)',
            slug: 'netflix-premium-ultra-hd-4k-perfil-privado',
            description: 'Acceso exclusivo a 1 pantalla privada Ultra HD 4K con PIN de seguridad, catálogo completo sin restricciones y soporte garantizado.',
            type: 'digital',
            sku: 'STRM-NFLX-001',
            price_normal: 19.90,
            price_offer: 12.50,
            price_sorti: 1200,
            streaming_platform: 'Netflix',
            image_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800'
        },
        {
            name: 'Disney+ Premium - Perfil Exclusivo (3 Meses)',
            slug: 'disney-plus-premium-perfil-exclusivo-3-meses',
            description: 'Disfruta de Disney, Pixar, Marvel, Star Wars y Star+ sin cortes ni anuncios publicitarios por 3 meses completos.',
            type: 'digital',
            sku: 'STRM-DISN-002',
            price_normal: 42.00,
            price_offer: 28.90,
            price_sorti: 2800,
            streaming_platform: 'Disney+',
            image_url: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800'
        },
        {
            name: 'Spotify Premium Individual (6 Meses Garantizados)',
            slug: 'spotify-premium-individual-6-meses',
            description: 'Música sin interrupciones, saltos ilimitados y descargas offline para escuchar en cualquier lugar.',
            type: 'digital',
            sku: 'STRM-SPOT-003',
            price_normal: 59.90,
            price_offer: 34.90,
            price_sorti: 3500,
            streaming_platform: 'Spotify',
            image_url: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=800'
        },
        {
            name: 'Max (HBO Max) Plan Platino 4K (1 Mes)',
            slug: 'max-hbo-max-plan-platino-4k-1-mes',
            description: 'Todas las series de HBO, películas de Warner Bros, Champions League y documentales de Discovery en calidad 4K UHD.',
            type: 'digital',
            sku: 'STRM-MAX-004',
            price_normal: 22.00,
            price_offer: 14.90,
            price_sorti: 1500,
            streaming_platform: 'HBO Max / Max',
            image_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800'
        },
        {
            name: 'YouTube Premium Sin Publicidad + Music (1 Año)',
            slug: 'youtube-premium-sin-publicidad-1-ano',
            description: 'Videos en segundo plano, descarga directa y acceso total a YouTube Music sin ningún tipo de anuncios.',
            type: 'digital',
            sku: 'STRM-YT-005',
            price_normal: 129.00,
            price_offer: 69.90,
            price_sorti: 7000,
            streaming_platform: 'YouTube Premium',
            image_url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800'
        },
        {
            name: 'Gemini Advanced & ChatGPT Plus - Acceso IA (1 Mes)',
            slug: 'gemini-advanced-chatgpt-plus-acceso-ia-1-mes',
            description: 'Acceso a los modelos más inteligentes de IA: Gemini 1.5 Pro y GPT-4o para generación de contenido, análisis de datos y código.',
            type: 'digital',
            sku: 'STRM-AI-006',
            price_normal: 49.00,
            price_offer: 24.90,
            price_sorti: 2500,
            streaming_platform: 'Gemini AI / ChatGPT',
            image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800'
        }
    ];

    const createdProductIds = [];

    for (const p of demoStreamingProducts) {
        let existing = await db.querySingle('SELECT id FROM products WHERE slug = ?', [p.slug]);
        let prodId;
        if (!existing) {
            const ins = await db.querySingle(`
                INSERT INTO products (
                    name, slug, description, type, sku, stock, category_id,
                    price_normal, price_offer, price_sorti, is_featured, is_recommended, is_new,
                    streaming_platform
                ) VALUES (?, ?, ?, ?, ?, 999, ?, ?, ?, ?, 1, 1, 1, ?)
                RETURNING id
            `, [p.name, p.slug, p.description, p.type, p.sku, catId, p.price_normal, p.price_offer, p.price_sorti, p.streaming_platform]);
            prodId = ins.id;
            await db.execute('INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, 0)', [prodId, p.image_url]);
        } else {
            prodId = existing.id;
            await db.execute('UPDATE products SET streaming_platform = ? WHERE id = ?', [p.streaming_platform, prodId]);
        }
        createdProductIds.push({ ...p, id: prodId });
    }

    console.log(`✓ ${createdProductIds.length} productos de streaming listos.`);

    // 4. Crear Cuentas de Streaming en `streaming_accounts`
    const now = new Date();
    const exp30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const exp90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const exp180 = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();
    const exp365 = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const accountsData = [
        {
            platform: 'Netflix',
            email: 'sorti.netflix01@gmail.com',
            password: 'SortiPass2026!',
            profile_name: 'Perfil 1 - Premium',
            profile_pin: '7821',
            activation_link: 'https://www.netflix.com/login',
            max_devices: 1,
            expiration_date: exp30,
            product_slug: 'netflix-premium-ultra-hd-4k-perfil-privado',
            notes: 'Cuenta renovada mensualmente con garantía total.'
        },
        {
            platform: 'Disney+',
            email: 'sorti.disney02@gmail.com',
            password: 'Disn3ySorti*2026',
            profile_name: 'Perfil VIP Joel',
            profile_pin: '1406',
            activation_link: 'https://www.disneyplus.com/login',
            max_devices: 1,
            expiration_date: exp90,
            product_slug: 'disney-plus-premium-perfil-exclusivo-3-meses',
            notes: 'Perfil personal 3 meses.'
        },
        {
            platform: 'Spotify',
            email: 'sorti.spotify03@gmail.com',
            password: 'Sp0t1fy#Sorti2026',
            profile_name: 'Plan Familiar Cupo 2',
            profile_pin: null,
            activation_link: 'https://www.spotify.com/pe-es/family/redeem/',
            max_devices: 1,
            expiration_date: exp180,
            product_slug: 'spotify-premium-individual-6-meses',
            notes: 'Invitación a familia de Spotify.'
        },
        {
            platform: 'HBO Max / Max',
            email: 'sorti.max04@gmail.com',
            password: 'MaxUltra2026!Sorti',
            profile_name: 'Max Platino 1',
            profile_pin: '9922',
            activation_link: 'https://play.max.com',
            max_devices: 1,
            expiration_date: exp30,
            product_slug: 'max-hbo-max-plan-platino-4k-1-mes',
            notes: 'Soporte 4K UHD.'
        },
        {
            platform: 'YouTube Premium',
            email: 'sorti.yt05@gmail.com',
            password: 'Youtub3Sorti!2026',
            profile_name: 'Cupo Familiar YT',
            profile_pin: null,
            activation_link: 'https://families.google.com/join',
            max_devices: 1,
            expiration_date: exp365,
            product_slug: 'youtube-premium-sin-publicidad-1-ano',
            notes: 'Plan anual activo.'
        },
        {
            platform: 'Gemini AI / ChatGPT',
            email: 'sorti.ai06@gmail.com',
            password: 'GeminiPro2026$Sorti',
            profile_name: 'Cuenta Pro',
            profile_pin: null,
            activation_link: 'https://gemini.google.com',
            max_devices: 2,
            expiration_date: exp30,
            product_slug: 'gemini-advanced-chatgpt-plus-acceso-ia-1-mes',
            notes: 'Acceso a IA Gemini Advanced.'
        }
    ];

    const savedAccounts = [];

    for (const acc of accountsData) {
        const prod = createdProductIds.find(p => p.slug === acc.product_slug);
        const prodId = prod ? prod.id : null;

        let existing = await db.querySingle('SELECT id FROM streaming_accounts WHERE email = ? AND platform = ?', [acc.email, acc.platform]);
        let accountId;
        if (!existing) {
            const ins = await db.querySingle(`
                INSERT INTO streaming_accounts (
                    platform, email, password, profile_name, profile_pin,
                    activation_link, max_devices, expiration_date, product_id, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id
            `, [
                acc.platform, acc.email, acc.password, acc.profile_name, acc.profile_pin,
                acc.activation_link, acc.max_devices, acc.expiration_date, prodId, acc.notes
            ]);
            accountId = ins.id;
        } else {
            accountId = existing.id;
            await db.execute(`
                UPDATE streaming_accounts SET
                    password = ?, profile_name = ?, profile_pin = ?,
                    activation_link = ?, expiration_date = ?, product_id = ?, notes = ?
                WHERE id = ?
            `, [
                acc.password, acc.profile_name, acc.profile_pin,
                acc.activation_link, acc.expiration_date, prodId, acc.notes, accountId
            ]);
        }
        savedAccounts.push({ ...acc, id: accountId, product_id: prodId });
    }

    console.log(`✓ ${savedAccounts.length} cuentas de streaming registradas.`);

    // 5. Crear Órdenes de Venta Ficticias / Demo para el Cliente
    const netflixProd = createdProductIds.find(p => p.slug === 'netflix-premium-ultra-hd-4k-perfil-privado');
    const disneyProd = createdProductIds.find(p => p.slug === 'disney-plus-premium-perfil-exclusivo-3-meses');
    const spotifyProd = createdProductIds.find(p => p.slug === 'spotify-premium-individual-6-meses');
    const maxProd = createdProductIds.find(p => p.slug === 'max-hbo-max-plan-platino-4k-1-mes');

    // Pedido 1: Netflix + Disney+ (Completado / Pagado)
    const order1 = await db.querySingle(`
        INSERT INTO orders (
            user_id, status, delivery_type, total_amount, payment_method, payment_proof_url, created_at
        ) VALUES (?, 'completed', 'pickup', 41.40, 'yape', 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=400', ?)
        RETURNING id
    `, [clientUserId, new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()]);

    if (order1) {
        await db.execute('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, 1, 12.50)', [order1.id, netflixProd.id]);
        await db.execute('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, 1, 28.90)', [order1.id, disneyProd.id]);

        // Asignar credenciales de streaming al cliente para esta orden
        const netflixAcc = savedAccounts.find(a => a.platform === 'Netflix');
        const disneyAcc = savedAccounts.find(a => a.platform === 'Disney+');

        if (netflixAcc) {
            await db.execute(`
                INSERT INTO streaming_assignments (account_id, order_id, user_id, expires_at)
                VALUES (?, ?, ?, ?)
            `, [netflixAcc.id, order1.id, clientUserId, exp30]);
        }
        if (disneyAcc) {
            await db.execute(`
                INSERT INTO streaming_assignments (account_id, order_id, user_id, expires_at)
                VALUES (?, ?, ?, ?)
            `, [disneyAcc.id, order1.id, clientUserId, exp90]);
        }
    }

    // Pedido 2: Spotify Premium (Completado / Pagado)
    const order2 = await db.querySingle(`
        INSERT INTO orders (
            user_id, status, delivery_type, total_amount, payment_method, payment_proof_url, created_at
        ) VALUES (?, 'completed', 'pickup', 34.90, 'bank_transfer', 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=400', ?)
        RETURNING id
    `, [clientUserId, new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()]);

    if (order2) {
        await db.execute('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, 1, 34.90)', [order2.id, spotifyProd.id]);

        const spotifyAcc = savedAccounts.find(a => a.platform === 'Spotify');
        if (spotifyAcc) {
            await db.execute(`
                INSERT INTO streaming_assignments (account_id, order_id, user_id, expires_at)
                VALUES (?, ?, ?, ?)
            `, [spotifyAcc.id, order2.id, clientUserId, exp180]);
        }
    }

    // Pedido 3: HBO Max (En Proceso / Verificado)
    const order3 = await db.querySingle(`
        INSERT INTO orders (
            user_id, status, delivery_type, total_amount, payment_method, payment_proof_url, created_at
        ) VALUES (?, 'processing', 'pickup', 14.90, 'yape', 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=400', ?)
        RETURNING id
    `, [clientUserId, new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()]);

    if (order3) {
        await db.execute('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, 1, 14.90)', [order3.id, maxProd.id]);

        const maxAcc = savedAccounts.find(a => a.platform === 'HBO Max / Max');
        if (maxAcc) {
            await db.execute(`
                INSERT INTO streaming_assignments (account_id, order_id, user_id, expires_at)
                VALUES (?, ?, ?, ?)
            `, [maxAcc.id, order3.id, clientUserId, exp30]);
        }
    }

    console.log('=== ¡SIEMBRA DE PRODUCTOS Y VENTAS STREAMING COMPLETADA CON ÉXITO! ===');
}

if (require.main === module) {
    (async () => {
        try {
            await seedDemoSalesAndStreaming();
            process.exit(0);
        } catch (e) {
            console.error('Error al sembrar ventas demo:', e);
            process.exit(1);
        }
    })();
}

module.exports = seedDemoSalesAndStreaming;
