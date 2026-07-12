const db = require('../config/database');

// 1. Estadísticas Generales del Dashboard Administrativo
exports.getDashboardStats = async (req, res) => {
    try {
        // Ventas Totales
        const totalSalesRow = await db.querySingle(`
            SELECT SUM(total_amount) as sum FROM orders 
            WHERE status NOT IN ('cancelled', 'pending_payment')
        `);
        const totalSales = totalSalesRow ? (Number(totalSalesRow.sum) || 0) : 0;

        // Total de Pedidos
        const totalOrdersRow = await db.querySingle("SELECT COUNT(id) as count FROM orders");
        const totalOrders = totalOrdersRow ? Number(totalOrdersRow.count) : 0;

        // Total de Clientes
        const totalClientsRow = await db.querySingle("SELECT COUNT(id) as count FROM users WHERE role = 'client'");
        const totalClients = totalClientsRow ? Number(totalClientsRow.count) : 0;

        // Monedas Sorti en Circulación
        const totalCoinsRow = await db.querySingle("SELECT SUM(sorti_balance) as sum FROM user_wallets");
        const totalCoins = totalCoinsRow ? (Number(totalCoinsRow.sum) || 0) : 0;

        // Últimos 5 Pedidos
        const recentOrders = await db.query(`
            SELECT o.*, u.name as user_name, u.email as user_email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 5
        `);

        // Productos Más Vendidos
        const topProducts = await db.query(`
            SELECT p.name, p.type, SUM(oi.quantity) as sold_qty
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status NOT IN ('cancelled', 'pending_payment')
            GROUP BY p.name, p.type
            ORDER BY sold_qty DESC
            LIMIT 5
        `);

        // Distribución de Ventas por Tipo de Producto
        const salesByType = await db.query(`
            SELECT p.type, SUM(oi.quantity * oi.price) as revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status NOT IN ('cancelled', 'pending_payment')
            GROUP BY p.type
        `);

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
exports.createProduct = async (req, res) => {
    try {
        const {
            name, slug, description, type, sku, stock, category_id,
            price_normal, price_offer, price_sorti, is_featured, is_recommended,
            is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date,
            download_url, download_file_size, download_version,
            media, variants
        } = req.body;

        if (!name || !slug || !type || price_normal === undefined) {
            return res.status(400).json({ error: 'Nombre, slug, tipo y precio normal son campos obligatorios.' });
        }

        const slugExists = await db.querySingle('SELECT id FROM products WHERE slug = ?', [slug]);
        if (slugExists) {
            return res.status(400).json({ error: 'El slug ya está registrado.' });
        }

        const resultRow = await db.querySingle(`
            INSERT INTO products (
                name, slug, description, type, sku, stock, category_id,
                price_normal, price_offer, price_sorti, is_featured, is_recommended,
                is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date,
                download_url, download_file_size, download_version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
        `, [
            name, slug, description, type, sku, Number(stock) || 0, Number(category_id) || null,
            Number(price_normal), price_offer ? Number(price_offer) : null, price_sorti ? Number(price_sorti) : null,
            is_featured ? 1 : 0, is_recommended ? 1 : 0, is_new ? 1 : 0, is_sold_out ? 1 : 0,
            is_upcoming ? 1 : 0, is_presale ? 1 : 0, presale_launch_date || null,
            download_url || null, download_file_size || null, download_version || null
        ]);

        const productId = resultRow.id;

        // Insertar galería multimedia
        if (media && media.length > 0) {
            for (const item of media) {
                await db.execute('INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, ?)', [productId, item.media_url, item.is_video ? 1 : 0]);
            }
        }

        // Insertar variantes
        if (variants && variants.length > 0) {
            for (const variant of variants) {
                await db.execute('INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES (?, ?, ?, ?, ?)', [productId, variant.type, variant.value, Number(variant.stock_offset) || 0, Number(variant.price_offset) || 0.0]);
            }
        }

        // Si el tipo es curso, crear automáticamente el curso asociado en el LMS
        if (type === 'course') {
            await db.execute('INSERT INTO courses (product_id, title, description, cover_image) VALUES (?, ?, ?, ?)', [
                productId, name, description, media && media.length > 0 ? media[0].media_url : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'
            ]);
        }

        return res.status(201).json({ message: 'Producto creado con éxito.', productId });
    } catch (error) {
        console.error('Error al crear producto:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 3. Editar un Producto
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, slug, description, type, sku, stock, category_id,
            price_normal, price_offer, price_sorti, is_featured, is_recommended,
            is_new, is_sold_out, is_upcoming, is_presale, presale_launch_date,
            download_url, download_file_size, download_version,
            media, variants
        } = req.body;

        const product = await db.querySingle('SELECT id FROM products WHERE id = ?', [id]);
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }

        await db.execute(`
            UPDATE products SET
                name = ?, slug = ?, description = ?, type = ?, sku = ?, stock = ?, category_id = ?,
                price_normal = ?, price_offer = ?, price_sorti = ?, is_featured = ?, is_recommended = ?,
                is_new = ?, is_sold_out = ?, is_upcoming = ?, is_presale = ?, presale_launch_date = ?,
                download_url = ?, download_file_size = ?, download_version = ?
            WHERE id = ?
        `, [
            name, slug, description, type, sku, Number(stock) || 0, Number(category_id) || null,
            Number(price_normal), price_offer ? Number(price_offer) : null, price_sorti ? Number(price_sorti) : null,
            is_featured ? 1 : 0, is_recommended ? 1 : 0, is_new ? 1 : 0, is_sold_out ? 1 : 0,
            is_upcoming ? 1 : 0, is_presale ? 1 : 0, presale_launch_date || null,
            download_url || null, download_file_size || null, download_version || null,
            id
        ]);

        // Actualizar Galería
        await db.execute('DELETE FROM product_media WHERE product_id = ?', [id]);
        if (media && media.length > 0) {
            for (const item of media) {
                await db.execute('INSERT INTO product_media (product_id, media_url, is_video) VALUES (?, ?, ?)', [id, item.media_url, item.is_video ? 1 : 0]);
            }
        }

        // Actualizar Variantes
        await db.execute('DELETE FROM product_variants WHERE product_id = ?', [id]);
        if (variants && variants.length > 0) {
            for (const variant of variants) {
                await db.execute('INSERT INTO product_variants (product_id, type, value, stock_offset, price_offset) VALUES (?, ?, ?, ?, ?)', [id, variant.type, variant.value, Number(variant.stock_offset) || 0, Number(variant.price_offset) || 0.0]);
            }
        }

        return res.json({ message: 'Producto actualizado con éxito.' });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 4. Eliminar un Producto
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.execute('DELETE FROM products WHERE id = ?', [id]);
        
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
exports.getOrders = async (req, res) => {
    try {
        const { status } = req.query;
        let query = 'SELECT o.*, u.name as user_name, u.email as user_email FROM orders o LEFT JOIN users u ON o.user_id = u.id';
        const params = [];

        if (status) {
            query += ' WHERE o.status = ?';
            params.push(status);
        }

        query += ' ORDER BY o.created_at DESC';

        const orders = await db.query(query, params);

        const enrichedOrders = await Promise.all(orders.map(async (order) => {
            const items = await db.query(`
                SELECT oi.*, p.name, p.slug, p.type
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `, [order.id]);

            return {
                ...order,
                items: items.map(item => ({
                    ...item,
                    variant_info: item.variant_info ? JSON.parse(item.variant_info) : null
                }))
            };
        }));

        return res.json(enrichedOrders);
    } catch (error) {
        console.error('Error al obtener pedidos globales:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 6. Cambiar Estado del Pedido / Confirmación manual de pago
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Estado del pedido no válido.' });
        }

        const order = await db.querySingle('SELECT * FROM orders WHERE id = ?', [id]);
        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }

        // Actualizar estado del pedido
        await db.execute('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

        // RECOMPENSA DE MONEDAS
        if ((status === 'paid' || status === 'completed') && order.user_id) {
            const rewardDescription = `Recompensa por pedido #${order.id}`;
            const rewardCheck = await db.querySingle("SELECT 1 as rew FROM sorti_transactions WHERE user_id = ? AND description = ? LIMIT 1", [order.user_id, rewardDescription]);

            if (!rewardCheck) {
                const coinsEarned = Math.round(order.total_amount * 10);
                
                if (coinsEarned > 0) {
                    await db.execute('UPDATE user_wallets SET sorti_balance = sorti_balance + ? WHERE user_id = ?', [coinsEarned, order.user_id]);
                    await db.execute(`
                        INSERT INTO sorti_transactions (user_id, amount, type, description)
                        VALUES (?, ?, 'earn', ?)
                    `, [order.user_id, coinsEarned, rewardDescription]);
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
exports.adjustWallet = async (req, res) => {
    try {
        const { email, amount, description } = req.body;

        if (!email || amount === undefined || !description) {
            return res.status(400).json({ error: 'Correo de usuario, cantidad (positivo/negativo) y descripción son obligatorios.' });
        }

        const user = await db.querySingle('SELECT id, role FROM users WHERE email = ?', [email]);
        if (!user || user.role !== 'client') {
            return res.status(404).json({ error: 'Cliente no encontrado.' });
        }

        const adjustedAmount = Number(amount);
        const wallet = await db.querySingle('SELECT sorti_balance FROM user_wallets WHERE user_id = ?', [user.id]);
        const currentBalance = wallet ? Number(wallet.sorti_balance) : 0;

        if (currentBalance + adjustedAmount < 0) {
            return res.status(400).json({ error: `Fondos insuficientes. El cliente solo tiene ${currentBalance} monedas.` });
        }

        await db.execute('UPDATE user_wallets SET sorti_balance = sorti_balance + ? WHERE user_id = ?', [adjustedAmount, user.id]);
        await db.execute(`
            INSERT INTO sorti_transactions (user_id, amount, type, description)
            VALUES (?, ?, 'admin_adjust', ?)
        `, [user.id, adjustedAmount, `Ajuste Admin: ${description}`]);

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
exports.createCoupon = async (req, res) => {
    try {
        const { code, type, value, min_spend, max_uses, expires_at } = req.body;

        if (!code || !type || value === undefined) {
            return res.status(400).json({ error: 'Código, tipo y valor son requeridos.' });
        }

        const codeExists = await db.querySingle('SELECT id FROM coupons WHERE code = ?', [code]);
        if (codeExists) {
            return res.status(400).json({ error: 'El código de cupón ya existe.' });
        }

        await db.execute(`
            INSERT INTO coupons (code, type, value, min_spend, max_uses, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            code.toUpperCase(),
            type,
            Number(value),
            Number(min_spend) || 0.0,
            Number(max_uses) || 9999,
            expires_at || null
        ]);

        return res.status(201).json({ message: 'Cupón creado con éxito.', code });
    } catch (error) {
        console.error('Error al crear cupón:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 9. Crear Estructura de LMS (Módulos/Lecciones)
exports.createCourseStructure = async (req, res) => {
    try {
        const { courseId, modules } = req.body;

        if (!courseId || !modules || modules.length === 0) {
            return res.status(400).json({ error: 'El ID del curso y la estructura de módulos son obligatorios.' });
        }

        // Eliminar estructura actual
        const currentModules = await db.query('SELECT id FROM course_modules WHERE course_id = ?', [courseId]);
        for (const mod of currentModules) {
            await db.execute('DELETE FROM course_lessons WHERE module_id = ?', [mod.id]);
        }
        await db.execute('DELETE FROM course_modules WHERE course_id = ?', [courseId]);

        // Insertar nueva estructura
        let modOrder = 1;
        for (const mod of modules) {
            const modRow = await db.querySingle(`
                INSERT INTO course_modules (course_id, title, sort_order) 
                VALUES (?, ?, ?)
                RETURNING id
            `, [courseId, mod.title, modOrder++]);
            
            const moduleId = modRow.id;

            if (mod.lessons && mod.lessons.length > 0) {
                let lessonOrder = 1;
                for (const lesson of mod.lessons) {
                    await db.execute(`
                        INSERT INTO course_lessons (
                            module_id, title, video_url, duration, pdf_url, resources_url, has_exam, exam_questions, sort_order
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        moduleId,
                        lesson.title,
                        lesson.video_url || null,
                        lesson.duration || '00:00',
                        lesson.pdf_url || null,
                        lesson.resources_url || null,
                        lesson.has_exam ? 1 : 0,
                        lesson.exam_questions ? JSON.stringify(lesson.exam_questions) : null,
                        lessonOrder++
                    ]);
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
exports.getSettings = async (req, res) => {
    try {
        const settings = await db.query('SELECT * FROM system_settings');
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

exports.updateSettings = async (req, res) => {
    try {
        const { sorti_rate, bank_accounts, yape_qr, delivery_districts } = req.body;

        if (sorti_rate !== undefined) {
            // Soporta Upsert multiplataforma mediante eliminación previa o SQL condicional.
            // Para simplicidad en SQLite/Postgres:
            await db.execute('DELETE FROM system_settings WHERE key = ?', ['sorti_rate']);
            await db.execute('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['sorti_rate', String(sorti_rate)]);
        }

        if (bank_accounts !== undefined) {
            const accountsStr = JSON.stringify(bank_accounts);
            await db.execute('DELETE FROM system_settings WHERE key = ?', ['bank_accounts']);
            await db.execute('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['bank_accounts', accountsStr]);
        }

        if (yape_qr !== undefined) {
            await db.execute('DELETE FROM system_settings WHERE key = ?', ['yape_qr']);
            await db.execute('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['yape_qr', String(yape_qr)]);
        }

        if (delivery_districts !== undefined) {
            const districtsStr = JSON.stringify(delivery_districts);
            await db.execute('DELETE FROM system_settings WHERE key = ?', ['delivery_districts']);
            await db.execute('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['delivery_districts', districtsStr]);
        }

        return res.json({ message: 'Configuraciones actualizadas con éxito.' });
    } catch (error) {
        console.error('Error al actualizar configuraciones:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
