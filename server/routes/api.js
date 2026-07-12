const express = require('express');
const router = express.Router();

// Controladores
const auth = require('../controllers/authController');
const products = require('../controllers/productController');
const orders = require('../controllers/orderController');
const customer = require('../controllers/customerController');
const admin = require('../controllers/adminController');

// Middlewares
const { authenticate, requireAuth, requireRole } = require('../middleware/auth');
const runSeed = require('../db/seed');

// Ruta temporal para inicializar Supabase desde producción
router.get('/db-init', async (req, res) => {
    try {
        await runSeed();
        res.json({ message: 'Base de datos inicializada y sembrada con éxito en Supabase.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Error al inicializar la base de datos.' });
    }
});

// ==========================================
// RUTAS PÚBLICAS / AUTENTICACIÓN
// ==========================================
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', requireAuth, auth.getMe);

// Catálogo de Productos
router.get('/products', products.getProducts);
router.get('/products/:slug', products.getProductBySlug);
router.get('/categories', products.getCategories);
router.get('/settings', admin.getSettings); // Público para Checkout e Invitados

// Checkout (Permite invitados o usuarios autenticados)
router.post('/orders', authenticate, orders.createOrder);
router.post('/orders/payment-proof', authenticate, orders.uploadPaymentProof);

// ==========================================
// RUTAS PRIVADAS - CLIENTES
// ==========================================
router.get('/customer/orders', requireAuth, orders.getMyOrders);
router.get('/customer/orders/:id', requireAuth, orders.getOrderDetails);
router.get('/customer/downloads', requireAuth, customer.getDownloads);
router.get('/customer/courses', requireAuth, customer.getCourses);
router.get('/customer/courses/:id', requireAuth, customer.getCourseDetails);
router.post('/customer/courses/lesson-complete', requireAuth, customer.toggleLessonComplete);
router.get('/customer/wallet', requireAuth, customer.getWallet);
router.get('/customer/coupons', requireAuth, customer.getCoupons);
router.put('/customer/profile', requireAuth, customer.updateProfile);

// ==========================================
// RUTAS PRIVADAS - EMPLEADOS / ADMINISTRADORES
// ==========================================
const adminOrEmployee = requireRole(['admin', 'employee']);
const adminOnly = requireRole(['admin']);

// Dashboard & Pedidos
router.get('/admin/dashboard', requireAuth, adminOrEmployee, admin.getDashboardStats);
router.get('/admin/orders', requireAuth, adminOrEmployee, admin.getOrders);
router.post('/admin/orders/:id/status', requireAuth, adminOrEmployee, admin.updateOrderStatus);

// Catálogo Admin
router.post('/admin/products', requireAuth, adminOrEmployee, admin.createProduct);
router.put('/admin/products/:id', requireAuth, adminOrEmployee, admin.updateProduct);
router.delete('/admin/products/:id', requireAuth, adminOrEmployee, admin.deleteProduct);

// Cursos LMS Admin
router.post('/admin/courses/structure', requireAuth, adminOrEmployee, admin.createCourseStructure);

// Billetera & Ajustes Sorti (Solo Admin)
router.post('/admin/wallet/adjust', requireAuth, adminOnly, admin.adjustWallet);

// Cupones (Admin/Empleado)
router.post('/admin/coupons', requireAuth, adminOrEmployee, admin.createCoupon);

// Ajustes del Sistema
router.get('/admin/settings', requireAuth, adminOrEmployee, admin.getSettings);
router.put('/admin/settings', requireAuth, adminOnly, admin.updateSettings);

module.exports = router;
