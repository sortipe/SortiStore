const db = require('../config/database');

// =========================================================================
// GESTIÓN DE PLATAFORMAS DE STREAMING (Netflix, Spotify, Gemini, etc.)
// =========================================================================

// 1. Obtener todas las plataformas con estadísticas de uso y capacidad
exports.getPlatforms = async (req, res) => {
    try {
        const platforms = await db.query('SELECT * FROM streaming_platforms ORDER BY name ASC');
        
        const enriched = await Promise.all(platforms.map(async (plat) => {
            const accounts = await db.query(`
                SELECT id, max_devices
                FROM streaming_accounts
                WHERE platform_id = ? OR LOWER(platform) = LOWER(?)
            `, [plat.id, plat.name]);

            const accountsCount = accounts.length;
            let totalSlots = 0;
            let usedSlots = 0;
            let fullAccountsCount = 0;

            for (const acc of accounts) {
                const maxDev = Number(acc.max_devices) || 1;
                totalSlots += maxDev;

                const countRow = await db.querySingle(`
                    SELECT COUNT(*) as count 
                    FROM streaming_assignments 
                    WHERE account_id = ?
                `, [acc.id]);

                const used = Number(countRow ? countRow.count : 0);
                usedSlots += used;
                if (used >= maxDev) {
                    fullAccountsCount++;
                }
            }

            const availableSlots = Math.max(0, totalSlots - usedSlots);

            return {
                ...plat,
                accounts_count: accountsCount,
                total_slots: totalSlots,
                used_slots: usedSlots,
                available_slots: availableSlots,
                full_accounts_count: fullAccountsCount
            };
        }));

        return res.json(enriched);
    } catch (error) {
        console.error('Error al obtener plataformas de streaming:', error);
        return res.status(500).json({ error: 'Error al obtener plataformas de streaming.' });
    }
};

// 2. Crear una nueva plataforma de streaming
exports.createPlatform = async (req, res) => {
    try {
        const { name, image_url, account_type, default_instructions, default_max_devices } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'El nombre de la plataforma es obligatorio.' });
        }

        const existing = await db.querySingle('SELECT id FROM streaming_platforms WHERE LOWER(name) = LOWER(?)', [name.trim()]);
        if (existing) {
            return res.status(400).json({ error: 'Ya existe una plataforma con ese nombre.' });
        }

        const maxDev = Number(default_max_devices) > 0 ? Number(default_max_devices) : 1;

        const resDb = await db.execute(`
            INSERT INTO streaming_platforms (name, image_url, account_type, default_instructions, default_max_devices)
            VALUES (?, ?, ?, ?, ?)
        `, [
            name.trim(),
            image_url ? image_url.trim() : null,
            account_type || 'credentials',
            default_instructions ? default_instructions.trim() : null,
            maxDev
        ]);

        return res.status(201).json({
            message: 'Plataforma creada con éxito.',
            id: resDb.lastInsertRowid || resDb.id
        });
    } catch (error) {
        console.error('Error al crear plataforma:', error);
        return res.status(500).json({ error: 'Error interno al crear plataforma.' });
    }
};

// 3. Actualizar una plataforma existente
exports.updatePlatform = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image_url, account_type, default_instructions, default_max_devices, sync_existing_accounts } = req.body;

        const plat = await db.querySingle('SELECT * FROM streaming_platforms WHERE id = ?', [id]);
        if (!plat) {
            return res.status(404).json({ error: 'Plataforma no encontrada.' });
        }

        const maxDev = Number(default_max_devices) > 0 ? Number(default_max_devices) : (plat.default_max_devices || 1);
        const resolvedName = name ? name.trim() : plat.name;

        await db.execute(`
            UPDATE streaming_platforms
            SET name = ?, image_url = ?, account_type = ?, default_instructions = ?, default_max_devices = ?
            WHERE id = ?
        `, [
            resolvedName,
            image_url !== undefined ? (image_url ? image_url.trim() : null) : plat.image_url,
            account_type || plat.account_type || 'credentials',
            default_instructions !== undefined ? (default_instructions ? default_instructions.trim() : null) : plat.default_instructions,
            maxDev,
            id
        ]);

        // Si se solicitó sincronizar las cuentas existentes de esta plataforma con el nuevo límite
        if (sync_existing_accounts) {
            await db.execute(`
                UPDATE streaming_accounts
                SET max_devices = ?
                WHERE platform_id = ? OR LOWER(platform) = LOWER(?)
            `, [maxDev, id, resolvedName]);
        }

        return res.json({ message: 'Plataforma y límites actualizados con éxito.' });
    } catch (error) {
        console.error('Error al actualizar plataforma:', error);
        return res.status(500).json({ error: 'Error interno al actualizar plataforma.' });
    }
};

