const { spawn } = require('child_process');

const envs = [
    { key: 'DB_USER', val: 'postgres' },
    { key: 'DB_PASSWORD', val: '@vYJYS140601' },
    { key: 'DB_NAME', val: 'postgres' },
    { key: 'JWT_SECRET', val: 'sortistore_super_secret_key_2026_2027' }
];

function addEnv(env) {
    return new Promise((resolve, reject) => {
        console.log(`Añadiendo ${env.key}...`);
        const child = spawn('npx', ['vercel', 'env', 'add', env.key, 'production'], {
            shell: true
        });

        // Escribir las respuestas de inmediato a la entrada estándar
        child.stdin.write('y\n');
        child.stdin.write(`${env.val}\n`);
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
    for (const env of envs) {
        try {
            await addEnv(env);
        } catch (e) {
            // Ignorar para continuar con los demás
        }
    }
    console.log('Finalizado.');
}

run();
