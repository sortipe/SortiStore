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
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'postgres',
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
