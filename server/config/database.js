require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const OLD_SUPABASE_REF = 'lsbymgreuuattsxpyexf';
const NEW_SUPABASE_REF = 'ekqguywfuqykisjtzaxz';
const NEW_POOLER_HOST = 'aws-1-us-west-2.pooler.supabase.com';

const isPostgres = !!process.env.DB_HOST || !!process.env.VERCEL;
let pgPool = null;
let sqliteDb = null;

if (isPostgres) {
    let host = process.env.DB_HOST ? process.env.DB_HOST.trim() : NEW_POOLER_HOST;
    let user = process.env.DB_USER ? process.env.DB_USER.trim() : `postgres.${NEW_SUPABASE_REF}`;
    let password = process.env.DB_PASSWORD ? process.env.DB_PASSWORD.trim() : '@Vyjys140601';
    let port = 6543; // Modo transacción Supavisor (puerto 6543) óptimo para serverless / Vercel
    let database = process.env.DB_NAME ? process.env.DB_NAME.trim() : 'postgres';

    // Si las variables de entorno aún apuntan al proyecto antiguo (Canada ca-central-1 o lsbymgreuuattsxpyexf), migrar automáticamente al nuevo
    if (host.includes(OLD_SUPABASE_REF) || host.includes('ca-central-1') || host.includes('supabase.co')) {
        host = NEW_POOLER_HOST;
    }
    if (user.includes(OLD_SUPABASE_REF) || user === 'postgres') {
        user = `postgres.${NEW_SUPABASE_REF}`;
    }
    if (!password || password === '@vYJYS140601') {
        password = '@Vyjys140601';
    }

    console.log(`Detectada base de datos PostgreSQL/Supabase (${host}:${port}). Conectando...`);
    pgPool = new Pool({
        host,
        port,
        user,
        password,
        database,
        ssl: { rejectUnauthorized: false },
        max: 5,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 10000
    });

    pgPool.on('error', (err) => {
        console.error('Error imprevisto en pgPool:', err.message);
    });

    // Migración Postgres automática para zona VIP y otras columnas necesarias
    (async () => {
        try {
            // Verificar si la columna is_vip existe en la tabla users
            const res = await pgPool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_vip'");
            if (res.rowCount === 0) {
                console.log('Migración Postgres: agregando columnas VIP a la tabla users...');
                await pgPool.query("ALTER TABLE users ADD COLUMN is_vip INTEGER DEFAULT 0;");
                await pgPool.query("ALTER TABLE users ADD COLUMN vip_coins INTEGER DEFAULT 0;");
                await pgPool.query("ALTER TABLE users ADD COLUMN vip_last_renovation TIMESTAMP;");
            }
            
            // Crear nuevas tablas VIP si no existen
            await pgPool.query(`
                CREATE TABLE IF NOT EXISTS vip_suppliers (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    phone TEXT,
                    address TEXT,
                    map_url TEXT,
                    courses TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS vip_gifts (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    code TEXT NOT NULL,
                    type VARCHAR(50) CHECK(type IN ('streaming', 'coupon', 'gift_card')) NOT NULL,
                    status VARCHAR(50) CHECK(status IN ('available', 'claimed')) DEFAULT 'available',
                    claimed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    claimed_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS vip_raffles (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT,
                    image_url TEXT,
                    coin_cost INTEGER DEFAULT 1,
                    draw_date TIMESTAMP,
                    winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    status VARCHAR(50) CHECK(status IN ('active', 'drawn')) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS vip_raffle_entries (
                    id SERIAL PRIMARY KEY,
                    raffle_id INTEGER NOT NULL REFERENCES vip_raffles(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS streaming_platforms (
                    id SERIAL PRIMARY KEY,
                    name TEXT UNIQUE NOT NULL,
                    image_url TEXT,
                    account_type VARCHAR(50) DEFAULT 'credentials',
                    default_instructions TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS streaming_accounts (
                    id SERIAL PRIMARY KEY,
                    platform TEXT NOT NULL,
                    platform_id INTEGER REFERENCES streaming_platforms(id) ON DELETE SET NULL,
                    platform_image TEXT,
                    account_type VARCHAR(50) DEFAULT 'credentials',
                    email TEXT,
                    password TEXT,
                    profile_name TEXT,
                    profile_pin TEXT,
                    activation_link TEXT,
                    usage_instructions TEXT,
                    max_devices INTEGER DEFAULT 1,
                    expiration_date TIMESTAMP,
                    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS streaming_assignments (
                    id SERIAL PRIMARY KEY,
                    account_id INTEGER NOT NULL REFERENCES streaming_accounts(id) ON DELETE CASCADE,
                    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP
                );
            `);

            // Verificar nuevas columnas en streaming_accounts (Postgres)
            const streamCols = await pgPool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'streaming_accounts'");
            const existingStreamCols = streamCols.rows.map(r => r.column_name);
            if (!existingStreamCols.includes('platform_id')) {
                await pgPool.query("ALTER TABLE streaming_accounts ADD COLUMN platform_id INTEGER REFERENCES streaming_platforms(id) ON DELETE SET NULL;");
            }
            if (!existingStreamCols.includes('platform_image')) {
                await pgPool.query("ALTER TABLE streaming_accounts ADD COLUMN platform_image TEXT;");
            }
            if (!existingStreamCols.includes('usage_instructions')) {
                await pgPool.query("ALTER TABLE streaming_accounts ADD COLUMN usage_instructions TEXT;");
            }
            if (!existingStreamCols.includes('account_type')) {
                await pgPool.query("ALTER TABLE streaming_accounts ADD COLUMN account_type VARCHAR(50) DEFAULT 'credentials';");
            }
            // Permitir que email y password sean nulos para cuentas basadas solo en link de activación
            await pgPool.query("ALTER TABLE streaming_accounts ALTER COLUMN email DROP NOT NULL;").catch(() => {});
            await pgPool.query("ALTER TABLE streaming_accounts ALTER COLUMN password DROP NOT NULL;").catch(() => {});
            await pgPool.query("ALTER TABLE streaming_assignments ALTER COLUMN user_id DROP NOT NULL;").catch(() => {});

            // Columnas para límites de plataforma y vinculación de cuentas propias (Postgres)
            await pgPool.query("ALTER TABLE streaming_platforms ADD COLUMN IF NOT EXISTS default_max_devices INTEGER DEFAULT 1;").catch(() => {});
            await pgPool.query("ALTER TABLE streaming_assignments ADD COLUMN IF NOT EXISTS target_email TEXT;").catch(() => {});
            await pgPool.query("ALTER TABLE streaming_assignments ADD COLUMN IF NOT EXISTS link_status VARCHAR(50) DEFAULT 'active';").catch(() => {});
            await pgPool.query("ALTER TABLE streaming_assignments ADD COLUMN IF NOT EXISTS linked_at TIMESTAMP;").catch(() => {});

            // Migración para monedas Sorti: precisión decimal NUMERIC(12,2)
            await pgPool.query("ALTER TABLE user_wallets ALTER COLUMN sorti_balance TYPE NUMERIC(12,2) USING sorti_balance::numeric;").catch(() => {});
            await pgPool.query("ALTER TABLE sorti_transactions ALTER COLUMN amount TYPE NUMERIC(12,2) USING amount::numeric;").catch(() => {});
            await pgPool.query("ALTER TABLE orders ALTER COLUMN sorti_coins_used TYPE NUMERIC(12,2) USING sorti_coins_used::numeric;").catch(() => {});

            // Sembrar configuraciones de moneda Sorti por defecto si no existen
            await pgPool.query("INSERT INTO system_settings (key, value) VALUES ('sorti_coins_per_sol', '0.20') ON CONFLICT (key) DO NOTHING;").catch(() => {});
            await pgPool.query("INSERT INTO system_settings (key, value) VALUES ('sorti_coin_value', '0.50') ON CONFLICT (key) DO NOTHING;").catch(() => {});

            // Verificar columnas de streaming en products (Postgres)
            const prodPlatRes = await pgPool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'streaming_platform'");
            if (prodPlatRes.rowCount === 0) {
                await pgPool.query("ALTER TABLE products ADD COLUMN streaming_platform TEXT;");
                await pgPool.query("ALTER TABLE products ADD COLUMN streaming_account_id INTEGER;");
            }

            // Sembrar plataformas por defecto si no existen
            const countPlatforms = await pgPool.query("SELECT COUNT(*) as count FROM streaming_platforms");
            if (parseInt(countPlatforms.rows[0].count, 10) === 0) {
                console.log('Sembrando plataformas de streaming por defecto en Postgres...');
                const defaultPlatforms = [
                    {
                        name: 'Netflix',
                        image_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300',
                        account_type: 'credentials',
                        default_instructions: '⚠️ REGLAS DEL PERFIL:\n1. Ingresar únicamente al perfil indicado con su PIN de seguridad.\n2. No modificar correo, contraseña ni el idioma general de la cuenta.\n3. Máximo 1 dispositivo simultáneo para evitar bloqueos del sistema.'
                    },
                    {
                        name: 'Disney+',
                        image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300',
                        account_type: 'credentials',
                        default_instructions: '⚠️ REGLAS DEL SERVICIO:\n1. Accede solo al perfil asignado con tu PIN.\n2. Prohibido renombrar o crear perfiles adicionales.\n3. Uso personal e individual en 1 pantalla.'
                    },
                    {
                        name: 'HBO Max / Max',
                        image_url: 'https://images.unsplash.com/photo-1585951237318-9ea5e175b891?w=300',
                        account_type: 'credentials',
                        default_instructions: '⚠️ REGLAS:\n1. Ingresa exclusivamente a tu perfil asignado.\n2. No compartir las credenciales con terceros.\n3. Disfruta de todo el catálogo en calidad máxima.'
                    },
                    {
                        name: 'Spotify Familiar',
                        image_url: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=300',
                        account_type: 'activation_link',
                        default_instructions: '🎵 PASOS DE ACTIVACIÓN:\n1. Haz clic en el Link de Activación proporcionado.\n2. Inicia sesión con tu cuenta personal de Spotify.\n3. Acepta la invitación confirmando la dirección del plan familiar indicada en las notas.\n4. ¡Listo! Tu cuenta ahora es Spotify Premium sin anuncios.'
                    },
                    {
                        name: 'Gemini AI / ChatGPT',
                        image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300',
                        account_type: 'activation_link',
                        default_instructions: '🤖 ACTIVACIÓN DE ACCESO IA:\n1. Abre el enlace de invitación enviado.\n2. Acepta el acceso con tu cuenta de Google / Gmail.\n3. Disfruta de modelos avanzados y herramientas Pro.'
                    },
                    {
                        name: 'Prime Video',
                        image_url: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=300',
                        account_type: 'credentials',
                        default_instructions: '⚠️ REGLAS:\n1. Usar solo el perfil indicado.\n2. Prohibido realizar compras o alquilar películas con cargo a la tarjeta asociada.'
                    },
                    {
                        name: 'YouTube Premium',
                        image_url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300',
                        account_type: 'activation_link',
                        default_instructions: '📺 ACTIVACIÓN:\n1. Abre el enlace de invitación al grupo familiar de Google.\n2. Únete con tu correo de Gmail personal y disfruta de YouTube sin anuncios.'
                    },
                    {
                        name: 'Canva Pro',
                        image_url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=300',
                        account_type: 'activation_link',
                        default_instructions: '🎨 ACTIVACIÓN:\n1. Abre el link de invitación al equipo Canva Pro.\n2. Inicia sesión con tu cuenta gratuita de Canva y se convertirá en Pro al instante.'
                    }
                ];
                for (const plat of defaultPlatforms) {
                    await pgPool.query(`
                        INSERT INTO streaming_platforms (name, image_url, account_type, default_instructions)
                        VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING
                    `, [plat.name, plat.image_url, plat.account_type, plat.default_instructions]);
                }
            }
            console.log('Migraciones VIP y Streaming ejecutadas con éxito en Postgres.');
        } catch (err) {
            console.error("Error al aplicar migración Postgres:", err);
        }
    })();
} else {
    console.log('Usando base de datos local SQLite...');
    const { DatabaseSync } = require('node:sqlite');
    const dbPath = process.env.DB_PATH || './server/db/database.sqlite';
    const dbDir = path.dirname(path.resolve(dbPath));
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    sqliteDb = new DatabaseSync(dbPath);

    // Migración SQLite automática para asegurar que la columna features exista
    try {
        const tableInfo = sqliteDb.prepare("PRAGMA table_info(products)").all();
        const hasFeatures = tableInfo.some(col => col.name === 'features');
        if (!hasFeatures && tableInfo.length > 0) {
            console.log('Migración SQLite: agregando columna features a la tabla products...');
            sqliteDb.exec("ALTER TABLE products ADD COLUMN features TEXT;");
        }

        const hasStreamingPlat = tableInfo.some(col => col.name === 'streaming_platform');
        if (!hasStreamingPlat && tableInfo.length > 0) {
            console.log('Migración SQLite: agregando columnas de streaming a la tabla products...');
            sqliteDb.exec("ALTER TABLE products ADD COLUMN streaming_platform TEXT;");
            sqliteDb.exec("ALTER TABLE products ADD COLUMN streaming_account_id INTEGER;");
        }

        const catTableInfo = sqliteDb.prepare("PRAGMA table_info(categories)").all();
        const hasParentId = catTableInfo.some(col => col.name === 'parent_id');
        if (!hasParentId && catTableInfo.length > 0) {
            console.log('Migración SQLite: agregando columna parent_id a la tabla categories...');
            sqliteDb.exec("ALTER TABLE categories ADD COLUMN parent_id INTEGER;");
        }

        // --- MIGRACIONES VIP SQLite ---
        const userTableInfo = sqliteDb.prepare("PRAGMA table_info(users)").all();
        const hasIsVip = userTableInfo.some(col => col.name === 'is_vip');
        if (!hasIsVip && userTableInfo.length > 0) {
            console.log('Migración SQLite: agregando columnas VIP a la tabla users...');
            sqliteDb.exec("ALTER TABLE users ADD COLUMN is_vip INTEGER DEFAULT 0;");
            sqliteDb.exec("ALTER TABLE users ADD COLUMN vip_coins INTEGER DEFAULT 0;");
            sqliteDb.exec("ALTER TABLE users ADD COLUMN vip_last_renovation TEXT;");
        }

        // Crear nuevas tablas VIP y Streaming si no existen
        sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS vip_suppliers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT,
                address TEXT,
                map_url TEXT,
                courses TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS vip_gifts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                code TEXT NOT NULL,
                type TEXT CHECK(type IN ('streaming', 'coupon', 'gift_card')) NOT NULL,
                status TEXT CHECK(status IN ('available', 'claimed')) DEFAULT 'available',
                claimed_by_user_id INTEGER,
                claimed_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(claimed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
            );
            CREATE TABLE IF NOT EXISTS vip_raffles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                image_url TEXT,
                coin_cost INTEGER DEFAULT 1,
                draw_date DATETIME,
                winner_id INTEGER,
                status TEXT CHECK(status IN ('active', 'drawn')) DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(winner_id) REFERENCES users(id) ON DELETE SET NULL
            );
            CREATE TABLE IF NOT EXISTS vip_raffle_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                raffle_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(raffle_id) REFERENCES vip_raffles(id) ON DELETE CASCADE,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS streaming_platforms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                image_url TEXT,
                account_type TEXT DEFAULT 'credentials',
                default_instructions TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS streaming_accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                platform TEXT NOT NULL,
                platform_id INTEGER,
                platform_image TEXT,
                account_type TEXT DEFAULT 'credentials',
                email TEXT,
                password TEXT,
                profile_name TEXT,
                profile_pin TEXT,
                activation_link TEXT,
                usage_instructions TEXT,
                max_devices INTEGER DEFAULT 1,
                expiration_date DATETIME,
                product_id INTEGER,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(platform_id) REFERENCES streaming_platforms(id) ON DELETE SET NULL,
                FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
            );
            CREATE TABLE IF NOT EXISTS streaming_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id INTEGER NOT NULL,
                order_id INTEGER,
                user_id INTEGER,
                assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                FOREIGN KEY(account_id) REFERENCES streaming_accounts(id) ON DELETE CASCADE,
                FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE SET NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        // Comprobar nuevas columnas en SQLite para streaming_accounts
        const streamTableInfo = sqliteDb.prepare("PRAGMA table_info(streaming_accounts)").all();
        const streamColNames = streamTableInfo.map(c => c.name);
        if (!streamColNames.includes('platform_id')) {
            sqliteDb.exec("ALTER TABLE streaming_accounts ADD COLUMN platform_id INTEGER;");
        }
        if (!streamColNames.includes('platform_image')) {
            sqliteDb.exec("ALTER TABLE streaming_accounts ADD COLUMN platform_image TEXT;");
        }
        if (!streamColNames.includes('usage_instructions')) {
            sqliteDb.exec("ALTER TABLE streaming_accounts ADD COLUMN usage_instructions TEXT;");
        }
        if (!streamColNames.includes('account_type')) {
            sqliteDb.exec("ALTER TABLE streaming_accounts ADD COLUMN account_type TEXT DEFAULT 'credentials';");
        }

        // Comprobar nuevas columnas en SQLite para streaming_platforms y streaming_assignments
        const platTableInfo = sqliteDb.prepare("PRAGMA table_info(streaming_platforms)").all();
        const platColNames = platTableInfo.map(c => c.name);
        if (!platColNames.includes('default_max_devices')) {
            sqliteDb.exec("ALTER TABLE streaming_platforms ADD COLUMN default_max_devices INTEGER DEFAULT 1;");
        }

        const assTableInfo = sqliteDb.prepare("PRAGMA table_info(streaming_assignments)").all();
        const assColNames = assTableInfo.map(c => c.name);
        if (!assColNames.includes('target_email')) {
            sqliteDb.exec("ALTER TABLE streaming_assignments ADD COLUMN target_email TEXT;");
        }
        if (!assColNames.includes('link_status')) {
            sqliteDb.exec("ALTER TABLE streaming_assignments ADD COLUMN link_status TEXT DEFAULT 'active';");
        }
        if (!assColNames.includes('linked_at')) {
            sqliteDb.exec("ALTER TABLE streaming_assignments ADD COLUMN linked_at DATETIME;");
        }

        // Sembrar plataformas en SQLite si no existen
        const countPlatformsSqlite = sqliteDb.prepare("SELECT COUNT(*) as count FROM streaming_platforms").get();
        if (countPlatformsSqlite && countPlatformsSqlite.count === 0) {
            console.log('Sembrando plataformas de streaming por defecto en SQLite...');
            const defaultPlatforms = [
                {
                    name: 'Netflix',
                    image_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300',
                    account_type: 'credentials',
                    default_instructions: '⚠️ REGLAS DEL PERFIL:\n1. Ingresar únicamente al perfil indicado con su PIN de seguridad.\n2. No modificar correo, contraseña ni el idioma general de la cuenta.\n3. Máximo 1 dispositivo simultáneo para evitar bloqueos del sistema.'
                },
                {
                    name: 'Disney+',
                    image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300',
                    account_type: 'credentials',
                    default_instructions: '⚠️ REGLAS DEL SERVICIO:\n1. Accede solo al perfil asignado con tu PIN.\n2. Prohibido renombrar o crear perfiles adicionales.\n3. Uso personal e individual en 1 pantalla.'
                },
                {
                    name: 'HBO Max / Max',
                    image_url: 'https://images.unsplash.com/photo-1585951237318-9ea5e175b891?w=300',
                    account_type: 'credentials',
                    default_instructions: '⚠️ REGLAS:\n1. Ingresa exclusivamente a tu perfil asignado.\n2. No compartir las credenciales con terceros.\n3. Disfruta de todo el catálogo en calidad máxima.'
                },
                {
                    name: 'Spotify Familiar',
                    image_url: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=300',
                    account_type: 'activation_link',
                    default_instructions: '🎵 PASOS DE ACTIVACIÓN:\n1. Haz clic en el Link de Activación proporcionado.\n2. Inicia sesión con tu cuenta personal de Spotify.\n3. Acepta la invitación confirmando la dirección del plan familiar indicada en las notas.\n4. ¡Listo! Tu cuenta ahora es Spotify Premium sin anuncios.'
                },
                {
                    name: 'Gemini AI / ChatGPT',
                    image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300',
                    account_type: 'activation_link',
                    default_instructions: '🤖 ACTIVACIÓN DE ACCESO IA:\n1. Abre el enlace de invitación enviado.\n2. Acepta el acceso con tu cuenta de Google / Gmail.\n3. Disfruta de modelos avanzados y herramientas Pro.'
                },
                {
                    name: 'Prime Video',
                    image_url: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=300',
                    account_type: 'credentials',
                    default_instructions: '⚠️ REGLAS:\n1. Usar solo el perfil indicado.\n2. Prohibido realizar compras o alquilar películas con cargo a la tarjeta asociada.'
                },
                {
                    name: 'YouTube Premium',
                    image_url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300',
                    account_type: 'activation_link',
                    default_instructions: '📺 ACTIVACIÓN:\n1. Abre el enlace de invitación al grupo familiar de Google.\n2. Únete con tu correo de Gmail personal y disfruta de YouTube sin anuncios.'
                },
                {
                    name: 'Canva Pro',
                    image_url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=300',
                    account_type: 'activation_link',
                    default_instructions: '🎨 ACTIVACIÓN:\n1. Abre el link de invitación al equipo Canva Pro.\n2. Inicia sesión con tu cuenta gratuita de Canva y se convertirá en Pro al instante.'
                }
            ];
            const insertStmt = sqliteDb.prepare("INSERT INTO streaming_platforms (name, image_url, account_type, default_instructions) VALUES (?, ?, ?, ?)");
            for (const p of defaultPlatforms) {
                try { insertStmt.run(p.name, p.image_url, p.account_type, p.default_instructions); } catch (e) {}
            }
        }
    } catch (err) {
        console.error("Error al aplicar migración SQLite local:", err);
    }
}

