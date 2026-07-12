const db = require('../config/database');

// Crear Pedido (Checkout)
exports.createOrder = (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const {
            guest_name,
            guest_email,
            delivery_type,
            delivery_address,
            delivery_cost,
            coupon_code,
            sorti_coins_used,
            payment_method,
            items
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'El carrito no contiene productos.' });
        }

        let subtotal = 0;
        const orderItemsToInsert = [];

        // 1. Validar productos, calcular subtotal y verificar stock
        for (const item of items) {
            const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
            if (!product) {
                return res.status(404).json({ error: `Producto con ID ${item.product_id} no encontrado.` });
            }

            if (product.stock < item.quantity && product.type === 'physical') {
                return res.status(400).json({ error: `Stock insuficiente para ${product.name}. Stock disponible: ${product.stock}` });
            }

            const itemPrice = product.price_offer ? product.price_offer : product.price_normal;
            subtotal += itemPrice * item.quantity;

            orderItemsToInsert.push({
                product_id: product.id,
                quantity: item.quantity,
                price: itemPrice,
                variant_info: item.variant_info ? JSON.stringify(item.variant_info) : null,
                is_physical: product.type === 'physical'
            });
        }

        // 2. Calcular Descuentos de Cupón
        let discountCoupon = 0;
        let couponId = null;
        let finalDeliveryCost = Number(delivery_cost) || 0;

        if (coupon_code) {
            const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(coupon_code);
            if (coupon) {
                const now = new Date().toISOString();
                if (coupon.expires_at && coupon.expires_at < now) {
                    return res.status(400).json({ error: 'El cupón ha expirado.' });
                }
                if (coupon.uses_count >= coupon.max_uses) {
                    return res.status(400).json({ error: 'El cupón ha superado su límite de uso.' });
                }
                if (subtotal < coupon.min_spend) {
                    return res.status(400).json({ error: `El monto mínimo de compra para este cupón es S/. ${coupon.min_spend.toFixed(2)}` });
                }

                couponId = coupon.id;

                if (coupon.type === 'percent') {
                    discountCoupon = (subtotal * coupon.value) / 100;
                } else if (coupon.type === 'fixed') {
                    discountCoupon = coupon.value;
                } else if (coupon.type === 'free_shipping') {
                    discountCoupon = finalDeliveryCost;
                    finalDeliveryCost = 0;
                }
            } else {
                return res.status(400).json({ error: 'Cupón no válido.' });
            }
        }

        // 3. Aplicar monedas Sorti (Solo para clientes registrados)
        let discountSorti = 0;
        let coinsToDeduct = Number(sorti_coins_used) || 0;

        if (userId && coinsToDeduct > 0) {
            const wallet = db.prepare('SELECT sorti_balance FROM user_wallets WHERE user_id = ?').get(userId);
            if (!wallet || wallet.sorti_balance < coinsToDeduct) {
                return res.status(400).json({ error: 'Saldo de monedas Sorti insuficiente.' });
            }

            // Tasa de cambio: 100 Sorti = S/. 1.00
            const rateRow = db.prepare("SELECT value FROM system_settings WHERE key = 'sorti_rate'").get();
            const rate = rateRow ? Number(rateRow.value) : 100;

            discountSorti = coinsToDeduct / rate;
        } else {
            coinsToDeduct = 0;
        }

        // 4. Calcular total final
        let totalAmount = subtotal + finalDeliveryCost - discountCoupon - discountSorti;
        if (totalAmount < 0) totalAmount = 0;

        // 5. Crear el pedido en la BD (transacción simulada)
        const orderResult = db.prepare(`
            INSERT INTO orders (
                user_id, guest_email, guest_name, status, delivery_type,
                delivery_address, delivery_cost, coupon_id, sorti_coins_used,
                total_amount, payment_method
            ) VALUES (?, ?, ?, 'pending_payment', ?, ?, ?, ?, ?, ?, ?)
        `).run(
            userId,
            userId ? null : guest_email,
            userId ? null : guest_name,
            delivery_type,
            delivery_address || 'Recojo en local',
            finalDeliveryCost,
            couponId,
            coinsToDeduct,
            totalAmount,
            payment_method
        );

        const orderId = orderResult.lastInsertRowid;

        // 6. Insertar los productos en order_items y restar stock si es físico
        const insertItem = db.prepare(`
            INSERT INTO order_items (order_id, product_id, quantity, price, variant_info)
            VALUES (?, ?, ?, ?, ?)
        `);

        for (const item of orderItemsToInsert) {
            insertItem.run(orderId, item.product_id, item.quantity, item.price, item.variant_info);
            
            // Restar stock
            if (item.is_physical) {
                db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?')
                    .run(item.quantity, item.product_id);
            }
        }

        // 7. Actualizar billetera virtual y registrar transacción Sorti
        if (userId && coinsToDeduct > 0) {
            db.prepare('UPDATE user_wallets SET sorti_balance = sorti_balance - ? WHERE user_id = ?')
                .run(coinsToDeduct, userId);
            
            db.prepare(`
                INSERT INTO sorti_transactions (user_id, amount, type, description)
                VALUES (?, ?, 'redeem', ?)
            `).run(userId, -coinsToDeduct, `Canjeado en pedido #${orderId}`);
        }

        // 8. Incrementar uso del cupón
        if (couponId) {
            db.prepare('UPDATE coupons SET uses_count = uses_count + 1 WHERE id = ?').run(couponId);
            if (userId) {
                db.prepare('INSERT INTO user_coupons (user_id, coupon_id, order_id) VALUES (?, ?, ?)')
                    .run(userId, couponId, orderId);
            }
        }

        return res.status(201).json({
            message: 'Pedido registrado con éxito. Pendiente de pago.',
            orderId,
            total: totalAmount,
            subtotal,
            discountCoupon,
            discountSorti,
            deliveryCost: finalDeliveryCost
        });
    } catch (error) {
        console.error('Error al crear pedido:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Adjuntar Comprobante de Pago (Yape QR / Transferencia)
exports.uploadPaymentProof = (req, res) => {
    try {
        const { orderId, proofUrl } = req.body;

        if (!orderId || !proofUrl) {
            return res.status(400).json({ error: 'El ID de pedido y el comprobante son requeridos.' });
        }

        // Verificar pedido
        const order = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }

        // Actualizar comprobante de pago y cambiar estado a 'processing'
        db.prepare(`
            UPDATE orders 
            SET payment_proof_url = ?, status = 'processing', updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).run(proofUrl, orderId);

        return res.json({
            message: 'Comprobante subido. Pago pendiente de validación manual por administración.',
            orderId
        });
    } catch (error) {
        console.error('Error al subir comprobante:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Listar Pedidos del Cliente Autenticado
exports.getMyOrders = (req, res) => {
    try {
        const userId = req.user.id;
        const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
        
        // Cargar ítems de cada pedido
        const enrichedOrders = orders.map(order => {
            const items = db.prepare(`
                SELECT oi.*, p.name, p.slug, p.type, 
                       (SELECT media_url FROM product_media WHERE product_id = p.id LIMIT 1) as image_url
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `).all(order.id);

            return {
                ...order,
                items: items.map(item => ({
                    ...item,
                    variant_info: item.variant_info ? JSON.parse(item.variant_info) : null
                }))
            };
        });

        return res.json(enrichedOrders);
    } catch (error) {
        console.error('Error al obtener pedidos del cliente:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Obtener Detalle de un Pedido Específico
exports.getOrderDetails = (req, res) => {
    try {
        const { id } = req.params;
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }

        // Proteger privacidad: si no es admin ni el dueño del pedido, rechazar
        if (req.user.role === 'client' && order.user_id !== req.user.id) {
            return res.status(403).json({ error: 'No autorizado para ver este pedido.' });
        }

        const items = db.prepare(`
            SELECT oi.*, p.name, p.slug, p.type,
                   (SELECT media_url FROM product_media WHERE product_id = p.id LIMIT 1) as image_url
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `).all(order.id);

        const enrichedOrder = {
            ...order,
            items: items.map(item => ({
                ...item,
                variant_info: item.variant_info ? JSON.parse(item.variant_info) : null
            }))
        };

        return res.json(enrichedOrder);
    } catch (error) {
        console.error('Error al obtener detalles del pedido:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
