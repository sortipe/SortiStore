const db = require('../config/database');
const bcrypt = require('bcryptjs');

// 1. Obtener Descargas y Cuentas Streaming del Cliente
exports.getDownloads = async (req, res) => {
    try {
        const userId = req.user.id;
        const downloads = await db.query(`
            SELECT DISTINCT p.id, p.name, p.slug, p.type, p.download_url, p.download_file_size, p.download_version, p.streaming_platform, o.id as order_id, o.created_at
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = ? AND o.status IN ('paid', 'processing', 'completed', 'shipped')
              AND p.type IN ('digital', 'software')
            ORDER BY o.created_at DESC
        `, [userId]);

        const enriched = await Promise.all(downloads.map(async (d) => {
            const streamingAss = await db.querySingle(`
                SELECT s.platform, s.email, s.password, s.profile_name, s.profile_pin, s.activation_link, 
                       COALESCE(a.expires_at, s.expiration_date) as expiration_date
                FROM streaming_assignments a
                JOIN streaming_accounts s ON a.account_id = s.id
                WHERE a.user_id = ? AND (a.order_id = ? OR s.product_id = ?)
                ORDER BY a.assigned_at DESC
                LIMIT 1
            `, [userId, d.order_id, d.id]);

            let streamingAccount = streamingAss;
            if (!streamingAccount) {
                streamingAccount = await db.querySingle(`
                    SELECT platform, email, password, profile_name, profile_pin, activation_link, expiration_date
                    FROM streaming_accounts
                    WHERE product_id = ?
                    LIMIT 1
                `, [d.id]);
            }

            return {
                ...d,
                streaming_account: streamingAccount || null
            };
        }));

        return res.json(enriched);
    } catch (error) {
        console.error('Error al obtener descargas:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 2. Obtener Billetera de Monedas Sorti e Historial
exports.getWallet = async (req, res) => {
    try {
        const userId = req.user.id;
        const wallet = await db.querySingle('SELECT sorti_balance FROM user_wallets WHERE user_id = ?', [userId]);
        const transactions = await db.query('SELECT * FROM sorti_transactions WHERE user_id = ? ORDER BY created_at DESC', [userId]);

        return res.json({
            balance: wallet ? wallet.sorti_balance : 0,
            transactions
        });
    } catch (error) {
        console.error('Error al obtener billetera de monedas:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 6. Obtener Cupones del Cliente
exports.getCoupons = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date().toISOString();

        // Cupones que no han expirado, no superaron usos y no son de otro usuario
        const coupons = await db.query(`
            SELECT * FROM coupons 
            WHERE (user_id IS NULL OR user_id = ?) 
              AND (expires_at IS NULL OR expires_at > ?)
              AND uses_count < max_uses
        `, [userId, now]);

        // Obtener historial de cupones usados por este usuario
        const usedCoupons = await db.query(`
            SELECT uc.*, c.code, c.type, c.value, o.total_amount
            FROM user_coupons uc
            JOIN coupons c ON uc.coupon_id = c.id
            JOIN orders o ON uc.order_id = o.id
            WHERE uc.user_id = ?
            ORDER BY uc.used_at DESC
        `, [userId]);

        return res.json({
            available: coupons,
            used: usedCoupons
        });
    } catch (error) {
        console.error('Error al obtener cupones del cliente:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 7. Actualizar Datos de la Cuenta del Cliente
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, password } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'El nombre y correo son requeridos.' });
        }

        // Validar duplicado de email
        const emailCheck = await db.querySingle('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
        if (emailCheck) {
            return res.status(400).json({ error: 'El correo electrónico ya está en uso por otra cuenta.' });
        }

        if (password && password.trim() !== '') {
            const hash = bcrypt.hashSync(password, 10);
            await db.execute('UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?', [name, email, hash, userId]);
        } else {
            await db.execute('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, userId]);
        }

        return res.json({ message: 'Perfil actualizado con éxito.' });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
