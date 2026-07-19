const db = require('../server/config/database');
const bcrypt = require('bcryptjs');

async function updateAdminCredentials() {
    console.log('Actualizando credenciales de administrador...');
    
    const adminPassHash = bcrypt.hashSync('@Vyjys140601', 10);
    
    // Buscar si ya existe algún administrador
    const adminUser = await db.querySingle("SELECT id FROM users WHERE role = 'admin'");
    
    if (adminUser) {
        // Actualizar el administrador existente
        await db.execute(
            "UPDATE users SET email = ?, password_hash = ?, name = 'Administrador Jorge' WHERE id = ?",
            ['jorgejoelifzyape@gmail.com', adminPassHash, adminUser.id]
        );
        console.log(`Administrador con ID ${adminUser.id} actualizado con éxito a jorgejoelifzyape@gmail.com / @Vyjys140601`);
    } else {
        // Si no existe, crearlo
        const newAdmin = await db.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES ('Administrador Jorge', 'jorgejoelifzyape@gmail.com', ?, 'admin')",
            [adminPassHash]
        );
        console.log('No se encontró administrador. Creado nuevo administrador jorgejoelifzyape@gmail.com / @Vyjys140601');
    }
    
    // Verificar cambios
    const verify = await db.querySingle("SELECT id, name, email, role FROM users WHERE role = 'admin'");
    console.log('Credenciales vigentes de administración:', verify);
}

updateAdminCredentials().catch(console.error);
