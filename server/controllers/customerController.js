const db = require('../config/database');

// 1. Obtener Descargas del Cliente (Software y Contenido Digital comprado y pagado)
exports.getDownloads = (req, res) => {
    try {
        const userId = req.user.id;
        const downloads = db.prepare(`
            SELECT DISTINCT p.id, p.name, p.slug, p.download_url, p.download_file_size, p.download_version, o.created_at
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = ? AND o.status IN ('paid', 'processing', 'completed', 'shipped')
              AND p.type IN ('digital', 'software')
            ORDER BY o.created_at DESC
        `).all(userId);

        return res.json(downloads);
    } catch (error) {
        console.error('Error al obtener descargas:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 2. Obtener Cursos Comprados con su Porcentaje de Progreso
exports.getCourses = (req, res) => {
    try {
        const userId = req.user.id;
        
        // Obtener cursos vinculados a productos comprados
        const courses = db.prepare(`
            SELECT DISTINCT c.id, c.title, c.description, c.cover_image, c.product_id
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN courses c ON oi.product_id = c.product_id
            WHERE o.user_id = ? AND o.status IN ('paid', 'processing', 'completed', 'shipped')
        `).all(userId);

        // Calcular progreso para cada curso
        const enrichedCourses = courses.map(course => {
            // Total de lecciones en el curso
            const totalLessonsRow = db.prepare(`
                SELECT COUNT(cl.id) as count 
                FROM course_lessons cl
                JOIN course_modules cm ON cl.module_id = cm.id
                WHERE cm.course_id = ?
            `).get(course.id);
            const totalLessons = totalLessonsRow ? totalLessonsRow.count : 0;

            // Lecciones completadas por este usuario en este curso
            const completedLessonsRow = db.prepare(`
                SELECT COUNT(ulp.lesson_id) as count 
                FROM user_lesson_progress ulp
                JOIN course_lessons cl ON ulp.lesson_id = cl.id
                JOIN course_modules cm ON cl.module_id = cm.id
                WHERE cm.course_id = ? AND ulp.user_id = ? AND ulp.completed = 1
            `).get(course.id, userId);
            const completedLessons = completedLessonsRow ? completedLessonsRow.count : 0;

            const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

            return {
                ...course,
                totalLessons,
                completedLessons,
                progressPercent
            };
        });

        return res.json(enrichedCourses);
    } catch (error) {
        console.error('Error al obtener cursos del cliente:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 3. Obtener Estructura Completa de un Curso y Progreso de Lecciones
exports.getCourseDetails = (req, res) => {
    try {
        const userId = req.user.id;
        const courseId = req.params.id;

        // Validar acceso: el usuario debe haber comprado el producto asociado al curso
        const accessCheck = db.prepare(`
            SELECT 1 FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN courses c ON oi.product_id = c.product_id
            WHERE o.user_id = ? AND c.id = ? AND o.status IN ('paid', 'processing', 'completed', 'shipped')
            LIMIT 1
        `).get(userId, courseId);

        if (!accessCheck && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'No tienes acceso a este curso. Debes comprarlo primero.' });
        }

        const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso no encontrado.' });
        }

        // Obtener módulos
        const modules = db.prepare('SELECT * FROM course_modules WHERE course_id = ? ORDER BY sort_order ASC').all(courseId);

        // Obtener lecciones estructuradas por módulo
        const modulesWithLessons = modules.map(mod => {
            const lessons = db.prepare('SELECT * FROM course_lessons WHERE module_id = ? ORDER BY sort_order ASC').all(mod.id);
            
            const enrichedLessons = lessons.map(lesson => {
                // Verificar si esta lección está completada por el usuario
                const progress = db.prepare(`
                    SELECT completed FROM user_lesson_progress 
                    WHERE user_id = ? AND lesson_id = ?
                `).get(userId, lesson.id);

                return {
                    ...lesson,
                    completed: progress ? !!progress.completed : false,
                    exam_questions: lesson.exam_questions ? JSON.parse(lesson.exam_questions) : null
                };
            });

            return {
                ...mod,
                lessons: enrichedLessons
            };
        });

        return res.json({
            course,
            modules: modulesWithLessons
        });
    } catch (error) {
        console.error('Error al obtener estructura del curso:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 4. Marcar/Desmarcar una clase como completada
exports.toggleLessonComplete = (req, res) => {
    try {
        const userId = req.user.id;
        const { lessonId, completed } = req.body; // completed: boolean

        if (!lessonId) {
            return res.status(400).json({ error: 'El ID de la lección es requerido.' });
        }

        // Verificar si existe la lección
        const lesson = db.prepare('SELECT id, module_id FROM course_lessons WHERE id = ?').get(lessonId);
        if (!lesson) {
            return res.status(404).json({ error: 'Lección no encontrada.' });
        }

        // Obtener ID del curso para calcular el progreso total
        const moduleRow = db.prepare('SELECT course_id FROM course_modules WHERE id = ?').get(lesson.module_id);
        const courseId = moduleRow.course_id;

        if (completed) {
            db.prepare(`
                INSERT INTO user_lesson_progress (user_id, lesson_id, completed)
                VALUES (?, ?, 1)
                ON CONFLICT(user_id, lesson_id) DO UPDATE SET completed = 1, completed_at = CURRENT_TIMESTAMP
            `).run(userId, lessonId);
        } else {
            db.prepare(`
                DELETE FROM user_lesson_progress 
                WHERE user_id = ? AND lesson_id = ?
            `).run(userId, lessonId);
        }

        // Recalcular progreso actual del curso
        const totalLessonsRow = db.prepare(`
            SELECT COUNT(cl.id) as count 
            FROM course_lessons cl
            JOIN course_modules cm ON cl.module_id = cm.id
            WHERE cm.course_id = ?
        `).get(courseId);
        const totalLessons = totalLessonsRow ? totalLessonsRow.count : 0;

        const completedLessonsRow = db.prepare(`
            SELECT COUNT(ulp.lesson_id) as count 
            FROM user_lesson_progress ulp
            JOIN course_lessons cl ON ulp.lesson_id = cl.id
            JOIN course_modules cm ON cl.module_id = cm.id
            WHERE cm.course_id = ? AND ulp.user_id = ? AND ulp.completed = 1
        `).get(courseId, userId);
        const completedLessons = completedLessonsRow ? completedLessonsRow.count : 0;

        const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        const isCourseCompleted = progressPercent === 100;

        return res.json({
            message: 'Progreso de la lección actualizado.',
            completed: !!completed,
            progressPercent,
            isCourseCompleted
        });
    } catch (error) {
        console.error('Error al actualizar progreso de lección:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 5. Obtener Billetera de Monedas Sorti e Historial
exports.getWallet = (req, res) => {
    try {
        const userId = req.user.id;
        const wallet = db.prepare('SELECT sorti_balance FROM user_wallets WHERE user_id = ?').get(userId);
        const transactions = db.prepare('SELECT * FROM sorti_transactions WHERE user_id = ? ORDER BY created_at DESC').all(userId);

        return res.json({
            balance: wallet ? wallet.sorti_balance : 0,
            transactions
        });
    } catch (error) {
        console.error('Error al obtener billetera de monedas:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 6. Obtener Cupones del Cliente (Generalmente disponibles y vigentes)
exports.getCoupons = (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date().toISOString();

        // Cupones que no han expirado, no superaron usos y no son de otro usuario
        const coupons = db.prepare(`
            SELECT * FROM coupons 
            WHERE (user_id IS NULL OR user_id = ?) 
              AND (expires_at IS NULL OR expires_at > ?)
              AND uses_count < max_uses
        `).all(userId, now);

        // Obtener historial de cupones usados por este usuario
        const usedCoupons = db.prepare(`
            SELECT uc.*, c.code, c.type, c.value, o.total_amount
            FROM user_coupons uc
            JOIN coupons c ON uc.coupon_id = c.id
            JOIN orders o ON uc.order_id = o.id
            WHERE uc.user_id = ?
            ORDER BY uc.used_at DESC
        `).all(userId);

        return res.json({
            available: coupons,
            used: usedCoupons
        });
    } catch (error) {
        console.error('Error al obtener cupones del cliente:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 7. Actualizar Datos de la Cuenta del Cliente
exports.updateProfile = (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, password } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'El nombre y correo son requeridos.' });
        }

        // Validar duplicado de email
        const emailCheck = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, userId);
        if (emailCheck) {
            return res.status(400).json({ error: 'El correo electrónico ya está en uso por otra cuenta.' });
        }

        if (password && password.trim() !== '') {
            const hash = bcrypt.hashSync(password, 10);
            db.prepare('UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?')
                .run(name, email, hash, userId);
        } else {
            db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')
                .run(name, email, userId);
        }

        return res.json({ message: 'Perfil actualizado con éxito.' });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
