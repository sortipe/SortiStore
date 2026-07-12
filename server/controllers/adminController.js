const db = require('../config/database');

// 1. Estadísticas Generales del Dashboard Administrativo
exports.getDashboardStats = (req, res) => {
    try {
        // Ventas Totales (excluyendo canceladas y pendientes de pago)
        const totalSalesRow = db.prepare(`
            SELECT SUM(total_amount) as sum FROM orders 
            WHERE status NOT IN ('cancelled', 'pending_payment')
        `).get();
        const totalSales = totalSalesRow ? (totalSalesRow.sum || 0) : 0;

        // Total de Pedidos
        const totalOrdersRow = db.prepare("SELECT COUNT(id) as count FROM orders").get();
        const totalOrders = totalOrdersRow ? totalOrdersRow.count : 0;

        // Total de Clientes
        const totalClientsRow = db.prepare("SELECT COUNT(id) as count FROM users WHERE role = 'client'").get();
        const totalClients = totalClientsRow ? totalClientsRow.count : 0;

        // Monedas Sorti en Circulación
        const totalCoinsRow = db.prepare("SELECT SUM(sorti_balance) as sum FROM user_wallets").get();
        const totalCoins = totalCoinsRow ? (totalCoinsRow.sum || 0) : 0;

        // Últimos 5 Pedidos
        const recentOrders = db.prepare(`
            SELECT o.*, u.name as user_name, u.email as user_email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 5
        `).all();

        // Productos Más Vendidos
        const topProducts = db.prepare(`
            SELECT p.name, p.type, SUM(oi.quantity) as sold_qty
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status NOT IN ('cancelled', 'pending_payment')
            GROUP BY oi.product_id
            ORDER BY sold_qty DESC
            LIMIT 5
        `).all();

        // Distribución de Ventas por Tipo de Producto
        const salesByType = db.prepare(`
            SELECT p.type, SUM(oi.quantity * oi.price) as revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status NOT IN ('cancelled', 'pending_payment')
            GROUP BY p.type
        `).all();

        return res.json({
            stats: {
                totalSales,
                totalOrders,
                totalClients,
                totalCoins
            },
            recentOrders,
            topProducts,
            salesByType
        });
    } catch (error) {
        console.error('Error al obtener estadísticas del dashboard:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 2. Crear un Producto
exports.createProduct = (req, res) => {
    try {
        const {
            name, slug, description, type, sku, stock, category_id,
            price_normal, price_offer, price_sorti, is_featured, is_recommended,
            is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date,
            download_url, download_file_size, download_version,
            media, variants // Arrays
        } = req.body;

        if (!name || !slug || !type || price_normal === undefined) {
            return res.status(400).json({ error: 'Nombre, slug, tipo y precio normal son campos obligatorios.' });
        }

        // Validar slug duplicado
        const slugExists = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug);
        if (slugExists) {
            return res.status(400).json({ error: 'El slug ya está registrado.' });
        }

        const result = db.prepare(`
            INSERT INTO products (
                name, slug, description, type, sku, stock, category_id,
                price_normal, price_offer, price_sorti, is_featured, is_recommended,
                is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date,
                download_url, download_file_size, download_version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            name, slug, description, type, sku, Number(stock) || 0, Number(category_id) || null,
            Number(price_normal), price_offer ? Number(price_offer) : null, price_sorti ? Number(price_sorti) : null,
            is_featured ? 1 : 0, is_recommended ? 1 : 0, is_new ? 1 : 0, is_sold_out ? 1 : 0,
            is_upcoming ? 1 : 0, is_presale ? 1 : 0, presale_launch_date || null,
            download_url || null, download_file_size || null, download_version || null
        );

        const productId = result.lastInsertRowid;

        // Insertar galería multimedia
        if (media && media.length > 0) {
            const insertMedia = db.prepare('INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, ?)');
            for (const item of media) {
                insertMedia.run(productId, item.media_url, item.is_video ? 1 : 0);
            }
        }

        // Insertar variantes
        if (variants && variants.length > 0) {
            const insertVariant = db.prepare('INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES (?, ?, ?, ?, ?)');
            for (const variant of variants) {
                insertVariant.run(productId, variant.type, variant.value, Number(variant.stock_offset) || 0, Number(variant.price_offset) || 0.0);
            }
        }

        // Si el tipo es curso, crear automáticamente el curso asociado en el LMS
        if (type === 'course') {
            db.prepare('INSERT INTO courses (product_id, title, description, cover_image) VALUES (?, ?, ?, ?)')
                .run(productId, name, description, media && media.length > 0 ? media[0].media_url : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800');
        }

        return res.status(201).json({ message: 'Producto creado con éxito.', productId });
    } catch (error) {
        console.error('Error al crear producto:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 3. Editar un Producto
exports.updateProduct = (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, slug, description, type, sku, stock, category_id,
            price_normal, price_offer, price_sorti, is_featured, is_recommended,
            is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date,
            download_url, download_file_size, download_version,
            media, variants
        } = req.body;

        const product = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }

        // Actualizar datos base del producto
        db.prepare(`
            UPDATE products SET
                name = ?, slug = ?, description = ?, type = ?, sku = ?, stock = ?, category_id = ?,
                price_normal = ?, price_offer = ?, price_sorti = ?, is_featured = ?, is_recommended = ?,
                is_new = ?, is_sold_out = ?, is_upcoming = ?, is_presale = ?, presale_launch_date = ?,
                download_url = ?, download_file_size = ?, download_version = ?
            WHERE id = ?
        `).run(
            name, slug, description, type, sku, Number(stock) || 0, Number(category_id) || null,
            Number(price_normal), price_offer ? Number(price_offer) : null, price_sorti ? Number(price_sorti) : null,
            is_featured ? 1 : 0, is_recommended ? 1 : 0, is_new ? 1 : 0, is_sold_out ? 1 : 0,
            is_upcoming ? 1 : 0, is_presale ? 1 : 0, presale_launch_date || null,
            download_url || null, download_file_size || null, download_version || null,
            id
        );

        // Actualizar Galería: eliminamos la existente e insertamos la nueva
        db.prepare('DELETE FROM product_media WHERE product_id = ?').run(id);
        if (media && media.length > 0) {
            const insertMedia = db.prepare('INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, ?)');
            for (const item of media) {
                insertMedia.run(id, item.media_url, item.is_video ? 1 : 0);
            }
        }

        // Actualizar Variantes: eliminamos e insertamos
        db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(id);
        if (variants && variants.length > 0) {
            const insertVariant = db.prepare('INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES (?, ?, ?, ?, ?)');
            for (const variant of variants) {
                insertVariant.run(id, variant.type, variant.value, Number(variant.stock_offset) || 0, Number(variant.price_offset) || 0.0);
            }
        }

        return res.json({ message: 'Producto actualizado con éxito.' });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 4. Eliminar un Producto
exports.deleteProduct = (req, res) => {
    try {
        const { id } = req.params;
        const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        return res.json({ message: 'Producto eliminado con éxito.' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 5. Listar todos los Pedidos (Para Administrador y Empleados)
exports.getOrders = (req, res) => {
    try {
        const { status } = req.query;
        let query = 'SELECT o.*, u.name as user_name, u.email as user_email FROM orders o LEFT JOIN users u ON o.user_id = u.id';
        const params = [];

        if (status) {
            query += ' WHERE o.status = ?';
            params.push(status);
        }

        query += ' ORDER BY o.created_at DESC';

        const orders = db.prepare(query).all(...params);

        const enrichedOrders = orders.map(order => {
            const items = db.prepare(`
                SELECT oi.*, p.name, p.slug, p.type
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
        console.error('Error al obtener pedidos globales:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 6. Cambiar Estado del Pedido / Confirmación manual de pago
exports.updateOrderStatus = (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Estado del pedido no válido.' });
        }

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }

        // Actualizar estado del pedido
        db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

        // RECOMPENSA DE MONEDAS: Si pasa a 'paid' o 'completed', premiar al cliente con el cashback
        if ((status === 'paid' || status === 'completed') && order.user_id) {
            const rewardDescription = `Recompensa por pedido #${order.id}`;
            // Verificar si ya se recompensó este pedido
            const rewardCheck = db.prepare("SELECT 1 FROM sorti_transactions WHERE user_id = ? AND description = ? LIMIT 1")
                .get(order.user_id, rewardDescription);

            if (!rewardCheck) {
                // Cashback: Gana 10% del total pagado en monedas. (10 monedas por Sol pagado)
                const coinsEarned = Math.round(order.total_amount * 10);
                
                if (coinsEarned > 0) {
                    db.prepare('UPDATE user_wallets SET sorti_balance = sorti_balance + ? WHERE user_id = ?')
                        .run(coinsEarned, order.user_id);
                    
                    db.prepare(`
                        INSERT INTO sorti_transactions (user_id, amount, type, description)
                        VALUES (?, ?, 'earn', ?)
                    `).run(order.user_id, coinsEarned, rewardDescription);
                }
            }
        }

        return res.json({ message: 'Estado del pedido actualizado con éxito.', orderId: id, newStatus: status });
    } catch (error) {
        console.error('Error al actualizar estado del pedido:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 7. Ajustar Billetera de Monedas Sorti Manualmente (Admin)
exports.adjustWallet = (req, res) => {
    try {
        const { email, amount, description } = req.body;

        if (!email || amount === undefined || !description) {
            return res.status(400).json({ error: 'Correo de usuario, cantidad (positivo/negativo) y descripción son obligatorios.' });
        }

        const user = db.prepare('SELECT id, role FROM users WHERE email = ?').get(email);
        if (!user || user.role !== 'client') {
            return res.status(404).json({ error: 'Cliente no encontrado.' });
        }

        const adjustedAmount = Number(amount);
        const wallet = db.prepare('SELECT sorti_balance FROM user_wallets WHERE user_id = ?').get(user.id);
        const currentBalance = wallet ? wallet.sorti_balance : 0;

        if (currentBalance + adjustedAmount < 0) {
            return res.status(400).json({ error: `Fondos insuficientes. El cliente solo tiene ${currentBalance} monedas.` });
        }

        db.prepare('UPDATE user_wallets SET sorti_balance = sorti_balance + ? WHERE user_id = ?')
            .run(adjustedAmount, user.id);

        db.prepare(`
            INSERT INTO sorti_transactions (user_id, amount, type, description)
            VALUES (?, ?, 'admin_adjust', ?)
        `).run(user.id, adjustedAmount, `Ajuste Admin: ${description}`);

        return res.json({
            message: 'Saldo ajustado con éxito.',
            userEmail: email,
            amount: adjustedAmount,
            newBalance: currentBalance + adjustedAmount
        });
    } catch (error) {
        console.error('Error al ajustar billetera:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 8. Crear un Cupón
exports.createCoupon = (req, res) => {
    try {
        const { code, type, value, min_spend, max_uses, expires_at } = req.body;

        if (!code || !type || value === undefined) {
            return res.status(400).json({ error: 'Código, tipo y valor son requeridos.' });
        }

        // Validar código duplicado
        const codeExists = db.prepare('SELECT id FROM coupons WHERE code = ?').get(code);
        if (codeExists) {
            return res.status(400).json({ error: 'El código de cupón ya existe.' });
        }

        db.prepare(`
            INSERT INTO coupons (code, type, value, min_spend, max_uses, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            code.toUpperCase(),
            type,
            Number(value),
            Number(min_spend) || 0.0,
            Number(max_uses) || 9999,
            expires_at || null
        );

        return res.status(201).json({ message: 'Cupón creado con éxito.', code });
    } catch (error) {
        console.error('Error al crear cupón:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 9. Crear Estructura de LMS (Módulos/Lecciones)
exports.createCourseStructure = (req, res) => {
    try {
        const { courseId, modules } = req.body; // modules: array de { title, lessons: [{ title, video_url, duration, pdf_url, resources_url, has_exam, exam_questions }] }

        if (!courseId || !modules || modules.length === 0) {
            return res.status(400).json({ error: 'El ID del curso y la estructura de módulos son obligatorios.' });
        }

        // Eliminar estructura actual para sobrescribir (operación limpia)
        const currentModules = db.prepare('SELECT id FROM course_modules WHERE course_id = ?').all(courseId);
        for (const mod of currentModules) {
            db.prepare('DELETE FROM course_lessons WHERE module_id = ?').run(mod.id);
        }
        db.prepare('DELETE FROM course_modules WHERE course_id = ?').run(courseId);

        // Insertar nueva estructura
        let modOrder = 1;
        for (const mod of modules) {
            const modResult = db.prepare('INSERT INTO course_modules (course_id, title, sort_order) VALUES (?, ?, ?)')
                .run(courseId, mod.title, modOrder++);
            
            const moduleId = modResult.lastInsertRowid;

            if (mod.lessons && mod.lessons.length > 0) {
                let lessonOrder = 1;
                const insertLesson = db.prepare(`
                    INSERT INTO course_lessons (
                        module_id, title, video_url, duration, pdf_url, resources_url, has_exam, exam_questions, sort_order
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                for (const lesson of mod.lessons) {
                    insertLesson.run(
                        moduleId,
                        lesson.title,
                        lesson.video_url || null,
                        lesson.duration || '00:00',
                        lesson.pdf_url || null,
                        lesson.resources_url || null,
                        lesson.has_exam ? 1 : 0,
                        lesson.exam_questions ? JSON.stringify(lesson.exam_questions) : null,
                        lessonOrder++
                    );
                }
            }
        }

        return res.json({ message: 'Estructura del curso LMS configurada con éxito.' });
    } catch (error) {
        console.error('Error al guardar estructura LMS:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 10. Configurar Ajustes de Sistema
exports.getSettings = (req, res) => {
    try {
        const settings = db.prepare('SELECT * FROM system_settings').all();
        const settingsMap = {};
        settings.forEach(s => {
            if (s.key === 'bank_accounts' || s.key === 'delivery_districts') {
                settingsMap[s.key] = JSON.parse(s.value);
            } else {
                settingsMap[s.key] = s.value;
            }
        });
        return res.json(settingsMap);
    } catch (error) {
        console.error('Error al obtener configuraciones:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.updateSettings = (req, res) => {
    try {
        const { sorti_rate, bank_accounts, yape_qr, delivery_districts } = req.body;

        if (sorti_rate !== undefined) {
            db.prepare(`INSERT INTO system_settings (key, value) VALUES ('sorti_rate', ?) 
                        ON CONFLICT(key) DO UPDATE SET value = ?`).run(String(sorti_rate), String(sorti_rate));
        }

        if (bank_accounts !== undefined) {
            const accountsStr = JSON.stringify(bank_accounts);
            db.prepare(`INSERT INTO system_settings (key, value) VALUES ('bank_accounts', ?) 
                        ON CONFLICT(key) DO UPDATE SET value = ?`).run(accountsStr, accountsStr);
        }

        if (yape_qr !== undefined) {
            db.prepare(`INSERT INTO system_settings (key, value) VALUES ('yape_qr', ?) 
                        ON CONFLICT(key) DO UPDATE SET value = ?`).run(String(yape_qr), String(yape_qr));
        }

        if (delivery_districts !== undefined) {
            const districtsStr = JSON.stringify(delivery_districts);
            db.prepare(`INSERT INTO system_settings (key, value) VALUES ('delivery_districts', ?) 
                        ON CONFLICT(key) DO UPDATE SET value = ?`).run(districtsStr, districtsStr);
        }

        return res.json({ message: 'Configuraciones actualizadas con éxito.' });
    } catch (error) {
        console.error('Error al actualizar configuraciones:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
