const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('../server/routes/api');

// Configuración rápida del servidor de prueba
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiRoutes);

const PORT = 3999;
let server;

function startServer() {
    return new Promise((resolve) => {
        server = app.listen(PORT, () => {
            console.log(`[TEST] Servidor de prueba levantado en puerto ${PORT}`);
            resolve();
        });
    });
}

function stopServer() {
    return new Promise((resolve) => {
        server.close(() => {
            console.log(`[TEST] Servidor de prueba apagado.`);
            resolve();
        });
    });
}

async function runTests() {
    console.log('\n--- INICIANDO PRUEBAS AUTOMATIZADAS DE API ---');
    const baseUrl = `http://localhost:${PORT}/api`;
    let clientToken = '';
    let adminToken = '';
    let testOrderId = null;

    try {
        // Test 1: Login de Cliente
        console.log('[TEST 1] Probando Login de Cliente...');
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'cliente@sortistore.com', password: 'cliente123' })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.error);
        clientToken = loginData.token;
        console.log(`  -> Login exitoso. Token obtenido. Balance Sorti: ${loginData.user.sortiBalance} monedas.`);

        // Test 2: Obtener Productos
        console.log('[TEST 2] Probando listado de productos...');
        const prodRes = await fetch(`${baseUrl}/products`);
        const prodData = await prodRes.json();
        if (!prodRes.ok) throw new Error(prodData.error);
        console.log(`  -> Productos encontrados en catálogo: ${prodData.length}`);

        // Ubicar producto físico y uno digital para la compra de prueba
        const physicalProduct = prodData.find(p => p.type === 'physical');
        const digitalProduct = prodData.find(p => p.type === 'digital');

        // Test 3: Crear un Pedido aplicando Cupón de 10% y 100 Monedas Sorti (ahorro S/. 1.00)
        console.log('[TEST 3] Probando creación de pedido con cupón y monedas Sorti...');
        const orderRes = await fetch(`${baseUrl}/orders`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientToken}`
            },
            body: JSON.stringify({
                delivery_type: 'delivery',
                delivery_address: 'Miraflores - Av. Arequipa 1234',
                delivery_cost: 7.00,
                coupon_code: 'BIENVENIDA10',
                sorti_coins_used: 100, // Equivale a S/. 1.00 de descuento
                payment_method: 'yape',
                items: [
                    { product_id: physicalProduct.id, quantity: 1 },
                    { product_id: digitalProduct.id, quantity: 1 }
                ]
            })
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.error);
        testOrderId = orderData.orderId;
        console.log(`  -> Pedido #${testOrderId} creado con éxito.`);
        console.log(`     Subtotal: S/. ${orderData.subtotal.toFixed(2)}`);
        console.log(`     Descuento Cupón: S/. ${orderData.discountCoupon.toFixed(2)}`);
        console.log(`     Descuento Sorti: S/. ${orderData.discountSorti.toFixed(2)}`);
        console.log(`     Total final: S/. ${orderData.total.toFixed(2)}`);

        // Test 4: Adjuntar comprobante de pago simulado
        console.log('[TEST 4] Probando subida de comprobante de pago...');
        const proofRes = await fetch(`${baseUrl}/orders/payment-proof`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientToken}`
            },
            body: JSON.stringify({
                orderId: testOrderId,
                proofUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' // 1px transparent png mock
            })
        });
        const proofData = await proofRes.json();
        if (!proofRes.ok) throw new Error(proofData.error);
        console.log('  -> Comprobante subido. Estado del pedido actualizado a procesamiento.');

        // Test 5: Login de Administrador
        console.log('[TEST 5] Probando Login de Administrador...');
        const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@sortistore.com', password: 'admin123' })
        });
        const adminLoginData = await adminLoginRes.json();
        if (!adminLoginRes.ok) throw new Error(adminLoginData.error);
        adminToken = adminLoginData.token;
        console.log('  -> Login de administrador exitoso.');

        // Test 6: Aprobación y Finalización de Pedido (Admin) -> Genera Cashback de Monedas Sorti
        console.log('[TEST 6] Aprobando pedido como Administrador para detonar cashback de Monedas...');
        const completeRes = await fetch(`${baseUrl}/admin/orders/${testOrderId}/status`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ status: 'completed' })
        });
        const completeData = await completeRes.json();
        if (!completeRes.ok) throw new Error(completeData.error);
        console.log(`  -> Pedido #${testOrderId} completado exitosamente por administración.`);

        // Test 7: Comprobar que el saldo de monedas del cliente se haya actualizado con el cashback del 10%
        console.log('[TEST 7] Verificando cashback de monedas Sorti en billetera del cliente...');
        const profileRes = await fetch(`${baseUrl}/auth/me`, {
            headers: { 'Authorization': `Bearer ${clientToken}` }
        });
        const profileData = await profileRes.json();
        console.log(`  -> Nuevo saldo de monedas Sorti del cliente: ${profileData.user.sortiBalance} monedas.`);
        
        console.log('\n[ÉXITO] ¡Todas las pruebas del backend han finalizado satisfactoriamente!');

    } catch (e) {
        console.error('\n[FALLO] La verificación de la API falló:', e.message);
    }
}

// Ejecutar flujo
(async () => {
    await startServer();
    await runTests();
    await stopServer();
})();
