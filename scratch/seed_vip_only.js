const db = require('../server/config/database');

async function runSeedVipOnly() {
    console.log('Iniciando siembra de datos VIP únicamente...');

    // 1. Obtener usuario cliente por defecto
    const userClient = await db.querySingle("SELECT id FROM users WHERE email = 'cliente@sortistore.com'");
    if (!userClient) {
        console.log('No se encontró el usuario cliente@sortistore.com. Abortando siembra.');
        return;
    }
    const clientUserId = userClient.id;

    // 2. Configurar como VIP
    await db.execute('UPDATE users SET is_vip = 1, vip_coins = 5, vip_last_renovation = ? WHERE id = ?', [new Date().toISOString(), clientUserId]);
    console.log('Usuario cliente@sortistore.com configurado como VIP con 5 monedas.');

    // 3. Limpiar tablas VIP antes de sembrar para evitar duplicados
    await db.execute('DELETE FROM vip_suppliers');
    await db.execute('DELETE FROM vip_gifts');
    await db.execute('DELETE FROM vip_raffles');
    await db.execute('DELETE FROM vip_raffle_entries');

    // 4. Sembrar Proveedores VIP
    await db.execute(`
        INSERT INTO vip_suppliers (name, phone, address, map_url, courses)
        VALUES (?, ?, ?, ?, ?)
    `, [
        'Importaciones Wilson Perú',
        '+51 987 654 321',
        'Av. Garcilaso de la Vega 1250, Tienda 204, Lima Centro',
        'https://maps.google.com/maps?q=Av.%20Garcilaso%20de%20la%20Vega%201250,%20Lima&t=&z=15&ie=UTF8&iwloc=&output=embed',
        'Procesadores, Tarjetas de Video, Placas Madre, Memorias RAM, SSDs, Cases Gamer'
    ]);

    await db.execute(`
        INSERT INTO vip_suppliers (name, phone, address, map_url, courses)
        VALUES (?, ?, ?, ?, ?)
    `, [
        'Distribuidora Textil Gamarra Mayoristas',
        '+51 912 345 678',
        'Jr. Huánuco 1580, Interior B, La Victoria, Lima',
        'https://maps.google.com/maps?q=Gamarra,%20La%20Victoria,%20Lima&t=&z=15&ie=UTF8&iwloc=&output=embed',
        'Polos de Algodón, Casacas, Jeans Mayoristas, Ropa Deportiva, Gorras, Ropa para Niños'
    ]);

    await db.execute(`
        INSERT INTO vip_suppliers (name, phone, address, map_url, courses)
        VALUES (?, ?, ?, ?, ?)
    `, [
        'Celulares y Gadgets Asia-Lima',
        '+51 999 888 777',
        'C.C. Polvos Azules, Sótano Pasaje 10, Tienda 5, La Victoria',
        'https://maps.google.com/maps?q=Polvos%20Azules,%20Lima&t=&z=15&ie=UTF8&iwloc=&output=embed',
        'Audífonos Bluetooth, Relojes Inteligentes, Fundas para Celulares, Cargadores Rápidos, Trípodes, Aros de Luz'
    ]);

    // 5. Sembrar Regalos
    await db.execute(`
        INSERT INTO vip_gifts (title, code, type, status)
        VALUES (?, ?, 'streaming', 'available')
    `, ['Cuenta Netflix Premium VIP (1 Mes)', 'Usuario: netflixvip@sortistore.com | Contraseña: NetflixVIP2026!']);

    await db.execute(`
        INSERT INTO vip_gifts (title, code, type, status)
        VALUES (?, ?, 'streaming', 'available')
    `, ['Acceso HBO Max Compartido', 'Usuario: hbomaxvip@sortistore.com | Contraseña: HBOMaxSorti2026']);

    await db.execute(`
        INSERT INTO vip_gifts (title, code, type, status)
        VALUES (?, ?, 'coupon', 'available')
    `, ['Código Canva Pro 1 Año', 'CANVA-PRO-VIP-2026-X8392-LMS']);

    await db.execute(`
        INSERT INTO vip_gifts (title, code, type, status, claimed_by_user_id, claimed_at)
        VALUES (?, ?, 'gift_card', 'claimed', ?, ?)
    `, ['Tarjeta de Regalo Spotify Premium (Reclamada)', 'SPOTIFY-GIFT-REDEEMED-9921', clientUserId, new Date().toISOString()]);

    await db.execute(`
        INSERT INTO vip_gifts (title, code, type, status, claimed_by_user_id, claimed_at)
        VALUES (?, ?, 'streaming', 'claimed', 1, ?)
    `, ['Cuenta Prime Video (Agotado de Prueba)', 'Usuario: primevideo@vip.com | Contraseña: primevipsecret', new Date().toISOString()]);

    // 6. Sembrar Sorteos
    const raffle1 = await db.querySingle(`
        INSERT INTO vip_raffles (title, description, image_url, coin_cost, draw_date, status)
        VALUES (?, ?, ?, 1, ?, 'active') RETURNING id
    `, [
        'Sorteo Mensual: iPhone 15 Pro Max 256GB',
        'Participa en nuestro espectacular sorteo exclusivo para miembros VIP. Cada ticket cuesta solo 1 moneda VIP. ¡Puedes comprar todos los que quieras para aumentar tus posibilidades!',
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    ]);

    const raffle2 = await db.querySingle(`
        INSERT INTO vip_raffles (title, description, image_url, coin_cost, draw_date, status)
        VALUES (?, ?, ?, 2, ?, 'active') RETURNING id
    `, [
        'Sorteo Especial: Consola PlayStation 5 Slim',
        'Llévate la mejor consola de videojuegos a casa. Cada entrada cuesta 2 monedas VIP. ¡Sorteo exclusivo con pocos cupos!',
        'https://images.unsplash.com/photo-1606813907291-d86edd9b94db?w=800',
        new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
    ]);

    const raffle3 = await db.querySingle(`
        INSERT INTO vip_raffles (title, description, image_url, coin_cost, draw_date, status, winner_id)
        VALUES (?, ?, ?, 1, ?, 'drawn', ?) RETURNING id
    `, [
        'Sorteo Anterior: Silla Gamer Ergonómica Premium',
        'Silla premium de alta densidad con soporte lumbar y reposabrazos 4D. El sorteo ha concluido y el ganador ha sido seleccionado.',
        'https://images.unsplash.com/photo-1598550476439-6847785fce6e?w=800',
        new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        clientUserId
    ]);

    if (raffle1 && raffle1.id) {
        await db.execute('INSERT INTO vip_raffle_entries (raffle_id, user_id) VALUES (?, ?)', [raffle1.id, clientUserId]);
    }
    if (raffle3 && raffle3.id) {
        await db.execute('INSERT INTO vip_raffle_entries (raffle_id, user_id) VALUES (?, ?)', [raffle3.id, clientUserId]);
    }

    console.log('¡Siembra VIP completada con éxito!');
}

runSeedVipOnly().catch(console.error);
