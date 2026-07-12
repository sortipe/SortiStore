const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'sortistore_super_secret_key_2026_2027';

// Middleware para verificar la existencia y validez de un token JWT
exports.authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        // Permitir peticiones sin autenticación (para checkout de invitados)
        req.user = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado.' });
        }
        req.user = decoded;
        next();
    });
};

// Middleware para obligar autenticación (ej: dashboard del cliente)
exports.requireAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Se requiere iniciar sesión.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Sesión expirada. Inicie sesión nuevamente.' });
        }
        req.user = decoded;
        next();
    });
};

// Middleware para validar roles específicos (ej: admin o empleado)
exports.requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado.' });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'No tienes permisos suficientes para realizar esta acción.' });
        }
        
        next();
    };
};
