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
        console.log('Intentando conectar al pooler de Oregon con la nueva contraseña...');
        await client.connect();
        console.log('¡CONECTADO CON ÉXITO A SUPABASE!');
        const res = await client.query('SELECT version()');
        console.log(res.rows[0]);
        await client.end();
    } catch (e) {
        console.error('Error de conexión:', e.message);
    }
})();
