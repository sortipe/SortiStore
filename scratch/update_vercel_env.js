const { spawn, execSync } = require('child_process');

const envs = [
    { key: 'DB_HOST', val: 'aws-1-us-west-2.pooler.supabase.com' },
    { key: 'DB_PORT', val: '5432' },
    { key: 'DB_USER', val: 'postgres.ekqguywfuqykisjtzaxz' },
    { key: 'DB_PASSWORD', val: '@Vyjys140601' },
    { key: 'DB_NAME', val: 'postgres' }
];

function deleteEnv(key) {
    try {
        console.log(`Eliminando variable antigua ${key} de Vercel...`);
        execSync(`npx vercel env rm ${key} production -y`, { stdio: 'inherit' });
    } catch (e) {
        // Ignorar si no existe
    }
}

function addEnv(env) {
    return new Promise((resolve, reject) => {
        console.log(`Añadiendo ${env.key} con valor: ${env.val}...`);
        const child = spawn('npx', ['vercel', 'env', 'add', env.key, 'production'], {
            shell: true
        });

        // Escribir las respuestas automáticas
        child.stdin.write('y\n'); // Sensitive? Yes
        child.stdin.write(`${env.val}\n`); // Value
        child.stdin.end();

        let output = '';
        child.stdout.on('data', (d) => { output += d.toString(); });
        child.stderr.on('data', (d) => { output += d.toString(); });

        child.on('close', (code) => {
            if (code === 0) {
                console.log(`[ÉXITO] ${env.key} agregada.`);
                resolve();
            } else {
                console.error(`[ERROR] ${env.key} falló. Salida:`, output);
                reject(new Error(`Fallo en ${env.key}`));
            }
        });
    });
}

async function run() {
    // 1. Eliminar variables anteriores
    for (const env of envs) {
        deleteEnv(env.key);
    }

    // 2. Agregar nuevas variables
    for (const env of envs) {
        try {
            await addEnv(env);
        } catch (e) {
            // Ignorar para continuar
        }
    }
    console.log('Actualización de variables en Vercel finalizada.');
}

run();
