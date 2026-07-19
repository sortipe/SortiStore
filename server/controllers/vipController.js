const db = require('../config/database');

// Helper interno para verificar y ejecutar la renovación de monedas VIP de 30 días
async function checkVipRenovationInternal(userId) {
    const user = await db.querySingle('SELECT id, is_vip, vip_coins, vip_last_renovation FROM users WHERE id = ?', [userId]);
    if (!user || !user.is_vip) return user;

    if (user.vip_last_renovation) {
        const lastRenovation = new Date(user.vip_last_renovation);
        const now = new Date();
        const diffTime = now - lastRenovation;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffDays >= 30) {
            console.log(`Renovación VIP para usuario ${userId}: 5 monedas otorgadas.`);
            await db.execute('UPDATE users SET vip_coins = 5, vip_last_renovation = ? WHERE id = ?', [now.toISOString(), userId]);
            user.vip_coins = 5;
            user.vip_last_renovation = now.toISOString();
        }
    } else {
        // Si no tiene fecha, inicializamos hoy
        const now = new Date();
        await db.execute('UPDATE users SET vip_coins = 5, vip_last_renovation = ? WHERE id = ?', [now.toISOString(), userId]);
        user.vip_coins = 5;
        user.vip_last_renovation = now.toISOString();
    }
    return user;
}

// ==========================================
// RUTA DE CLIENTES VIP
// ==========================================

