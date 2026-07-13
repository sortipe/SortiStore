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
