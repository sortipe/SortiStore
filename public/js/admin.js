/* ==========================================================================
   LÓGICA DEL PANEL DE ADMINISTRACIÓN (SORTISTORE BACK-OFFICE)
   ========================================================================== */

let AdminState = {
    user: null,
    activeTab: 'dashboard'
};

// ==========================================
// COMPROBACIONES DE SEGURIDAD AL CARGAR
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    initTheme(); // Inicializar tema oscuro/claro
    
    try {
        const data = await AuthService.getMe();
        if (!data || !data.user || data.user.role === 'client') {
            showToast('Acceso no autorizado.', 'error');
            setTimeout(() => { window.location.href = '/index.html#/auth'; }, 1000);
            return;
        }

        AdminState.user = data.user;
        document.getElementById('admin-user-name').textContent = data.user.name;
        
        initAdminEvents();
        switchTab('dashboard');
        
    } catch (e) {
        showToast('Error al autenticar sesión administrativa.', 'error');
        setTimeout(() => { window.location.href = '/index.html#/auth'; }, 1000);
    }
});

// ==========================================
// CONTROLADOR DE MENÚ DE NAVEGACIÓN
// ==========================================
function initAdminEvents() {
    const menuItems = document.querySelectorAll('.admin-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(m => m.classList.remove('active'));
            item.classList.add('active');
            
            const tabName = item.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Cerrar sesión
    document.getElementById('admin-logout-btn').addEventListener('click', () => {
        AuthService.logout();
        showToast('Sesión administrativa finalizada.', 'info');
        setTimeout(() => { window.location.href = '/'; }, 500);
    });

    // Modo Claro/Oscuro en Admin
    document.getElementById('admin-theme-toggle-btn').addEventListener('click', () => {
        toggleTheme();
        const icon = document.getElementById('admin-theme-toggle-btn').querySelector('i');
        if (document.body.classList.contains('light-mode')) {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    });
}

// Intercambiador de pestañas
async function switchTab(tabName) {
    AdminState.activeTab = tabName;
    const contentArea = document.getElementById('admin-tab-content');
    const titleArea = document.getElementById('admin-page-title');
    
    // Nombres de cabecera
    const titles = {
        dashboard: 'Dashboard General',
        products: 'Catálogo de Productos',
        categories: 'Gestión de Categorías y Subcategorías',
        orders: 'Gestión de Pedidos',
        courses: 'Estructura LMS Cursos',
        wallet: 'Ajuste de Monedas Virtuales',
        coupons: 'Gestión de Cupones',
        settings: 'Configuraciones del Sistema'
    };
    
    titleArea.textContent = titles[tabName] || 'Administración';
    
    contentArea.innerHTML = `<div class="skeleton" style="height: 32px; width: 250px; margin-bottom: 24px;"></div><div class="skeleton" style="height: 250px;"></div>`;

    try {
        switch (tabName) {
            case 'dashboard':
                await renderDashboardTab(contentArea);
                break;
            case 'products':
                await renderProductsTab(contentArea);
                break;
            case 'categories':
                await renderCategoriesTab(contentArea);
                break;
            case 'orders':
                await renderOrdersTab(contentArea);
                break;
            case 'courses':
                await renderCoursesTab(contentArea);
                break;
            case 'wallet':
                renderWalletTab(contentArea);
                break;
            case 'coupons':
                await renderCouponsTab(contentArea);
                break;
            case 'settings':
                await renderSettingsTab(contentArea);
                break;
        }
    } catch (e) {
        contentArea.innerHTML = `<div class="glass-panel" style="padding: 24px; color: var(--danger);">Error al cargar los datos del panel.</div>`;
    }
}

// ==========================================
// 1. PESTAÑA: DASHBOARD GENERAL
// ==========================================
async function renderDashboardTab(container) {
    const data = await AdminService.getDashboardStats();
    const { stats, recentOrders, topProducts, salesByType } = data;

    const avgTicket = stats.totalOrders > 0 ? (stats.totalSales / stats.totalOrders) : 0;
    const convRate = stats.totalClients > 0 ? ((stats.totalOrders / (stats.totalClients * 4.5)) * 100).toFixed(1) : "0.0";

    container.innerHTML = `
        <!-- Tarjetas de métricas rápidas -->
        <div class="stats-grid animate-fade-in" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 24px;">
            <div class="stat-card">
                <div class="stat-info">
                    <h4>Ventas Totales</h4>
                    <div class="stat-value">S/. ${stats.totalSales.toFixed(2)}</div>
                </div>
                <div class="stat-icon"><i class="fas fa-hand-holding-usd"></i></div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h4>Pedidos Totales</h4>
                    <div class="stat-value">${stats.totalOrders}</div>
                </div>
                <div class="stat-icon"><i class="fas fa-shopping-basket"></i></div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h4>Ticket Promedio (AOV)</h4>
                    <div class="stat-value">S/. ${avgTicket.toFixed(2)}</div>
                </div>
                <div class="stat-icon"><i class="fas fa-calculator"></i></div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h4>Clientes Registrados</h4>
                    <div class="stat-value">${stats.totalClients}</div>
                </div>
                <div class="stat-icon"><i class="fas fa-users"></i></div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h4>Tasa Conversión (Est.)</h4>
                    <div class="stat-value">${convRate}%</div>
                </div>
                <div class="stat-icon"><i class="fas fa-funnel-dollar"></i></div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h4>Monedas Emitidas</h4>
                    <div class="stat-value"><i class="fas fa-coins" style="color: gold;"></i> ${stats.totalCoins}</div>
                </div>
                <div class="stat-icon"><i class="fas fa-piggy-bank"></i></div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1.2fr 1.2fr; gap: 24px;" class="animate-fade-in">
            
            <!-- Últimos Pedidos Recibidos -->
            <div class="admin-table-container">
                <div class="admin-table-header">
                    <h3>Últimos Pedidos</h3>
                    <button class="btn-outline" style="padding: 6px 12px; font-size: 11px;" onclick="switchTab('orders')">Ver todos</button>
                </div>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cliente / Correo</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentOrders.map(o => `
                            <tr>
                                <td>#${o.id}</td>
                                <td>${o.user_name || o.guest_name || 'Invitado'}<br><span style="font-size: 11px; color: var(--text-muted);">${o.user_email || o.guest_email}</span></td>
                                <td>S/. ${o.total_amount.toFixed(2)}</td>
                                <td><span class="badge ${o.status === 'completed' ? 'badge-new' : 'badge-presale'}">${o.status.toUpperCase()}</span></td>
                                <td>${new Date(o.created_at).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Gráfico de Distribución de Ingresos -->
            <div class="admin-table-container">
                <div class="admin-table-header">
                    <h3>Ingresos por Categoría</h3>
                </div>
                <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px;">
                    ${salesByType.length === 0 ? `
                        <p style="text-align: center; color: var(--text-muted); padding: 32px 0;">Aún no hay ventas registradas.</p>
                    ` : salesByType.map(s => {
                        const maxRevenue = Math.max(...salesByType.map(item => Number(item.revenue))) || 1;
                        const percent = Math.round((Number(s.revenue) / maxRevenue) * 100);
                        const icons = { course: 'fa-graduation-cap', software: 'fa-laptop-code', digital: 'fa-download', physical: 'fa-box' };
                        return `
                            <div>
                                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                                    <span style="text-transform: capitalize; font-weight: 600;"><i class="fas ${icons[s.type] || 'fa-box'}"></i> ${s.type}</span>
                                    <strong>S/. ${Number(s.revenue).toFixed(2)}</strong>
                                </div>
                                <div style="background: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden;">
                                    <div style="background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%); width: ${percent}%; height: 100%; border-radius: 4px;"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Productos Más Vendidos -->
            <div class="admin-table-container">
                <div class="admin-table-header">
                    <h3>Productos Estrella</h3>
                </div>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Vendidos</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topProducts.length === 0 ? `
                            <tr><td colspan="2" style="text-align: center; color: var(--text-muted); padding: 32px 0;">No hay ventas registradas.</td></tr>
                        ` : topProducts.map(p => `
                            <tr>
                                <td><strong>${p.name}</strong><br><span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">${p.type}</span></td>
                                <td style="font-weight: 700; color: var(--color-secondary);">${p.sold_qty} uds</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ==========================================
// 2. PESTAÑA: CATÁLOGO DE PRODUCTOS (CRUD)
// ==========================================
let globalProductList = [];

async function renderProductsTab(container) {
    globalProductList = await ShopService.getProducts();

    container.innerHTML = `
        <div class="admin-table-container animate-fade-in">
            <div class="admin-table-header">
                <h3>Lista de Productos</h3>
                <button class="btn-primary" onclick="openProductFormModal()"><i class="fas fa-plus"></i> Crear Producto</button>
            </div>
            
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Producto</th>
                        <th>Tipo</th>
                        <th>Precio (Normal / Oferta)</th>
                        <th>Stock</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${globalProductList.map(p => `
                        <tr>
                            <td>#${p.id}</td>
                            <td>
                                <strong>${p.name}</strong><br>
                                <span style="font-size: 11px; color: var(--text-muted);">SKU: ${p.sku || 'N/A'}</span>
                            </td>
                            <td><span class="badge ${p.type === 'physical' ? 'badge-featured' : 'badge-new'}">${p.type.toUpperCase()}</span></td>
                            <td>
                                S/. ${p.price_normal.toFixed(2)} 
                                ${p.price_offer ? `<br><span style="color: var(--color-secondary); font-size: 12px; font-weight:700;">Oferta: S/. ${p.price_offer.toFixed(2)}</span>` : ''}
                            </td>
                            <td>${p.type === 'physical' ? p.stock : 'Ilimitado'}</td>
                            <td>
                                <div style="display: flex; gap: 8px;">
                                    <button class="btn-outline" style="padding: 6px 12px; font-size: 12px;" onclick="openProductFormModal(${p.id})"><i class="fas fa-edit"></i> Editar</button>
                                    <button class="btn-outline" style="padding: 6px 12px; font-size: 12px; border-color: var(--danger); color: var(--danger);" onclick="deleteProductCall(${p.id})"><i class="fas fa-trash"></i></button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Crear/Editar Producto - Abrir modal
// Crear/Editar Producto - Abrir modal
window.openProductFormModal = async (productId = null) => {
    const modal = document.getElementById('admin-details-modal');
    const modalContent = document.getElementById('admin-modal-content-area');
    
    let product = {
        name: '', slug: '', description: '', type: 'physical', sku: '', stock: 0,
        category_id: null, price_normal: 0, price_offer: null, price_sorti: null,
        is_featured: false, is_recommended: false, is_new: false, is_presale: false,
        presale_launch_date: '', download_url: '', download_file_size: '', download_version: '',
        media: [], variants: []
    };

    if (productId) {
        product = globalProductList.find(p => p.id === productId);
    }

    // Cargar categorías del sistema para el selector
    let catOptions = '<option value="">-- Sin categoría --</option>';
    try {
        const categories = await ShopService.getCategories();
        categories.forEach(cat => {
            catOptions += `<option value="${cat.id}" ${product.category_id === cat.id ? 'selected' : ''}>${cat.name} (Principal)</option>`;
            if (cat.subcategories && cat.subcategories.length > 0) {
                cat.subcategories.forEach(sub => {
                    catOptions += `<option value="${sub.id}" ${product.category_id === sub.id ? 'selected' : ''}>&nbsp;&nbsp;&nbsp;↳ ${sub.name}</option>`;
                });
            }
        });
    } catch (e) {
        console.error('Error al cargar categorías para el formulario:', e);
    }

    modalContent.innerHTML = `
        <div class="admin-modal-header">
            <h3>${productId ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
            <button onclick="closeAdminModal()" style="font-size: 20px; border:none; background:none; cursor:pointer;"><i class="fas fa-times"></i></button>
        </div>
        <form id="product-crud-form">
            <div class="admin-modal-body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label>Nombre del Producto</label>
                    <input type="text" id="prod-name" class="form-control" value="${product.name}" required>
                </div>
                <div class="form-group">
                    <label>Slug de URL (Único)</label>
                    <input type="text" id="prod-slug" class="form-control" value="${product.slug}" placeholder="ej: auricular-soundmax-x1" required>
                </div>
                <div class="form-group">
                    <label>Tipo de Producto</label>
                    <select id="prod-type" class="form-control" onchange="toggleProductTypeForm(this.value)">
                        <option value="physical" ${product.type === 'physical' ? 'selected' : ''}>Físico</option>
                        <option value="digital" ${product.type === 'digital' ? 'selected' : ''}>Digital (E-book, streaming)</option>
                        <option value="software" ${product.type === 'software' ? 'selected' : ''}>Software / Sistemas / CRM</option>
                        <option value="course" ${product.type === 'course' ? 'selected' : ''}>Curso LMS</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Código SKU / Referencia</label>
                    <input type="text" id="prod-sku" class="form-control" value="${product.sku || ''}">
                </div>
                
                <div class="form-group" id="group-stock" style="display: ${product.type === 'physical' ? 'block' : 'none'};">
                    <label>Stock Disponible</label>
                    <input type="number" id="prod-stock" class="form-control" value="${product.stock}">
                </div>
                <div class="form-group">
                    <label>Categoría / Subcategoría</label>
                    <select id="prod-category" class="form-control">
                        ${catOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Precio Normal (S/.)</label>
                    <input type="number" step="0.01" id="prod-price-normal" class="form-control" value="${product.price_normal}" required>
                </div>
                <div class="form-group">
                    <label>Precio Oferta (S/.) (Opcional)</label>
                    <input type="number" step="0.01" id="prod-price-offer" class="form-control" value="${product.price_offer || ''}">
                </div>
                <div class="form-group">
                    <label>Precio Exclusivo Sorti Coins (Opcional)</label>
                    <input type="number" id="prod-price-sorti" class="form-control" value="${product.price_sorti || ''}">
                </div>
                <div class="form-group">
                    <label>Marca / Fabricante</label>
                    <input type="text" id="prod-brand" class="form-control" value="${product.brand || ''}">
                </div>

                <div class="form-group" style="grid-column: span 2;">
                    <label>Descripción General</label>
                    <textarea id="prod-desc" class="form-control" style="height: 100px;">${product.description || ''}</textarea>
                </div>

                <!-- Opciones de Estado -->
                <div class="form-group" style="grid-column: span 2; display: flex; gap: 20px; flex-wrap: wrap;">
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; text-transform: none;">
                        <input type="checkbox" id="chk-featured" ${product.is_featured ? 'checked' : ''}> Destacado
                    </label>
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; text-transform: none;">
                        <input type="checkbox" id="chk-recommended" ${product.is_recommended ? 'checked' : ''}> Recomendado
                    </label>
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; text-transform: none;">
                        <input type="checkbox" id="chk-new" ${product.is_new ? 'checked' : ''}> Nuevo
                    </label>
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; text-transform: none;">
                        <input type="checkbox" id="chk-presale" ${product.is_presale ? 'checked' : ''} onchange="togglePresaleDateForm(this.checked)"> Preventa
                    </label>
                </div>

                <!-- Fecha de Preventa -->
                <div class="form-group" id="group-presale" style="grid-column: span 2; display: ${product.is_presale ? 'block' : 'none'};">
                    <label>Fecha y Hora del Lanzamiento Oficial</label>
                    <input type="datetime-local" id="prod-presale-date" class="form-control" value="${product.presale_launch_date ? product.presale_launch_date.substring(0, 16) : ''}">
                </div>

                <!-- Campos de Descarga Digital / Software -->
                <div id="digital-download-fields" style="grid-column: span 2; display: ${['digital', 'software'].includes(product.type) ? 'grid' : 'none'}; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="form-group" style="grid-column: span 2;">
                        <label>URL de Descarga Directa del Archivo</label>
                        <input type="text" id="prod-download-url" class="form-control" value="${product.download_url || ''}" placeholder="https://example.com/files/setup.zip">
                    </div>
                    <div class="form-group">
                        <label>Tamaño del Archivo</label>
                        <input type="text" id="prod-download-size" class="form-control" value="${product.download_file_size || ''}" placeholder="ej: 154 MB">
                    </div>
                    <div class="form-group">
                        <label>Versión del Software / Archivo</label>
                        <input type="text" id="prod-download-version" class="form-control" value="${product.download_version || ''}" placeholder="ej: v1.0.4">
                    </div>
                </div>

                <!-- Galería Multimedia (URLs o archivos locales optimizados) -->
                <div class="form-group" style="grid-column: span 2;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <label style="font-weight: 700; color: var(--text-secondary);">Galería de Imágenes del Producto</label>
                        <button type="button" class="btn-outline" style="padding: 4px 10px; font-size: 11px;" onclick="addProductMediaRow()"><i class="fas fa-plus"></i> Agregar Imagen</button>
                    </div>
                    <div id="product-media-rows-container" style="display: flex; flex-direction: column; gap: 12px;"></div>
                </div>
            </div>
            
            <div class="admin-modal-footer">
                <button type="button" class="btn-outline" onclick="closeAdminModal()">Cancelar</button>
                <button type="submit" class="btn-primary">Guardar Producto</button>
            </div>
        </form>
    `;

    modal.classList.add('active');

    window.currentProductMedia = [...(product.media || [])];
    if (window.currentProductMedia.length === 0) {
        window.currentProductMedia.push({ media_url: '', is_video: 0 });
    }
    window.renderProductMediaRows();

    // Handler al enviar Formulario
    document.getElementById('product-crud-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const mediaArray = window.currentProductMedia.filter(item => item.media_url.trim() !== '');

        const payload = {
            name: document.getElementById('prod-name').value.trim(),
            slug: document.getElementById('prod-slug').value.trim(),
            type: document.getElementById('prod-type').value,
            sku: document.getElementById('prod-sku').value.trim() || null,
            stock: Number(document.getElementById('prod-stock').value) || 0,
            category_id: Number(document.getElementById('prod-category').value) || null,
            price_normal: Number(document.getElementById('prod-price-normal').value),
            price_offer: Number(document.getElementById('prod-price-offer').value) || null,
            price_sorti: Number(document.getElementById('prod-price-sorti').value) || null,
            description: document.getElementById('prod-desc').value.trim(),
            is_featured: document.getElementById('chk-featured').checked,
            is_recommended: document.getElementById('chk-recommended').checked,
            is_new: document.getElementById('chk-new').checked,
            is_presale: document.getElementById('chk-presale').checked,
            presale_launch_date: document.getElementById('prod-presale-date').value || null,
            download_url: document.getElementById('prod-download-url').value.trim() || null,
            download_file_size: document.getElementById('prod-download-size').value.trim() || null,
            download_version: document.getElementById('prod-download-version').value.trim() || null,
            media: mediaArray,
            variants: [] // Variantes se agregan por backend o simplificado
        };

        try {
            if (productId) {
                await AdminService.updateProduct(productId, payload);
                showToast('Producto actualizado.', 'success');
            } else {
                await AdminService.createProduct(payload);
                showToast('Producto creado con éxito.', 'success');
            }
            closeAdminModal();
            switchTab('products');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
};

window.toggleProductTypeForm = (val) => {
    document.getElementById('group-stock').style.display = val === 'physical' ? 'block' : 'none';
    document.getElementById('digital-download-fields').style.display = ['digital', 'software'].includes(val) ? 'grid' : 'none';
};

window.togglePresaleDateForm = (isChecked) => {
    document.getElementById('group-presale').style.display = isChecked ? 'block' : 'none';
};

window.deleteProductCall = async (id) => {
    if (confirm('¿Estás seguro de eliminar este producto del catálogo?')) {
        try {
            await AdminService.deleteProduct(id);
            showToast('Producto eliminado.', 'info');
            switchTab('products');
        } catch (e) {
            showToast('Error al eliminar producto.', 'error');
        }
    }
};

// ==========================================
// 3. PESTAÑA: GESTIÓN DE PEDIDOS
// ==========================================
let globalOrdersList = [];

async function renderOrdersTab(container) {
    globalOrdersList = await AdminService.getOrders();

    container.innerHTML = `
        <div class="admin-table-container animate-fade-in">
            <div class="admin-table-header">
                <h3>Pedidos Realizados</h3>
            </div>
            
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Pedido</th>
                        <th>Cliente / Correo</th>
                        <th>Delivery / Dirección</th>
                        <th>Total</th>
                        <th>Pago</th>
                        <th>Estado</th>
                        <th>Gestionar</th>
                    </tr>
                </thead>
                <tbody>
                    ${globalOrdersList.map(o => {
                        const statusColors = {
                            pending_payment: 'badge-presale',
                            paid: 'badge-new',
                            processing: 'badge-upcoming',
                            shipped: 'badge-featured',
                            completed: 'badge-new',
                            cancelled: 'badge-soldout'
                        };
                        return `
                            <tr>
                                <td>#${o.id}</td>
                                <td><strong>${o.user_name || o.guest_name || 'Invitado'}</strong><br><span style="font-size:11px; color:var(--text-muted);">${o.user_email || o.guest_email}</span></td>
                                <td><span class="badge badge-featured">${o.delivery_type.toUpperCase()}</span><br><span style="font-size:11px; color:var(--text-muted);">${o.delivery_address}</span></td>
                                <td>S/. ${o.total_amount.toFixed(2)}</td>
                                <td><span class="badge badge-featured">${o.payment_method.toUpperCase()}</span></td>
                                <td><span class="badge ${statusColors[o.status] || 'badge-upcoming'}">${o.status.toUpperCase()}</span></td>
                                <td>
                                    <button class="btn-outline" style="padding: 6px 12px; font-size:12px;" onclick="openOrderDetailsModal(${o.id})">
                                        <i class="fas fa-edit"></i> Ver Detalle
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Modal de detalles y aprobación del pago
window.openOrderDetailsModal = (orderId) => {
    const modal = document.getElementById('admin-details-modal');
    const modalContent = document.getElementById('admin-modal-content-area');
    
    const order = globalOrdersList.find(o => o.id === orderId);
    if (!order) return;

    modalContent.innerHTML = `
        <div class="admin-modal-header">
            <h3>Detalle del Pedido #${order.id}</h3>
            <button onclick="closeAdminModal()" style="font-size: 20px;"><i class="fas fa-times"></i></button>
        </div>
        <div class="admin-modal-body">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <div>
                    <h4>Información General</h4>
                    <p style="margin-top: 8px;"><strong>Cliente:</strong> ${order.user_name || order.guest_name || 'Invitado'}</p>
                    <p><strong>Email:</strong> ${order.user_email || order.guest_email}</p>
                    <p><strong>Entrega:</strong> ${order.delivery_type === 'delivery' ? 'Delivery a Domicilio' : 'Recojo en local'}</p>
                    <p><strong>Dirección:</strong> ${order.delivery_address}</p>
                    <p><strong>Fecha Pedido:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div>
                    <h4>Estado del Pago y Envío</h4>
                    <div class="form-group" style="margin-top: 8px;">
                        <label>Cambiar Estado del Pedido</label>
                        <select id="update-order-status-select" class="form-control">
                            <option value="pending_payment" ${order.status === 'pending_payment' ? 'selected' : ''}>Pendiente de Pago</option>
                            <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Pagado (Validado)</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>En Proceso</option>
                            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Enviado</option>
                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completado (Entregado)</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </div>
                    <p><strong>Método Pago:</strong> ${order.payment_method.toUpperCase()}</p>
                    <p><strong>Monedas Sorti Canjeadas:</strong> ${order.sorti_coins_used} monedas</p>
                </div>
            </div>

            <h4>Artículos Comprados</h4>
            <div style="margin-top: 12px; margin-bottom: 24px; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px;">
                ${order.items.map(item => `
                    <div style="display: flex; justify-content: space-between; font-size: 13px; border-bottom: 1px solid var(--border-color); padding: 8px 0;">
                        <span>${item.name} (x${item.quantity})</span>
                        <strong>S/. ${(item.price * item.quantity).toFixed(2)}</strong>
                    </div>
                `).join('')}
                <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 16px; margin-top: 12px;">
                    <span>Total Pedido:</span>
                    <span>S/. ${order.total_amount.toFixed(2)}</span>
                </div>
            </div>

            <!-- Visualizador del Voucher subido por el cliente -->
            ${order.payment_proof_url ? `
                <h4>Comprobante de Pago Subido</h4>
                <div class="payment-proof-viewer">
                    <p style="font-size: 12px; color: var(--text-muted);">Compruebe que el depósito y el monto coincidan con el total.</p>
                    <img src="${order.payment_proof_url}" alt="Voucher de Pago">
                </div>
            ` : `
                <div class="glass-panel" style="padding: 12px; text-align: center; color: var(--danger);"><i class="fas fa-exclamation-triangle"></i> El cliente aún no ha subido comprobante de pago para este pedido.</div>
            `}
        </div>
        <div class="admin-modal-footer">
            <button class="btn-outline" onclick="closeAdminModal()">Cancelar</button>
            <button class="btn-primary" onclick="saveOrderStatusCall(${order.id})">Guardar Cambios</button>
        </div>
    `;

    modal.classList.add('active');
};

window.saveOrderStatusCall = async (orderId) => {
    const status = document.getElementById('update-order-status-select').value;
    try {
        await AdminService.updateOrderStatus(orderId, status);
        showToast('Estado del pedido actualizado.', 'success');
        closeAdminModal();
        switchTab('orders');
    } catch (e) {
        showToast('Error al actualizar el pedido.', 'error');
    }
};

// ==========================================
// 4. PESTAÑA: ESTRUCTURADOR LMS DE CURSOS
// ==========================================
let globalCoursesList = [];

async function renderCoursesTab(container) {
    // Filtrar del catálogo general todos los productos que sean cursos
    const products = await ShopService.getProducts();
    globalCoursesList = products.filter(p => p.type === 'course');

    container.innerHTML = `
        <div class="admin-table-container animate-fade-in">
            <div class="admin-table-header">
                <h3>Cursos Disponibles</h3>
            </div>
            
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Curso</th>
                        <th>Precio</th>
                        <th>Estructura</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${globalCoursesList.map(c => `
                        <tr>
                            <td><strong>${c.name}</strong><br><span style="font-size: 11px; color: var(--text-muted);">${c.brand || 'Facilitador'}</span></td>
                            <td>S/. ${c.price_normal.toFixed(2)}</td>
                            <td id="course-struct-badge-${c.id}"><span class="badge badge-featured">Configurable</span></td>
                            <td>
                                <button class="btn-secondary" style="padding: 8px 16px; font-size: 12px;" onclick="openCourseBuilderModal(${c.id})">
                                    <i class="fas fa-stream"></i> Estructurar Módulos/Clases
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Estructurador visual modular interactivo
let builderModules = [];

window.openCourseBuilderModal = async (productId) => {
    const modal = document.getElementById('admin-details-modal');
    const modalContent = document.getElementById('admin-modal-content-area');
    
    let courseId = null;
    let modulesList = [];
    
    try {
        const details = await AdminService.getCourseStructure(productId);
        courseId = details.id;
        modulesList = details.modules;
    } catch (e) {
        showToast('Error al cargar la estructura del curso. Asegúrate de que el producto esté registrado como curso en la base de datos.', 'error');
        return;
    }

    builderModules = modulesList.map(m => ({
        title: m.title,
        lessons: (m.lessons || []).map(l => ({
            title: l.title,
            video_url: l.video_url,
            duration: l.duration,
            pdf_url: l.pdf_url,
            resources_url: l.resources_url,
            has_exam: !!l.has_exam,
            exam_questions: l.exam_questions ? (typeof l.exam_questions === 'string' ? JSON.parse(l.exam_questions) : l.exam_questions) : []
        }))
    }));

    renderLMSBuilderContent(courseId);
    modal.classList.add('active');
};

function renderLMSBuilderContent(courseId) {
    const modalContent = document.getElementById('admin-modal-content-area');
    
    modalContent.innerHTML = `
        <div class="admin-modal-header">
            <h3>Estructurador LMS - Módulos y Clases</h3>
            <button onclick="closeAdminModal()" style="font-size: 20px;"><i class="fas fa-times"></i></button>
        </div>
        <div class="admin-modal-body">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <p style="font-size: 13px; color: var(--text-muted);">Configure los módulos didácticos y las clases de video asociadas a este curso.</p>
                <button type="button" class="btn-outline" onclick="addLMSBuilderModule(${courseId})"><i class="fas fa-plus"></i> Añadir Módulo</button>
            </div>
            
            <div id="lms-modules-builder-list">
                ${builderModules.map((mod, modIdx) => `
                    <div class="lms-builder-module" data-mod-idx="${modIdx}">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <input type="text" class="form-control" style="font-weight: 700; width: 70%;" value="${mod.title}" oninput="builderModules[${modIdx}].title = this.value" placeholder="Nombre del Módulo (ej: Módulo 1: Introducción)">
                            <button type="button" class="btn-outline" style="color: var(--danger); border-color: var(--danger); padding: 6px 12px; font-size:12px;" onclick="removeLMSBuilderModule(${modIdx}, ${courseId})"><i class="fas fa-trash"></i> Eliminar Módulo</button>
                        </div>

                        <!-- Clases del Módulo -->
                        <div class="lms-lessons-builder-list" style="margin-left: 20px; display: flex; flex-direction: column; gap: 12px;">
                            ${mod.lessons.map((les, lesIdx) => `
                                <div class="lms-builder-lesson-row">
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                        <div class="form-group" style="margin-bottom:8px;">
                                            <label>Título de la Clase</label>
                                            <input type="text" class="form-control" value="${les.title}" oninput="builderModules[${modIdx}].lessons[${lesIdx}].title = this.value" placeholder="ej: 1.1 Introducción">
                                        </div>
                                        <div class="form-group" style="margin-bottom:8px;">
                                            <label>URL del Video MP4 / YouTube</label>
                                            <input type="text" class="form-control" value="${les.video_url || ''}" oninput="builderModules[${modIdx}].lessons[${lesIdx}].video_url = this.value" placeholder="https://example.com/video.mp4">
                                        </div>
                                        <div class="form-group" style="margin-bottom:8px;">
                                            <label>Duración</label>
                                            <input type="text" class="form-control" value="${les.duration || '00:00'}" oninput="builderModules[${modIdx}].lessons[${lesIdx}].duration = this.value" placeholder="ej: 12:45">
                                        </div>
                                        <div class="form-group" style="margin-bottom:8px;">
                                            <label>URL Diapositivas PDF</label>
                                            <input type="text" class="form-control" value="${les.pdf_url || ''}" oninput="builderModules[${modIdx}].lessons[${lesIdx}].pdf_url = this.value" placeholder="https://example.com/slides.pdf">
                                        </div>
                                    </div>
                                    <div style="text-align: right; margin-top: 4px;">
                                        <button type="button" style="color: var(--danger); font-size:12px; font-weight:700;" onclick="removeLMSBuilderLesson(${modIdx}, ${lesIdx}, ${courseId})"><i class="fas fa-times"></i> Remover Clase</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <button type="button" class="btn-outline" style="margin-top:12px; padding: 6px 12px; font-size: 11px;" onclick="addLMSBuilderLesson(${modIdx}, ${courseId})"><i class="fas fa-plus"></i> Añadir Clase</button>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="admin-modal-footer">
            <button class="btn-outline" onclick="closeAdminModal()">Cancelar</button>
            <button class="btn-primary" onclick="saveCourseStructureCall(${courseId})">Guardar Cambios de Curso</button>
        </div>
    `;
}

window.addLMSBuilderModule = (courseId) => {
    builderModules.push({ title: '', lessons: [] });
    renderLMSBuilderContent(courseId);
};

window.removeLMSBuilderModule = (idx, courseId) => {
    builderModules.splice(idx, 1);
    renderLMSBuilderContent(courseId);
};

window.addLMSBuilderLesson = (modIdx, courseId) => {
    builderModules[modIdx].lessons.push({
        title: '', video_url: '', duration: '00:00', pdf_url: '', resources_url: '', has_exam: false, exam_questions: []
    });
    renderLMSBuilderContent(courseId);
};

window.removeLMSBuilderLesson = (modIdx, lesIdx, courseId) => {
    builderModules[modIdx].lessons.splice(lesIdx, 1);
    renderLMSBuilderContent(courseId);
};

window.saveCourseStructureCall = async (courseId) => {
    try {
        await AdminService.createCourseStructure(courseId, builderModules);
        showToast('Estructura de lecciones LMS guardada.', 'success');
        closeAdminModal();
    } catch (e) {
        showToast('Error al estructurar curso.', 'error');
    }
};

// ==========================================
// 5. PESTAÑA: AJUSTAR MONEDAS VIRTUALES (SORTI)
// ==========================================
function renderWalletTab(container) {
    container.innerHTML = `
        <div class="checkout-layout animate-fade-in" style="max-width: 600px; margin: 0 auto;">
            <div class="checkout-section">
                <h3><i class="fas fa-coins" style="color: var(--color-accent);"></i> Ajuste de Monedas Virtuales</h3>
                <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 24px;">Otorgue o retire monedas Sorti del balance de la billetera virtual de cualquier cliente registrado.</p>
                
                <form id="wallet-adjust-form">
                    <div class="form-group">
                        <label>Correo Electrónico del Cliente</label>
                        <input type="email" id="adj-email" class="form-control" placeholder="cliente@sortistore.com" required>
                    </div>
                    <div class="form-group">
                        <label>Monedas a Sumar o Restar</label>
                        <input type="number" id="adj-amount" class="form-control" placeholder="ej: 100 para sumar o -50 para restar" required>
                    </div>
                    <div class="form-group">
                        <label>Motivo o Descripción de la Ajuste</label>
                        <input type="text" id="adj-desc" class="form-control" placeholder="ej: Recompensa por campaña de verano" required>
                    </div>

                    <button type="submit" class="btn-accent" style="width: 100%; margin-top: 12px; padding: 12px 24px;">
                        <i class="fas fa-check-double"></i> Confirmar y Aplicar Ajuste
                    </button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('wallet-adjust-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('adj-email').value.trim();
        const amount = Number(document.getElementById('adj-amount').value);
        const description = document.getElementById('adj-desc').value.trim();

        try {
            const response = await AdminService.adjustWallet(email, amount, description);
            showToast(response.message, 'success');
            
            // Limpiar formulario
            document.getElementById('wallet-adjust-form').reset();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

// ==========================================
// 6. PESTAÑA: SISTEMA DE CUPONES
// ==========================================
async function renderCouponsTab(container) {
    const response = await CustomerService.getCoupons();
    
    container.innerHTML = `
        <div class="admin-table-container animate-fade-in">
            <div class="admin-table-header">
                <h3>Lista de Cupones</h3>
                <button class="btn-primary" onclick="openCouponFormModal()"><i class="fas fa-plus"></i> Crear Cupón</button>
            </div>
            
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Tipo</th>
                        <th>Valor Descuento</th>
                        <th>Gasto Mínimo</th>
                        <th>Límite Usos (Máx)</th>
                        <th>Expiración</th>
                        <th style="width: 100px; text-align: center;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${response.available.map(c => `
                        <tr>
                            <td><strong>${c.code}</strong></td>
                            <td><span class="badge badge-featured">${c.type.toUpperCase()}</span></td>
                            <td>${c.type === 'percent' ? `${c.value}%` : `S/. ${c.value.toFixed(2)}`}</td>
                            <td>S/. ${c.min_spend.toFixed(2)}</td>
                            <td>${c.uses_count} / ${c.max_uses}</td>
                            <td>${c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Nunca'}</td>
                            <td style="text-align: center;">
                                <button class="btn-outline" style="color: var(--danger); border-color: var(--danger); padding: 4px 8px; font-size: 11px; margin: 0;" onclick="deleteCouponCall(${c.id})">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

window.deleteCouponCall = async (couponId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cupón?')) return;
    try {
        await AdminService.deleteCoupon(couponId);
        showToast('Cupón eliminado con éxito.', 'success');
        switchTab('coupons');
    } catch (e) {
        showToast('Error al eliminar cupón: ' + e.message, 'error');
    }
};

window.openCouponFormModal = () => {
    const modal = document.getElementById('admin-details-modal');
    const modalContent = document.getElementById('admin-modal-content-area');

    modalContent.innerHTML = `
        <div class="admin-modal-header">
            <h3>Crear Cupón de Descuento</h3>
            <button onclick="closeAdminModal()" style="font-size: 20px;"><i class="fas fa-times"></i></button>
        </div>
        <form id="coupon-crud-form">
            <div class="admin-modal-body">
                <div class="form-group">
                    <label>Código del Cupón (Mayúsculas sin espacios)</label>
                    <input type="text" id="coup-code" class="form-control" style="text-transform: uppercase;" placeholder="ej: VERANO25" required>
                </div>
                <div class="form-group">
                    <label>Tipo de Descuento</label>
                    <select id="coup-type" class="form-control" required>
                        <option value="percent">Porcentual (%)</option>
                        <option value="fixed">Monto Fijo (S/.)</option>
                        <option value="free_shipping">Envío Gratis</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Valor del Descuento</label>
                    <input type="number" step="0.01" id="coup-value" class="form-control" placeholder="ej: 10 para 10% o S/. 10" required>
                </div>
                <div class="form-group">
                    <label>Monto de Gasto Mínimo (S/.)</label>
                    <input type="number" step="0.01" id="coup-min-spend" class="form-control" value="0.00">
                </div>
                <div class="form-group">
                    <label>Límite de Usos Totales</label>
                    <input type="number" id="coup-max-uses" class="form-control" value="100">
                </div>
                <div class="form-group">
                    <label>Fecha de Expiración (Opcional)</label>
                    <input type="date" id="coup-expires" class="form-control">
                </div>
            </div>
            <div class="admin-modal-footer">
                <button type="button" class="btn-outline" onclick="closeAdminModal()">Cancelar</button>
                <button type="submit" class="btn-primary">Crear Cupón</button>
            </div>
        </form>
    `;

    modal.classList.add('active');

    document.getElementById('coupon-crud-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            code: document.getElementById('coup-code').value.trim().toUpperCase(),
            type: document.getElementById('coup-type').value,
            value: Number(document.getElementById('coup-value').value),
            min_spend: Number(document.getElementById('coup-min-spend').value) || 0,
            max_uses: Number(document.getElementById('coup-max-uses').value) || 9999,
            expires_at: document.getElementById('coup-expires').value ? new Date(document.getElementById('coup-expires').value).toISOString() : null
        };

        try {
            await AdminService.createCoupon(payload);
            showToast('Cupón creado con éxito.', 'success');
            closeAdminModal();
            switchTab('coupons');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
};

// ==========================================
// 7. PESTAÑA: CONFIGURACIONES DEL SISTEMA
// ==========================================
let currentSettings = {};

async function renderSettingsTab(container) {
    currentSettings = await AdminService.getSettings();

    // Cargar site_branding por defecto
    const branding = currentSettings.site_branding ? (typeof currentSettings.site_branding === 'string' ? JSON.parse(currentSettings.site_branding) : currentSettings.site_branding) : {
        site_name: 'SortiStore',
        primary_color: '#6366f1',
        accent_color: '#f59e0b'
    };

    // Cargar home_banners
    let banners = [];
    if (currentSettings.home_banners) {
        banners = typeof currentSettings.home_banners === 'string' ? JSON.parse(currentSettings.home_banners) : currentSettings.home_banners;
    } else if (currentSettings.home_banner) {
        const single = typeof currentSettings.home_banner === 'string' ? JSON.parse(currentSettings.home_banner) : currentSettings.home_banner;
        banners = [single];
    }
    if (banners.length === 0) {
        banners = [{
            image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600',
            badge: 'Campaña de Julio',
            title: 'Tecnología y Software en un solo lugar',
            description: 'Descubre hardware premium, cursos interactivos LMS y software empresarial con entrega instantánea.',
            link: '#/category/tecnologia',
            bg_y: 50
        }];
    }
    currentSettings.home_banners = banners;

    container.innerHTML = `
        <form id="settings-admin-form" class="animate-fade-in" style="max-width: 850px; margin: 0 auto; display: flex; flex-direction: column; gap: 28px; padding-bottom: 60px;">
            
            <!-- Personalización de Marca (Branding) -->
            <div class="checkout-section" style="width: 100%;">
                <h3><i class="fas fa-palette" style="color: var(--color-primary);"></i> Personalización y Marca del Sitio</h3>
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px; align-items: end;">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label>Nombre de la Tienda (Document Title & Logo)</label>
                        <input type="text" id="set-site-name" class="form-control" value="${branding.site_name || ''}" placeholder="SortiStore" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label>Color Principal</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="color" id="set-primary-color" value="${branding.primary_color || '#6366f1'}" style="width: 44px; height: 44px; border: none; border-radius: 8px; cursor: pointer; background: none;">
                            <span style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">${branding.primary_color || '#6366f1'}</span>
                        </div>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label>Color de Acento</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="color" id="set-accent-color" value="${branding.accent_color || '#f59e0b'}" style="width: 44px; height: 44px; border: none; border-radius: 8px; cursor: pointer; background: none;">
                            <span style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">${branding.accent_color || '#f59e0b'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Carrusel de Banners del Home (Hero Slider) -->
            <div class="checkout-section" style="width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3><i class="fas fa-images" style="color: var(--color-primary);"></i> Carrusel de Banners Principal (Hero Home Slides)</h3>
                    <button type="button" class="btn-outline" onclick="addBannerSlideRow()"><i class="fas fa-plus"></i> Añadir Diapositiva</button>
                </div>
                
                <div id="settings-banners-list" style="display: flex; flex-direction: column; gap: 20px;">
                    ${banners.map((slide, idx) => {
                        const bgY = slide.bg_y !== undefined ? slide.bg_y : 50;
                        const hasImage = !!slide.image_url;
                        const isBase64 = hasImage && slide.image_url.startsWith('data:image/');
                        return `
                            <div class="glass-panel animate-fade-in" style="padding: 20px; border-left: 4px solid var(--color-primary);" data-banner-idx="${idx}">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                    <h4 style="color: var(--color-primary); margin: 0;">Diapositiva #${idx + 1}</h4>
                                    <div style="display: flex; gap: 8px;">
                                        ${idx > 0 ? `<button type="button" class="action-btn" style="padding: 6px 10px;" onclick="moveBannerSlide(${idx}, -1)"><i class="fas fa-arrow-up"></i></button>` : ''}
                                        ${idx < banners.length - 1 ? `<button type="button" class="action-btn" style="padding: 6px 10px;" onclick="moveBannerSlide(${idx}, 1)"><i class="fas fa-arrow-down"></i></button>` : ''}
                                        <button type="button" style="color: var(--danger); font-size: 14px; padding: 6px 10px; border: none; background: none; cursor: pointer;" onclick="removeBannerSlideRow(${idx})"><i class="fas fa-trash-alt"></i> Eliminar</button>
                                    </div>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                                    <div class="form-group" style="margin-bottom: 0;">
                                        <label>Título del Banner</label>
                                        <input type="text" class="form-control" value="${slide.title || ''}" placeholder="ej: Descuentos de Invierno" oninput="updateBannerSlideField(${idx}, 'title', this.value)" required>
                                    </div>
                                    <div class="form-group" style="margin-bottom: 0;">
                                        <label>Etiqueta / Badge</label>
                                        <input type="text" class="form-control" value="${slide.badge || ''}" placeholder="ej: Campaña Flash" oninput="updateBannerSlideField(${idx}, 'badge', this.value)">
                                    </div>
                                </div>

                                <div class="form-group" style="margin-bottom: 16px;">
                                    <label>Descripción / Subtexto del Banner</label>
                                    <input type="text" class="form-control" value="${slide.description || ''}" placeholder="ej: Obtén hasta 50% de descuento..." oninput="updateBannerSlideField(${idx}, 'description', this.value)" required>
                                </div>

                                <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; margin-bottom: 16px;">
                                    <div class="form-group" style="margin-bottom: 0;">
                                        <label>Enlace del Botón (ej: #/category/tecnologia)</label>
                                        <input type="text" class="form-control" value="${slide.link || '#/'}" oninput="updateBannerSlideField(${idx}, 'link', this.value)">
                                    </div>
                                    <div class="form-group" style="margin-bottom: 0;">
                                        <label>Origen de la Imagen</label>
                                        <div style="display: flex; gap: 16px; align-items: center; height: 44px;">
                                            <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; text-transform:none; margin: 0; font-size:13px; font-weight:normal; color:var(--text-primary);">
                                                <input type="radio" name="img-src-type-${idx}" value="url" ${!isBase64 ? 'checked' : ''} onchange="toggleBannerSrcType(${idx}, 'url')"> URL Externa
                                            </label>
                                            <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; text-transform:none; margin: 0; font-size:13px; font-weight:normal; color:var(--text-primary);">
                                                <input type="radio" name="img-src-type-${idx}" value="file" ${isBase64 ? 'checked' : ''} onchange="toggleBannerSrcType(${idx}, 'file')"> Subir Archivo
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; align-items: center;">
                                    <div>
                                        <!-- Selector de URL -->
                                        <div id="banner-url-input-grp-${idx}" style="display: ${!isBase64 ? 'block' : 'none'};" class="form-group">
                                            <label>URL de la Imagen de Fondo</label>
                                            <input type="text" class="form-control" value="${!isBase64 ? (slide.image_url || '') : ''}" placeholder="https://images.unsplash.com/..." oninput="updateBannerSlideField(${idx}, 'image_url', this.value)">
                                        </div>
                                        <!-- Selector de Archivo -->
                                        <div id="banner-file-input-grp-${idx}" style="display: ${isBase64 ? 'block' : 'none'};" class="form-group">
                                            <label>Selecciona Archivo de Imagen (Optimización local)</label>
                                            <input type="file" accept="image/*" class="form-control" style="padding: 8px 16px;" onchange="handleBannerFileUpload(event, ${idx})">
                                        </div>
                                        
                                        <!-- Ajuste Vertical -->
                                        <div class="form-group" style="margin-bottom: 0;">
                                            <label style="display: flex; justify-content: space-between;">
                                                <span>Ajuste de Posición Vertical</span>
                                                <strong id="banner-bg-y-val-${idx}">${bgY}%</strong>
                                            </label>
                                            <input type="range" min="0" max="100" class="form-control" style="padding:0; height: 10px; cursor: pointer;" value="${bgY}" oninput="updateBannerBgPosition(${idx}, this.value)">
                                            <p style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">Desliza para encuadrar la imagen (0% arriba, 50% centro, 100% abajo).</p>
                                        </div>
                                    </div>
                                    
                                    <!-- Miniatura Previsualización de Encuadre -->
                                    <div style="text-align: center;">
                                        <label style="margin-bottom: 6px; display: block; font-size:11px; font-weight:700;">Previsualización de Encuadre</label>
                                        <div id="banner-preview-box-${idx}" style="background-image: url('${slide.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'}'); background-size: cover; background-position: center ${bgY}%; height: 95px; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);"></div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Moneda Sorti -->
            <div class="checkout-section" style="width: 100%;">
                <h3><i class="fas fa-coins" style="color: var(--color-accent);"></i> Configuración de Moneda Sorti</h3>
                <div class="form-group">
                    <label>Equivalencia de Moneda (Sorti Coins = S/. 1.00)</label>
                    <input type="number" id="set-sorti-rate" class="form-control" value="${currentSettings.sorti_rate || 100}" required>
                    <p style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">Por defecto 100. Significa que 100 monedas equivalen a S/. 1.00 de descuento en el checkout.</p>
                </div>
            </div>

            <!-- Métodos de Pago: Yape y Cuentas Bancarias -->
            <div class="checkout-section" style="width: 100%;">
                <h3><i class="fas fa-university" style="color: var(--color-primary);"></i> Métodos de Pago (Cuentas y Yape QR)</h3>
                <div class="form-group">
                    <label>URL de Imagen QR de Yape</label>
                    <input type="text" id="set-yape-qr" class="form-control" value="${currentSettings.yape_qr || ''}">
                </div>
                
                <h4 style="margin-bottom: 12px;">Cuentas Bancarias para Transferencias</h4>
                <div id="settings-bank-accounts-rows" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
                    ${(currentSettings.bank_accounts || []).map((b, idx) => `
                        <div class="glass-panel" style="padding: 16px; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto; gap: 10px; align-items: center;" data-bank-row-idx="${idx}">
                            <input type="text" class="form-control" value="${b.bank}" placeholder="Banco (ej: BCP)" oninput="updateSettingBankValue(${idx}, 'bank', this.value)">
                            <input type="text" class="form-control" value="${b.account}" placeholder="Nro Cuenta" oninput="updateSettingBankValue(${idx}, 'account', this.value)">
                            <input type="text" class="form-control" value="${b.CCI}" placeholder="Nro CCI" oninput="updateSettingBankValue(${idx}, 'CCI', this.value)">
                            <input type="text" class="form-control" value="${b.owner}" placeholder="Titular" oninput="updateSettingBankValue(${idx}, 'owner', this.value)">
                            <button type="button" style="color: var(--danger); border:none; background:none;" onclick="removeSettingBankRow(${idx})"><i class="fas fa-trash"></i></button>
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="btn-outline" onclick="addSettingBankRow()"><i class="fas fa-plus"></i> Añadir Cuenta</button>
            </div>

            <!-- Distritos de Entrega -->
            <div class="checkout-section" style="width: 100%;">
                <h3><i class="fas fa-truck" style="color: var(--color-primary);"></i> Cobertura de Delivery por Distritos</h3>
                <div id="settings-districts-rows" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
                    ${(currentSettings.delivery_districts || []).map((d, idx) => `
                        <div class="glass-panel" style="padding: 16px; display: grid; grid-template-columns: 2fr 1fr 1.5fr auto; gap: 10px; align-items: center;" data-district-row-idx="${idx}">
                            <input type="text" class="form-control" value="${d.name}" placeholder="Distrito (ej: Miraflores)" oninput="updateSettingDistrictValue(${idx}, 'name', this.value)">
                            <input type="number" step="0.01" class="form-control" value="${d.cost}" placeholder="Costo Envío (S/.)" oninput="updateSettingDistrictValue(${idx}, 'cost', this.value)">
                            <input type="text" class="form-control" value="${d.time}" placeholder="Tiempo Estimado (ej: 24-48 horas)" oninput="updateSettingDistrictValue(${idx}, 'time', this.value)">
                            <button type="button" style="color: var(--danger); border:none; background:none;" onclick="removeSettingDistrictRow(${idx})"><i class="fas fa-trash"></i></button>
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="btn-outline" onclick="addSettingDistrictRow()"><i class="fas fa-plus"></i> Añadir Distrito</button>
            </div>

            <button type="submit" class="btn-primary" style="padding: 16px; font-size: 16px; font-weight: 700;">
                <i class="fas fa-save"></i> Guardar Todas las Configuraciones del Sistema
            </button>
        </form>
    `;

    document.getElementById('settings-admin-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            sorti_rate: Number(document.getElementById('set-sorti-rate').value),
            yape_qr: document.getElementById('set-yape-qr').value.trim(),
            bank_accounts: currentSettings.bank_accounts,
            delivery_districts: currentSettings.delivery_districts,
            home_banners: currentSettings.home_banners,
            site_branding: {
                site_name: document.getElementById('set-site-name').value.trim(),
                primary_color: document.getElementById('set-primary-color').value,
                accent_color: document.getElementById('set-accent-color').value
            }
        };

        try {
            await AdminService.updateSettings(payload);
            showToast('Configuraciones generales actualizadas con éxito.', 'success');
            // Aplicar cambios en tiempo real en la UI del administrador
            document.title = payload.site_branding.site_name;
            document.documentElement.style.setProperty('--color-primary', payload.site_branding.primary_color);
            document.documentElement.style.setProperty('--color-accent', payload.site_branding.accent_color);
            switchTab('settings');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

// Helpers para la edición reactiva de banners
window.updateBannerSlideField = (idx, field, value) => {
    currentSettings.home_banners[idx][field] = value;
    if (field === 'image_url') {
        const preview = document.getElementById(`banner-preview-box-${idx}`);
        if (preview) preview.style.backgroundImage = `url('${value || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'}')`;
    }
};

window.updateBannerBgPosition = (idx, value) => {
    const val = Number(value);
    currentSettings.home_banners[idx].bg_y = val;
    document.getElementById(`banner-bg-y-val-${idx}`).textContent = `${val}%`;
    const preview = document.getElementById(`banner-preview-box-${idx}`);
    if (preview) preview.style.backgroundPositionY = `${val}%`;
};

window.toggleBannerSrcType = (idx, type) => {
    const urlGrp = document.getElementById(`banner-url-input-grp-${idx}`);
    const fileGrp = document.getElementById(`banner-file-input-grp-${idx}`);
    if (type === 'url') {
        urlGrp.style.display = 'block';
        fileGrp.style.display = 'none';
    } else {
        urlGrp.style.display = 'none';
        fileGrp.style.display = 'block';
    }
};

window.addBannerSlideRow = () => {
    if (!currentSettings.home_banners) currentSettings.home_banners = [];
    currentSettings.home_banners.push({
        image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
        badge: 'Nuevo Slide',
        title: 'Título del Slide',
        description: 'Descripción breve de la diapositiva...',
        link: '#/',
        bg_y: 50
    });
    renderSettingsTab(document.getElementById('admin-tab-content'));
};

window.removeBannerSlideRow = (idx) => {
    currentSettings.home_banners.splice(idx, 1);
    renderSettingsTab(document.getElementById('admin-tab-content'));
};

window.moveBannerSlide = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= currentSettings.home_banners.length) return;
    
    // Intercambiar
    const temp = currentSettings.home_banners[idx];
    currentSettings.home_banners[idx] = currentSettings.home_banners[targetIdx];
    currentSettings.home_banners[targetIdx] = temp;
    
    renderSettingsTab(document.getElementById('admin-tab-content'));
};

window.handleBannerFileUpload = (event, idx) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            const MAX_WIDTH = 1200;
            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const base64 = canvas.toDataURL('image/jpeg', 0.75);
            
            currentSettings.home_banners[idx].image_url = base64;
            const preview = document.getElementById(`banner-preview-box-${idx}`);
            if (preview) preview.style.backgroundImage = `url('${base64}')`;
            
            showToast('Imagen cargada y optimizada con éxito.', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

// Helpers para edición reactiva de filas en settings
window.updateSettingBankValue = (idx, field, value) => {
    currentSettings.bank_accounts[idx][field] = value;
};

window.addSettingBankRow = () => {
    if (!currentSettings.bank_accounts) currentSettings.bank_accounts = [];
    currentSettings.bank_accounts.push({ bank: '', account: '', CCI: '', owner: '' });
    renderSettingsTab(document.getElementById('admin-tab-content'));
};

window.removeSettingBankRow = (idx) => {
    currentSettings.bank_accounts.splice(idx, 1);
    renderSettingsTab(document.getElementById('admin-tab-content'));
};

window.updateSettingDistrictValue = (idx, field, value) => {
    if (field === 'cost') {
        currentSettings.delivery_districts[idx][field] = Number(value);
    } else {
        currentSettings.delivery_districts[idx][field] = value;
    }
};

window.addSettingDistrictRow = () => {
    if (!currentSettings.delivery_districts) currentSettings.delivery_districts = [];
    currentSettings.delivery_districts.push({ name: '', cost: 0.00, time: '' });
    renderSettingsTab(document.getElementById('admin-tab-content'));
};

window.removeSettingDistrictRow = (idx) => {
    currentSettings.delivery_districts.splice(idx, 1);
    renderSettingsTab(document.getElementById('admin-tab-content'));
};

// ==========================================
// MODAL GENERAL UTILS
// ==========================================
function closeAdminModal() {
    document.getElementById('admin-details-modal').classList.remove('active');
    document.getElementById('admin-modal-content-area').innerHTML = '';
}

window.closeAdminModal = closeAdminModal;

// ==========================================
// 8. PESTAÑA: GESTIÓN DE CATEGORÍAS Y SUBCATEGORÍAS
// ==========================================
async function renderCategoriesTab(container) {
    const categoriesTree = await ShopService.getCategories();

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;" class="animate-fade-in">
            
            <!-- Crear Categoría / Subcategoría -->
            <div class="checkout-section" style="width: 100%;">
                <h3>Crear Nueva Categoría o Subcategoría</h3>
                <form id="create-category-form" style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px;">
                    <div class="form-group">
                        <label>Nombre de la Categoría</label>
                        <input type="text" id="cat-name-input" class="form-control" placeholder="ej: Hardware y Laptops" required>
                    </div>
                    <div class="form-group">
                        <label>¿Es una Subcategoría de...?</label>
                        <select id="cat-parent-select" class="form-control">
                            <option value="">-- Ninguno (Es categoría principal) --</option>
                            ${categoriesTree.map(cat => `
                                <option value="${cat.id}">${cat.name}</option>
                            `).join('')}
                        </select>
                        <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Si seleccionas una categoría padre, se convertirá en una subcategoría de ésta.</p>
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; padding: 12px; font-weight:700;">
                        <i class="fas fa-plus"></i> Crear Categoría / Subcategoría
                    </button>
                </form>
            </div>

            <!-- Listado y Eliminación -->
            <div class="admin-table-container">
                <div class="admin-table-header">
                    <h3>Categorías Existentes</h3>
                </div>
                <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px; max-height: 500px; overflow-y: auto;">
                    ${categoriesTree.length === 0 ? `
                        <p style="color: var(--text-muted); text-align: center; padding: 24px 0;">No hay categorías creadas.</p>
                    ` : categoriesTree.map(cat => `
                        <div class="glass-panel" style="padding: 16px; border-left: 4px solid var(--color-primary); background: rgba(255,255,255,0.02);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong style="font-size: 15px; color: var(--text-primary);"><i class="fas fa-folder"></i> ${cat.name}</strong>
                                    <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">(Slug: ${cat.slug})</span>
                                </div>
                                <button class="action-btn" style="color: var(--danger); border: none; background: none; cursor: pointer; padding: 6px 10px;" onclick="deleteCategoryCall(${cat.id})" title="Eliminar Categoría y todas sus subcategorías">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                            
                            <!-- Subcategorías -->
                            ${cat.subcategories && cat.subcategories.length > 0 ? `
                                <div style="margin-top: 12px; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; border-left: 1px dashed var(--border-color);">
                                    ${cat.subcategories.map(sub => `
                                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                                            <span><i class="fas fa-tag" style="font-size: 10px; color: var(--text-muted);"></i> ${sub.name} <span style="font-size: 10px; color: var(--text-muted);">(Slug: ${sub.slug})</span></span>
                                            <button style="color: var(--danger); border: none; background: none; cursor: pointer; font-size: 11px;" onclick="deleteCategoryCall(${sub.id})" title="Eliminar Subcategoría">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <p style="font-size: 11px; color: var(--text-muted); margin-top: 8px; margin-left: 16px;">Sin subcategorías.</p>
                            `}
                        </div>
                    `).join('')}
                </div>
            </div>

        </div>
    `;

    // Formulario submit
    document.getElementById('create-category-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('cat-name-input').value.trim();
        const parentId = document.getElementById('cat-parent-select').value;

        try {
            await AdminService.createCategory(name, parentId ? Number(parentId) : null);
            showToast('Categoría/Subcategoría creada con éxito.', 'success');
            // Recargar pestaña
            await renderCategoriesTab(container);
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

// Window handler para borrar categorías
window.deleteCategoryCall = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría? Si eliminas una categoría principal, también se borrarán todas sus subcategorías.')) {
        return;
    }

    try {
        await AdminService.deleteCategory(id);
        showToast('Categoría eliminada con éxito.', 'success');
        // Recargar pestaña activa
        const contentArea = document.getElementById('admin-tab-content');
        await renderCategoriesTab(contentArea);
    } catch (error) {
        showToast(error.message, 'error');
    }
};

// Helpers para la edición reactiva de la galería multimedia de productos
window.renderProductMediaRows = () => {
    const container = document.getElementById('product-media-rows-container');
    if (!container) return;

    if (window.currentProductMedia.length === 0) {
        container.innerHTML = `<p style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 10px 0;">No hay imágenes cargadas en la galería.</p>`;
        return;
    }

    container.innerHTML = window.currentProductMedia.map((item, idx) => {
        const isBase64 = item.media_url && item.media_url.startsWith('data:image/');
        return `
            <div class="glass-panel" style="padding: 12px; display: grid; grid-template-columns: 1fr 1.2fr auto; gap: 12px; align-items: center; background: rgba(255,255,255,0.01);" data-media-row-idx="${idx}">
                <div>
                    <label style="font-size: 11px; margin-bottom: 4px; display: block; text-transform: uppercase; color:var(--text-muted);">Origen Imagen #${idx + 1}</label>
                    <div style="display: flex; gap: 12px; align-items: center; height: 38px;">
                        <label style="display: inline-flex; align-items: center; gap: 4px; cursor: pointer; text-transform:none; margin:0; font-size:12px; font-weight:normal; color:var(--text-primary);">
                            <input type="radio" name="prod-media-src-${idx}" value="url" ${!isBase64 ? 'checked' : ''} onchange="toggleProductMediaSrcType(${idx}, 'url')"> URL
                        </label>
                        <label style="display: inline-flex; align-items: center; gap: 4px; cursor: pointer; text-transform:none; margin:0; font-size:12px; font-weight:normal; color:var(--text-primary);">
                            <input type="radio" name="prod-media-src-${idx}" value="file" ${isBase64 ? 'checked' : ''} onchange="toggleProductMediaSrcType(${idx}, 'file')"> Archivo
                        </label>
                    </div>
                </div>
                <div>
                    <!-- Input URL -->
                    <div id="prod-media-url-grp-${idx}" style="display: ${!isBase64 ? 'block' : 'none'};">
                        <label style="font-size: 11px; margin-bottom: 4px; display: block; text-transform: uppercase; color:var(--text-muted);">Dirección URL</label>
                        <input type="text" class="form-control" style="padding: 8px 12px;" value="${!isBase64 ? (item.media_url || '') : ''}" placeholder="https://images.unsplash.com/..." oninput="updateProductMediaUrl(${idx}, this.value)">
                    </div>
                    <!-- Input File -->
                    <div id="prod-media-file-grp-${idx}" style="display: ${isBase64 ? 'block' : 'none'};">
                        <label style="font-size: 11px; margin-bottom: 4px; display: block; text-transform: uppercase; color:var(--text-muted);">Seleccionar Archivo</label>
                        <input type="file" accept="image/*" class="form-control" style="padding: 6px 12px; font-size: 12px;" onchange="handleProductMediaFileUpload(event, ${idx})">
                    </div>
                </div>
                <div style="display: flex; gap: 10px; align-items: center; align-self: end; margin-bottom: 2px;">
                    <div id="prod-media-preview-${idx}" style="background-image: url('${item.media_url || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100'}'); background-size: cover; background-position: center; width: 40px; height: 40px; border-radius: 6px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);"></div>
                    <button type="button" class="action-btn" style="color: var(--danger); padding: 8px;" onclick="removeProductMediaRow(${idx})" title="Quitar imagen"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
    }).join('');
};

window.toggleProductMediaSrcType = (idx, type) => {
    const urlGrp = document.getElementById(`prod-media-url-grp-${idx}`);
    const fileGrp = document.getElementById(`prod-media-file-grp-${idx}`);
    if (type === 'url') {
        urlGrp.style.display = 'block';
        fileGrp.style.display = 'none';
    } else {
        urlGrp.style.display = 'none';
        fileGrp.style.display = 'block';
    }
};

window.updateProductMediaUrl = (idx, val) => {
    window.currentProductMedia[idx].media_url = val;
    const preview = document.getElementById(`prod-media-preview-${idx}`);
    if (preview) preview.style.backgroundImage = `url('${val || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100'}')`;
};

window.addProductMediaRow = () => {
    window.currentProductMedia.push({ media_url: '', is_video: 0 });
    window.renderProductMediaRows();
};

window.removeProductMediaRow = (idx) => {
    window.currentProductMedia.splice(idx, 1);
    window.renderProductMediaRows();
};

window.handleProductMediaFileUpload = (event, idx) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Comprimir para productos (max 800px para mantener la BD liviana)
            const MAX_WIDTH = 800;
            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            
            window.currentProductMedia[idx].media_url = base64;
            const preview = document.getElementById(`prod-media-preview-${idx}`);
            if (preview) preview.style.backgroundImage = `url('${base64}')`;
            
            showToast('Imagen del producto cargada y optimizada con éxito.', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};
