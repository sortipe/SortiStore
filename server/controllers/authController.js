const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sortistore_super_secret_key_2026_2027';

// Registrar usuario
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        // Verificar si el email ya existe
        const userExists = await db.querySingle('SELECT id FROM users WHERE email = ?', [email]);
        if (userExists) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
        }

        // Encriptar contraseña
        const hash = bcrypt.hashSync(password, 10);

        // Insertar usuario (Retorna el id insertado usando RETURNING id)
        const result = await db.execute(`
            INSERT INTO users (name, email, password_hash, role)
            VALUES (?, ?, ?, 'client')
            RETURNING id
        `, [name, email, hash]);

        const userId = result.lastInsertRowid;

        // Crear la billetera virtual del cliente con saldo 0
        await db.execute('INSERT INTO user_wallets (user_id, sorti_balance) VALUES (?, 0)', [userId]);

        // Bonificación de bienvenida (50 monedas)
        await db.execute('UPDATE user_wallets SET sorti_balance = sorti_balance + 50 WHERE user_id = ?', [userId]);
        await db.execute(`
            INSERT INTO sorti_transactions (user_id, amount, type, description)
            VALUES (?, 50, 'earn', 'Bono de bienvenida por registro')
        `, [userId]);

        // Generar JWT
        const token = jwt.sign({ id: userId, role: 'client' }, JWT_SECRET, { expiresIn: '30d' });

        return res.status(201).json({
            message: 'Usuario registrado con éxito.',
            token,
            user: { id: userId, name, email, role: 'client' }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Iniciar sesión
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
        }

        // Buscar usuario
        const user = await db.querySingle('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // Validar contraseña
        const isMatch = bcrypt.compareSync(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // Obtener saldo de monedas Sorti si es cliente
        let sortiBalance = 0;
        if (user.role === 'client') {
            const wallet = await db.querySingle('SELECT sorti_balance FROM user_wallets WHERE user_id = ?', [user.id]);
            sortiBalance = wallet ? wallet.sorti_balance : 0;
        }

        // Generar Token
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

        return res.json({
            message: 'Inicio de sesión exitoso.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                sortiBalance
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Obtener datos del usuario autenticado
exports.getMe = async (req, res) => {
    try {
        const user = await db.querySingle('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        // Obtener saldo de monedas si es cliente
        let sortiBalance = 0;
        if (user.role === 'client') {
            const wallet = await db.querySingle('SELECT sorti_balance FROM user_wallets WHERE user_id = ?', [user.id]);
            sortiBalance = wallet ? wallet.sorti_balance : 0;
        }

        return res.json({
            user: {
                ...user,
                sortiBalance
            }
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