// 4. Eliminar una plataforma
exports.deletePlatform = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('UPDATE streaming_accounts SET platform_id = NULL WHERE platform_id = ?', [id]);
        await db.execute('DELETE FROM streaming_platforms WHERE id = ?', [id]);
        return res.json({ message: 'Plataforma eliminada con éxito.' });
    } catch (error) {
        console.error('Error al eliminar plataforma:', error);
        return res.status(500).json({ error: 'Error al eliminar plataforma.' });
    }
};

// =========================================================================
// GESTIÓN DE CUENTAS / PERFILES Y LÍMITES DE USO
// =========================================================================

// 5. Obtener todas las cuentas y perfiles con límites y alertas
exports.getAccounts = async (req, res) => {
    try {
        const { platform, platform_id, search, product_id, status } = req.query;
        let query = `
            SELECT s.*, p.name as product_name,
                   sp.image_url as platform_default_image,
                   sp.default_instructions as platform_default_instructions
            FROM streaming_accounts s 
            LEFT JOIN products p ON s.product_id = p.id 
            LEFT JOIN streaming_platforms sp ON s.platform_id = sp.id OR LOWER(s.platform) = LOWER(sp.name)
            WHERE 1=1
        `;
        const params = [];

        if (platform_id) {
            query += ' AND (s.platform_id = ? OR sp.id = ?)';
            params.push(Number(platform_id), Number(platform_id));
        }
        if (platform) {
            query += ' AND LOWER(s.platform) = LOWER(?)';
            params.push(platform.trim());
        }
        if (product_id) {
            query += ' AND s.product_id = ?';
            params.push(Number(product_id));
        }
        if (search) {
            query += ' AND (s.email LIKE ? OR s.profile_name LIKE ? OR s.platform LIKE ? OR s.activation_link LIKE ?)';
            const likeParam = `%${search}%`;
            params.push(likeParam, likeParam, likeParam, likeParam);
        }

        query += ' ORDER BY s.created_at DESC';

        const accounts = await db.query(query, params);

        const enriched = await Promise.all(accounts.map(async (acc) => {
            const assignments = await db.query(`
                SELECT a.id as assignment_id, a.user_id, a.order_id, a.assigned_at, a.expires_at,
                       a.target_email, a.link_status, a.linked_at,
                       COALESCE(u.name, o.guest_name, 'Cliente ID: ' || a.user_id) as user_name,
                       COALESCE(u.email, o.guest_email) as user_email
                FROM streaming_assignments a
                LEFT JOIN users u ON a.user_id = u.id
                LEFT JOIN orders o ON a.order_id = o.id
                WHERE a.account_id = ?
                ORDER BY a.assigned_at DESC
            `, [acc.id]);

            const currentUsersCount = assignments.length;
            const maxDevices = Number(acc.max_devices) || 1;
            const availableSlots = Math.max(0, maxDevices - currentUsersCount);
            const usagePercentage = Math.min(100, Math.round((currentUsersCount / maxDevices) * 100));
            const isFull = currentUsersCount >= maxDevices;
            const isNearFull = currentUsersCount > 0 && currentUsersCount >= maxDevices * 0.75 && !isFull;
            const isExpired = acc.expiration_date ? new Date(acc.expiration_date) < new Date() : false;

            return {
                ...acc,
                platform_image: acc.platform_image || acc.platform_default_image || null,
                usage_instructions: acc.usage_instructions || acc.platform_default_instructions || null,
                assignments,
                current_users_count: currentUsersCount,
                available_slots: availableSlots,
                usage_percentage: usagePercentage,
                is_full: isFull,
                is_near_full: isNearFull,
                is_expired: isExpired
            };
        }));

        // Filtrado por estado si se solicitó
        let result = enriched;
        if (status === 'full') {
            result = enriched.filter(a => a.is_full && !a.is_expired);
        } else if (status === 'available') {
            result = enriched.filter(a => !a.is_full && !a.is_expired);
        } else if (status === 'near_full') {
            result = enriched.filter(a => a.is_near_full && !a.is_expired);
        } else if (status === 'expired') {
            result = enriched.filter(a => a.is_expired);
        }

        return res.json(result);
    } catch (error) {
        console.error('Error al obtener cuentas de streaming:', error);
        return res.status(500).json({ error: 'Error al obtener cuentas de streaming.' });
    }
};

