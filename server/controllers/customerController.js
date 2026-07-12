const db = require('../config/database');
const bcrypt = require('bcryptjs');

// 1. Obtener Descargas del Cliente
exports.getDownloads = async (req, res) => {
    try {
        const userId = req.user.id;
        const downloads = await db.query(`
            SELECT DISTINCT p.id, p.name, p.slug, p.download_url, p.download_file_size, p.download_version, o.created_at
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = ? AND o.status IN ('paid', 'processing', 'completed', 'shipped')
              AND p.type IN ('digital', 'software')
            ORDER BY o.created_at DESC
        `, [userId]);

        return res.json(downloads);
    } catch (error) {
        console.error('Error al obtener descargas:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 2. Obtener Cursos Comprados con su Porcentaje de Progreso
exports.getCourses = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Obtener cursos vinculados a productos comprados
        const courses = await db.query(`
            SELECT DISTINCT c.id, c.title, c.description, c.cover_image, c.product_id
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN courses c ON oi.product_id = c.product_id
            WHERE o.user_id = ? AND o.status IN ('paid', 'processing', 'completed', 'shipped')
        `, [userId]);

        // Calcular progreso para cada curso
        const enrichedCourses = await Promise.all(courses.map(async (course) => {
            // Total de lecciones en el curso
            const totalLessonsRow = await db.querySingle(`
                SELECT COUNT(cl.id) as count 
                FROM course_lessons cl
                JOIN course_modules cm ON cl.module_id = cm.id
                WHERE cm.course_id = ?
            `, [course.id]);
            const totalLessons = totalLessonsRow ? Number(totalLessonsRow.count) : 0;

            // Lecciones completadas por este usuario en este curso
            const completedLessonsRow = await db.querySingle(`
                SELECT COUNT(ulp.lesson_id) as count 
                FROM user_lesson_progress ulp
                JOIN course_lessons cl ON ulp.lesson_id = cl.id
                JOIN course_modules cm ON cl.module_id = cm.id
                WHERE cm.course_id = ? AND ulp.user_id = ? AND ulp.completed = 1
            `, [course.id, userId]);
            const completedLessons = completedLessonsRow ? Number(completedLessonsRow.count) : 0;

            const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

            return {
                ...course,
                totalLessons,
                completedLessons,
                progressPercent
            };
        }));

        return res.json(enrichedCourses);
    } catch (error) {
        console.error('Error al obtener cursos del cliente:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 3. Obtener Estructura Completa de un Curso y Progreso de Lecciones
exports.getCourseDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const courseId = req.params.id;

        // Validar acceso: el usuario debe haber comprado el producto asociado al curso
        const accessCheck = await db.querySingle(`
            SELECT 1 as has_access FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN courses c ON oi.product_id = c.product_id
            WHERE o.user_id = ? AND c.id = ? AND o.status IN ('paid', 'processing', 'completed', 'shipped')
            LIMIT 1
        `, [userId, courseId]);

        if (!accessCheck && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'No tienes acceso a este curso. Debes comprarlo primero.' });
        }

        const course = await db.querySingle('SELECT * FROM courses WHERE id = ?', [courseId]);
        if (!course) {
            return res.status(404).json({ error: 'Curso no encontrado.' });
        }

        // Obtener módulos
        const modules = await db.query('SELECT * FROM course_modules WHERE course_id = ? ORDER BY sort_order ASC', [courseId]);

        // Obtener lecciones estructuradas por módulo
        const modulesWithLessons = await Promise.all(modules.map(async (mod) => {
            const lessons = await db.query('SELECT * FROM course_lessons WHERE module_id = ? ORDER BY sort_order ASC', [mod.id]);
            
            const enrichedLessons = await Promise.all(lessons.map(async (lesson) => {
                // Verificar si esta lección está completada por el usuario
                const progress = await db.querySingle(`
                    SELECT completed FROM user_lesson_progress 
                    WHERE user_id = ? AND lesson_id = ?
                `, [userId, lesson.id]);

                return {
                    ...lesson,
                    completed: progress ? !!progress.completed : false,
                    exam_questions: lesson.exam_questions ? JSON.parse(lesson.exam_questions) : null
                };
            }));

            return {
                ...mod,
                lessons: enrichedLessons
            };
        }));

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
exports.toggleLessonComplete = async (req, res) => {
    try {
        const userId = req.user.id;
        const { lessonId, completed } = req.body;

        if (!lessonId) {
            return res.status(400).json({ error: 'El ID de la lección es requerido.' });
        }

        // Verificar si existe la lección
        const lesson = await db.querySingle('SELECT id, module_id FROM course_lessons WHERE id = ?', [lessonId]);
        if (!lesson) {
            return res.status(404).json({ error: 'Lección no encontrada.' });
        }

        // Obtener ID del curso para calcular el progreso total
        const moduleRow = await db.querySingle('SELECT course_id FROM course_modules WHERE id = ?', [lesson.module_id]);
        const courseId = moduleRow.course_id;

        if (completed) {
            // SQLite e Postgres soportan ON CONFLICT de claves primarias compuestas de forma distinta.
            // Para simplificar, primero eliminamos si existe y luego insertamos.
            await db.execute('DELETE FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?', [userId, lessonId]);
            await db.execute(`
                INSERT INTO user_lesson_progress (user_id, lesson_id, completed)
                VALUES (?, ?, 1)
            `, [userId, lessonId]);
        } else {
            await db.execute(`
                DELETE FROM user_lesson_progress 
                WHERE user_id = ? AND lesson_id = ?
            `, [userId, lessonId]);
        }

        // Recalcular progreso actual del curso
        const totalLessonsRow = await db.querySingle(`
            SELECT COUNT(cl.id) as count 
            FROM course_lessons cl
            JOIN course_modules cm ON cl.module_id = cm.id
            WHERE cm.course_id = ?
        `, [courseId]);
        const totalLessons = totalLessonsRow ? Number(totalLessonsRow.count) : 0;

        const completedLessonsRow = await db.querySingle(`
            SELECT COUNT(ulp.lesson_id) as count 
            FROM user_lesson_progress ulp
            JOIN course_lessons cl ON ulp.lesson_id = cl.id
            JOIN course_modules cm ON cl.module_id = cm.id
            WHERE cm.course_id = ? AND ulp.user_id = ? AND ulp.completed = 1
        `, [courseId, userId]);
        const completedLessons = completedLessonsRow ? Number(completedLessonsRow.count) : 0;

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
exports.getWallet = async (req, res) => {
    try {
        const userId = req.user.id;
        const wallet = await db.querySingle('SELECT sorti_balance FROM user_wallets WHERE user_id = ?', [userId]);
        const transactions = await db.query('SELECT * FROM sorti_transactions WHERE user_id = ? ORDER BY created_at DESC', [userId]);

        return res.json({
            balance: wallet ? wallet.sorti_balance : 0,
            transactions
        });
    } catch (error) {
        console.error('Error al obtener billetera de monedas:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 6. Obtener Cupones del Cliente
exports.getCoupons = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date().toISOString();

        // Cupones que no han expirado, no superaron usos y no son de otro usuario
        const coupons = await db.query(`
            SELECT * FROM coupons 
            WHERE (user_id IS NULL OR user_id = ?) 
              AND (expires_at IS NULL OR expires_at > ?)
              AND uses_count < max_uses
        `, [userId, now]);

        // Obtener historial de cupones usados por este usuario
        const usedCoupons = await db.query(`
            SELECT uc.*, c.code, c.type, c.value, o.total_amount
            FROM user_coupons uc
            JOIN coupons c ON uc.coupon_id = c.id
            JOIN orders o ON uc.order_id = o.id
            WHERE uc.user_id = ?
            ORDER BY uc.used_at DESC
        `, [userId]);

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
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, password } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'El nombre y correo son requeridos.' });
        }

        // Validar duplicado de email
        const emailCheck = await db.querySingle('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
        if (emailCheck) {
            return res.status(400).json({ error: 'El correo electrónico ya está en uso por otra cuenta.' });
        }

        if (password && password.trim() !== '') {
            const hash = bcrypt.hashSync(password, 10);
            await db.execute('UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?', [name, email, hash, userId]);
        } else {
            await db.execute('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, userId]);
        }

        return res.json({ message: 'Perfil actualizado con éxito.' });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
