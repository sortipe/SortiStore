const { spawn } = require('child_process');

const envs = [
    { key: 'DB_PORT', val: '5432' },
    { key: 'DB_USER', val: 'postgres' },
    { key: 'DB_PASSWORD', val: '@vYJYS140601' },
    { key: 'DB_NAME', val: 'postgres' },
    { key: 'JWT_SECRET', val: 'sortistore_super_secret_key_2026_2027' }
];

function addEnv(env) {
    return new Promise((resolve, reject) => {
        console.log(`\n--- Añadiendo variable ${env.key} ---`);
        const child = spawn('npx', ['vercel', 'env', 'add', env.key, 'production'], {
            shell: true
        });

        child.stdout.on('data', (data) => {
            const output = data.toString();
            // Detectar preguntas y responder automáticamente
            if (output.includes('sensitive?')) {
                child.stdin.write('y\n');
            } else if (output.includes('value of')) {
                child.stdin.write(`${env.val}\n`);
            }
        });

        child.on('close', (code) => {
            if (code === 0) {
                console.log(`[ÉXITO] Variable ${env.key} añadida.`);
                resolve();
            } else {
                reject(new Error(`Variable ${env.key} falló con código ${code}`));
            }
        });
    });
}

async function run() {
    for (const env of envs) {
        try {
            await addEnv(env);
        } catch (e) {
            console.error(e.message);
        }
    }
    console.log('\n--- Finalizado el registro de variables ---');
}

run();