// 6. Registrar Nueva Cuenta / Perfil Streaming
exports.createAccount = async (req, res) => {
    try {
        const {
            platform, platform_id, platform_image, account_type,
            email, password, profile_name, profile_pin,
            activation_link, activation_links_list, usage_instructions, max_devices,
            expiration_date, product_id, notes
        } = req.body;

        const type = account_type || 'credentials';

        if (!platform || !platform.trim()) {
            return res.status(400).json({ error: 'La plataforma es obligatoria.' });
        }

        // Buscar datos por defecto de la plataforma si no vienen
        let resolvedPlatformId = platform_id ? Number(platform_id) : null;
        let resolvedImage = platform_image ? platform_image.trim() : null;
        let resolvedInstructions = usage_instructions ? usage_instructions.trim() : null;

        const platObj = await db.querySingle(`
            SELECT id, image_url, default_instructions, default_max_devices FROM streaming_platforms 
            WHERE id = ? OR LOWER(name) = LOWER(?)
        `, [resolvedPlatformId || 0, platform.trim()]);

        if (platObj) {
            resolvedPlatformId = platObj.id;
            if (!resolvedImage && platObj.image_url) resolvedImage = platObj.image_url;
            if (!resolvedInstructions && platObj.default_instructions) resolvedInstructions = platObj.default_instructions;
        }

        const limitDevices = Number(max_devices) > 0 ? Number(max_devices) : (platObj && platObj.default_max_devices ? platObj.default_max_devices : 1);

        // --- CASO 1: MODALIDAD LINK DE ACTIVACIÓN (Soporta múltiples enlaces por lote) ---
        if (type === 'activation_link') {
            const rawLinks = activation_links_list || activation_link;
            if (!rawLinks || !String(rawLinks).trim()) {
                return res.status(400).json({ error: 'Debes ingresar al menos un enlace de activación.' });
            }

            const linksList = (typeof rawLinks === 'string' ? rawLinks.split(/[\r\n]+/) : (Array.isArray(rawLinks) ? rawLinks : [rawLinks]))
                .map(l => String(l).trim())
                .filter(l => l.length > 0);

            if (linksList.length === 0) {
                return res.status(400).json({ error: 'No se encontraron enlaces de activación válidos.' });
            }

            let insertedCount = 0;
            for (const singleLink of linksList) {
                await db.execute(`
                    INSERT INTO streaming_accounts (
                        platform, platform_id, platform_image, account_type,
                        email, password, profile_name, profile_pin,
                        activation_link, usage_instructions, max_devices,
                        expiration_date, product_id, notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    platform.trim(),
                    resolvedPlatformId,
                    resolvedImage,
                    'activation_link',
                    null,
                    null,
                    profile_name ? profile_name.trim() : null,
                    null,
                    singleLink,
                    resolvedInstructions,
                    1, // Cada enlace de activación es para 1 compra/usuario
                    expiration_date || null,
                    product_id ? Number(product_id) : null,
                    notes ? notes.trim() : null
                ]);
                insertedCount++;
            }

            return res.status(201).json({
                message: `Se registraron ${insertedCount} enlace(s) de activación exitosamente en el inventario.`,
                count: insertedCount
            });
        }

        // --- CASO 2: MODALIDAD AGREGAR A CUENTA PROPIA (El cliente enviará su correo) ---
        if (type === 'personal_account') {
            const resDb = await db.execute(`
                INSERT INTO streaming_accounts (
                    platform, platform_id, platform_image, account_type,
                    email, password, profile_name, profile_pin,
                    activation_link, usage_instructions, max_devices,
                    expiration_date, product_id, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                platform.trim(),
                resolvedPlatformId,
                resolvedImage,
                'personal_account',
                null,
                null,
                profile_name ? profile_name.trim() : 'Vinculación a Cuenta Propia',
                null,
                null,
                resolvedInstructions,
                limitDevices,
                expiration_date || null,
                product_id ? Number(product_id) : null,
                notes ? notes.trim() : null
            ]);

            return res.status(201).json({
                message: `Lote de vinculación a cuenta propia registrado con capacidad para ${limitDevices} usuario(s).`,
                id: resDb.lastInsertRowid || resDb.id
            });
        }

        // --- CASO 3: MODALIDAD CREDENCIALES (Email, Clave, Perfil, PIN) ---
        if (type === 'credentials' && (!email || !email.trim()) && (!password || !password.trim())) {
            return res.status(400).json({ error: 'El correo o usuario y la contraseña son requeridos para este tipo de cuenta.' });
        }

        const resDb = await db.execute(`
            INSERT INTO streaming_accounts (
                platform, platform_id, platform_image, account_type,
                email, password, profile_name, profile_pin,
                activation_link, usage_instructions, max_devices,
                expiration_date, product_id, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            platform.trim(),
            resolvedPlatformId,
            resolvedImage,
            type,
            email ? email.trim() : null,
            password ? password.trim() : null,
            profile_name ? profile_name.trim() : null,
            profile_pin ? profile_pin.trim() : null,
            activation_link ? activation_link.trim() : null,
            resolvedInstructions,
            limitDevices,
            expiration_date || null,
            product_id ? Number(product_id) : null,
            notes ? notes.trim() : null
        ]);

        return res.status(201).json({
            message: 'Cuenta / Perfil de streaming registrado con éxito.',
            id: resDb.lastInsertRowid || resDb.id
        });
    } catch (error) {
        console.error('Error al crear cuenta de streaming:', error);
        return res.status(500).json({ error: 'Error interno al registrar cuenta de streaming.' });
    }
};

// 7. Actualizar Cuenta / Perfil Streaming
exports.updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            platform, platform_id, platform_image, account_type,
            email, password, profile_name, profile_pin,
            activation_link, usage_instructions, max_devices,
            expiration_date, product_id, notes
        } = req.body;

        const existing = await db.querySingle('SELECT * FROM streaming_accounts WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ error: 'Cuenta de streaming no encontrada.' });
        }

        const type = account_type !== undefined ? account_type : (existing.account_type || 'credentials');
        const limitDevices = max_devices !== undefined ? (Number(max_devices) > 0 ? Number(max_devices) : 1) : existing.max_devices;
        const targetPlatform = platform !== undefined ? (platform ? platform.trim() : existing.platform) : existing.platform;
        const targetPlatformId = platform_id !== undefined ? (platform_id ? Number(platform_id) : null) : existing.platform_id;
        const targetPlatformImage = platform_image !== undefined ? (platform_image ? platform_image.trim() : null) : existing.platform_image;
        const targetEmail = email !== undefined ? (email ? email.trim() : null) : existing.email;
        const targetPassword = password !== undefined ? (password ? password.trim() : null) : existing.password;
        const targetProfileName = profile_name !== undefined ? (profile_name ? profile_name.trim() : null) : existing.profile_name;
        const targetProfilePin = profile_pin !== undefined ? (profile_pin ? profile_pin.trim() : null) : existing.profile_pin;
        const targetActivationLink = activation_link !== undefined ? (activation_link ? activation_link.trim() : null) : existing.activation_link;
        const targetUsageInstructions = usage_instructions !== undefined ? (usage_instructions ? usage_instructions.trim() : null) : existing.usage_instructions;
        const targetExpirationDate = expiration_date !== undefined ? (expiration_date || null) : existing.expiration_date;
        const targetProductId = product_id !== undefined ? (product_id ? Number(product_id) : null) : existing.product_id;
        const targetNotes = notes !== undefined ? (notes ? notes.trim() : null) : existing.notes;

        await db.execute(`
            UPDATE streaming_accounts SET
                platform = ?,
                platform_id = ?,
                platform_image = ?,
                account_type = ?,
                email = ?,
                password = ?,
                profile_name = ?,
                profile_pin = ?,
                activation_link = ?,
                usage_instructions = ?,
                max_devices = ?,
                expiration_date = ?,
                product_id = ?,
                notes = ?
            WHERE id = ?
        `, [
            targetPlatform,
            targetPlatformId,
            targetPlatformImage,
            type,
            targetEmail,
            targetPassword,
            targetProfileName,
            targetProfilePin,
            targetActivationLink,
            targetUsageInstructions,
            limitDevices,
            targetExpirationDate,
            targetProductId,
            targetNotes,
            id
        ]);

        return res.json({ message: 'Cuenta de streaming actualizada con éxito.' });
    } catch (error) {
        console.error('Error al actualizar cuenta de streaming:', error);
        return res.status(500).json({ error: 'Error interno al actualizar cuenta de streaming.' });
    }
};

// 8. Eliminar Cuenta / Perfil Streaming
exports.deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const acc = await db.querySingle('SELECT id FROM streaming_accounts WHERE id = ?', [id]);
        if (!acc) {
            return res.status(404).json({ error: 'Cuenta de streaming no encontrada.' });
        }

        await db.execute('DELETE FROM streaming_assignments WHERE account_id = ?', [id]);
        await db.execute('DELETE FROM streaming_accounts WHERE id = ?', [id]);

        return res.json({ message: 'Cuenta de streaming eliminada con éxito.' });
    } catch (error) {
        console.error('Error al eliminar cuenta de streaming:', error);
        return res.status(500).json({ error: 'Error al eliminar cuenta de streaming.' });
    }
};

// 9. Asignar un Perfil a un Usuario / Pedido Manualmente
exports.assignUser = async (req, res) => {
    try {
        const { account_id, user_id, order_id, expires_at } = req.body;

        if (!account_id || (!user_id && !order_id)) {
            return res.status(400).json({ error: 'ID de cuenta y ID de usuario o pedido son requeridos.' });
        }

        const acc = await db.querySingle('SELECT * FROM streaming_accounts WHERE id = ?', [account_id]);
        if (!acc) {
            return res.status(404).json({ error: 'Cuenta de streaming no encontrada.' });
        }

        const countRow = await db.querySingle('SELECT COUNT(*) as count FROM streaming_assignments WHERE account_id = ?', [account_id]);
        const currentCount = Number(countRow ? countRow.count : 0);
        if (currentCount >= acc.max_devices) {
            return res.status(400).json({ error: `La cuenta ya alcanzó el límite máximo de ${acc.max_devices} usuario(s) / dispositivo(s). Cupo agotado.` });
        }

        let targetUserId = user_id;
        if (!targetUserId && order_id) {
            const order = await db.querySingle('SELECT user_id FROM orders WHERE id = ?', [order_id]);
            if (order && order.user_id) targetUserId = order.user_id;
        }

        const expirationDate = expires_at || acc.expiration_date || null;

        await db.execute(`
            INSERT INTO streaming_assignments (account_id, order_id, user_id, expires_at)
            VALUES (?, ?, ?, ?)
        `, [account_id, order_id || null, targetUserId || null, expirationDate]);

        return res.json({ message: 'Usuario asignado exitosamente al perfil de streaming.' });
    } catch (error) {
        console.error('Error al asignar usuario a cuenta de streaming:', error);
        return res.status(500).json({ error: 'Error al asignar usuario.' });
    }
};

// 10. Desasignar / Liberar cupo de usuario
exports.unassignUser = async (req, res) => {
    try {
        const { assignment_id } = req.params;
        await db.execute('DELETE FROM streaming_assignments WHERE id = ?', [assignment_id]);
        return res.json({ message: 'Asignación removida con éxito. Cupo liberado.' });
    } catch (error) {
        console.error('Error al liberar asignación:', error);
        return res.status(500).json({ error: 'Error al remover asignación.' });
    }
};

// =========================================================================
// ASIGNACIÓN AUTOMÁTICA Y ENTREGA DE CUENTAS POR PEDIDO
// =========================================================================

// Función interna reutilizable para auto-asignar cuentas de streaming a un pedido
async function autoAssignStreamingToOrder(orderId) {
    const order = await db.querySingle('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return { success: false, error: 'Pedido no encontrado.' };

    const items = await db.query(`
        SELECT oi.*, p.name as product_name, p.streaming_platform, p.type, p.id as product_id
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    `, [orderId]);

    const assigned = [];
    const unfulfilled = [];

    for (const item of items) {
        const isStreaming = item.streaming_platform || (item.type === 'digital' && item.streaming_platform);
        if (!isStreaming) continue;

        const platformName = item.streaming_platform;
        const qty = item.quantity || 1;

        // Verificar cuántas asignaciones ya tiene este pedido para este producto
        const currentAssignments = await db.query(`
            SELECT a.id, a.account_id
            FROM streaming_assignments a
            JOIN streaming_accounts s ON a.account_id = s.id
            WHERE a.order_id = ? AND (s.product_id = ? OR LOWER(s.platform) = LOWER(?))
        `, [orderId, item.product_id, platformName]);

        const needed = qty - currentAssignments.length;

        for (let i = 0; i < needed; i++) {
            // Buscar una cuenta disponible que no esté llena ni vencida
            // Prioridad: 1. Misma plataforma y mismo producto. 2. Misma plataforma con product_id nulo/libre
            let availableAccount = await db.querySingle(`
                SELECT s.*,
                       (SELECT COUNT(*) FROM streaming_assignments WHERE account_id = s.id) as used_count
                FROM streaming_accounts s
                WHERE s.product_id = ?
                  AND (s.expiration_date IS NULL OR s.expiration_date > CURRENT_TIMESTAMP)
                  AND (SELECT COUNT(*) FROM streaming_assignments WHERE account_id = s.id) < s.max_devices
                ORDER BY used_count ASC, s.created_at ASC
                LIMIT 1
            `, [item.product_id]);

            if (!availableAccount && platformName) {
                availableAccount = await db.querySingle(`
                    SELECT s.*,
                           (SELECT COUNT(*) FROM streaming_assignments WHERE account_id = s.id) as used_count
                    FROM streaming_accounts s
                    WHERE LOWER(s.platform) = LOWER(?)
                      AND (s.expiration_date IS NULL OR s.expiration_date > CURRENT_TIMESTAMP)
                      AND (SELECT COUNT(*) FROM streaming_assignments WHERE account_id = s.id) < s.max_devices
                    ORDER BY used_count ASC, s.created_at ASC
                    LIMIT 1
                `, [platformName]);
            }

            if (availableAccount) {
                const expiresAt = availableAccount.expiration_date || null;
                const linkStatus = availableAccount.account_type === 'personal_account' ? 'pending' : 'active';
                const resDb = await db.execute(`
                    INSERT INTO streaming_assignments (account_id, order_id, user_id, expires_at, link_status)
                    VALUES (?, ?, ?, ?, ?)
                `, [availableAccount.id, orderId, order.user_id || null, expiresAt, linkStatus]);

                assigned.push({
                    account_id: availableAccount.id,
                    platform: availableAccount.platform,
                    email: availableAccount.email,
                    profile_name: availableAccount.profile_name,
                    activation_link: availableAccount.activation_link,
                    assignment_id: resDb.lastInsertRowid
                });
            } else {
                unfulfilled.push({
                    product_name: item.product_name,
                    platform: platformName
                });
            }
        }
    }

    return {
        success: true,
        assigned,
        unfulfilled
    };
}

exports.autoAssignStreamingToOrder = autoAssignStreamingToOrder;

// 11. Endpoint para ejecutar auto-asignación manual desde el panel
exports.autoAssignOrderStreaming = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await autoAssignStreamingToOrder(Number(id));
        return res.json(result);
    } catch (error) {
        console.error('Error en auto-asignación de streaming:', error);
        return res.status(500).json({ error: 'Error al auto-asignar streaming.' });
    }
};

// 12. Obtener cuentas entregadas/asignadas a un pedido específico (Para Admin y Cliente)
exports.getOrderStreaming = async (req, res) => {
    try {
        const { id } = req.params;
        const orderId = Number(id);

        const order = await db.querySingle('SELECT user_id FROM orders WHERE id = ?', [orderId]);
        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }

        // Si es cliente, verificar que el pedido sea suyo
        if (req.user && req.user.role === 'client' && order.user_id !== req.user.id) {
            return res.status(403).json({ error: 'No autorizado para ver este pedido.' });
        }

        const deliveries = await db.query(`
            SELECT a.id as assignment_id, a.assigned_at, a.expires_at,
                   a.target_email, a.link_status, a.linked_at,
                   s.id as account_id, s.platform, s.email, s.password, s.profile_name, s.profile_pin,
                   s.activation_link, s.account_type, s.max_devices, s.notes,
                   COALESCE(s.platform_image, sp.image_url) as platform_image,
                   COALESCE(s.usage_instructions, sp.default_instructions) as usage_instructions,
                   (SELECT COUNT(*) FROM streaming_assignments WHERE account_id = s.id) as current_users_count
            FROM streaming_assignments a
            JOIN streaming_accounts s ON a.account_id = s.id
            LEFT JOIN streaming_platforms sp ON s.platform_id = sp.id OR LOWER(s.platform) = LOWER(sp.name)
            WHERE a.order_id = ?
            ORDER BY a.assigned_at ASC
        `, [orderId]);

        return res.json(deliveries);
    } catch (error) {
        console.error('Error al obtener streaming de la orden:', error);
        return res.status(500).json({ error: 'Error al obtener entregas de streaming.' });
    }
};

// 13. Marcar una asignación como vinculada por el Administrador
exports.markAssignmentLinked = async (req, res) => {
    try {
        const { assignment_id } = req.params;
        const ass = await db.querySingle('SELECT id FROM streaming_assignments WHERE id = ?', [assignment_id]);
        if (!ass) {
            return res.status(404).json({ error: 'Asignación no encontrada.' });
        }
        await db.execute(`
            UPDATE streaming_assignments 
            SET link_status = 'active', linked_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [assignment_id]);
        return res.json({ message: 'Cuenta marcada como vinculada y activa exitosamente.' });
    } catch (error) {
        console.error('Error al marcar vinculación:', error);
        return res.status(500).json({ error: 'Error al actualizar estado de vinculación.' });
    }
};

// 14. Enviar correo personal por el cliente para vinculación
exports.submitTargetEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const orderId = Number(id);
        const { target_email, assignment_id } = req.body;

        if (!target_email || !target_email.trim() || !target_email.includes('@')) {
            return res.status(400).json({ error: 'Por favor ingresa un correo electrónico válido.' });
        }

        const order = await db.querySingle('SELECT user_id FROM orders WHERE id = ?', [orderId]);
        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }

        if (req.user && req.user.role === 'client' && order.user_id !== req.user.id) {
            return res.status(403).json({ error: 'No autorizado para modificar este pedido.' });
        }

        if (assignment_id) {
            await db.execute(`
                UPDATE streaming_assignments 
                SET target_email = ?, link_status = 'pending' 
                WHERE id = ? AND order_id = ?
            `, [target_email.trim(), assignment_id, orderId]);
        } else {
            await db.execute(`
                UPDATE streaming_assignments 
                SET target_email = ?, link_status = 'pending' 
                WHERE order_id = ?
            `, [target_email.trim(), orderId]);
        }

        return res.json({ message: 'Correo enviado correctamente para la vinculación. Nuestro equipo activará tu cuenta en breve.' });
    } catch (error) {
        console.error('Error al enviar correo para vinculación:', error);
        return res.status(500).json({ error: 'Error al enviar correo para vinculación.' });
    }
};
