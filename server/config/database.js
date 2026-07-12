const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './server/db/database.sqlite';

// Asegurar que el directorio de la base de datos exista
const dbDir = path.dirname(path.resolve(dbPath));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Inicializar la base de datos de manera síncrona nativa de Node.js
const db = new DatabaseSync(dbPath);

console.log('Conexión a la base de datos SQLite establecida con éxito.');

module.exports = db;
