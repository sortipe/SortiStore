const { Client } = require('pg');

const client = new Client({
    host: 'aws-1-us-west-2.pooler.supabase.com',
    port: 5432,
    user: 'postgres.ekqguywfuqykisjtzaxz',
    password: '@Vyjys140601',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        await client.connect();
        console.log('Conectado. Ejecutando consulta...');
        const sql = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1 ORDER BY p.created_at DESC';
        const res = await client.query(sql);
        console.log('¡Éxito! Número de filas:', res.rowCount);
        console.log('Primera fila:', res.rows[0]);
    } catch (e) {
        console.error('ERROR DETECTADO EN LA CONSULTA:', e.message);
        console.error(e.stack);
    } finally {
        await client.end();
    }
})();
