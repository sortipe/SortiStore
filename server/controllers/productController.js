const db = require('../config/database');

// Listar todos los productos con filtros (Búsqueda, Categoría, Ofertas, Destacados, etc.)
exports.getProducts = async (req, res) => {
    try {
        const { q, category, type, featured, recommended, presale, offer } = req.query;
        let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
        const params = [];

        if (q) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)';
            const likeParam = `%${q}%`;
            params.push(likeParam, likeParam, likeParam, likeParam);
        }

        if (category) {
            query += ' AND (c.slug = ? OR c.parent_id IN (SELECT id FROM categories WHERE slug = ?))';
            params.push(category, category);
        }

        if (type) {
            query += ' AND p.type = ?';
            params.push(type);
        }

        if (featured === 'true' || featured === '1') {
            query += ' AND p.is_featured = 1';
        }

        if (recommended === 'true' || recommended === '1') {
            query += ' AND p.is_recommended = 1';
        }

        if (presale === 'true' || presale === '1') {
            query += ' AND p.is_presale = 1';
        }

        if (offer === 'true' || offer === '1') {
            query += ' AND p.price_offer IS NOT NULL AND p.price_offer < p.price_normal';
        }

        query += ' ORDER BY p.created_at DESC';

        const products = await db.query(query, params);

        // Obtener galería multimedia y variantes para cada producto
        const enrichedProducts = await Promise.all(products.map(async (product) => {
            // Galería
            const media = await db.query('SELECT id, media_url, is_video FROM product_media WHERE product_id = ?', [product.id]);
            // Variantes
            const variants = await db.query('SELECT id, type, value, stock_offset, price_offset FROM product_variants WHERE product_id = ?', [product.id]);
            
            return {
                ...product,
                media,
                variants,
                is_featured: !!product.is_featured,
                is_recommended: !!product.is_recommended,
                is_new: !!product.is_new,
                is_sold_out: !!product.is_sold_out,
                is_upcoming: !!product.is_upcoming,
                is_presale: !!product.is_presale
            };
        }));

        return res.json(enrichedProducts);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Obtener detalles de un producto por su slug
exports.getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const product = await db.querySingle(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.slug = ?
        `, [slug]);

        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }

        // Galería multimedia
        const media = await db.query('SELECT id, media_url, is_video FROM product_media WHERE product_id = ?', [product.id]);
        
        // Variantes
        const variants = await db.query('SELECT id, type, value, stock_offset, price_offset FROM product_variants WHERE product_id = ?', [product.id]);

        const enrichedProduct = {
            ...product,
            media,
            variants,
            is_featured: !!product.is_featured,
            is_recommended: !!product.is_recommended,
            is_new: !!product.is_new,
            is_sold_out: !!product.is_sold_out,
            is_upcoming: !!product.is_upcoming,
            is_presale: !!product.is_presale
        };

        return res.json(enrichedProduct);
    } catch (error) {
        console.error('Error al obtener producto por slug:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Obtener árbol de categorías y subcategorías
exports.getCategories = async (req, res) => {
    try {
        const allCategories = await db.query('SELECT * FROM categories');
        
        const parentCategories = allCategories.filter(cat => cat.parent_id === null);
        const categoriesTree = parentCategories.map(parent => {
            const children = allCategories.filter(cat => cat.parent_id === parent.id);
            return {
                ...parent,
                subcategories: children
            };
        });

        return res.json(categoriesTree);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
