const db = require('../config/database');

// 1. Obtener todas las Cuentas / Perfiles de Streaming con sus usuarios asignados
exports.getAccounts = async (req, res) => {
    try {
        const { platform, search, product_id } = req.query;
        let query = `
            SELECT s.*, p.name as product_name 
            FROM streaming_accounts s 
            LEFT JOIN products p ON s.product_id = p.id 
            WHERE 1=1
        `;
        const params = [];

        if (platform) {
            query += ' AND s.platform = ?';
            params.push(platform);
        }
        if (product_id) {
            query += ' AND s.product_id = ?';
            params.push(Number(product_id));
        }
        if (search) {
            query += ' AND (s.email LIKE ? OR s.profile_name LIKE ? OR s.platform LIKE ?)';
            const likeParam = `%${search}%`;
            params.push(likeParam, likeParam, likeParam);
        }

        query += ' ORDER BY s.created_at DESC';

        const accounts = await db.query(query, params);

        const enriched = await Promise.all(accounts.map(async (acc) => {
            const assignments = await db.query(`
                SELECT a.id as assignment_id, a.user_id, a.order_id, a.assigned_at, a.expires_at,
                       u.name as user_name, u.email as user_email
                FROM streaming_assignments a
                LEFT JOIN users u ON a.user_id = u.id
                WHERE a.account_id = ?
            `, [acc.id]);

            const currentUsersCount = assignments.length;
            const maxDevices = Number(acc.max_devices) || 1;
            const isFull = currentUsersCount >= maxDevices;
            const isExpired = acc.expiration_date ? new Date(acc.expiration_date) < new Date() : false;

            return {
                ...acc,
                assignments,
                current_users_count: currentUsersCount,
                is_full: isFull,
                is_expired: isExpired
            };
        }));

        return res.json(enriched);
    } catch (error) {
        console.error('Error al obtener cuentas de streaming:', error);
        return res.status(500).json({ error: 'Error al obtener cuentas de streaming.' });
    }
};

// 2. Registrar Nueva Cuenta / Perfil Streaming
exports.createAccount = async (req, res) => {
    try {
        const {
            platform, email, password, profile_name, profile_pin,
            activation_link, max_devices, expiration_date, product_id, notes
        } = req.body;

        if (!platform || !email || !password) {
            return res.status(400).json({ error: 'Plataforma, correo y contraseña son requeridos.' });
        }

        const resDb = await db.execute(`
            INSERT INTO streaming_accounts (
                platform, email, password, profile_name, profile_pin,
                activation_link, max_devices, expiration_date, product_id, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            platform.trim(),
            email.trim(),
            password.trim(),
            profile_name ? profile_name.trim() : null,
            profile_pin ? profile_pin.trim() : null,
            activation_link ? activation_link.trim() : null,
            Number(max_devices) > 0 ? Number(max_devices) : 1,
            expiration_date || null,
            product_id ? Number(product_id) : null,
            notes ? notes.trim() : null
        ]);

        return res.status(201).json({ message: 'Cuenta/Perfil de streaming registrado con éxito.', id: resDb.lastInsertRowid });
    } catch (error) {
        console.error('Error al crear cuenta de streaming:', error);
        return res.status(500).json({ error: 'Error interno al registrar cuenta de streaming.' });
    }
};

// 3. Actualizar Cuenta / Perfil Streaming
exports.updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            platform, email, password, profile_name, profile_pin,
            activation_link, max_devices, expiration_date, product_id, notes
        } = req.body;

        const acc = await db.querySingle('SELECT id FROM streaming_accounts WHERE id = ?', [id]);
        if (!acc) {
            return res.status(404).json({ error: 'Cuenta de streaming no encontrada.' });
        }

        await db.execute(`
            UPDATE streaming_accounts SET
                platform = ?, email = ?, password = ?, profile_name = ?, profile_pin = ?,
                activation_link = ?, max_devices = ?, expiration_date = ?, product_id = ?, notes = ?
            WHERE id = ?
        `, [
            platform.trim(),
            email.trim(),
            password.trim(),
            profile_name ? profile_name.trim() : null,
            profile_pin ? profile_pin.trim() : null,
            activation_link ? activation_link.trim() : null,
            Number(max_devices) > 0 ? Number(max_devices) : 1,
            expiration_date || null,
            product_id ? Number(product_id) : null,
            notes ? notes.trim() : null,
            id
        ]);

        return res.json({ message: 'Cuenta de streaming actualizada con éxito.' });
    } catch (error) {
        console.error('Error al actualizar cuenta de streaming:', error);
        return res.status(500).json({ error: 'Error interno al actualizar cuenta de streaming.' });
    }
};

// 4. Eliminar Cuenta / Perfil Streaming
exports.deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const acc = await db.querySingle('SELECT id FROM streaming_accounts WHERE id = ?', [id]);
        if (!acc) {
            return res.status(404).json({ error: 'Cuenta de streaming no encontrada.' });
        }

        await db.execute('DELETE FROM streaming_assignments WHERE account_id = ?', [id]);
        await db.execute('DELETE FROM streaming_accounts WHERE id = ?', [id]);

        return res.json({ message: 'Cuenta de streaming eliminada con éxito.' });
    } catch (error) {
        console.error('Error al eliminar cuenta de streaming:', error);
        return res.status(500).json({ error: 'Error al eliminar cuenta de streaming.' });
    }
};

// 5. Asignar un Perfil a un Usuario / Pedido
exports.assignUser = async (req, res) => {
    try {
        const { account_id, user_id, order_id, expires_at } = req.body;

        if (!account_id || (!user_id && !order_id)) {
            return res.status(400).json({ error: 'ID de cuenta y ID de usuario o pedido son requeridos.' });
        }

        const acc = await db.querySingle('SELECT * FROM streaming_accounts WHERE id = ?', [account_id]);
        if (!acc) {
            return res.status(404).json({ error: 'Cuenta de streaming no encontrada.' });
        }

        const countRow = await db.querySingle('SELECT COUNT(*) as count FROM streaming_assignments WHERE account_id = ?', [account_id]);
        if (countRow.count >= acc.max_devices) {
            return res.status(400).json({ error: `La cuenta ya alcanzó el límite máximo de ${acc.max_devices} dispositivo(s)/usuario(s).` });
        }

        let targetUserId = user_id;
        if (!targetUserId && order_id) {
            const order = await db.querySingle('SELECT user_id FROM orders WHERE id = ?', [order_id]);
            if (order && order.user_id) targetUserId = order.user_id;
        }

        if (!targetUserId) {
            return res.status(400).json({ error: 'No se pudo determinar el usuario para la asignación.' });
        }

        const expirationDate = expires_at || acc.expiration_date || null;

        await db.execute(`
            INSERT INTO streaming_assignments (account_id, order_id, user_id, expires_at)
            VALUES (?, ?, ?, ?)
        `, [account_id, order_id || null, targetUserId, expirationDate]);

        return res.json({ message: 'Usuario asignado exitosamente al perfil de streaming.' });
    } catch (error) {
        console.error('Error al asignar usuario a cuenta de streaming:', error);
        return res.status(500).json({ error: 'Error al asignar usuario.' });
    }
};

// 6. Desasignar / Liberar cupo de usuario
exports.unassignUser = async (req, res) => {
    try {
        const { assignment_id } = req.params;
        await db.execute('DELETE FROM streaming_assignments WHERE id = ?', [assignment_id]);
        return res.json({ message: 'Asignación removida con éxito. Cupo liberado.' });
    } catch (error) {
        console.error('Error al liberar asignación:', error);
        return res.status(500).json({ error: 'Error al remover asignación.' });
    }
};
