const express = require('express');
const router = express.Router();

// Controladores
const auth = require('../controllers/authController');
const products = require('../controllers/productController');
const orders = require('../controllers/orderController');
const customer = require('../controllers/customerController');
const admin = require('../controllers/adminController');
const vip = require('../controllers/vipController');

// Middlewares
const { authenticate, requireAuth, requireRole } = require('../middleware/auth');

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

// Rutas VIP - Clientes
router.get('/vip/status', requireAuth, vip.getVipStatus);
router.get('/vip/suppliers', requireAuth, vip.getSuppliers);
router.get('/vip/gifts', requireAuth, vip.getGifts);
router.post('/vip/gifts/:id/claim', requireAuth, vip.claimGift);
router.get('/vip/raffles', requireAuth, vip.getRaffles);
router.post('/vip/raffles/:id/enter', requireAuth, vip.enterRaffle);

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
router.get('/admin/courses/:productId', requireAuth, adminOrEmployee, admin.getCourseStructure);

// Billetera & Ajustes Sorti (Solo Admin)
router.post('/admin/wallet/adjust', requireAuth, adminOnly, admin.adjustWallet);

// Cupones (Admin/Empleado)
router.post('/admin/coupons', requireAuth, adminOrEmployee, admin.createCoupon);
router.delete('/admin/coupons/:id', requireAuth, adminOrEmployee, admin.deleteCoupon);

// Categorías y Subcategorías (Admin/Empleado)
router.post('/admin/categories', requireAuth, adminOrEmployee, admin.createCategory);
router.delete('/admin/categories/:id', requireAuth, adminOrEmployee, admin.deleteCategory);

// Ajustes del Sistema
router.get('/admin/settings', requireAuth, adminOrEmployee, admin.getSettings);
router.put('/admin/settings', requireAuth, adminOnly, admin.updateSettings);

// Gestión VIP Admin (Admin / Empleado)
router.get('/admin/vip/users', requireAuth, adminOrEmployee, vip.adminGetUsers);
router.put('/admin/vip/users/:id/status', requireAuth, adminOnly, vip.adminToggleUserVip);
router.put('/admin/vip/users/:id/coins', requireAuth, adminOnly, vip.adminAdjustUserVipCoins);

// CRUD Proveedores VIP
router.post('/admin/vip/suppliers', requireAuth, adminOrEmployee, vip.adminCreateSupplier);
router.put('/admin/vip/suppliers/:id', requireAuth, adminOrEmployee, vip.adminUpdateSupplier);
router.delete('/admin/vip/suppliers/:id', requireAuth, adminOrEmployee, vip.adminDeleteSupplier);

// CRUD Cuentas Regalo VIP
router.post('/admin/vip/gifts', requireAuth, adminOrEmployee, vip.adminCreateGift);
router.put('/admin/vip/gifts/:id', requireAuth, adminOrEmployee, vip.adminUpdateGift);
router.delete('/admin/vip/gifts/:id', requireAuth, adminOrEmployee, vip.adminDeleteGift);

// CRUD Sorteos VIP
router.post('/admin/vip/raffles', requireAuth, adminOrEmployee, vip.adminCreateRaffle);
router.put('/admin/vip/raffles/:id', requireAuth, adminOrEmployee, vip.adminUpdateRaffle);
router.delete('/admin/vip/raffles/:id', requireAuth, adminOrEmployee, vip.adminDeleteRaffle);
router.post('/admin/vip/raffles/:id/draw', requireAuth, adminOrEmployee, vip.adminDrawRaffle);

module.exports = router;