// Obtener estado VIP actual del cliente
exports.getVipStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await checkVipRenovationInternal(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        return res.json({
            is_vip: !!user.is_vip,
            vip_coins: user.vip_coins || 0,
            vip_last_renovation: user.vip_last_renovation
        });
    } catch (error) {
        console.error('Error al obtener estado VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Obtener la lista de proveedores importadores de Lima (Solo VIP)
exports.getSuppliers = async (req, res) => {
    try {
        // Verificar si es VIP (middleware ya debe validar requireAuth, pero hagamos doble check)
        const user = await db.querySingle('SELECT is_vip, role FROM users WHERE id = ?', [req.user.id]);
        if (!user || (!user.is_vip && user.role !== 'admin')) {
            return res.status(403).json({ error: 'Acceso exclusivo para miembros VIP.' });
        }

        const suppliers = await db.query('SELECT * FROM vip_suppliers ORDER BY id ASC');
        return res.json(suppliers);
    } catch (error) {
        console.error('Error al obtener proveedores VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Obtener cuentas y regalos de streaming o cupones (Solo VIP)
exports.getGifts = async (req, res) => {
    try {
        const user = await db.querySingle('SELECT is_vip, role FROM users WHERE id = ?', [req.user.id]);
        if (!user || (!user.is_vip && user.role !== 'admin')) {
            return res.status(403).json({ error: 'Acceso exclusivo para miembros VIP.' });
        }

        const gifts = await db.query(`
            SELECT g.id, g.title, g.type, g.status, g.claimed_by_user_id, g.claimed_at,
                   CASE WHEN g.status = 'available' OR g.claimed_by_user_id = ? THEN g.code ELSE 'RESERVADO' END as code,
                   u.name as claimed_by_name
            FROM vip_gifts g
            LEFT JOIN users u ON g.claimed_by_user_id = u.id
            ORDER BY g.status ASC, g.created_at DESC
        `, [req.user.id]);

        return res.json(gifts);
    } catch (error) {
        console.error('Error al obtener regalos VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Reclamar cuenta de streaming o cupón exclusivo
exports.claimGift = async (req, res) => {
    try {
        const userId = req.user.id;
        const giftId = req.params.id;

        const user = await db.querySingle('SELECT is_vip FROM users WHERE id = ?', [userId]);
        if (!user || !user.is_vip) {
            return res.status(403).json({ error: 'Acceso exclusivo para miembros VIP.' });
        }

        const gift = await db.querySingle('SELECT * FROM vip_gifts WHERE id = ?', [giftId]);
        if (!gift) {
            return res.status(404).json({ error: 'Regalo no encontrado.' });
        }

        if (gift.status !== 'available') {
            return res.status(400).json({ error: 'Este código o cuenta ya ha sido reclamado por otro usuario.' });
        }

        const now = new Date().toISOString();
        await db.execute(`
            UPDATE vip_gifts 
            SET status = 'claimed', claimed_by_user_id = ?, claimed_at = ?
            WHERE id = ?
        `, [userId, now, giftId]);

        return res.json({ message: 'Regalo reclamado con éxito.', code: gift.code });
    } catch (error) {
        console.error('Error al reclamar regalo VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Obtener sorteos (Sorteos VIP) y cantidad de participaciones
exports.getRaffles = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await db.querySingle('SELECT is_vip, role FROM users WHERE id = ?', [userId]);
        if (!user || (!user.is_vip && user.role !== 'admin')) {
            return res.status(403).json({ error: 'Acceso exclusivo para miembros VIP.' });
        }

        // Obtener todos los sorteos
        const raffles = await db.query(`
            SELECT r.*, u.name as winner_name 
            FROM vip_raffles r
            LEFT JOIN users u ON r.winner_id = u.id
            ORDER BY r.created_at DESC
        `);

        // Enriquecer con total de participaciones y participaciones del usuario
        const enrichedRaffles = await Promise.all(raffles.map(async (raffle) => {
            const totalTicketsRow = await db.querySingle('SELECT COUNT(*) as count FROM vip_raffle_entries WHERE raffle_id = ?', [raffle.id]);
            const userTicketsRow = await db.querySingle('SELECT COUNT(*) as count FROM vip_raffle_entries WHERE raffle_id = ? AND user_id = ?', [raffle.id, userId]);
            
            return {
                ...raffle,
                total_tickets: totalTicketsRow ? Number(totalTicketsRow.count) : 0,
                user_tickets: userTicketsRow ? Number(userTicketsRow.count) : 0
            };
        }));

        return res.json(enrichedRaffles);
    } catch (error) {
        console.error('Error al obtener sorteos VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Participar en un sorteo gastando monedas VIP
exports.enterRaffle = async (req, res) => {
    try {
        const userId = req.user.id;
        const raffleId = req.params.id;

        // Asegurar renovación de monedas
        const user = await checkVipRenovationInternal(userId);
        if (!user || !user.is_vip) {
            return res.status(403).json({ error: 'Acceso exclusivo para miembros VIP.' });
        }

        const raffle = await db.querySingle('SELECT * FROM vip_raffles WHERE id = ?', [raffleId]);
        if (!raffle) {
            return res.status(404).json({ error: 'Sorteo no encontrado.' });
        }

        if (raffle.status !== 'active') {
            return res.status(400).json({ error: 'Este sorteo ya ha finalizado.' });
        }

        if (user.vip_coins < raffle.coin_cost) {
            return res.status(400).json({ error: 'Monedas VIP insuficientes para participar en este sorteo.' });
        }

        // Transacción de descuento e inserción
        const newBalance = user.vip_coins - raffle.coin_cost;
        await db.execute('UPDATE users SET vip_coins = ? WHERE id = ?', [newBalance, userId]);
        await db.execute('INSERT INTO vip_raffle_entries (raffle_id, user_id) VALUES (?, ?)', [raffleId, userId]);

        return res.json({
            message: '¡Inscripción al sorteo registrada con éxito!',
            vip_coins: newBalance
        });
    } catch (error) {
        console.error('Error al entrar a sorteo VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// ==========================================
// RUTAS DE ADMINISTRACIÓN
// ==========================================

// Listar todos los usuarios para gestión VIP
exports.adminGetUsers = async (req, res) => {
    try {
        const users = await db.query(`
            SELECT id, name, email, role, is_vip, vip_coins, vip_last_renovation, created_at
            FROM users
            WHERE role = 'client'
            ORDER BY created_at DESC
        `);
        return res.json(users);
    } catch (error) {
        console.error('Error al listar usuarios para admin VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Activar/desactivar estado VIP de un cliente
exports.adminToggleUserVip = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_vip } = req.body;

        const user = await db.querySingle('SELECT id, name FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const now = new Date().toISOString();
        if (Number(is_vip) === 1) {
            // Activar VIP: Asignar 5 monedas iniciales y fijar renovación
            await db.execute(`
                UPDATE users 
                SET is_vip = 1, vip_coins = 5, vip_last_renovation = ? 
                WHERE id = ?
            `, [now, id]);
        } else {
            // Desactivar VIP
            await db.execute(`
                UPDATE users 
                SET is_vip = 0, vip_coins = 0, vip_last_renovation = NULL 
                WHERE id = ?
            `, [id]);
        }

        return res.json({ message: `Estado VIP de ${user.name} actualizado con éxito.` });
    } catch (error) {
        console.error('Error al alternar estado VIP del usuario:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Ajustar monedas VIP de un cliente
exports.adminAdjustUserVipCoins = async (req, res) => {
    try {
        const { id } = req.params;
        const { coins } = req.body;

        if (coins === undefined || Number(coins) < 0) {
            return res.status(400).json({ error: 'Cantidad de monedas inválida.' });
        }

        await db.execute('UPDATE users SET vip_coins = ? WHERE id = ?', [Number(coins), id]);
        return res.json({ message: 'Monedas VIP ajustadas con éxito.' });
    } catch (error) {
        console.error('Error al ajustar monedas VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// CRUD Proveedores
exports.adminCreateSupplier = async (req, res) => {
    try {
        const { name, phone, address, map_url, courses } = req.body;
        if (!name) return res.status(400).json({ error: 'El nombre es obligatorio.' });

        await db.execute(`
            INSERT INTO vip_suppliers (name, phone, address, map_url, courses)
            VALUES (?, ?, ?, ?, ?)
        `, [name, phone || null, address || null, map_url || null, courses || null]);

        return res.status(201).json({ message: 'Proveedor VIP creado con éxito.' });
    } catch (error) {
        console.error('Error al crear proveedor VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.adminUpdateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address, map_url, courses } = req.body;

        const supplier = await db.querySingle('SELECT id FROM vip_suppliers WHERE id = ?', [id]);
        if (!supplier) return res.status(404).json({ error: 'Proveedor no encontrado.' });

        await db.execute(`
            UPDATE vip_suppliers
            SET name = ?, phone = ?, address = ?, map_url = ?, courses = ?
            WHERE id = ?
        `, [name, phone || null, address || null, map_url || null, courses || null, id]);

        return res.json({ message: 'Proveedor VIP actualizado con éxito.' });
    } catch (error) {
        console.error('Error al actualizar proveedor VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.adminDeleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM vip_suppliers WHERE id = ?', [id]);
        return res.json({ message: 'Proveedor VIP eliminado con éxito.' });
    } catch (error) {
        console.error('Error al eliminar proveedor VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// CRUD Cuentas/Regalos
exports.adminCreateGift = async (req, res) => {
    try {
        const { title, code, type } = req.body;
        if (!title || !code || !type) {
            return res.status(400).json({ error: 'Título, código/contenido y tipo son obligatorios.' });
        }

        await db.execute(`
            INSERT INTO vip_gifts (title, code, type, status)
            VALUES (?, ?, ?, 'available')
        `, [title, code, type]);

        return res.status(201).json({ message: 'Regalo VIP creado con éxito.' });
    } catch (error) {
        console.error('Error al crear regalo VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.adminUpdateGift = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, code, type, status } = req.body;

        const gift = await db.querySingle('SELECT id FROM vip_gifts WHERE id = ?', [id]);
        if (!gift) return res.status(404).json({ error: 'Regalo no encontrado.' });

        await db.execute(`
            UPDATE vip_gifts
            SET title = ?, code = ?, type = ?, status = ?
            WHERE id = ?
        `, [title, code, type, status || 'available', id]);

        return res.json({ message: 'Regalo VIP actualizado con éxito.' });
    } catch (error) {
        console.error('Error al actualizar regalo VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.adminDeleteGift = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM vip_gifts WHERE id = ?', [id]);
        return res.json({ message: 'Regalo VIP eliminado con éxito.' });
    } catch (error) {
        console.error('Error al eliminar regalo VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// CRUD Sorteos
exports.adminCreateRaffle = async (req, res) => {
    try {
        const { title, description, image_url, coin_cost, draw_date } = req.body;
        if (!title || !draw_date) {
            return res.status(400).json({ error: 'Título y fecha de sorteo son obligatorios.' });
        }

        await db.execute(`
            INSERT INTO vip_raffles (title, description, image_url, coin_cost, draw_date, status)
            VALUES (?, ?, ?, ?, ?, 'active')
        `, [title, description || null, image_url || null, Number(coin_cost) || 1, draw_date]);

        return res.status(201).json({ message: 'Sorteo VIP creado con éxito.' });
    } catch (error) {
        console.error('Error al crear sorteo VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.adminUpdateRaffle = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, image_url, coin_cost, draw_date, status } = req.body;

        const raffle = await db.querySingle('SELECT id FROM vip_raffles WHERE id = ?', [id]);
        if (!raffle) return res.status(404).json({ error: 'Sorteo no encontrado.' });

        await db.execute(`
            UPDATE vip_raffles
            SET title = ?, description = ?, image_url = ?, coin_cost = ?, draw_date = ?, status = ?
            WHERE id = ?
        `, [title, description || null, image_url || null, Number(coin_cost) || 1, draw_date, status || 'active', id]);

        return res.json({ message: 'Sorteo VIP actualizado con éxito.' });
    } catch (error) {
        console.error('Error al actualizar sorteo VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.adminDeleteRaffle = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM vip_raffles WHERE id = ?', [id]);
        return res.json({ message: 'Sorteo VIP eliminado con éxito.' });
    } catch (error) {
        console.error('Error al eliminar sorteo VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Realizar el sorteo: Seleccionar un ganador aleatorio entre los participantes
exports.adminDrawRaffle = async (req, res) => {
    try {
        const { id } = req.params;

        const raffle = await db.querySingle('SELECT * FROM vip_raffles WHERE id = ?', [id]);
        if (!raffle) return res.status(404).json({ error: 'Sorteo no encontrado.' });

        if (raffle.status === 'drawn') {
            return res.status(400).json({ error: 'Este sorteo ya ha sido realizado anteriormente.' });
        }

        // Obtener participaciones de la tabla
        const entries = await db.query('SELECT DISTINCT user_id FROM vip_raffle_entries WHERE raffle_id = ?', [id]);
        if (entries.length === 0) {
            // No hay participantes, cambiar estado pero sin ganador
            await db.execute(`
                UPDATE vip_raffles 
                SET status = 'drawn', draw_date = ? 
                WHERE id = ?
            `, [new Date().toISOString(), id]);
            return res.json({ message: 'El sorteo finalizó pero no tuvo participantes inscritos.', winner_name: 'Ninguno' });
        }

        // Seleccionar uno al azar
        const randomIndex = Math.floor(Math.random() * entries.length);
        const winnerUserId = entries[randomIndex].user_id;

        // Obtener nombre del ganador
        const winner = await db.querySingle('SELECT name, email FROM users WHERE id = ?', [winnerUserId]);

        // Guardar ganador en la base de datos
        await db.execute(`
            UPDATE vip_raffles
            SET status = 'drawn', winner_id = ?, draw_date = ?
            WHERE id = ?
        `, [winnerUserId, new Date().toISOString(), id]);

        return res.json({
            message: '¡El sorteo se realizó con éxito!',
            winner: {
                name: winner.name,
                email: winner.email
            }
        });
    } catch (error) {
        console.error('Error al realizar sorteo VIP:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