// Traducir los placeholders "?" de SQLite/MySQL a "$1, $2..." de Postgres
function sqlToPostgres(sql) {
    let index = 1;
    return sql.replace(/\?/g, () => '$' + (index++));
}

const dbAdapter = {
    isPostgres,
    
    // Obtener todos los registros de una consulta
    async query(sql, params = []) {
        if (isPostgres) {
            const pgSql = sqlToPostgres(sql);
            const res = await pgPool.query(pgSql, params);
            return res.rows;
        } else {
            const stmt = sqliteDb.prepare(sql);
            return stmt.all(...params);
        }
    },

    // Obtener un único registro de una consulta
    async querySingle(sql, params = []) {
        if (isPostgres) {
            const pgSql = sqlToPostgres(sql);
            const res = await pgPool.query(pgSql, params);
            return res.rows[0] || null;
        } else {
            const stmt = sqliteDb.prepare(sql);
            return stmt.get(...params) || null;
        }
    },

    // Ejecutar sentencias de escritura (INSERT, UPDATE, DELETE)
    async execute(sql, params = []) {
        if (isPostgres) {
            const pgSql = sqlToPostgres(sql);
            const res = await pgPool.query(pgSql, params);
            const firstRow = res.rows[0] || {};
            // Soporta lectura del id devuelto mediante cláusula RETURNING
            return {
                lastInsertRowid: firstRow.id || firstRow.user_id || null,
                changes: res.rowCount
            };
        } else {
            const stmt = sqliteDb.prepare(sql);
            const res = stmt.run(...params);
            return {
                lastInsertRowid: res.lastInsertRowid,
                changes: res.changes
            };
        }
    },

    // Ejecutar sentencias estructuradas múltiples (Ej: Migraciones / Esquemas)
    async exec(sql) {
        if (isPostgres) {
            await pgPool.query(sql);
        } else {
            sqliteDb.exec(sql);
        }
    }
};

module.exports = dbAdapter;
