const { spawn, execSync } = require('child_process');

const envs = [
    { key: 'DB_HOST', val: 'aws-0-ca-central-1.pooler.supabase.com' },
    { key: 'DB_PORT', val: '5432' },
    { key: 'DB_USER', val: 'postgres.lsbymgreuuattsxpyexf' },
    { key: 'DB_PASSWORD', val: '@Vyjys140601' },
    { key: 'DB_NAME', val: 'postgres' },
    { key: 'SUPABASE_ID', val: 'lsbymgreuuattsxpyexf' },
    { key: 'SUPABASE_ANON_KEY', val: 'sb_publishable_nWI1cfQ26bHo2uX477ewWw_edKTJYal' },
    { key: 'JWT_SECRET', val: 'sortistore_super_secret_key_2026_2027' }
];

function deleteEnv(key) {
    try {
        console.log(`Eliminando variable antigua ${key} de Vercel...`);
        execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' });
    } catch (e) {
        // Ignorar si no existe
    }
}

function addEnv(env) {
    return new Promise((resolve) => {
        console.log(`Añadiendo ${env.key} a Vercel...`);
        const child = spawn('npx', ['vercel', 'env', 'add', env.key, 'production'], {
            shell: true
        });

        // Responder automáticamente a las preguntas del CLI de Vercel
        child.stdin.write('y\n');
        child.stdin.write(`${env.val}\n`);
        child.stdin.end();

        child.on('close', (code) => {
            if (code === 0) {
                console.log(`[ÉXITO] ${env.key} configurada.`);
            } else {
                console.log(`[AVISO] ${env.key} retornó código ${code}.`);
            }
            resolve();
        });
    });
}

async function run() {
    console.log('--- ACTUALIZANDO VARIABLES DE ENTORNO EN VERCEL ---');
    for (const env of envs) {
        deleteEnv(env.key);
    }
    for (const env of envs) {
        await addEnv(env);
    }
    console.log('Variables de entorno actualizadas en Vercel.');
}

run();
