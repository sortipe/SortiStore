require('dotenv').config();
const { DatabaseSync } = require('node:sqlite');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const isPostgres = !!process.env.DB_HOST;
let pgPool = null;
let sqliteDb = null;

if (isPostgres) {
    console.log('Detectada base de datos PostgreSQL/Supabase. Conectando...');
    pgPool = new Pool({
        host: process.env.DB_HOST ? process.env.DB_HOST.trim() : undefined,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT.trim(), 10) : 5432,
        user: process.env.DB_USER ? process.env.DB_USER.trim() : 'postgres',
        password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.trim() : undefined,
        database: process.env.DB_NAME ? process.env.DB_NAME.trim() : 'postgres',
        ssl: { rejectUnauthorized: false } // Requerido para conexiones seguras en Supabase
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
            `);
            console.log('Migraciones VIP ejecutadas con éxito en Postgres.');
        } catch (err) {
            console.error("Error al aplicar migración Postgres:", err);
        }
    })();
} else {
    console.log('Usando base de datos local SQLite...');
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

        // Crear nuevas tablas VIP si no existen
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
        `);
    } catch (err) {
        console.error("Error al aplicar migración SQLite local:", err);
    }
}

// Traducir los placeholders "?" de SQLite/MySQL a "$1, $2..." de Postgres
function sqlToPostgres(sql) {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
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
