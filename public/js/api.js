/* ==========================================================================
   CONEXIÓN CON LA API DE BACKEND (SORTISTORE)
   ========================================================================== */

const API_BASE_URL = '/api';

// Función base para realizar peticiones HTTP autenticadas
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('sortistore_jwt');
    
    // Configurar cabeceras por defecto
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Ocurrió un error en la solicitud.');
        }

        return data;
    } catch (error) {
        console.error(`Error en API Call [${endpoint}]:`, error);
        throw error;
    }
}

// Servicios de Autenticación
const AuthService = {
    async register(name, email, password) {
        const res = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
        if (res.token) {
            localStorage.setItem('sortistore_jwt', res.token);
        }
        return res;
    },

    async login(email, password) {
        const res = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (res.token) {
            localStorage.setItem('sortistore_jwt', res.token);
        }
        return res;
    },

    logout() {
        localStorage.removeItem('sortistore_jwt');
    },

    async getMe() {
        if (!localStorage.getItem('sortistore_jwt')) return null;
        return await apiCall('/auth/me');
    }
};

// Servicios de Catálogo y Tienda
const ShopService = {
    async getProducts(filters = {}) {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== '') {
                params.append(key, filters[key]);
            }
        });
        const query = params.toString() ? `?${params.toString()}` : '';
        return await apiCall(`/products${query}`);
    },

    async getProductBySlug(slug) {
        return await apiCall(`/products/${slug}`);
    },

    async getCategories() {
        return await apiCall('/categories');
    },

    async getSettings() {
        return await apiCall('/settings');
    }
};

// Servicios de Pedidos y Checkout
const OrderService = {
    async createOrder(orderData) {
        return await apiCall('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    },

    async uploadPaymentProof(orderId, proofUrl) {
        return await apiCall('/orders/payment-proof', {
            method: 'POST',
            body: JSON.stringify({ orderId, proofUrl })
        });
    }
};

// Servicios de Portal del Cliente
const CustomerService = {
    async getOrders() {
        return await apiCall('/customer/orders');
    },

    async getOrderDetails(id) {
        return await apiCall(`/customer/orders/${id}`);
    },

    async getDownloads() {
        return await apiCall('/customer/downloads');
    },

    async getCourses() {
        return await apiCall('/customer/courses');
    },

    async getCourseDetails(courseId) {
        return await apiCall(`/customer/courses/${courseId}`);
    },

    async toggleLessonComplete(lessonId, completed) {
        return await apiCall('/customer/courses/lesson-complete', {
            method: 'POST',
            body: JSON.stringify({ lessonId, completed: completed ? 1 : 0 })
        });
    },

    async getWallet() {
        return await apiCall('/customer/wallet');
    },

    async getCoupons() {
        return await apiCall('/customer/coupons');
    },

    async updateProfile(profileData) {
        return await apiCall('/customer/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }
};

// Servicios de Administración
const AdminService = {
    async getDashboardStats() {
        return await apiCall('/admin/dashboard');
    },

    async getOrders(status = '') {
        const query = status ? `?status=${status}` : '';
        return await apiCall(`/admin/orders${query}`);
    },

    async updateOrderStatus(orderId, status) {
        return await apiCall(`/admin/orders/${orderId}/status`, {
            method: 'POST',
            body: JSON.stringify({ status })
        });
    },

    async createProduct(productData) {
        return await apiCall('/admin/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    },

    async updateProduct(id, productData) {
        return await apiCall(`/admin/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    },

    async deleteProduct(id) {
        return await apiCall(`/admin/products/${id}`, {
            method: 'DELETE'
        });
    },

    async createCourseStructure(courseId, modules) {
        return await apiCall('/admin/courses/structure', {
            method: 'POST',
            body: JSON.stringify({ courseId, modules })
        });
    },

    async adjustWallet(email, amount, description) {
        return await apiCall('/admin/wallet/adjust', {
            method: 'POST',
            body: JSON.stringify({ email, amount, description })
        });
    },

    async createCoupon(couponData) {
        return await apiCall('/admin/coupons', {
            method: 'POST',
            body: JSON.stringify(couponData)
        });
    },

    async deleteCoupon(id) {
        return await apiCall(`/admin/coupons/${id}`, {
            method: 'DELETE'
        });
    },

    async createCategory(name, parent_id) {
        return await apiCall('/admin/categories', {
            method: 'POST',
            body: JSON.stringify({ name, parent_id })
        });
    },

    async deleteCategory(id) {
        return await apiCall(`/admin/categories/${id}`, {
            method: 'DELETE'
        });
    },

    async getCourseStructure(productId) {
        return await apiCall(`/admin/courses/${productId}`);
    },

    async getSettings() {
        return await apiCall('/admin/settings');
    },

    async updateSettings(settingsData) {
        return await apiCall('/admin/settings', {
            method: 'PUT',
            body: JSON.stringify(settingsData)
        });
    },

    async getVipUsers() {
        return await apiCall('/admin/vip/users');
    },

    async toggleVipStatus(userId, isVip) {
        return await apiCall(`/admin/vip/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ is_vip: isVip ? 1 : 0 })
        });
    },

    async adjustVipCoins(userId, coins) {
        return await apiCall(`/admin/vip/users/${userId}/coins`, {
            method: 'PUT',
            body: JSON.stringify({ coins })
        });
    },

    // CRUD Proveedores
    async createVipSupplier(data) {
        return await apiCall('/admin/vip/suppliers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateVipSupplier(id, data) {
        return await apiCall(`/admin/vip/suppliers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteVipSupplier(id) {
        return await apiCall(`/admin/vip/suppliers/${id}`, {
            method: 'DELETE'
        });
    },

    // CRUD Cuentas Regalo
    async createVipGift(data) {
        return await apiCall('/admin/vip/gifts', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateVipGift(id, data) {
        return await apiCall(`/admin/vip/gifts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteVipGift(id) {
        return await apiCall(`/admin/vip/gifts/${id}`, {
            method: 'DELETE'
        });
    },

    // CRUD Sorteos
    async createVipRaffle(data) {
        return await apiCall('/admin/vip/raffles', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateVipRaffle(id, data) {
        return await apiCall(`/admin/vip/raffles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteVipRaffle(id) {
        return await apiCall(`/admin/vip/raffles/${id}`, {
            method: 'DELETE'
        });
    },

    async drawVipRaffle(id) {
        return await apiCall(`/admin/vip/raffles/${id}/draw`, {
            method: 'POST'
        });
    }
};

// Servicios de la Zona VIP para Clientes
const VipService = {
    async getStatus() {
        return await apiCall('/vip/status');
    },

    async getSuppliers() {
        return await apiCall('/vip/suppliers');
    },

    async getGifts() {
        return await apiCall('/vip/gifts');
    },

    async claimGift(id) {
        return await apiCall(`/vip/gifts/${id}/claim`, {
            method: 'POST'
        });
    },

    async getRaffles() {
        return await apiCall('/vip/raffles');
    },

    async enterRaffle(id) {
        return await apiCall(`/vip/raffles/${id}/enter`, {
            method: 'POST'
        });
    }
};
