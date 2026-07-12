require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware globales
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Permitir subidas base64 sutiles de comprobantes de pago
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir la carpeta de la interfaz frontend estática
app.use(express.static(path.join(__dirname, '../public')));

// Servir subidas de archivos simuladas en el directorio uploads
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Registrar las rutas de la API REST
app.use('/api', apiRoutes);

// Manejar rutas para SPA en el frontend cliente (Redirigir a index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Manejar ruta de la administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Manejador de error 404 para API
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint no encontrado.' });
});

// Redirección por defecto si no coincide nada más (para la SPA del cliente)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Escuchar servidor (Solo si se ejecuta directamente)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`=============================================================`);
        console.log(` Servidor Sortistore ejecutándose en: http://localhost:${PORT}`);
        console.log(` - Panel de la Tienda Cliente: http://localhost:${PORT}/`);
        console.log(` - Panel de Administración:    http://localhost:${PORT}/admin`);
        console.log(`=============================================================`);
    });
}

module.exports = app;
