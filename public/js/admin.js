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
    
    // Cargar branding dinámico del sistema
    try {
        const settings = await AdminService.getSettings();
        if (settings && settings.site_branding && window.applyDynamicBranding) {
            window.applyDynamicBranding(settings.site_branding);
        }
    } catch (e) {}

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
        streaming: 'Gestión de Cuentas y Perfiles Streaming',
        categories: 'Gestión de Categorías y Subcategorías',
        orders: 'Gestión de Pedidos',
        wallet: 'Ajuste de Monedas Virtuales',
        coupons: 'Gestión de Cupones',
        vip_users: 'Gestión de Usuarios y Clientes',
        vip_resources: 'Gestión de Recursos de Zona VIP',
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
            case 'streaming':
                await renderStreamingTab(contentArea);
                break;
            case 'categories':
                await renderCategoriesTab(contentArea);
                break;
            case 'orders':
                await renderOrdersTab(contentArea);
                break;
            case 'wallet':
                renderWalletTab(contentArea);
                break;
            case 'coupons':
                await renderCouponsTab(contentArea);
                break;
            case 'vip_users':
                await renderVipUsersTab(contentArea);
                break;
            case 'vip_resources':
                await renderVipResourcesTab(contentArea);
                break;
            case 'settings':
                await renderSettingsTab(contentArea);
                break;
        }
    } catch (e) {
        console.error("Error al cambiar de pestaña [", tabName, "]:", e);
        contentArea.innerHTML = `<div class="glass-panel" style="padding: 24px; color: var(--danger);">Error al cargar los datos del panel: ${e.message}</div>`;
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
                        const icons = { software: 'fa-laptop-code', digital: 'fa-download', physical: 'fa-box' };
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
window._cachedAdminCategories = [];
window._adminProductFilterOffers = false;

function formatProductUploadDate(dateStr) {
    if (!dateStr) return '<span style="color:var(--text-muted); font-size:11px;">N/A</span>';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let badge = '';
    if (diffHours < 24 && diffHours >= 0) {
        badge = '<span class="badge" style="background:#10b981; color:white; font-size:9.5px; margin-left:6px;"><i class="fas fa-bolt"></i> Hoy</span>';
    } else if (diffDays <= 7 && diffDays >= 0) {
        badge = '<span class="badge badge-featured" style="font-size:9.5px; margin-left:6px;">Reciente</span>';
    }

    const dateFormatted = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeFormatted = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    return `
        <div>
            <span style="font-size: 12.5px; font-weight: 600;">${dateFormatted}</span>${badge}
            <span style="display: block; font-size: 11px; color: var(--text-muted);">${timeFormatted}</span>
        </div>
    `;
}

async function renderProductsTab(container) {
    let categories = [];
    try {
        [globalProductList, categories] = await Promise.all([
            ShopService.getProducts(),
            ShopService.getCategories().catch(() => [])
        ]);
        window._cachedAdminCategories = categories || [];
    } catch (err) {
        console.error('Error al cargar productos o categorías:', err);
        showToast('Error al cargar catálogo de productos.', 'error');
        globalProductList = [];
    }

    container.innerHTML = `
        <div class="admin-table-container animate-fade-in">
            <div class="admin-table-header" style="margin-bottom: 20px;">
                <div>
                    <h3 style="margin: 0; font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-boxes" style="color: var(--color-primary);"></i> Lista de Productos
                    </h3>
                    <p style="color: var(--text-muted); font-size: 13px; margin: 4px 0 0 0;">
                        Filtra tu catálogo por categoría, productos recientemente subidos, tipo o búsqueda directa.
                    </p>
                </div>
                <button class="btn-primary" onclick="openProductFormModal()" style="display: inline-flex; align-items: center; gap: 8px;">
                    <i class="fas fa-plus"></i> Crear Producto
                </button>
            </div>

            <!-- Barra de Filtros Principales -->
            <div class="glass-panel" style="padding: 16px 20px; margin-bottom: 14px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
                <!-- Buscador -->
                <div style="flex: 1; min-width: 220px; position: relative;">
                    <i class="fas fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 13px;"></i>
                    <input type="text" id="admin-product-search" class="form-control" placeholder="Buscar por producto, SKU o marca..." style="padding-left: 38px; font-size: 13px;" oninput="filterAdminProductsTable()">
                </div>

                <!-- Filtro por Categoría -->
                <div style="min-width: 200px;">
                    <select id="admin-product-category-filter" class="form-control" style="font-size: 13px;" onchange="filterAdminProductsTable()">
                        <option value="">📁 Todas las Categorías</option>
                        ${categories.map(cat => `
                            <option value="${cat.id}">${cat.name}</option>
                            ${cat.subcategories ? cat.subcategories.map(sub => `<option value="${sub.id}">&nbsp;&nbsp;&nbsp;↳ ${sub.name}</option>`).join('') : ''}
                        `).join('')}
                    </select>
                </div>

                <!-- Filtro: Productos Recientemente Subidos / Orden -->
                <div style="min-width: 230px;">
                    <select id="admin-product-sort-filter" class="form-control" style="font-size: 13px; font-weight: 600;" onchange="filterAdminProductsTable()">
                        <option value="recent">⚡ Recientemente subidos (Más nuevos)</option>
                        <option value="recent_today">🔥 Subidos Hoy</option>
                        <option value="recent_7d">🕒 Subidos últimos 7 días</option>
                        <option value="recent_30d">📅 Subidos este mes (30 días)</option>
                        <option value="oldest">⏳ Más antiguos primero</option>
                        <option value="price_desc">💰 Mayor precio</option>
                        <option value="price_asc">🏷️ Menor precio</option>
                        <option value="name_asc">🔤 Nombre: A - Z</option>
                    </select>
                </div>

                <!-- Filtro por Tipo -->
                <div style="min-width: 140px;">
                    <select id="admin-product-type-filter" class="form-control" style="font-size: 13px;" onchange="filterAdminProductsTable()">
                        <option value="">Todos los tipos</option>
                        <option value="physical">📦 Físicos</option>
                        <option value="digital">⚡ Digitales</option>
                        <option value="software">💻 Software</option>
                    </select>
                </div>

                <!-- Botón Reset -->
                <button class="btn-outline" style="padding: 9px 14px; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;" onclick="resetAdminProductFilters()" title="Restablecer filtros">
                    <i class="fas fa-undo"></i> Limpiar
                </button>
            </div>

            <!-- Accesos Rápidos de Filtrado -->
            <div style="display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; align-items: center;">
                <span style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin-right: 4px;">Filtros rápidos:</span>
                <button type="button" class="btn-outline admin-prod-pill active" data-filter="all" onclick="setAdminProductQuickFilter('all', this)" style="padding: 4px 12px; font-size: 11.5px; border-radius: 20px;">Todos (${globalProductList.length})</button>
                <button type="button" class="btn-outline admin-prod-pill" data-filter="recent_7d" onclick="setAdminProductQuickFilter('recent_7d', this)" style="padding: 4px 12px; font-size: 11.5px; border-radius: 20px;"><i class="fas fa-bolt" style="color: #10b981;"></i> Recientemente subidos (7 días)</button>
                <button type="button" class="btn-outline admin-prod-pill" data-filter="offers" onclick="setAdminProductQuickFilter('offers', this)" style="padding: 4px 12px; font-size: 11.5px; border-radius: 20px;"><i class="fas fa-fire" style="color: var(--color-secondary);"></i> En Oferta</button>
                <button type="button" class="btn-outline admin-prod-pill" data-filter="streaming" onclick="setAdminProductQuickFilter('streaming', this)" style="padding: 4px 12px; font-size: 11.5px; border-radius: 20px;"><i class="fas fa-tv" style="color: var(--color-primary);"></i> Streaming</button>
                <button type="button" class="btn-outline admin-prod-pill" data-filter="physical" onclick="setAdminProductQuickFilter('physical', this)" style="padding: 4px 12px; font-size: 11.5px; border-radius: 20px;"><i class="fas fa-box"></i> Físicos</button>
                <div style="margin-left: auto;">
                    <span id="admin-products-count" style="font-size: 12.5px; color: var(--text-muted); font-weight: 600;"></span>
                </div>
            </div>
            
            <table class="admin-table">
                <thead>
                    <tr>
                        <th style="width: 50px;">ID</th>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Tipo</th>
                        <th>Precio (Normal / Oferta)</th>
                        <th>Stock</th>
                        <th>Fecha de Subida</th>
                        <th style="text-align: right; min-width: 140px;">Acciones</th>
                    </tr>
                </thead>
                <tbody id="admin-products-table-body">
                </tbody>
            </table>
        </div>
    `;

    renderAdminProductRows(globalProductList);
}

function renderAdminProductRows(products) {
    const tbody = document.getElementById('admin-products-table-body');
    const countEl = document.getElementById('admin-products-count');
    if (!tbody) return;

    if (countEl) {
        countEl.textContent = `${products.length} de ${globalProductList.length} productos`;
    }

    if (!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 48px 24px; color: var(--text-muted);">
                    <i class="fas fa-boxes" style="font-size: 36px; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
                    <p style="font-size: 15px; font-weight: 600; margin: 0 0 8px 0; color: var(--text-primary);">No se encontraron productos</p>
                    <p style="font-size: 12.5px; margin: 0 0 16px 0;">Prueba cambiando la categoría seleccionada o los filtros de búsqueda.</p>
                    <button class="btn-outline" style="padding: 6px 14px; font-size: 12px;" onclick="resetAdminProductFilters()">
                        <i class="fas fa-undo"></i> Limpiar Filtros
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = products.map(p => {
        const typeBadge = p.type === 'physical' 
            ? '<span class="badge badge-featured"><i class="fas fa-box"></i> FÍSICO</span>'
            : (p.type === 'software'
                ? '<span class="badge badge-upcoming"><i class="fas fa-laptop-code"></i> SOFTWARE</span>'
                : `<span class="badge badge-new" style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3);"><i class="fas fa-bolt"></i> DIGITAL${p.streaming_platform ? ' (' + p.streaming_platform + ')' : ''}</span>`);

        const catBadge = p.category_name 
            ? `<span class="badge" style="background: rgba(99,102,241,0.1); color: var(--color-primary); font-size: 11px; font-weight: 600; border: 1px solid rgba(99,102,241,0.2);"><i class="fas fa-folder"></i> ${p.category_name}</span>`
            : '<span style="color: var(--text-muted); font-size: 11px;">Sin categoría</span>';

        return `
            <tr>
                <td style="font-weight: 700; color: var(--text-muted);">#${p.id}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${p.media && p.media.length > 0 ? `<img src="${p.media[0].media_url}" alt="${p.name}" style="width: 38px; height: 38px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color); flex-shrink: 0;">` : ''}
                        <div>
                            <strong style="color: var(--text-primary); font-size: 13.5px;">${p.name}</strong>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                                <span>SKU: ${p.sku || 'N/A'}</span>
                                ${p.brand ? ` • <span style="color: var(--text-secondary);">${p.brand}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </td>
                <td>${catBadge}</td>
                <td>${typeBadge}</td>
                <td>
                    <strong style="font-size: 13px;">S/. ${Number(p.price_normal).toFixed(2)}</strong>
                    ${p.price_offer ? `<br><span style="color: var(--color-secondary); font-size: 11.5px; font-weight: 700;"><i class="fas fa-tag"></i> Oferta: S/. ${Number(p.price_offer).toFixed(2)}</span>` : ''}
                </td>
                <td>
                    ${p.type === 'physical' 
                        ? (Number(p.stock) > 0 
                            ? `<span style="font-weight: 600; color: ${Number(p.stock) < 5 ? '#f59e0b' : 'var(--text-primary)'};">${p.stock} uds.</span>` 
                            : '<span class="badge badge-soldout">Agotado</span>')
                        : '<span style="color: #10b981; font-weight: 600; font-size: 12px;"><i class="fas fa-infinity"></i> Ilimitado</span>'}
                </td>
                <td>
                    ${formatProductUploadDate(p.created_at)}
                </td>
                <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 6px; justify-content: flex-end;">
                        <button class="btn-outline" style="padding: 6px 10px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;" onclick="openProductFormModal(${p.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-outline" style="padding: 6px 10px; font-size: 12px; border-color: rgba(239,68,68,0.4); color: var(--danger);" onclick="deleteProductCall(${p.id}, '${(p.name || '').replace(/'/g, "\\'")}')" title="Eliminar Producto">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.filterAdminProductsTable = () => {
    if (!globalProductList) return;

    const searchVal = document.getElementById('admin-product-search')?.value.trim().toLowerCase() || '';
    const catVal = document.getElementById('admin-product-category-filter')?.value || '';
    const sortVal = document.getElementById('admin-product-sort-filter')?.value || 'recent';
    const typeVal = document.getElementById('admin-product-type-filter')?.value || '';

    let filtered = [...globalProductList];

    // 1. Buscador
    if (searchVal) {
        filtered = filtered.filter(p => {
            const name = (p.name || '').toLowerCase();
            const sku = (p.sku || '').toLowerCase();
            const brand = (p.brand || '').toLowerCase();
            const catName = (p.category_name || '').toLowerCase();
            const platform = (p.streaming_platform || '').toLowerCase();
            return name.includes(searchVal) || sku.includes(searchVal) || brand.includes(searchVal) || catName.includes(searchVal) || platform.includes(searchVal);
        });
    }

    // 2. Filtro por Categoría
    if (catVal) {
        const catIdNum = Number(catVal);
        filtered = filtered.filter(p => {
            if (p.category_id === catIdNum) return true;
            if (window._cachedAdminCategories) {
                const parentCat = window._cachedAdminCategories.find(c => c.id === catIdNum);
                if (parentCat && parentCat.subcategories) {
                    return parentCat.subcategories.some(s => s.id === p.category_id);
                }
            }
            return false;
        });
    }

    // 3. Filtro por Tipo
    if (typeVal) {
        filtered = filtered.filter(p => p.type === typeVal);
    }

    // 4. Filtro solo ofertas si está activo
    if (window._adminProductFilterOffers) {
        filtered = filtered.filter(p => p.price_offer !== null && Number(p.price_offer) > 0);
    }

    // 5. Filtro y orden por productos recientemente subidos
    const now = new Date();
    if (sortVal === 'recent_today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = filtered.filter(p => p.created_at && new Date(p.created_at) >= startOfToday);
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortVal === 'recent_7d') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(p => p.created_at && new Date(p.created_at) >= sevenDaysAgo);
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortVal === 'recent_30d') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(p => p.created_at && new Date(p.created_at) >= thirtyDaysAgo);
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortVal === 'recent') {
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortVal === 'oldest') {
        filtered.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    } else if (sortVal === 'price_desc') {
        filtered.sort((a, b) => (Number(b.price_offer || b.price_normal)) - (Number(a.price_offer || a.price_normal)));
    } else if (sortVal === 'price_asc') {
        filtered.sort((a, b) => (Number(a.price_offer || a.price_normal)) - (Number(b.price_offer || b.price_normal)));
    } else if (sortVal === 'name_asc') {
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    renderAdminProductRows(filtered);
};

window.resetAdminProductFilters = () => {
    const s = document.getElementById('admin-product-search');
    const c = document.getElementById('admin-product-category-filter');
    const o = document.getElementById('admin-product-sort-filter');
    const t = document.getElementById('admin-product-type-filter');
    if (s) s.value = '';
    if (c) c.value = '';
    if (o) o.value = 'recent';
    if (t) t.value = '';
    window._adminProductFilterOffers = false;
    document.querySelectorAll('.admin-prod-pill').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === 'all');
    });
    filterAdminProductsTable();
};

window.setAdminProductQuickFilter = (filterKey, buttonEl) => {
    document.querySelectorAll('.admin-prod-pill').forEach(b => b.classList.remove('active'));
    if (buttonEl) buttonEl.classList.add('active');

    const searchInput = document.getElementById('admin-product-search');
    const catSelect = document.getElementById('admin-product-category-filter');
    const sortSelect = document.getElementById('admin-product-sort-filter');
    const typeSelect = document.getElementById('admin-product-type-filter');

    if (filterKey === 'all') {
        if (searchInput) searchInput.value = '';
        if (catSelect) catSelect.value = '';
        if (sortSelect) sortSelect.value = 'recent';
        if (typeSelect) typeSelect.value = '';
        window._adminProductFilterOffers = false;
    } else if (filterKey === 'recent_7d') {
        if (sortSelect) sortSelect.value = 'recent_7d';
        if (typeSelect) typeSelect.value = '';
        if (catSelect) catSelect.value = '';
        window._adminProductFilterOffers = false;
    } else if (filterKey === 'offers') {
        window._adminProductFilterOffers = true;
    } else if (filterKey === 'streaming') {
        window._adminProductFilterOffers = false;
        if (typeSelect) typeSelect.value = 'digital';
        if (catSelect && window._cachedAdminCategories) {
            const strCat = window._cachedAdminCategories.find(c => c.slug === 'streaming' || c.name.toLowerCase().includes('streaming'));
            if (strCat) catSelect.value = String(strCat.id);
        }
    } else if (filterKey === 'physical') {
        window._adminProductFilterOffers = false;
        if (typeSelect) typeSelect.value = 'physical';
        if (catSelect) catSelect.value = '';
    }

    filterAdminProductsTable();
};

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
        product = globalProductList.find(p => p.id == productId) || product;
    }

    // Cargar categorías del sistema para el selector
    let catOptions = '<option value="">-- Sin categoría --</option>';
    try {
        const categories = await ShopService.getCategories();
        categories.forEach(cat => {
            catOptions += `<option value="${cat.id}" ${product.category_id == cat.id ? 'selected' : ''}>${cat.name} (Principal)</option>`;
            if (cat.subcategories && cat.subcategories.length > 0) {
                cat.subcategories.forEach(sub => {
                    catOptions += `<option value="${sub.id}" ${product.category_id == sub.id ? 'selected' : ''}>&nbsp;&nbsp;&nbsp;↳ ${sub.name}</option>`;
                });
            }
        });
    } catch (e) {
        console.error('Error al cargar categorías para el formulario:', e);
    }

    // Cargar plataformas de streaming para el selector
    let streamingPlatforms = window._cachedStreamingPlatforms || [];
    if (!streamingPlatforms || streamingPlatforms.length === 0) {
        try {
            streamingPlatforms = await AdminService.getStreamingPlatforms();
            window._cachedStreamingPlatforms = streamingPlatforms;
        } catch (e) {
            console.error('Error al cargar plataformas para el formulario:', e);
        }
    }

    // Inicializar medios (Portada y Galería)
    let initialCover = '';
    let initialGallery = [];

    if (product.media && product.media.length > 0) {
        initialCover = product.media[0].media_url || '';
        initialGallery = product.media.slice(1).map(m => typeof m === 'string' ? { media_url: m, is_video: 0 } : m);
    }

    window.currentProductCover = initialCover;
    window.currentProductGallery = initialGallery;

    modalContent.innerHTML = `
        <div class="admin-modal-header">
            <h3>${productId ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
            <button onclick="closeAdminModal()" style="font-size: 20px; border:none; background:none; cursor:pointer;"><i class="fas fa-times"></i></button>
        </div>
        <form id="product-crud-form">
            <div class="admin-modal-body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label>Nombre del Producto</label>
                    <input type="text" id="prod-name" class="form-control" value="${product.name}" oninput="${!productId ? "document.getElementById('prod-slug').value = this.value.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');" : ""}" required>
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
                        <input type="checkbox" id="chk-sold-out" ${product.is_sold_out ? 'checked' : ''}> Agotado
                    </label>
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; text-transform: none;">
                        <input type="checkbox" id="chk-upcoming" ${product.is_upcoming ? 'checked' : ''}> Próximamente
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

                <!-- Campos de Descarga Digital / Software / Streaming -->
                <div id="digital-download-fields" style="grid-column: span 2; display: ${['digital', 'software'].includes(product.type) ? 'grid' : 'none'}; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="form-group" style="grid-column: span 2;">
                        <label>URL de Descarga Directa del Archivo (Si aplica)</label>
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
                    <div class="form-group">
                        <label style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Plataforma Streaming Asociada</span>
                            <small style="color: var(--color-primary); font-weight: 600;">(Entrega automática)</small>
                        </label>
                        <select id="prod-streaming-platform-select" class="form-control" onchange="handleStreamingPlatformSelectChange(this)">
                            <option value="">-- Ninguna (Producto normal) --</option>
                            ${(streamingPlatforms || []).map(sp => `<option value="${sp.name}" ${product.streaming_platform === sp.name ? 'selected' : ''}>${sp.name} (${sp.account_type === 'activation_link' ? 'Link de activación' : 'Perfiles/Clave'})</option>`).join('')}
                            <option value="__custom__" ${product.streaming_platform && !(streamingPlatforms || []).some(sp => sp.name === product.streaming_platform) ? 'selected' : ''}>➕ Otra plataforma (Escribir manualmente)...</option>
                        </select>
                        <input type="text" id="prod-streaming-platform" class="form-control" value="${product.streaming_platform || ''}" placeholder="ej: Netflix, Disney+, Spotify, Gemini AI" style="margin-top: 8px; display: ${product.streaming_platform && !(streamingPlatforms || []).some(sp => sp.name === product.streaming_platform) ? 'block' : 'none'};">
                    </div>
                </div>

                <!-- Especificaciones / Ficha Técnica -->
                <div class="form-group" style="grid-column: span 2;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <label style="font-weight: 700; color: var(--text-secondary);">Especificaciones / Ficha Técnica</label>
                        <button type="button" class="btn-outline" style="padding: 4px 10px; font-size: 11px;" onclick="addProductFeatureRow()"><i class="fas fa-plus"></i> Agregar Especificación</button>
                    </div>
                    <div id="product-features-rows-container" style="display: flex; flex-direction: column; gap: 8px;"></div>
                </div>

                <!-- SECCIÓN 1: IMAGEN DE PORTADA DEL PRODUCTO (DESDE EL COMPUTADOR O URL) -->
                <div class="form-group" style="grid-column: span 2;">
                    <div class="product-image-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                            <div>
                                <label style="font-weight: 700; color: var(--text-primary); font-size: 14px;">
                                    <i class="fas fa-image" style="color: var(--color-primary); margin-right: 6px;"></i> Imagen de Portada (Principal)
                                </label>
                                <span style="font-size: 11px; color: var(--text-muted); display: block;">
                                    Es la imagen frontal que aparecerá en el catálogo, tarjetas y cabecera de la tienda.
                                </span>
                            </div>
                            <button type="button" class="btn-outline" style="padding: 4px 10px; font-size: 11px;" onclick="toggleCoverUrlInput()">
                                <i class="fas fa-link"></i> <span id="cover-url-toggle-text">Ingresar URL</span>
                            </button>
                        </div>
                        
                        <div class="cover-upload-wrapper">
                            <div class="cover-preview-box" id="cover-preview-box" style="background-image: ${initialCover ? `url('${initialCover}')` : 'none'};">
                                ${!initialCover ? '<i class="fas fa-camera" style="font-size: 32px; color: var(--text-muted);"></i>' : ''}
                            </div>
                            <div style="display: flex; flex-direction: column; justify-content: center; gap: 8px;">
                                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                                    <label class="btn-primary" style="cursor: pointer; display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; font-size: 13px; margin: 0;">
                                        <i class="fas fa-laptop"></i> Subir Portada desde el PC
                                        <input type="file" id="prod-cover-file-input" accept="image/*" style="display: none;" onchange="handleProductCoverUpload(event)">
                                    </label>
                                    <button type="button" id="remove-cover-btn" class="action-btn" style="color: var(--danger); display: ${initialCover ? 'inline-flex' : 'none'}; align-items: center; gap: 6px; font-size: 12px; padding: 6px 12px; border: 1px solid var(--danger); border-radius: var(--radius-md);" onclick="removeProductCover()" title="Quitar portada">
                                        <i class="fas fa-trash-alt"></i> Quitar Portada
                                    </button>
                                </div>
                                <div id="cover-url-input-container" style="display: ${initialCover && !initialCover.startsWith('data:') ? 'block' : 'none'}; margin-top: 4px;">
                                    <input type="text" id="prod-cover-url" class="form-control" placeholder="https://images.unsplash.com/..." value="${initialCover && !initialCover.startsWith('data:') ? initialCover : ''}" oninput="updateCoverFromUrl(this.value)">
                                </div>
                                <span style="font-size: 11px; color: var(--text-muted);">
                                    Formatos compatibles: JPG, PNG, WEBP, GIF. Compresión y optimización automática para máxima velocidad.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 2: GALERÍA DE IMÁGENES ADICIONALES (DESDE EL COMPUTADOR O MULTI-ARCHIVOS) -->
                <div class="form-group" style="grid-column: span 2;">
                    <div class="product-image-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
                            <div>
                                <label style="font-weight: 700; color: var(--text-primary); font-size: 14px;">
                                    <i class="fas fa-images" style="color: var(--color-secondary); margin-right: 6px;"></i> Galería de Fotos Adicionales
                                </label>
                                <span style="font-size: 11px; color: var(--text-muted); display: block;">
                                    Imágenes secundarias para el carrusel de detalles del producto.
                                </span>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <label class="btn-secondary" style="cursor: pointer; display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; font-size: 12px; margin: 0;">
                                    <i class="fas fa-file-upload"></i> Subir Fotos del PC
                                    <input type="file" id="prod-gallery-files-input" accept="image/*" multiple style="display: none;" onchange="handleGalleryMultipleUpload(event)">
                                </label>
                                <button type="button" class="btn-outline" style="padding: 6px 12px; font-size: 12px;" onclick="addGalleryUrlRow()">
                                    <i class="fas fa-link"></i> Añadir por URL
                                </button>
                            </div>
                        </div>
                        
                        <!-- Drag & Drop Zone -->
                        <div class="drag-drop-zone" id="gallery-dropzone" onclick="document.getElementById('prod-gallery-files-input').click()">
                            <i class="fas fa-cloud-upload-alt" style="font-size: 28px; color: var(--color-secondary); margin-bottom: 6px;"></i>
                            <p style="font-size: 13px; font-weight: 600; margin-bottom: 2px;">Haz clic aquí o arrastra fotos desde tu computadora</p>
                            <span style="font-size: 11px; color: var(--text-muted);">Puedes seleccionar y subir múltiples imágenes a la vez</span>
                        </div>

                        <!-- Grid de Miniaturas de la Galería -->
                        <div id="product-gallery-grid-container" class="gallery-grid"></div>
                    </div>
                </div>
            </div>
            
            <div class="admin-modal-footer">
                <button type="button" class="btn-outline" onclick="closeAdminModal()">Cancelar</button>
                <button type="submit" class="btn-primary">Guardar Producto</button>
            </div>
        </form>
    `;

    modal.style.display = 'flex';
    modal.classList.add('active');

    // Inicializar listeners de Drag & Drop para la galería
    const dropzone = document.getElementById('gallery-dropzone');
    if (dropzone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('dragover');
            }, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                handleFilesForGallery(Array.from(files));
            }
        }, false);
    }

    // Renderizar la grilla de galería
    window.renderProductGalleryGrid();

    // Renderizar especificaciones
    window.currentProductFeatures = [];
    if (product.features) {
        try {
            let parsed = typeof product.features === 'string' ? JSON.parse(product.features) : product.features;
            if (Array.isArray(parsed)) {
                window.currentProductFeatures = parsed.map(item => ({
                    name: item.name || item.key || '',
                    value: item.value || ''
                }));
            } else if (typeof parsed === 'object' && parsed !== null) {
                window.currentProductFeatures = Object.entries(parsed).map(([key, val]) => ({
                    name: key,
                    value: String(val)
                }));
            }
        } catch (e) {
            console.error('Error al cargar especificaciones de producto:', e);
            window.currentProductFeatures = [];
        }
    }
    window.renderProductFeaturesRows();

    // Handler al enviar Formulario
    document.getElementById('product-crud-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Construir arreglo de medios: Portada primero, luego galería
        const allMedia = [];
        if (window.currentProductCover && window.currentProductCover.trim() !== '') {
            allMedia.push({ media_url: window.currentProductCover.trim(), is_video: 0 });
        }
        if (window.currentProductGallery && window.currentProductGallery.length > 0) {
            window.currentProductGallery.forEach(item => {
                if (item && item.media_url && item.media_url.trim() !== '') {
                    allMedia.push({ media_url: item.media_url.trim(), is_video: item.is_video ? 1 : 0 });
                }
            });
        }

        const featuresArray = (window.currentProductFeatures || []).filter(f => f && f.name && f.name.trim() !== '' && f.value && f.value.trim() !== '');

        const payload = {
            name: document.getElementById('prod-name').value.trim(),
            slug: document.getElementById('prod-slug').value.trim(),
            type: document.getElementById('prod-type').value,
            sku: document.getElementById('prod-sku').value.trim() || null,
            stock: Number(document.getElementById('prod-stock').value) || 0,
            category_id: Number(document.getElementById('prod-category').value) || null,
            brand: document.getElementById('prod-brand')?.value.trim() || null,
            price_normal: Number(document.getElementById('prod-price-normal').value),
            price_offer: Number(document.getElementById('prod-price-offer').value) || null,
            price_sorti: Number(document.getElementById('prod-price-sorti').value) || null,
            description: document.getElementById('prod-desc').value.trim(),
            is_featured: document.getElementById('chk-featured').checked,
            is_recommended: document.getElementById('chk-recommended').checked,
            is_new: document.getElementById('chk-new').checked,
            is_sold_out: document.getElementById('chk-sold-out')?.checked || false,
            is_upcoming: document.getElementById('chk-upcoming')?.checked || false,
            is_presale: document.getElementById('chk-presale').checked,
            presale_launch_date: document.getElementById('prod-presale-date').value || null,
            download_url: document.getElementById('prod-download-url')?.value.trim() || null,
            download_file_size: document.getElementById('prod-download-size')?.value.trim() || null,
            download_version: document.getElementById('prod-download-version')?.value.trim() || null,
            streaming_platform: document.getElementById('prod-streaming-platform')?.value.trim() || null,
            media: allMedia,
            features: featuresArray,
            variants: []
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

window.handleStreamingPlatformSelectChange = (selectEl) => {
    const input = document.getElementById('prod-streaming-platform');
    if (!input) return;
    if (selectEl.value === '__custom__') {
        input.style.display = 'block';
        input.value = '';
        input.focus();
    } else {
        input.style.display = 'none';
        input.value = selectEl.value;
    }
};

window.closeAdminModal = () => {
    const modal = document.getElementById('admin-details-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
};

window.deleteProductCall = (id, name = '') => {
    const product = globalProductList ? globalProductList.find(p => p.id === id) : null;
    const prodName = name || (product ? product.name : `#${id}`);
    
    const modal = document.getElementById('admin-details-modal');
    const modalContent = document.getElementById('admin-modal-content-area');
    
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
        <div class="admin-modal-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="color: var(--danger); font-weight: 700; margin: 0;"><i class="fas fa-exclamation-triangle"></i> Confirmar Eliminación</h3>
            <button onclick="closeAdminModal()" style="font-size: 20px; border:none; background:none; color: var(--text-muted); cursor:pointer;"><i class="fas fa-times"></i></button>
        </div>
        <div class="admin-modal-body" style="padding: 24px 0; text-align: center;">
            <div style="font-size: 52px; color: var(--danger); margin-bottom: 16px;">
                <i class="fas fa-trash-alt"></i>
            </div>
            <p style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">¿Estás seguro de eliminar este producto?</p>
            <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px; line-height: 1.5;">
                <strong style="color: var(--text-main);">${prodName}</strong> (ID: #${id})<br>
                Esta acción eliminará el producto del catálogo y limpiará todos sus recursos asociados.
            </p>
        </div>
        <div class="admin-modal-footer" style="display: flex; justify-content: center; gap: 16px; border-top: 1px solid var(--border-color); padding-top: 16px;">
            <button type="button" class="btn-outline" style="padding: 8px 20px; font-size: 14px;" onclick="closeAdminModal()">Cancelar</button>
            <button type="button" class="btn-primary" style="background: var(--danger); border-color: var(--danger); padding: 8px 20px; font-size: 14px;" onclick="executeDeleteProduct(${id})">
                <i class="fas fa-trash"></i> Sí, Eliminar Producto
            </button>
        </div>
    `;
    
    modal.style.display = 'flex';
    modal.classList.add('active');
};

window.executeDeleteProduct = async (id) => {
    try {
        window.closeAdminModal();
        await AdminService.deleteProduct(id);
        showToast('Producto eliminado con éxito.', 'info');
        await switchTab('products');
    } catch (e) {
        showToast(e.message || 'Error al eliminar el producto.', 'error');
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
                        const deliveryBadge = o.delivery_type === 'digital' 
                            ? '<span class="badge badge-new" style="background:#10b981; color:white;"><i class="fas fa-bolt"></i> DIGITAL</span>' 
                            : (o.delivery_type === 'pickup' 
                                ? '<span class="badge badge-upcoming"><i class="fas fa-store"></i> RECOJO</span>' 
                                : '<span class="badge badge-featured"><i class="fas fa-truck"></i> DELIVERY</span>');

                        return `
                            <tr>
                                <td>#${o.id}</td>
                                <td><strong>${o.user_name || o.guest_name || 'Invitado'}</strong><br><span style="font-size:11px; color:var(--text-muted);">${o.user_email || o.guest_email}</span></td>
                                <td>${deliveryBadge}<br><span style="font-size:11px; color:var(--text-muted);">${o.delivery_address}</span></td>
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
                    <p><strong>Entrega:</strong> ${order.delivery_type === 'digital' ? '<span style="color:#10b981; font-weight:700;"><i class="fas fa-bolt"></i> Entrega Digital Inmediata</span>' : (order.delivery_type === 'pickup' ? 'Recojo en local' : 'Delivery a Domicilio')}</p>
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

            <!-- Cuentas Streaming Asignadas al Pedido -->
            ${(() => {
                const hasStreamingItems = order.items && order.items.some(it => it.type === 'digital' || it.streaming_platform);
                const deliveries = order.streaming_deliveries || [];
                if (!hasStreamingItems && deliveries.length === 0) return '';

                return `
                    <div style="margin-bottom: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h4 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-tv" style="color: var(--color-primary);"></i> Cuentas / Perfiles Streaming Entregados
                            </h4>
                            <button type="button" class="btn-outline" style="padding: 4px 10px; font-size: 12px;" onclick="handleAutoAssignOrderStreamingInModal(${order.id})">
                                <i class="fas fa-sync-alt"></i> Reasignar / Auto-Entregar
                            </button>
                        </div>
                        ${deliveries.length > 0 ? `
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                ${deliveries.map(d => {
                                    const isLinkOnly = d.account_type === 'activation_link' || (!d.email && d.activation_link);
                                    const isPersonalAccount = d.account_type === 'personal_account';
                                    const logoHtml = d.platform_image 
                                        ? `<img src="${d.platform_image}" alt="${d.platform}" style="width: 38px; height: 38px; border-radius: 8px; object-fit: cover;">`
                                        : `<div style="width: 38px; height: 38px; border-radius: 8px; background: rgba(99,102,241,0.15); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 18px;"><i class="fas fa-play"></i></div>`;

                                    return `
                                        <div style="background: var(--bg-hover); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px;">
                                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 10px;">
                                                <div style="display: flex; align-items: center; gap: 10px;">
                                                    ${logoHtml}
                                                    <div>
                                                        <strong style="font-size: 15px;">${d.platform}</strong>
                                                        <div style="font-size: 11.5px; color: var(--text-secondary);">
                                                            ${isPersonalAccount ? '<span class="badge" style="background: rgba(99,102,241,0.15); color: var(--color-primary);"><i class="fas fa-user-check"></i> Cuenta Propia</span>' : (isLinkOnly ? '<span class="badge" style="background: rgba(16,185,129,0.15); color: #10b981;">Link de Activación</span>' : '<span class="badge" style="background: rgba(99,102,241,0.15); color: var(--color-primary);">Credenciales de Perfil</span>')}
                                                            <span style="margin-left: 6px;">Ocupación cuenta: <strong>${d.current_users_count || 1}/${d.max_devices || 1}</strong> cupos</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button type="button" class="btn-icon" style="color: var(--danger); font-size: 12px;" title="Liberar esta cuenta del pedido" onclick="handleUnassignStreamingFromOrder(${d.assignment_id}, ${order.id})">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>

                                            ${isPersonalAccount ? `
                                                <div style="background: var(--bg-card); padding: 12px 14px; border-radius: 6px; margin-bottom: 8px;">
                                                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                                                        <div>
                                                            <span style="font-size: 11.5px; color: var(--text-muted); display: block;">Correo de vinculación del cliente:</span>
                                                            <strong style="font-size: 13.5px; color: var(--text-primary);">${d.target_email || '<span style="color: #f59e0b;">⏳ Esperando que el cliente ingrese su correo en su panel</span>'}</strong>
                                                        </div>
                                                        <div>
                                                            ${d.target_email ? (d.link_status === 'active' || d.link_status === 'linked' ? `
                                                                <span class="badge badge-new" style="font-size: 11px;"><i class="fas fa-check-circle"></i> Vinculada & Activa</span>
                                                            ` : `
                                                                <button type="button" class="btn-primary" style="font-size: 11.5px; padding: 5px 10px;" onclick="handleMarkAssignmentLinked(${d.assignment_id}); closeAdminModalModal(); openOrderDetailsModal(${order.id});">
                                                                    <i class="fas fa-check"></i> Marcar como Vinculada
                                                                </button>
                                                            `) : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            ` : (isLinkOnly ? `
                                                <div style="background: var(--bg-card); padding: 10px 14px; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                                                    <div style="font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                                        <strong>Link de Invitación / Activación:</strong>
                                                        <a href="${d.activation_link}" target="_blank" style="color: var(--color-primary); margin-left: 6px;">${d.activation_link}</a>
                                                    </div>
                                                    <button type="button" class="btn-outline" style="padding: 4px 8px; font-size: 11px; flex-shrink: 0;" onclick="navigator.clipboard.writeText('${d.activation_link}'); showToast('Link copiado al portapapeles', 'info');">
                                                        <i class="fas fa-copy"></i> Copiar
                                                    </button>
                                                </div>
                                            ` : `
                                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; background: var(--bg-card); padding: 10px; border-radius: 6px; margin-bottom: 8px; font-size: 12.5px;">
                                                    <div><strong>Email:</strong> ${d.email || 'N/A'} <button type="button" style="background:none; border:none; color:var(--color-primary); cursor:pointer;" onclick="navigator.clipboard.writeText('${d.email}'); showToast('Email copiado', 'info');"><i class="fas fa-copy"></i></button></div>
                                                    <div><strong>Clave:</strong> <span style="font-family: monospace;">${d.password || 'N/A'}</span> <button type="button" style="background:none; border:none; color:var(--color-primary); cursor:pointer;" onclick="navigator.clipboard.writeText('${d.password}'); showToast('Clave copiada', 'info');"><i class="fas fa-copy"></i></button></div>
                                                    <div><strong>Perfil:</strong> <span style="color: var(--color-secondary); font-weight: 700;">${d.profile_name || 'N/A'}</span></div>
                                                    <div><strong>PIN:</strong> <span style="color: #f59e0b; font-weight: 800; letter-spacing: 1px;">${d.profile_pin || 'Sin PIN'}</span></div>
                                                </div>
                                            `)}

                                            ${d.usage_instructions ? `
                                                <div style="font-size: 11.5px; color: var(--text-secondary); background: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; padding: 6px 10px; border-radius: 4px; white-space: pre-line;">
                                                    <strong>Reglas entregadas al cliente:</strong> ${d.usage_instructions}
                                                </div>
                                            ` : ''}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : `
                            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 14px; text-align: center;">
                                <p style="color: #f59e0b; font-size: 13px; margin: 0 0 10px 0;">
                                    <i class="fas fa-exclamation-triangle"></i> Este pedido contiene productos de streaming pero aún no tiene cuenta asignada.
                                </p>
                                <button type="button" class="btn-primary" style="font-size: 12.5px; padding: 6px 14px;" onclick="handleAutoAssignOrderStreamingInModal(${order.id})">
                                    <i class="fas fa-magic"></i> Entregar Cuenta Automáticamente Ahora
                                </button>
                            </div>
                        `}
                    </div>
                `;
            })()}

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

    modal.style.display = 'flex';
    modal.classList.add('active');
};

window.saveOrderStatusCall = async (orderId) => {
    const status = document.getElementById('update-order-status-select').value;
    try {
        const res = await AdminService.updateOrderStatus(orderId, status);
        showToast(res.message || 'Estado del pedido actualizado.', 'success');
        if (res.streamingDelivery && res.streamingDelivery.assigned && res.streamingDelivery.assigned.length > 0) {
            showToast(`¡Se entregaron ${res.streamingDelivery.assigned.length} cuenta(s) streaming al cliente!`, 'success');
        }
        closeAdminModal();
        switchTab('orders');
    } catch (e) {
        showToast('Error al actualizar el pedido.', 'error');
    }
};

window.handleAutoAssignOrderStreamingInModal = async (orderId) => {
    try {
        const res = await AdminService.autoAssignOrderStreaming(orderId);
        if (res.assigned && res.assigned.length > 0) {
            showToast(`Se asignaron ${res.assigned.length} cuenta(s) streaming exitosamente.`, 'success');
        } else if (res.unfulfilled && res.unfulfilled.length > 0) {
            showToast(`Aviso: No hay cuentas libres con cupos para ${res.unfulfilled.map(u => u.platform).join(', ')}. Agrega más cuentas.`, 'warning');
        } else {
            showToast('No hay productos de streaming pendientes en este pedido.', 'info');
        }
        // Refrescar pedidos
        globalOrdersList = await AdminService.getOrders();
        openOrderDetailsModal(orderId);
    } catch (err) {
        showToast(err.message || 'Error al auto-asignar streaming.', 'error');
    }
};

window.handleUnassignStreamingFromOrder = async (assignmentId, orderId) => {
    if (!confirm('¿Seguro que deseas desvincular esta cuenta streaming del pedido? El cupo quedará libre para otro cliente.')) return;
    try {
        await AdminService.unassignStreamingUser(assignmentId);
        showToast('Asignación liberada.', 'success');
        globalOrdersList = await AdminService.getOrders();
        openOrderDetailsModal(orderId);
    } catch (err) {
        showToast(err.message || 'Error al liberar cupo.', 'error');
    }
};

// ==========================================
// 4. PESTAÑA: AJUSTAR MONEDAS VIRTUALES (SORTI)
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

    modal.style.display = 'flex';
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

async function renderSettingsTab(container, reloadFromApi = true) {
    if (reloadFromApi || !currentSettings || !currentSettings.bank_accounts) {
        currentSettings = await AdminService.getSettings();
    }

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
            description: 'Descubre hardware premium, licencias de software y cuentas streaming con entrega instantánea.',
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
                            <input type="color" id="set-primary-color" value="${branding.primary_color || '#6366f1'}" style="width: 44px; height: 44px; border: none; border-radius: 8px; cursor: pointer; background: none;" oninput="updateBrandingLivePreview()">
                            <span id="set-primary-color-text" style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">${branding.primary_color || '#6366f1'}</span>
                        </div>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label>Color de Acento</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="color" id="set-accent-color" value="${branding.accent_color || '#f59e0b'}" style="width: 44px; height: 44px; border: none; border-radius: 8px; cursor: pointer; background: none;" oninput="updateBrandingLivePreview()">
                            <span id="set-accent-color-text" style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">${branding.accent_color || '#f59e0b'}</span>
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
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
                    <h3 style="margin: 0;"><i class="fas fa-coins" style="color: var(--color-accent);"></i> Configuración de Moneda Sorti</h3>
                    <span style="background: rgba(245, 158, 11, 0.12); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.25); font-weight: 700; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                        <i class="fas fa-gem"></i> Fidelización y Recompensas
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                    <!-- 1. Ganancia por Compra -->
                    <div class="glass-panel" style="padding: 18px; border-left: 4px solid var(--color-accent);">
                        <label style="font-weight: 700; font-size: 13px; display: block; margin-bottom: 6px;">
                            <i class="fas fa-shopping-cart" style="color: var(--color-accent); margin-right: 6px;"></i>
                            Monedas ganadas por cada S/. 1.00 al comprar
                        </label>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="number" step="any" min="0" id="set-sorti-coins-per-sol" class="form-control" value="${currentSettings.sorti_coins_per_sol !== undefined ? currentSettings.sorti_coins_per_sol : '0.20'}" required style="font-size: 16px; font-weight: 700; text-align: center;" oninput="updateSortiConfigLivePreview()">
                            <span style="font-size: 12px; font-weight: 600; color: var(--text-muted); white-space: nowrap;">monedas / S/. 1.00</span>
                        </div>
                        <p style="font-size: 11px; color: var(--text-muted); margin-top: 8px; line-height: 1.4;">
                            <strong>Ejemplo:</strong> Si colocas <code>0.20</code>, por cada S/. 1.00 comprado el cliente gana 0.20 monedas (en una compra de S/. 100.00 gana 20.00 monedas).
                        </p>
                    </div>

                    <!-- 2. Valor de Canje -->
                    <div class="glass-panel" style="padding: 18px; border-left: 4px solid #10b981;">
                        <label style="font-weight: 700; font-size: 13px; display: block; margin-bottom: 6px;">
                            <i class="fas fa-tags" style="color: #10b981; margin-right: 6px;"></i>
                            Valor de 1 moneda al canjear (en Soles)
                        </label>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 14px; font-weight: 700; color: var(--text-secondary);">S/.</span>
                            <input type="number" step="any" min="0" id="set-sorti-coin-value" class="form-control" value="${currentSettings.sorti_coin_value !== undefined ? currentSettings.sorti_coin_value : '0.50'}" required style="font-size: 16px; font-weight: 700; text-align: center;" oninput="updateSortiConfigLivePreview()">
                            <span style="font-size: 12px; font-weight: 600; color: var(--text-muted); white-space: nowrap;">descuento / 1 moneda</span>
                        </div>
                        <p style="font-size: 11px; color: var(--text-muted); margin-top: 8px; line-height: 1.4;">
                            <strong>Ejemplo:</strong> Si colocas <code>0.50</code>, cada 1 moneda Sorti vale S/. 0.50 céntimos de descuento (canjear 20 monedas descontará S/. 10.00 en el checkout).
                        </p>
                    </div>
                </div>

                <!-- Simulación Dinámica en Vivo -->
                <div class="glass-panel" style="margin-top: 14px; padding: 14px 18px; background: rgba(99, 102, 241, 0.05); border: 1px dashed rgba(99, 102, 241, 0.3); border-radius: var(--radius-md); font-size: 12px; display: flex; flex-wrap: wrap; gap: 16px; align-items: center; justify-content: space-around;">
                    <div>
                        <span style="color: var(--text-muted);">Simulación Compra:</span>
                        <strong style="color: var(--text-primary); margin-left: 6px;">S/. 100.00</strong>
                        <span style="margin: 0 6px;">➔</span>
                        <span style="color: var(--color-accent); font-weight: 800;"><i class="fas fa-coins"></i> <span id="preview-sorti-earned">20.00</span> Monedas ganadas</span>
                    </div>
                    <div style="border-left: 1px solid var(--border-color); height: 20px; display: inline-block;"></div>
                    <div>
                        <span style="color: var(--text-muted);">Simulación Canje:</span>
                        <strong style="color: var(--color-accent); margin-left: 6px;"><i class="fas fa-coins"></i> 20 Monedas</strong>
                        <span style="margin: 0 6px;">➔</span>
                        <span style="color: #10b981; font-weight: 800;">- S/. <span id="preview-sorti-discount">10.00</span> de descuento</span>
                    </div>
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
                </div>
                <button type="button" class="btn-outline" onclick="addSettingBankRow()"><i class="fas fa-plus"></i> Añadir Cuenta</button>
            </div>

            <!-- Distritos de Entrega -->
            <div class="checkout-section" style="width: 100%;">
                <h3><i class="fas fa-truck" style="color: var(--color-primary);"></i> Cobertura de Delivery por Distritos</h3>
                <div id="settings-districts-rows" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
                </div>
                <button type="button" class="btn-outline" onclick="addSettingDistrictRow()"><i class="fas fa-plus"></i> Añadir Distrito</button>
            </div>

            <button type="submit" class="btn-primary" style="padding: 16px; font-size: 16px; font-weight: 700;">
                <i class="fas fa-save"></i> Guardar Todas las Configuraciones del Sistema
            </button>
        </form>
    `;

    // Renderizar filas de cuentas bancarias y distritos en el DOM
    if (window.renderSettingBankRowsUI) window.renderSettingBankRowsUI();
    if (window.renderSettingDistrictRowsUI) window.renderSettingDistrictRowsUI();

    document.getElementById('settings-admin-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (window.syncBankAccountsFromDOM) window.syncBankAccountsFromDOM();
        if (window.syncDistrictsFromDOM) window.syncDistrictsFromDOM();

        const coinsPerSol = Number(document.getElementById('set-sorti-coins-per-sol').value) || 0.20;
        const coinVal = Number(document.getElementById('set-sorti-coin-value').value) || 0.50;
        const equivalentRate = coinVal > 0 ? Number((1 / coinVal).toFixed(2)) : 2;

        const payload = {
            sorti_coins_per_sol: coinsPerSol,
            sorti_coin_value: coinVal,
            sorti_rate: equivalentRate,
            yape_qr: document.getElementById('set-yape-qr').value.trim(),
            bank_accounts: currentSettings.bank_accounts || [],
            delivery_districts: currentSettings.delivery_districts || [],
            home_banners: currentSettings.home_banners || [],
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
            if (window.applyDynamicBranding) {
                window.applyDynamicBranding(payload.site_branding);
            }
            switchTab('settings');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    if (window.updateSortiConfigLivePreview) {
        window.updateSortiConfigLivePreview();
    }
}

// Helper para vista previa en vivo del Branding y Colores
window.updateBrandingLivePreview = function() {
    const primaryInput = document.getElementById('set-primary-color');
    const accentInput = document.getElementById('set-accent-color');
    const siteNameInput = document.getElementById('set-site-name');

    if (primaryInput) {
        const textSpan = document.getElementById('set-primary-color-text');
        if (textSpan) textSpan.textContent = primaryInput.value;
    }
    if (accentInput) {
        const textSpan = document.getElementById('set-accent-color-text');
        if (textSpan) textSpan.textContent = accentInput.value;
    }

    if (window.applyDynamicBranding) {
        window.applyDynamicBranding({
            site_name: siteNameInput ? siteNameInput.value : undefined,
            primary_color: primaryInput ? primaryInput.value : undefined,
            accent_color: accentInput ? accentInput.value : undefined
        });
    }
};

// Helper para vista previa en vivo de la configuración de Moneda Sorti
window.updateSortiConfigLivePreview = function() {
    const coinsPerSolInput = document.getElementById('set-sorti-coins-per-sol');
    const coinValInput = document.getElementById('set-sorti-coin-value');
    if (!coinsPerSolInput || !coinValInput) return;
    const coinsPerSol = parseFloat(coinsPerSolInput.value) || 0;
    const coinValue = parseFloat(coinValInput.value) || 0;
    const pEarned = document.getElementById('preview-sorti-earned');
    const pDiscount = document.getElementById('preview-sorti-discount');
    if (pEarned) pEarned.textContent = (100 * coinsPerSol).toFixed(2);
    if (pDiscount) pDiscount.textContent = (20 * coinValue).toFixed(2);
};

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
    renderSettingsTab(document.getElementById('admin-tab-content'), false);
};

window.removeBannerSlideRow = (idx) => {
    currentSettings.home_banners.splice(idx, 1);
    renderSettingsTab(document.getElementById('admin-tab-content'), false);
};

window.moveBannerSlide = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= currentSettings.home_banners.length) return;
    
    // Intercambiar
    const temp = currentSettings.home_banners[idx];
    currentSettings.home_banners[idx] = currentSettings.home_banners[targetIdx];
    currentSettings.home_banners[targetIdx] = temp;
    
    renderSettingsTab(document.getElementById('admin-tab-content'), false);
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

// ==========================================
// HELPERS PARA EDICIÓN REACTIVA DE CUENTAS BANCARIAS Y DISTRITOS
// ==========================================
window.syncBankAccountsFromDOM = () => {
    const bankContainer = document.getElementById('settings-bank-accounts-rows');
    if (!bankContainer) return;
    const rowEls = bankContainer.querySelectorAll('[data-bank-row-idx]');
    const banks = [];
    rowEls.forEach((row) => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 4) {
            banks.push({
                bank: inputs[0].value.trim(),
                account: inputs[1].value.trim(),
                CCI: inputs[2].value.trim(),
                owner: inputs[3].value.trim()
            });
        }
    });
    currentSettings.bank_accounts = banks;
};

window.renderSettingBankRowsUI = () => {
    const container = document.getElementById('settings-bank-accounts-rows');
    if (!container) return;
    const accounts = currentSettings.bank_accounts || [];
    if (accounts.length === 0) {
        container.innerHTML = `
            <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 13px; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
                <i class="fas fa-info-circle"></i> No hay cuentas bancarias registradas. Haz clic en "Añadir Cuenta" para agregar una.
            </div>
        `;
        return;
    }
    container.innerHTML = accounts.map((b, idx) => `
        <div class="glass-panel" style="padding: 16px; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto; gap: 10px; align-items: center;" data-bank-row-idx="${idx}">
            <input type="text" class="form-control" value="${(b.bank || '').replace(/"/g, '&quot;')}" placeholder="Banco (ej: BCP)" oninput="updateSettingBankValue(${idx}, 'bank', this.value)">
            <input type="text" class="form-control" value="${(b.account || '').replace(/"/g, '&quot;')}" placeholder="Nro Cuenta" oninput="updateSettingBankValue(${idx}, 'account', this.value)">
            <input type="text" class="form-control" value="${(b.CCI || '').replace(/"/g, '&quot;')}" placeholder="Nro CCI" oninput="updateSettingBankValue(${idx}, 'CCI', this.value)">
            <input type="text" class="form-control" value="${(b.owner || '').replace(/"/g, '&quot;')}" placeholder="Titular" oninput="updateSettingBankValue(${idx}, 'owner', this.value)">
            <button type="button" style="color: var(--danger); border:none; background:none; cursor: pointer; padding: 8px 12px; font-size: 16px;" title="Eliminar cuenta bancaria" onclick="removeSettingBankRow(${idx})"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
};

window.updateSettingBankValue = (idx, field, value) => {
    if (currentSettings.bank_accounts && currentSettings.bank_accounts[idx]) {
        currentSettings.bank_accounts[idx][field] = value;
    }
};

window.addSettingBankRow = () => {
    window.syncBankAccountsFromDOM();
    if (!currentSettings.bank_accounts) currentSettings.bank_accounts = [];
    currentSettings.bank_accounts.push({ bank: '', account: '', CCI: '', owner: '' });
    window.renderSettingBankRowsUI();
};

window.removeSettingBankRow = (idx) => {
    window.syncBankAccountsFromDOM();
    if (currentSettings.bank_accounts && currentSettings.bank_accounts.length > idx) {
        currentSettings.bank_accounts.splice(idx, 1);
    }
    window.renderSettingBankRowsUI();
};

window.syncDistrictsFromDOM = () => {
    const distContainer = document.getElementById('settings-districts-rows');
    if (!distContainer) return;
    const rowEls = distContainer.querySelectorAll('[data-district-row-idx]');
    const dists = [];
    rowEls.forEach((row) => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 3) {
            dists.push({
                name: inputs[0].value.trim(),
                cost: parseFloat(inputs[1].value) || 0,
                time: inputs[2].value.trim()
            });
        }
    });
    currentSettings.delivery_districts = dists;
};

window.renderSettingDistrictRowsUI = () => {
    const container = document.getElementById('settings-districts-rows');
    if (!container) return;
    const districts = currentSettings.delivery_districts || [];
    if (districts.length === 0) {
        container.innerHTML = `
            <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 13px; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
                <i class="fas fa-info-circle"></i> No hay distritos de cobertura registrados. Haz clic en "Añadir Distrito" para agregar uno.
            </div>
        `;
        return;
    }
    container.innerHTML = districts.map((d, idx) => `
        <div class="glass-panel" style="padding: 16px; display: grid; grid-template-columns: 2fr 1fr 1.5fr auto; gap: 10px; align-items: center;" data-district-row-idx="${idx}">
            <input type="text" class="form-control" value="${(d.name || '').replace(/"/g, '&quot;')}" placeholder="Distrito (ej: Miraflores)" oninput="updateSettingDistrictValue(${idx}, 'name', this.value)">
            <input type="number" step="0.01" class="form-control" value="${d.cost !== undefined ? d.cost : ''}" placeholder="Costo Envío (S/.)" oninput="updateSettingDistrictValue(${idx}, 'cost', this.value)">
            <input type="text" class="form-control" value="${(d.time || '').replace(/"/g, '&quot;')}" placeholder="Tiempo Estimado (ej: 24-48 horas)" oninput="updateSettingDistrictValue(${idx}, 'time', this.value)">
            <button type="button" style="color: var(--danger); border:none; background:none; cursor: pointer; padding: 8px 12px; font-size: 16px;" title="Eliminar distrito" onclick="removeSettingDistrictRow(${idx})"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
};

window.updateSettingDistrictValue = (idx, field, value) => {
    if (currentSettings.delivery_districts && currentSettings.delivery_districts[idx]) {
        if (field === 'cost') {
            currentSettings.delivery_districts[idx][field] = Number(value);
        } else {
            currentSettings.delivery_districts[idx][field] = value;
        }
    }
};

window.addSettingDistrictRow = () => {
    window.syncDistrictsFromDOM();
    if (!currentSettings.delivery_districts) currentSettings.delivery_districts = [];
    currentSettings.delivery_districts.push({ name: '', cost: 0.00, time: '' });
    window.renderSettingDistrictRowsUI();
};

window.removeSettingDistrictRow = (idx) => {
    window.syncDistrictsFromDOM();
    if (currentSettings.delivery_districts && currentSettings.delivery_districts.length > idx) {
        currentSettings.delivery_districts.splice(idx, 1);
    }
    window.renderSettingDistrictRowsUI();
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
                                <button class="action-btn" style="color: var(--danger); border: none; background: none; cursor: pointer; padding: 6px 10px;" onclick="deleteCategoryCall(${cat.id}, '${cat.name.replace(/'/g, "\\'")}', false)" title="Eliminar Categoría y todas sus subcategorías">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                            
                            <!-- Subcategorías -->
                            ${cat.subcategories && cat.subcategories.length > 0 ? `
                                <div style="margin-top: 12px; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; border-left: 1px dashed var(--border-color);">
                                    ${cat.subcategories.map(sub => `
                                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                                            <span><i class="fas fa-tag" style="font-size: 10px; color: var(--text-muted);"></i> ${sub.name} <span style="font-size: 10px; color: var(--text-muted);">(Slug: ${sub.slug})</span></span>
                                            <button style="color: var(--danger); border: none; background: none; cursor: pointer; font-size: 11px; padding: 4px 8px;" onclick="deleteCategoryCall(${sub.id}, '${sub.name.replace(/'/g, "\\'")}', true)" title="Eliminar Subcategoría">
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

// Window handler para borrar categorías y subcategorías
window.deleteCategoryCall = (id, name = '', isSub = false) => {
    const modal = document.getElementById('admin-details-modal');
    const modalContent = document.getElementById('admin-modal-content-area');
    
    if (!modal || !modalContent) return;

    const labelType = isSub ? 'Subcategoría' : 'Categoría Principal';
    const subNotice = !isSub ? '<br><span style="color: var(--danger); font-size: 12px; font-weight: 600;">⚠️ Al eliminar una categoría principal, también se borrarán todas sus subcategorías.</span>' : '';

    modalContent.innerHTML = `
        <div class="admin-modal-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="color: var(--danger); font-weight: 700; margin: 0;"><i class="fas fa-exclamation-triangle"></i> Confirmar Eliminación</h3>
            <button onclick="closeAdminModal()" style="font-size: 20px; border:none; background:none; color: var(--text-muted); cursor:pointer;"><i class="fas fa-times"></i></button>
        </div>
        <div class="admin-modal-body" style="padding: 24px 0; text-align: center;">
            <div style="font-size: 52px; color: var(--danger); margin-bottom: 16px;">
                <i class="fas fa-folder-minus"></i>
            </div>
            <p style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">¿Estás seguro de eliminar esta ${labelType.toLowerCase()}?</p>
            <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px; line-height: 1.5;">
                <strong style="color: var(--text-main);">${name || `#${id}`}</strong> (${labelType})
                ${subNotice}
            </p>
        </div>
        <div class="admin-modal-footer" style="display: flex; justify-content: center; gap: 16px; border-top: 1px solid var(--border-color); padding-top: 16px;">
            <button type="button" class="btn-outline" style="padding: 8px 20px; font-size: 14px;" onclick="closeAdminModal()">Cancelar</button>
            <button type="button" class="btn-primary" style="background: var(--danger); border-color: var(--danger); padding: 8px 20px; font-size: 14px;" onclick="executeDeleteCategory(${id})">
                <i class="fas fa-trash"></i> Sí, Eliminar ${labelType}
            </button>
        </div>
    `;
    
    modal.style.display = 'flex';
    modal.classList.add('active');
};

window.executeDeleteCategory = async (id) => {
    try {
        window.closeAdminModal();
        await AdminService.deleteCategory(id);
        showToast('Categoría/Subcategoría eliminada con éxito.', 'info');
        const contentArea = document.getElementById('admin-tab-content');
        await renderCategoriesTab(contentArea);
    } catch (e) {
        showToast(e.message || 'Error al eliminar la categoría.', 'error');
    }
};

// ==========================================
// UTILIDADES DE PROCESAMIENTO Y COMPRESIÓN DE IMÁGENES
// ==========================================
function compressImageFile(file, maxWidth = 900, quality = 0.82) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            return reject(new Error('El archivo seleccionado no es una imagen válida.'));
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const base64 = canvas.toDataURL('image/jpeg', quality);
                resolve(base64);
            };
            img.onerror = () => reject(new Error('Error al procesar la imagen.'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo.'));
        reader.readAsDataURL(file);
    });
}

// 1. Manejo de Imagen de Portada del Producto
window.handleProductCoverUpload = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    try {
        showToast('Procesando imagen de portada...', 'info');
        const base64 = await compressImageFile(file, 1000, 0.85);
        window.currentProductCover = base64;
        
        const preview = document.getElementById('cover-preview-box');
        if (preview) {
            preview.style.backgroundImage = `url('${base64}')`;
            preview.innerHTML = '';
        }
        const removeBtn = document.getElementById('remove-cover-btn');
        if (removeBtn) removeBtn.style.display = 'inline-flex';

        const urlInput = document.getElementById('prod-cover-url');
        if (urlInput) urlInput.value = '';

        showToast('Imagen de portada cargada con éxito.', 'success');
    } catch (e) {
        showToast(e.message || 'Error al cargar la portada.', 'error');
    }
};

window.toggleCoverUrlInput = () => {
    const container = document.getElementById('cover-url-input-container');
    const toggleText = document.getElementById('cover-url-toggle-text');
    if (!container) return;
    if (container.style.display === 'none') {
        container.style.display = 'block';
        if (toggleText) toggleText.textContent = 'Ocultar URL';
    } else {
        container.style.display = 'none';
        if (toggleText) toggleText.textContent = 'Ingresar URL';
    }
};

window.updateCoverFromUrl = (val) => {
    const trimmed = (val || '').trim();
    window.currentProductCover = trimmed;
    const preview = document.getElementById('cover-preview-box');
    const removeBtn = document.getElementById('remove-cover-btn');
    if (preview) {
        if (trimmed) {
            preview.style.backgroundImage = `url('${trimmed}')`;
            preview.innerHTML = '';
        } else {
            preview.style.backgroundImage = 'none';
            preview.innerHTML = '<i class="fas fa-camera" style="font-size: 32px; color: var(--text-muted);"></i>';
        }
    }
    if (removeBtn) {
        removeBtn.style.display = trimmed ? 'inline-flex' : 'none';
    }
};

window.removeProductCover = () => {
    window.currentProductCover = '';
    const preview = document.getElementById('cover-preview-box');
    const urlInput = document.getElementById('prod-cover-url');
    const fileInput = document.getElementById('prod-cover-file-input');
    const removeBtn = document.getElementById('remove-cover-btn');

    if (preview) {
        preview.style.backgroundImage = 'none';
        preview.innerHTML = '<i class="fas fa-camera" style="font-size: 32px; color: var(--text-muted);"></i>';
    }
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';
    if (removeBtn) removeBtn.style.display = 'none';
    showToast('Portada removida.', 'info');
};

// 2. Manejo de Galería de Imágenes Adicionales
window.handleFilesForGallery = async (files) => {
    if (!files || files.length === 0) return;
    showToast(`Cargando ${files.length} foto(s) a la galería...`, 'info');
    let loadedCount = 0;

    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        try {
            const base64 = await compressImageFile(file, 900, 0.82);
            window.currentProductGallery.push({ media_url: base64, is_video: 0 });
            loadedCount++;
        } catch (err) {
            console.error('Error al procesar imagen de galería:', err);
        }
    }

    window.renderProductGalleryGrid();
    if (loadedCount > 0) {
        showToast(`${loadedCount} imagen(es) agregada(s) a la galería.`, 'success');
    }
};

window.handleGalleryMultipleUpload = async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
        await window.handleFilesForGallery(Array.from(files));
        event.target.value = '';
    }
};

window.renderProductGalleryGrid = () => {
    const container = document.getElementById('product-gallery-grid-container');
    if (!container) return;

    if (!Array.isArray(window.currentProductGallery)) {
        window.currentProductGallery = [];
    }

    if (window.currentProductGallery.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 12px; color: var(--text-muted); font-size: 12px; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
                No hay fotos adicionales en la galería aún. Sube fotos desde tu PC con el botón superior o arrástralas aquí.
            </div>
        `;
        return;
    }

    container.innerHTML = window.currentProductGallery.map((item, idx) => {
        const isBase64 = item.media_url && item.media_url.startsWith('data:image/');
        const badge = isBase64 ? 'Archivo local' : 'URL';
        return `
            <div class="gallery-card animate-fade-in">
                <div class="gallery-thumb" style="background-image: url('${item.media_url || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100'}');"></div>
                <div class="gallery-actions">
                    <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">#${idx + 1} (${badge})</span>
                    <button type="button" class="action-btn" style="color: var(--danger); padding: 4px;" onclick="removeGalleryItem(${idx})" title="Eliminar foto">
                        <i class="fas fa-trash-alt" style="font-size: 11px;"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
};

window.addGalleryUrlRow = () => {
    const url = prompt('Ingrese la dirección URL de la imagen (ej: https://...):');
    if (url && url.trim() !== '') {
        window.currentProductGallery.push({ media_url: url.trim(), is_video: 0 });
        window.renderProductGalleryGrid();
        showToast('Imagen agregada a la galería.', 'success');
    }
};

window.removeGalleryItem = (idx) => {
    window.currentProductGallery.splice(idx, 1);
    window.renderProductGalleryGrid();
    showToast('Foto eliminada de la galería.', 'info');
};

window.insertDescriptionTag = (tag) => {
    const textarea = document.getElementById('prod-desc');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after  = text.substring(end, text.length);
    
    if (tag === '**bold**') {
        const selection = text.substring(start, end) || 'texto';
        textarea.value = before + '**' + selection + '**' + after;
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = start + 2 + selection.length;
    } else if (tag === '• ') {
        const newline = before.endsWith('\n') || before === '' ? '' : '\n';
        textarea.value = before + newline + '• ' + after;
        textarea.selectionStart = start + newline.length + 2;
        textarea.selectionEnd = start + newline.length + 2;
    }
    textarea.focus();
};

window.renderProductFeaturesRows = () => {
    const container = document.getElementById('product-features-rows-container');
    if (!container) return;

    if (!Array.isArray(window.currentProductFeatures)) {
        window.currentProductFeatures = [];
    }

    if (window.currentProductFeatures.length === 0) {
        container.innerHTML = `<p style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 10px 0; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">No se han agregado especificaciones a este producto.</p>`;
        return;
    }

    container.innerHTML = window.currentProductFeatures.map((feat, idx) => `
        <div style="display: grid; grid-template-columns: 1fr 1.5fr auto; gap: 10px; align-items: center;">
            <input type="text" class="form-control" placeholder="ej: Color, Dimensiones" value="${feat.name || ''}" oninput="updateProductFeatureField(${idx}, 'name', this.value)" style="padding: 8px 12px;">
            <input type="text" class="form-control" placeholder="ej: Azul Metálico, 15x10 cm" value="${feat.value || ''}" oninput="updateProductFeatureField(${idx}, 'value', this.value)" style="padding: 8px 12px;">
            <button type="button" class="action-btn" style="color: var(--danger); padding: 8px;" onclick="removeProductFeatureRow(${idx})"><i class="fas fa-trash-alt"></i></button>
        </div>
    `).join('');
};

window.updateProductFeatureField = (idx, field, value) => {
    if (!window.currentProductFeatures[idx]) window.currentProductFeatures[idx] = { name: '', value: '' };
    window.currentProductFeatures[idx][field] = value;
};

window.addProductFeatureRow = () => {
    window.currentProductFeatures.push({ name: '', value: '' });
    window.renderProductFeaturesRows();
};

window.removeProductFeatureRow = (idx) => {
    window.currentProductFeatures.splice(idx, 1);
    window.renderProductFeaturesRows();
};

// ==========================================
// MÓDULO DE ADMINISTRACIÓN VIP
// ==========================================

AdminState.vipResourceSubTab = 'raffles';

// 1. Pestaña: Gestión de Usuarios y Clientes VIP (CRUD Completo)
async function renderVipUsersTab(container) {
    container.innerHTML = `
        <div class="glass-panel" style="padding: 20px 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
                <h3 style="margin: 0; font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-users-cog" style="color: var(--color-primary);"></i> Gestión de Usuarios y Clientes
                </h3>
                <p style="color: var(--text-secondary); font-size: 13.5px; margin: 4px 0 0 0;">
                    Administra cuentas de clientes, empleados y administradores. Crea, edita información, contraseñas, monedas Sorti y estado VIP.
                </p>
            </div>
            <button class="btn-primary" onclick="openUserModal()" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px;">
                <i class="fas fa-user-plus"></i> Nuevo Usuario
            </button>
        </div>

        <!-- Filtros y Búsqueda -->
        <div class="glass-panel" style="padding: 16px 20px; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 14px; align-items: center;">
            <div style="flex: 1; min-width: 220px; position: relative;">
                <i class="fas fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
                <input type="text" id="admin-user-search" class="form-control" placeholder="Buscar por nombre o correo..." style="padding-left: 38px;" onkeyup="filterAdminUsersTable()">
            </div>
            <div style="min-width: 160px;">
                <select id="admin-user-role-filter" class="form-control" onchange="filterAdminUsersTable()">
                    <option value="">Todos los roles</option>
                    <option value="client">Solo Clientes</option>
                    <option value="employee">Solo Empleados</option>
                    <option value="admin">Solo Administradores</option>
                </select>
            </div>
            <div style="min-width: 160px;">
                <select id="admin-user-vip-filter" class="form-control" onchange="filterAdminUsersTable()">
                    <option value="">Todos los estados</option>
                    <option value="vip">Solo Miembros VIP</option>
                    <option value="standard">Solo Estándar</option>
                </select>
            </div>
            <div>
                <span id="admin-users-count" style="font-size: 12.5px; color: var(--text-muted); font-weight: 600;"></span>
            </div>
        </div>

        <div class="glass-panel" style="padding: 0; overflow-x: auto;">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th style="width: 50px;">ID</th>
                        <th>Nombre y Correo</th>
                        <th>Rol</th>
                        <th>¿Es VIP?</th>
                        <th>Monedas VIP</th>
                        <th>Monedas Sorti</th>
                        <th>Última Renovación</th>
                        <th style="text-align: right; min-width: 180px;">Acciones</th>
                    </tr>
                </thead>
                <tbody id="admin-vip-users-table-body">
                    <tr><td colspan="8" style="text-align: center; padding: 30px;">Cargando usuarios...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    try {
        const users = await AdminService.getUsers();
        window._cachedAdminUsers = users || [];
        renderAdminUsersRows(window._cachedAdminUsers);
    } catch (e) {
        showToast('Error al cargar usuarios: ' + e.message, 'error');
    }
}

function renderAdminUsersRows(users) {
    const tbody = document.getElementById('admin-vip-users-table-body');
    const countEl = document.getElementById('admin-users-count');
    if (!tbody) return;

    if (countEl) countEl.textContent = `${users.length} usuarios encontrados`;

    if (!users || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 14px;">No se encontraron usuarios con los filtros seleccionados.</td></tr>`;
        return;
    }

    const roleBadges = {
        admin: '<span class="badge" style="background: rgba(147, 51, 234, 0.15); color: #9333ea; border: 1px solid rgba(147, 51, 234, 0.3); font-weight: 700;">Admin</span>',
        employee: '<span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); font-weight: 700;">Empleado</span>',
        client: '<span class="badge" style="background: rgba(100, 116, 139, 0.15); color: #64748b; font-weight: 600;">Cliente</span>'
    };

    tbody.innerHTML = users.map(user => {
        const isVip = !!user.is_vip;
        const lastRenovation = user.vip_last_renovation ? new Date(user.vip_last_renovation).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '<span style="color: var(--text-muted);">N/A</span>';
        const roleBadge = roleBadges[user.role] || roleBadges.client;
        const safeName = (user.name || '').replace(/'/g, "\\'");

        return `
            <tr>
                <td style="font-weight: 700; color: var(--text-muted);">${user.id}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px;">
                            ${(user.name || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: 700; font-size: 14px;">${user.name || 'Sin nombre'}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td>${roleBadge}</td>
                <td>
                    <span class="badge" style="${isVip ? 'background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 700;' : 'background: rgba(148, 163, 184, 0.12); color: var(--text-muted);'}">
                        ${isVip ? '👑 VIP' : 'Estándar'}
                    </span>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <input type="number" id="vip-coins-input-${user.id}" value="${user.vip_coins || 0}" min="0" class="form-control" style="width: 65px; padding: 4px 6px; font-size: 12.5px; text-align: center;" ${!isVip ? 'disabled' : ''}>
                        ${isVip ? `<button class="action-btn" onclick="saveVipCoins(${user.id})" title="Guardar Monedas VIP" style="color: var(--success); width: 28px; height: 28px; padding: 0;"><i class="fas fa-save" style="font-size: 12px;"></i></button>` : ''}
                    </div>
                </td>
                <td>
                    <span style="font-weight: 700; color: var(--color-accent); font-size: 13px; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="fas fa-coins"></i> ${Number(user.sorti_balance || 0).toFixed(2)}
                    </span>
                </td>
                <td style="font-size: 12px;">${lastRenovation}</td>
                <td style="text-align: right;">
                    <div style="display: inline-flex; align-items: center; gap: 6px; justify-content: flex-end;">
                        <button type="button" class="btn-icon" style="padding: 6px 10px; font-size: 12px; background: rgba(99,102,241,0.1); color: var(--color-primary); border-radius: 6px;" title="Editar usuario" onclick="openUserModal(${user.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button type="button" class="btn-icon" style="padding: 6px 10px; font-size: 12px; background: ${isVip ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'}; color: ${isVip ? '#ef4444' : '#f59e0b'}; border-radius: 6px;" title="${isVip ? 'Desactivar VIP' : 'Activar VIP'}" onclick="toggleVipStatus(${user.id}, ${isVip ? 0 : 1})">
                            <i class="fas ${isVip ? 'fa-user-slash' : 'fa-crown'}"></i> ${isVip ? 'Desactivar' : 'Activar'}
                        </button>
                        <button type="button" class="btn-icon" style="padding: 6px 8px; font-size: 12px; color: #ef4444; border-radius: 6px;" title="Eliminar usuario" onclick="deleteUserCall(${user.id}, '${safeName}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.filterAdminUsersTable = () => {
    const q = (document.getElementById('admin-user-search')?.value || '').toLowerCase().trim();
    const role = document.getElementById('admin-user-role-filter')?.value || '';
    const vip = document.getElementById('admin-user-vip-filter')?.value || '';

    const allUsers = window._cachedAdminUsers || [];
    const filtered = allUsers.filter(u => {
        const matchQ = !q || (u.name && u.name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q));
        const matchRole = !role || u.role === role;
        const matchVip = !vip || (vip === 'vip' ? !!u.is_vip : !u.is_vip);
        return matchQ && matchRole && matchVip;
    });

    renderAdminUsersRows(filtered);
};

// ==========================================
// MODAL: CREAR Y EDITAR USUARIO
// ==========================================
window.openUserModal = (userId = null) => {
    const allUsers = window._cachedAdminUsers || [];
    const user = userId ? allUsers.find(u => u.id === userId) : null;

    const html = `
        <div style="padding: 24px; max-width: 520px; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                <h3 style="font-size: 18px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 8px;">
                    <i class="fas ${user ? 'fa-user-edit' : 'fa-user-plus'}" style="color: var(--color-primary);"></i>
                    ${user ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </h3>
                <button class="btn-icon" onclick="closeAdminModalModal()"><i class="fas fa-times"></i></button>
            </div>
            <form onsubmit="handleSaveUser(event, ${user ? user.id : 'null'})">
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">Nombre Completo *</label>
                    <input type="text" id="usr-name" class="form-control" required value="${user ? user.name : ''}" placeholder="ej: Juan Pérez">
                </div>
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">Correo Electrónico *</label>
                    <input type="email" id="usr-email" class="form-control" required value="${user ? user.email : ''}" placeholder="correo@ejemplo.com">
                </div>
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">
                        Contraseña ${user ? '<span style="color: var(--text-muted); font-weight: normal;">(dejar en blanco para no cambiarla)</span>' : '*'}
                    </label>
                    <input type="password" id="usr-password" class="form-control" ${user ? '' : 'required'} placeholder="${user ? '••••••••' : 'Mínimo 6 caracteres'}">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                    <div class="form-group">
                        <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">Rol del Sistema</label>
                        <select id="usr-role" class="form-control">
                            <option value="client" ${user && user.role === 'client' ? 'selected' : ''}>Cliente</option>
                            <option value="employee" ${user && user.role === 'employee' ? 'selected' : ''}>Empleado / Soporte</option>
                            <option value="admin" ${user && user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">Saldo Monedas Sorti</label>
                        <input type="number" step="any" min="0" id="usr-sorti-balance" class="form-control" value="${user ? (Number(user.sorti_balance) || 0) : 50}">
                    </div>
                </div>
                <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px; padding: 14px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <label style="font-size: 13px; font-weight: 700; color: var(--color-accent); cursor: pointer; display: flex; align-items: center; gap: 8px; margin: 0;">
                            <input type="checkbox" id="usr-is-vip" ${user && user.is_vip ? 'checked' : ''} onchange="document.getElementById('usr-vip-coins-container').style.display = this.checked ? 'block' : 'none'">
                            <i class="fas fa-crown"></i> Membresía VIP Activa
                        </label>
                    </div>
                    <div id="usr-vip-coins-container" style="display: ${user && user.is_vip ? 'block' : 'none'}; margin-top: 10px;">
                        <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 4px;">Monedas VIP Asignadas</label>
                        <input type="number" min="0" id="usr-vip-coins" class="form-control" value="${user ? (user.vip_coins || 0) : 5}" style="max-width: 140px;">
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button type="button" class="btn-outline" onclick="closeAdminModalModal()">Cancelar</button>
                    <button type="submit" class="btn-primary"><i class="fas fa-save"></i> ${user ? 'Guardar Cambios' : 'Crear Usuario'}</button>
                </div>
            </form>
        </div>
    `;

    openAdminModalModal(html);
};

window.handleSaveUser = async (e, userId) => {
    e.preventDefault();
    const name = document.getElementById('usr-name').value.trim();
    const email = document.getElementById('usr-email').value.trim();
    const password = document.getElementById('usr-password').value;
    const role = document.getElementById('usr-role').value;
    const sorti_balance = Number(document.getElementById('usr-sorti-balance').value) || 0;
    const is_vip = document.getElementById('usr-is-vip').checked ? 1 : 0;
    const vip_coins = is_vip ? (Number(document.getElementById('usr-vip-coins').value) || 0) : 0;

    const payload = {
        name,
        email,
        role,
        sorti_balance,
        is_vip,
        vip_coins
    };

    if (password && password.trim().length > 0) {
        payload.password = password.trim();
    }

    try {
        if (userId) {
            await AdminService.updateUser(userId, payload);
            showToast('Usuario actualizado con éxito.', 'success');
        } else {
            if (!password || password.trim().length === 0) {
                showToast('La contraseña es obligatoria para nuevos usuarios.', 'error');
                return;
            }
            await AdminService.createUser(payload);
            showToast('Usuario creado con éxito.', 'success');
        }
        closeAdminModalModal();
        switchTab('vip_users');
    } catch (err) {
        showToast(err.message || 'Error al guardar usuario.', 'error');
    }
};

window.deleteUserCall = async (userId, userName) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario "${userName}" (ID: ${userId})?\n\nEsta acción eliminará su cuenta, billetera y accesos.`)) {
        return;
    }
    try {
        const res = await AdminService.deleteUser(userId);
        showToast(res.message || 'Usuario eliminado con éxito.', 'success');
        switchTab('vip_users');
    } catch (e) {
        showToast(e.message || 'Error al eliminar usuario.', 'error');
    }
};

window.toggleVipStatus = async (userId, newStatus) => {
    try {
        const res = await AdminService.toggleVipStatus(userId, newStatus);
        showToast(res.message, 'success');
        switchTab('vip_users');
    } catch (e) {
        showToast(e.message || 'Error al cambiar estado VIP.', 'error');
    }
};

window.saveVipCoins = async (userId) => {
    const input = document.getElementById(`vip-coins-input-${userId}`);
    if (!input) return;
    const coins = Number(input.value);
    try {
        const res = await AdminService.adjustVipCoins(userId, coins);
        showToast(res.message, 'success');
        switchTab('vip_users');
    } catch (e) {
        showToast(e.message || 'Error al ajustar monedas.', 'error');
    }
};


// 2. Pestaña: Gestión de Recursos VIP (Sorteos, Proveedores, Regalos)
async function renderVipResourcesTab(container) {
    container.innerHTML = `
        <div class="glass-panel" style="padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
                <h3>Administración de Recursos VIP</h3>
                <p style="color: var(--text-secondary); font-size: 13px; margin-top: 4px;">Crea y edita sorteos, proveedores locales de Lima y regalos/cuentas streaming para los clientes VIP.</p>
            </div>
            <div>
                <button class="btn-primary" onclick="openVipResourceCreateModal()" style="display: inline-flex; align-items: center; gap: 8px;">
                    <i class="fas fa-plus"></i> Crear Nuevo Registro
                </button>
            </div>
        </div>

        <!-- Pestañas internas de Recursos -->
        <div class="vip-tabs" style="margin-bottom: 24px;">
            <button class="vip-tab-btn ${AdminState.vipResourceSubTab === 'raffles' ? 'active' : ''}" onclick="switchVipResourceSubTab('raffles')">
                <i class="fas fa-ticket-alt"></i> Sorteos de Premios
            </button>
            <button class="vip-tab-btn ${AdminState.vipResourceSubTab === 'suppliers' ? 'active' : ''}" onclick="switchVipResourceSubTab('suppliers')">
                <i class="fas fa-truck-loading"></i> Proveedores de Lima
            </button>
            <button class="vip-tab-btn ${AdminState.vipResourceSubTab === 'gifts' ? 'active' : ''}" onclick="switchVipResourceSubTab('gifts')">
                <i class="fas fa-gift"></i> Cuentas y Códigos Regalo
            </button>
        </div>

        <div id="admin-vip-resources-list-area" class="glass-panel" style="padding: 0; overflow-x: auto;">
            <!-- Renderizado dinámico de la lista -->
        </div>
    `;

    renderVipResourcesSubTabContent();
}

window.switchVipResourceSubTab = (subTab) => {
    AdminState.vipResourceSubTab = subTab;
    const btns = document.querySelectorAll('.vip-tab-btn');
    btns.forEach(btn => btn.classList.remove('active'));

    const targetIdx = subTab === 'raffles' ? 0 : subTab === 'suppliers' ? 1 : 2;
    if (btns[targetIdx]) btns[targetIdx].classList.add('active');

    renderVipResourcesSubTabContent();
};

async function renderVipResourcesSubTabContent() {
    const listArea = document.getElementById('admin-vip-resources-list-area');
    if (!listArea) return;

    listArea.innerHTML = `<div style="text-align: center; padding: 24px;">Cargando recursos...</div>`;

    try {
        if (AdminState.vipResourceSubTab === 'raffles') {
            const raffles = await VipService.getRaffles();
            if (raffles.length === 0) {
                listArea.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--text-muted);">No hay sorteos registrados.</div>`;
                return;
            }

            listArea.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Imagen</th>
                            <th>Título</th>
                            <th>Costo (Monedas)</th>
                            <th>Fecha Sorteo</th>
                            <th>Estado</th>
                            <th>Ganador</th>
                            <th>Participantes</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${raffles.map(raffle => {
                            const date = new Date(raffle.draw_date).toLocaleDateString();
                            const isActive = raffle.status === 'active';
                            return `
                                <tr>
                                    <td><img src="${raffle.image_url || ''}" style="width: 50px; height: 35px; object-fit: cover; border-radius: 4px;"></td>
                                    <td style="font-weight: 600;">${raffle.title}</td>
                                    <td><i class="fas fa-coins" style="color: var(--color-accent);"></i> ${raffle.coin_cost} VIP</td>
                                    <td>${date}</td>
                                    <td>
                                        <span class="badge ${isActive ? 'badge-featured' : 'badge-sold-out'}">
                                            ${isActive ? 'Activo' : 'Finalizado'}
                                        </span>
                                    </td>
                                    <td style="font-weight: bold; color: var(--color-secondary);">${raffle.winner_name || (isActive ? '-' : 'Ninguno')}</td>
                                    <td>${raffle.total_tickets} boletos</td>
                                    <td>
                                        <div style="display: flex; gap: 8px;">
                                            ${isActive ? `<button class="btn-primary" onclick="drawVipRaffle(${raffle.id})" style="padding: 4px 8px; font-size: 11px;"><i class="fas fa-trophy"></i> Sortear</button>` : ''}
                                            <button class="action-btn" onclick="editVipRaffleModal(${JSON.stringify(raffle).replace(/"/g, '&quot;')})" title="Editar"><i class="fas fa-edit"></i></button>
                                            <button class="action-btn" onclick="deleteVipRaffle(${raffle.id})" title="Eliminar" style="color: var(--danger);"><i class="fas fa-trash-alt"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;

        } else if (AdminState.vipResourceSubTab === 'suppliers') {
            const suppliers = await VipService.getSuppliers();
            if (suppliers.length === 0) {
                listArea.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--text-muted);">No hay proveedores registrados.</div>`;
                return;
            }

            listArea.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Teléfono</th>
                            <th>Dirección</th>
                            <th>Productos que ofrece</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${suppliers.map(sup => `
                            <tr>
                                <td style="font-weight: 600;">${sup.name}</td>
                                <td><a href="tel:${sup.phone}">${sup.phone || '-'}</a></td>
                                <td style="font-size: 13px;">${sup.address || '-'}</td>
                                <td>
                                    ${sup.courses ? sup.courses.split(',').map(tag => `
                                        <span class="badge" style="background: rgba(245, 158, 11, 0.08); color: var(--color-accent); border: 1px solid rgba(245, 158, 11, 0.2); font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block; margin: 2px;">
                                            ${tag.trim()}
                                        </span>
                                    `).join('') : '-'}
                                </td>
                                <td>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="action-btn" onclick="editVipSupplierModal(${JSON.stringify(sup).replace(/"/g, '&quot;')})" title="Editar"><i class="fas fa-edit"></i></button>
                                        <button class="action-btn" onclick="deleteVipSupplier(${sup.id})" title="Eliminar" style="color: var(--danger);"><i class="fas fa-trash-alt"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

        } else if (AdminState.vipResourceSubTab === 'gifts') {
            const gifts = await VipService.getGifts();
            if (gifts.length === 0) {
                listArea.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--text-muted);">No hay regalos registrados.</div>`;
                return;
            }

            listArea.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Tipo</th>
                            <th>Código / Credenciales</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gifts.map(gift => {
                            const isClaimed = gift.status === 'claimed';
                            return `
                                <tr>
                                    <td style="font-weight: 600;">${gift.title}</td>
                                    <td>
                                        <span class="badge" style="font-size: 11px;">
                                            ${gift.type === 'streaming' ? 'Streaming' : gift.type === 'coupon' ? 'Cupón' : 'Gift Card'}
                                        </span>
                                    </td>
                                    <td style="font-family: monospace; font-size: 12px;">${gift.code}</td>
                                    <td>
                                        <span class="badge ${isClaimed ? 'badge-sold-out' : 'badge-featured'}">
                                            ${isClaimed ? 'Reclamado' : 'Disponible'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style="display: flex; gap: 8px;">
                                            <button class="action-btn" onclick="editVipGiftModal(${JSON.stringify(gift).replace(/"/g, '&quot;')})" title="Editar"><i class="fas fa-edit"></i></button>
                                            <button class="action-btn" onclick="deleteVipGift(${gift.id})" title="Eliminar" style="color: var(--danger);"><i class="fas fa-trash-alt"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (e) {
        showToast('Error al cargar recursos VIP: ' + e.message, 'error');
    }
}

// Acciones CRUD Admin VIP
window.deleteVipRaffle = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este sorteo?')) return;
    try {
        const res = await AdminService.deleteVipRaffle(id);
        showToast(res.message, 'success');
        renderVipResourcesSubTabContent();
    } catch (e) {
        showToast(e.message, 'error');
    }
};

window.deleteVipSupplier = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;
    try {
        const res = await AdminService.deleteVipSupplier(id);
        showToast(res.message, 'success');
        renderVipResourcesSubTabContent();
    } catch (e) {
        showToast(e.message, 'error');
    }
};

window.deleteVipGift = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este regalo/cuenta?')) return;
    try {
        const res = await AdminService.deleteVipGift(id);
        showToast(res.message, 'success');
        renderVipResourcesSubTabContent();
    } catch (e) {
        showToast(e.message, 'error');
    }
};

window.drawVipRaffle = async (id) => {
    if (!confirm('¿Estás seguro de realizar el sorteo ahora de forma aleatoria?')) return;
    try {
        const res = await AdminService.drawVipRaffle(id);
        showToast(res.message, 'success');
        
        // Mostrar modal especial de ganador
        const winner = res.winner;
        const html = `
            <div style="text-align: center; padding: 24px;">
                <div style="font-size: 50px; color: var(--color-accent); margin-bottom: 16px;"><i class="fas fa-trophy animate-pulse"></i></div>
                <h2 style="font-size: 24px; margin-bottom: 8px;">¡Ganador Seleccionado!</h2>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">El sistema ha elegido aleatoriamente al siguiente participante:</p>
                <div style="background: rgba(245, 158, 11, 0.1); border: 1.5px solid var(--color-accent); padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                    <div style="font-size: 20px; font-weight: 800; color: var(--text-primary);">${winner.name || 'Ninguno'}</div>
                    <div style="color: var(--text-secondary); font-size: 13px; margin-top: 4px;">${winner.email || ''}</div>
                </div>
                <button class="btn-primary" onclick="closeAdminModalModal()" style="width: 120px; margin: 0 auto; display: block;">Cerrar</button>
            </div>
        `;
        openAdminModalModal(html);
        renderVipResourcesSubTabContent();
    } catch (e) {
        showToast(e.message || 'Error al sortear.', 'error');
    }
};

// Modal de Creación VIP General
window.openVipResourceCreateModal = () => {
    const subTab = AdminState.vipResourceSubTab;
    let html = '';

    if (subTab === 'raffles') {
        html = `
            <div style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0;"><i class="fas fa-ticket-alt"></i> Crear Sorteo VIP</h3>
                    <button class="vip-map-modal-close" onclick="closeAdminModalModal()"><i class="fas fa-times"></i></button>
                </div>
                <form id="create-raffle-form" onsubmit="handleCreateVipRaffle(event)">
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label class="form-label">Título del Sorteo</label>
                        <input type="text" id="raffle-title" class="form-control" placeholder="ej: iPhone 15 Pro Max 256GB" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label class="form-label">Descripción</label>
                        <textarea id="raffle-desc" class="form-control" placeholder="Detalles del sorteo..." rows="3"></textarea>
                    </div>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label class="form-label">URL de Imagen</label>
                        <input type="url" id="raffle-img" class="form-control" placeholder="https://unsplash.com/...">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                        <div class="form-group">
                            <label class="form-label">Costo (Monedas VIP)</label>
                            <input type="number" id="raffle-cost" class="form-control" value="1" min="1" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Fecha de Sorteo</label>
                            <input type="datetime-local" id="raffle-date" class="form-control" required>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 12px;">
                        <button type="button" class="btn-outline" onclick="closeAdminModalModal()">Cancelar</button>
                        <button type="submit" class="btn-primary">Crear Sorteo</button>
                    </div>
                </form>
            </div>
        `;
    } else if (subTab === 'suppliers') {
        html = `
            <div style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0;"><i class="fas fa-building"></i> Crear Proveedor local</h3>
                    <button class="vip-map-modal-close" onclick="closeAdminModalModal()"><i class="fas fa-times"></i></button>
                </div>
                <form id="create-supplier-form" onsubmit="handleCreateVipSupplier(event)">
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label class="form-label">Nombre del Proveedor</label>
                        <input type="text" id="sup-name" class="form-control" placeholder="ej: Distribuidora Wilson SAC" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label class="form-label">Teléfono de Contacto</label>
                        <input type="text" id="sup-phone" class="form-control" placeholder="ej: +51 987654321">
                    </div>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label class="form-label">Dirección Escrita</label>
                        <input type="text" id="sup-address" class="form-control" placeholder="ej: Gamarra, La Victoria">
                    </div>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label class="form-label">Iframe / URL de Mapa</label>
                        <input type="url" id="sup-map" class="form-control" placeholder="https://maps.google.com/... (URL del embed)">
                    </div>
                    <div class="form-group" style="margin-bottom: 24px;">
                        <label class="form-label">Productos que ofrece (Separados por comas)</label>
                        <input type="text" id="sup-courses" class="form-control" placeholder="ej: Audífonos, Laptops, Celulares" required>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 12px;">
                        <button type="button" class="btn-outline" onclick="closeAdminModalModal()">Cancelar</button>
                        <button type="submit" class="btn-primary">Crear Proveedor</button>
                    </div>
                </form>
            </div>
        `;
    } else if (subTab === 'gifts') {
        html = `
            <div style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0;"><i class="fas fa-gift"></i> Crear Cuenta o Código Regalo</h3>
                    <button class="vip-map-modal-close" onclick="closeAdminModalModal()"><i class="fas fa-times"></i></button>
                </div>
                <form id="create-gift-form" onsubmit="handleCreateVipGift(event)">
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label class="form-label">Título del Regalo</label>
                        <input type="text" id="gift-title" class="form-control" placeholder="ej: Cuenta Netflix Premium VIP (1 Mes)" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label class="form-label">Código / Credenciales de Acceso</label>
                        <input type="text" id="gift-code" class="form-control" placeholder="ej: netflix@vip.com | pass: 123" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 24px;">
                        <label class="form-label">Tipo de Recurso</label>
                        <select id="gift-type" class="form-control" style="padding: 10px 14px;">
                            <option value="streaming">Streaming (Netflix, HBO, Prime)</option>
                            <option value="coupon">Cupón / Licencia Software</option>
                            <option value="gift_card">Tarjeta Regalo (Amazon, Spotify)</option>
                        </select>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 12px;">
                        <button type="button" class="btn-outline" onclick="closeAdminModalModal()">Cancelar</button>
                        <button type="submit" class="btn-primary">Crear Regalo</button>
                    </div>
                </form>
            </div>
        `;
    }

    openAdminModalModal(html);
};

// Handlers de creación
window.handleCreateVipRaffle = async (e) => {
    e.preventDefault();
    const data = {
        title: document.getElementById('raffle-title').value,
        description: document.getElementById('raffle-desc').value,
        image_url: document.getElementById('raffle-img').value,
        coin_cost: Number(document.getElementById('raffle-cost').value),
        draw_date: document.getElementById('raffle-date').value
    };
    try {
        const res = await AdminService.createVipRaffle(data);
        showToast(res.message, 'success');
        closeAdminModalModal();
        renderVipResourcesSubTabContent();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.handleCreateVipSupplier = async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('sup-name').value,
        phone: document.getElementById('sup-phone').value,
        address: document.getElementById('sup-address').value,
        map_url: document.getElementById('sup-map').value,
        courses: document.getElementById('sup-courses').value
    };
    try {
        const res = await AdminService.createVipSupplier(data);
        showToast(res.message, 'success');
        closeAdminModalModal();
        renderVipResourcesSubTabContent();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.handleCreateVipGift = async (e) => {
    e.preventDefault();
    const data = {
        title: document.getElementById('gift-title').value,
        code: document.getElementById('gift-code').value,
        type: document.getElementById('gift-type').value
    };
    try {
        const res = await AdminService.createVipGift(data);
        showToast(res.message, 'success');
        closeAdminModalModal();
        renderVipResourcesSubTabContent();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// Modal de Edición de Sorteo
window.editVipRaffleModal = (raffle) => {
    const formattedDate = raffle.draw_date ? raffle.draw_date.slice(0, 16) : '';
    const html = `
        <div style="padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3><i class="fas fa-edit"></i> Editar Sorteo VIP</h3>
                <button class="vip-map-modal-close" onclick="closeAdminModalModal()"><i class="fas fa-times"></i></button>
            </div>
            <form id="edit-raffle-form" onsubmit="handleUpdateVipRaffle(event, ${raffle.id})">
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Título del Sorteo</label>
                    <input type="text" id="raffle-title-edit" class="form-control" value="${raffle.title}" required>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Descripción</label>
                    <textarea id="raffle-desc-edit" class="form-control" rows="3">${raffle.description || ''}</textarea>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">URL de Imagen</label>
                    <input type="url" id="raffle-img-edit" class="form-control" value="${raffle.image_url || ''}">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                    <div class="form-group">
                        <label class="form-label">Costo (Monedas VIP)</label>
                        <input type="number" id="raffle-cost-edit" class="form-control" value="${raffle.coin_cost}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Fecha de Sorteo</label>
                        <input type="datetime-local" id="raffle-date-edit" class="form-control" value="${formattedDate}" required>
                    </div>
                </div>
                <div class="form-group" style="margin-bottom: 24px;">
                    <label class="form-label">Estado</label>
                    <select id="raffle-status-edit" class="form-control" style="padding: 10px 14px;">
                        <option value="active" ${raffle.status === 'active' ? 'selected' : ''}>Activo</option>
                        <option value="drawn" ${raffle.status === 'drawn' ? 'selected' : ''}>Finalizado / Sorteado</option>
                    </select>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 12px;">
                    <button type="button" class="btn-outline" onclick="closeAdminModalModal()">Cancelar</button>
                    <button type="submit" class="btn-primary">Guardar Cambios</button>
                </div>
            </form>
        </div>
    `;
    openAdminModalModal(html);
};

window.handleUpdateVipRaffle = async (e, id) => {
    e.preventDefault();
    const data = {
        title: document.getElementById('raffle-title-edit').value,
        description: document.getElementById('raffle-desc-edit').value,
        image_url: document.getElementById('raffle-img-edit').value,
        coin_cost: Number(document.getElementById('raffle-cost-edit').value),
        draw_date: document.getElementById('raffle-date-edit').value,
        status: document.getElementById('raffle-status-edit').value
    };
    try {
        const res = await AdminService.updateVipRaffle(id, data);
        showToast(res.message, 'success');
        closeAdminModalModal();
        renderVipResourcesSubTabContent();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// Modal de Edición de Proveedor
window.editVipSupplierModal = (sup) => {
    const html = `
        <div style="padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3><i class="fas fa-edit"></i> Editar Proveedor VIP</h3>
                <button class="vip-map-modal-close" onclick="closeAdminModalModal()"><i class="fas fa-times"></i></button>
            </div>
            <form id="edit-supplier-form" onsubmit="handleUpdateVipSupplier(event, ${sup.id})">
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Nombre del Proveedor</label>
                    <input type="text" id="sup-name-edit" class="form-control" value="${sup.name}" required>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Teléfono</label>
                    <input type="text" id="sup-phone-edit" class="form-control" value="${sup.phone || ''}">
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Dirección Escrita</label>
                    <input type="text" id="sup-address-edit" class="form-control" value="${sup.address || ''}">
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">URL de Mapa (Embed)</label>
                    <input type="url" id="sup-map-edit" class="form-control" value="${sup.map_url || ''}">
                </div>
                <div class="form-group" style="margin-bottom: 24px;">
                    <label class="form-label">Productos que ofrece (Separados por comas)</label>
                    <input type="text" id="sup-courses-edit" class="form-control" value="${sup.courses || ''}" placeholder="ej: Audífonos, Laptops, Celulares" required>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 12px;">
                    <button type="button" class="btn-outline" onclick="closeAdminModalModal()">Cancelar</button>
                    <button type="submit" class="btn-primary">Guardar Cambios</button>
                </div>
            </form>
        </div>
    `;
    openAdminModalModal(html);
};

window.handleUpdateVipSupplier = async (e, id) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('sup-name-edit').value,
        phone: document.getElementById('sup-phone-edit').value,
        address: document.getElementById('sup-address-edit').value,
        map_url: document.getElementById('sup-map-edit').value,
        courses: document.getElementById('sup-courses-edit').value
    };
    try {
        const res = await AdminService.updateVipSupplier(id, data);
        showToast(res.message, 'success');
        closeAdminModalModal();
        renderVipResourcesSubTabContent();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// Modal de Edición de Regalo
window.editVipGiftModal = (gift) => {
    const html = `
        <div style="padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3><i class="fas fa-edit"></i> Editar Regalo/Cuenta VIP</h3>
                <button class="vip-map-modal-close" onclick="closeAdminModalModal()"><i class="fas fa-times"></i></button>
            </div>
            <form id="edit-gift-form" onsubmit="handleUpdateVipGift(event, ${gift.id})">
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Título</label>
                    <input type="text" id="gift-title-edit" class="form-control" value="${gift.title}" required>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Código / Credenciales</label>
                    <input type="text" id="gift-code-edit" class="form-control" value="${gift.code}" required>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Tipo</label>
                    <select id="gift-type-edit" class="form-control" style="padding: 10px 14px;">
                        <option value="streaming" ${gift.type === 'streaming' ? 'selected' : ''}>Streaming</option>
                        <option value="coupon" ${gift.type === 'coupon' ? 'selected' : ''}>Cupón</option>
                        <option value="gift_card" ${gift.type === 'gift_card' ? 'selected' : ''}>Gift Card</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom: 24px;">
                    <label class="form-label">Estado</label>
                    <select id="gift-status-edit" class="form-control" style="padding: 10px 14px;">
                        <option value="available" ${gift.status === 'available' ? 'selected' : ''}>Disponible</option>
                        <option value="claimed" ${gift.status === 'claimed' ? 'selected' : ''}>Reclamado</option>
                    </select>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 12px;">
                    <button type="button" class="btn-outline" onclick="closeAdminModalModal()">Cancelar</button>
                    <button type="submit" class="btn-primary">Guardar Cambios</button>
                </div>
            </form>
        </div>
    `;
    openAdminModalModal(html);
};

window.handleUpdateVipGift = async (e, id) => {
    e.preventDefault();
    const data = {
        title: document.getElementById('gift-title-edit').value,
        code: document.getElementById('gift-code-edit').value,
        type: document.getElementById('gift-type-edit').value,
        status: document.getElementById('gift-status-edit').value
    };
    try {
        const res = await AdminService.updateVipGift(id, data);
        showToast(res.message, 'success');
        closeAdminModalModal();
        renderVipResourcesSubTabContent();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// Helpers de control del modal
window.openAdminModalModal = (html) => {
    const modal = document.getElementById('admin-details-modal');
    const content = document.getElementById('admin-modal-content-area');
    if (modal && content) {
        content.innerHTML = html;
        modal.style.display = 'flex';
        modal.classList.add('open');
    }
};

window.closeAdminModalModal = () => {
    const modal = document.getElementById('admin-details-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('open');
    }
};

// ==========================================
// PESTAÑA: GESTIÓN DE PLATAFORMAS Y CUENTAS STREAMING
// ==========================================
let _cachedStreamingPlatforms = [];

async function renderStreamingTab(container) {
    let accounts = [];
    let platforms = [];
    let products = [];
    try {
        [accounts, platforms] = await Promise.all([
            AdminService.getStreamingAccounts(),
            AdminService.getStreamingPlatforms()
        ]);
    } catch (err) {
        console.error('Error al cargar cuentas y plataformas:', err);
        showToast('Error al cargar datos de streaming.', 'error');
    }

    try {
        products = await ShopService.getProducts();
        if (products && products.length > 0) {
            globalProductList = products;
        }
    } catch (e) {
        console.warn('No se pudieron precargar los productos en streaming:', e);
    }

    window._cachedStreamingAccounts = accounts;
    window._cachedStreamingPlatforms = platforms;

    // Calcular estadísticas globales
    const totalAccounts = accounts.length;
    let totalCapacity = 0;
    let totalUsed = 0;
    let totalFull = 0;

    accounts.forEach(a => {
        const cap = Number(a.max_devices) || 1;
        totalCapacity += cap;
        totalUsed += Number(a.current_users_count) || 0;
        if (a.is_full) totalFull++;
    });

    const totalFree = Math.max(0, totalCapacity - totalUsed);

    const html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
            <div>
                <h3 style="font-size: 22px; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-tv" style="color: var(--color-primary);"></i> Plataformas y Cuentas Streaming
                </h3>
                <p style="color: var(--text-secondary); font-size: 13.5px; margin-top: 4px;">
                    Crea plataformas, administra inventario de cuentas/perfiles, límites de uso y entrega automática al cliente.
                </p>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn-outline" onclick="openStreamingPlatformModal()" style="display: inline-flex; align-items: center; gap: 8px;">
                    <i class="fas fa-layer-group"></i> Nueva Plataforma
                </button>
                <button class="btn-primary" onclick="openStreamingAccountModal()" style="display: inline-flex; align-items: center; gap: 8px;">
                    <i class="fas fa-key"></i> Nueva Cuenta / Perfil
                </button>
            </div>
        </div>

        <!-- Banner Explicativo de Integración con la Tienda -->
        <div style="background: linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(236,72,153,0.06) 100%); border: 1px solid rgba(99,102,241,0.2); border-radius: var(--radius-md); padding: 16px 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
            <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 280px;">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                    <i class="fas fa-store"></i>
                </div>
                <div>
                    <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary);">
                        ¿Dónde compran los clientes estas cuentas en la tienda?
                    </h4>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-secondary); line-height: 1.4;">
                        Los clientes compran los productos desde la sección <strong>Streaming & Cuentas</strong> en la tienda. Al confirmar su pago, el sistema toma automáticamente una cuenta disponible o link de activación de este inventario y se la entrega de inmediato en pantalla y a su correo.
                    </p>
                </div>
            </div>
            <a href="#/category/streaming" target="_blank" class="btn-primary" style="padding: 10px 18px; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; white-space: nowrap;">
                <i class="fas fa-play-circle"></i> Ver Catálogo en la Tienda <i class="fas fa-external-link-alt" style="font-size: 11px;"></i>
            </a>
        </div>

        <!-- Métricas Rápidas de Streaming -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
            <div class="glass-panel" style="padding: 16px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 14px;">
                <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(99,102,241,0.15); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 20px;">
                    <i class="fas fa-boxes"></i>
                </div>
                <div>
                    <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Cuentas Registradas</span>
                    <h4 style="font-size: 20px; font-weight: 800; margin: 2px 0 0 0;">${totalAccounts}</h4>
                </div>
            </div>

            <div class="glass-panel" style="padding: 16px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 14px;">
                <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(16,185,129,0.15); color: #10b981; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div>
                    <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Cupos Disponibles</span>
                    <h4 style="font-size: 20px; font-weight: 800; margin: 2px 0 0 0; color: #10b981;">${totalFree} <small style="font-size: 12px; color: var(--text-muted);">/ ${totalCapacity}</small></h4>
                </div>
            </div>

            <div class="glass-panel" style="padding: 16px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 14px;">
                <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(245,158,11,0.15); color: #f59e0b; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                    <i class="fas fa-users"></i>
                </div>
                <div>
                    <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Cupos en Uso (Clientes)</span>
                    <h4 style="font-size: 20px; font-weight: 800; margin: 2px 0 0 0; color: #f59e0b;">${totalUsed}</h4>
                </div>
            </div>

            <div class="glass-panel" style="padding: 16px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 14px;">
                <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(239,68,68,0.15); color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div>
                    <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Cuentas Llenas / Agotadas</span>
                    <h4 style="font-size: 20px; font-weight: 800; margin: 2px 0 0 0; color: #ef4444;">${totalFull}</h4>
                </div>
            </div>
        </div>

        <!-- Sección de Plataformas Creadas -->
        <div class="glass-panel" style="padding: 20px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
                <h4 style="margin: 0; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-layer-group" style="color: var(--color-primary);"></i> Plataformas Activas
                </h4>
                <span style="font-size: 12.5px; color: var(--text-muted);">Haz clic en una plataforma para filtrar sus cuentas</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px;" id="platforms-grid-container">
                <div class="streaming-platform-card active" onclick="selectStreamingPlatformFilter(null, this)" style="cursor: pointer; border: 2px solid var(--color-primary); background: rgba(99,102,241,0.08); border-radius: 12px; padding: 14px; display: flex; align-items: center; gap: 12px;">
                    <div style="width: 42px; height: 42px; border-radius: 10px; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                        <i class="fas fa-th-large"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 700; font-size: 14px;">Todas</div>
                        <div style="font-size: 11.5px; color: var(--text-muted);">${totalAccounts} cuentas registradas</div>
                    </div>
                </div>

                ${platforms.map(p => {
                    const logo = p.image_url 
                        ? `<img src="${p.image_url}" alt="${p.name}" style="width: 42px; height: 42px; border-radius: 10px; object-fit: cover;">`
                        : `<div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-size: 18px;"><i class="fas fa-tv"></i></div>`;

                    const isLinkType = p.account_type === 'activation_link';

                    const storeProduct = (products || []).find(prod => 
                        (prod.streaming_platform && prod.streaming_platform.toLowerCase() === p.name.toLowerCase()) ||
                        (prod.name && prod.name.toLowerCase().includes(p.name.toLowerCase()))
                    );

                    return `
                        <div class="streaming-platform-card" onclick="selectStreamingPlatformFilter('${p.name}', this)" style="cursor: pointer; border: 1px solid var(--border-color); background: var(--bg-card); border-radius: 12px; padding: 14px; display: flex; align-items: flex-start; gap: 12px; transition: all 0.2s ease;">
                            ${logo}
                            <div style="flex: 1; min-width: 0;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <strong style="font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</strong>
                                    <button type="button" class="btn-icon" style="padding: 2px 4px; font-size: 11px; opacity: 0.7;" title="Editar plataforma" onclick="event.stopPropagation(); openStreamingPlatformModal(${p.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </div>
                                <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 2px;">
                                    ${p.accounts_count || 0} cuentas · <span style="color: ${p.available_slots > 0 ? '#10b981' : '#ef4444'}; font-weight: 600;">${p.available_slots || 0} libres</span>
                                </div>
                                <div style="font-size: 10.5px; margin-top: 4px; display: flex; gap: 4px; flex-wrap: wrap;">
                                    ${isLinkType ? '<span class="badge" style="background: rgba(16,185,129,0.15); color: #10b981; font-size: 9.5px; padding: 1px 6px;">Link Activación</span>' : '<span class="badge" style="background: rgba(99,102,241,0.15); color: var(--color-primary); font-size: 9.5px; padding: 1px 6px;">Perfiles / Clave</span>'}
                                </div>
                                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color); display: flex; justify-content: space-between; align-items: center; gap: 4px;">
                                    ${storeProduct ? `
                                        <span class="badge" style="background: rgba(16,185,129,0.15); color: #10b981; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;" title="Producto publicado en la tienda">
                                            <i class="fas fa-check-circle"></i> S/. ${(storeProduct.price_offer || storeProduct.price_normal || 0).toFixed(2)}
                                        </span>
                                        <button type="button" class="btn-icon" style="padding: 2px 6px; font-size: 10.5px; color: var(--color-primary); background: rgba(99,102,241,0.08); border-radius: 4px;" title="Editar precio o detalles del producto en la tienda" onclick="event.stopPropagation(); openProductFormModal(${storeProduct.id})">
                                            <i class="fas fa-pencil-alt"></i> Editar
                                        </button>
                                    ` : `
                                        <span class="badge" style="background: rgba(245,158,11,0.15); color: #f59e0b; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;" title="Aún no tiene producto creado en la tienda">
                                            <i class="fas fa-exclamation-triangle"></i> Sin publicar
                                        </span>
                                        <button type="button" class="btn-outline" style="padding: 2px 8px; font-size: 10px; border-radius: 4px; font-weight: 600;" title="Crear producto en la tienda para esta plataforma" onclick="event.stopPropagation(); createProductForPlatform('${p.name.replace(/'/g, "\\'")}', '${p.image_url ? p.image_url.replace(/'/g, "\\'") : ''}')">
                                            <i class="fas fa-plus"></i> Publicar
                                        </button>
                                    `}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <!-- Filtros y Búsqueda -->
        <div class="glass-panel" style="padding: 16px 20px; margin-bottom: 24px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
                <div>
                    <label style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin-bottom: 4px; display: block;">Buscar</label>
                    <input type="text" id="search-streaming" class="form-control" placeholder="Buscar por email, perfil, PIN o link..." onkeyup="filterStreamingAccounts()">
                </div>
                <div>
                    <label style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin-bottom: 4px; display: block;">Plataforma</label>
                    <select id="filter-streaming-platform" class="form-control" onchange="filterStreamingAccounts()">
                        <option value="">Todas las plataformas</option>
                        ${platforms.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin-bottom: 4px; display: block;">Estado de Cupo / Límite</label>
                    <select id="filter-streaming-status" class="form-control" onchange="filterStreamingAccounts()">
                        <option value="">Todos los estados</option>
                        <option value="available">Con cupos disponibles</option>
                        <option value="near_full">⚠️ Por llenarse (>= 75%)</option>
                        <option value="full">🚫 Cuenta llena (Cupo 100% agotado)</option>
                        <option value="expired">Vencidas</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Tabla / Listado de Cuentas y Perfiles -->
        <div class="table-responsive glass-panel" style="overflow-x: auto; border-radius: var(--radius-md);">
            <table class="admin-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--border-color); text-align: left;">
                        <th style="padding: 14px 16px;">Plataforma & Logo</th>
                        <th style="padding: 14px 16px;">Tipo & Acceso (Email / Clave o Link)</th>
                        <th style="padding: 14px 16px;">Perfil & PIN</th>
                        <th style="padding: 14px 16px;">Capacidad & Límite (Admin)</th>
                        <th style="padding: 14px 16px;">Reglas / Advertencias</th>
                        <th style="padding: 14px 16px;">Clientes Asignados</th>
                        <th style="padding: 14px 16px; text-align: right;">Acciones</th>
                    </tr>
                </thead>
                <tbody id="streaming-accounts-tbody">
                    ${renderStreamingAccountsRows(accounts)}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

window.selectStreamingPlatformFilter = (platformName, cardEl) => {
    document.querySelectorAll('.streaming-platform-card').forEach(c => {
        c.style.border = '1px solid var(--border-color)';
        c.style.background = 'var(--bg-card)';
    });
    if (cardEl) {
        cardEl.style.border = '2px solid var(--color-primary)';
        cardEl.style.background = 'rgba(99,102,241,0.08)';
    }

    const select = document.getElementById('filter-streaming-platform');
    if (select) {
        select.value = platformName || '';
        filterStreamingAccounts();
    }
};

function renderStreamingAccountsRows(accounts) {
    if (!accounts || accounts.length === 0) {
        return `<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 14px;">No se encontraron cuentas ni perfiles de streaming con los filtros seleccionados.</td></tr>`;
    }

    return accounts.map(acc => {
        const isFull = acc.is_full;
        const isNearFull = acc.is_near_full;
        const isExpired = acc.is_expired;
        const isLinkOnly = acc.account_type === 'activation_link' || (!acc.email && acc.activation_link);

        // Barra de progreso y badges de límite
        const used = acc.current_users_count || 0;
        const max = acc.max_devices || 1;
        const percent = Math.min(100, Math.round((used / max) * 100));

        let progressColor = '#10b981'; // verde
        let statusBadge = `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 700;"><i class="fas fa-check-circle"></i> ${used} / ${max} cupos</span>`;

        if (isExpired) {
            progressColor = '#ef4444';
            statusBadge = `<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; font-weight: 700;"><i class="fas fa-clock"></i> Vencida</span>`;
        } else if (isFull) {
            progressColor = '#ef4444';
            statusBadge = `<span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; font-weight: 800; border: 1px solid rgba(239, 68, 68, 0.4);"><i class="fas fa-ban"></i> LLENA (${used}/${max})</span>`;
        } else if (isNearFull) {
            progressColor = '#f59e0b';
            statusBadge = `<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; font-weight: 700;"><i class="fas fa-exclamation-triangle"></i> ¡Por Llenarse! (${used}/${max})</span>`;
        }

        const logoHtml = acc.platform_image
            ? `<img src="${acc.platform_image}" alt="${acc.platform}" style="width: 36px; height: 36px; border-radius: 8px; object-fit: cover;">`
            : `<div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(99,102,241,0.15); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 16px;"><i class="fas fa-tv"></i></div>`;

        const assignmentsList = acc.assignments && acc.assignments.length > 0
            ? acc.assignments.map(as => `
                <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px; margin-bottom: 6px; background: var(--bg-hover); padding: 6px 8px; border-radius: 6px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            <i class="fas fa-user" style="font-size: 10px; color: var(--color-primary);"></i>
                            <strong>${as.user_name || 'Cliente'}</strong>
                            ${as.order_id ? `<span style="color: var(--text-muted); font-size: 11px;">(Ped #${as.order_id})</span>` : ''}
                        </div>
                        <button type="button" class="btn-icon" style="color: var(--danger); font-size: 11px; padding: 2px 4px;" title="Liberar cupo de este usuario" onclick="handleUnassignStreamingUser(${as.assignment_id})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    ${as.target_email ? `
                        <div style="font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; justify-content: space-between; gap: 4px; background: rgba(0,0,0,0.15); padding: 2px 6px; border-radius: 4px;">
                            <span><i class="fas fa-at"></i> ${as.target_email}</span>
                            ${as.link_status === 'active' || as.link_status === 'linked' ? `
                                <span style="color: #10b981; font-weight: 700; font-size: 10.5px;"><i class="fas fa-check-circle"></i> Vinculada</span>
                            ` : `
                                <button type="button" class="btn-primary" style="padding: 1px 6px; font-size: 10px; line-height: 1.4;" onclick="handleMarkAssignmentLinked(${as.assignment_id})">
                                    <i class="fas fa-check"></i> Marcar Vinculada
                                </button>
                            `}
                        </div>
                    ` : (acc.account_type === 'personal_account' ? `
                        <span style="font-size: 10.5px; color: #f59e0b;"><i class="fas fa-clock"></i> Esperando correo de cliente</span>
                    ` : '')}
                </div>
              `).join('')
            : `<span style="font-size: 12px; color: var(--text-muted);">Sin clientes asignados</span>`;

        return `
            <tr style="border-bottom: 1px solid var(--border-color); vertical-align: middle;">
                <td style="padding: 14px 16px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${logoHtml}
                        <div>
                            <div style="font-weight: 700; font-size: 14px;">${acc.platform}</div>
                            ${acc.product_name ? `<div style="font-size: 11px; color: var(--text-muted);">Cat: ${acc.product_name}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td style="padding: 14px 16px; font-size: 12.5px;">
                    ${isLinkOnly ? `
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span class="badge" style="background: rgba(16,185,129,0.15); color: #10b981; width: fit-content; font-size: 10.5px;">
                                <i class="fas fa-link"></i> Link de Activación
                            </span>
                            <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                                <a href="${acc.activation_link}" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary); font-size: 12px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    ${acc.activation_link}
                                </a>
                                <button type="button" class="btn-cred-copy" style="padding: 2px 6px; font-size: 10.5px;" onclick="navigator.clipboard.writeText('${acc.activation_link}'); showToast('Link copiado', 'info');">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                    ` : `
                        <div>
                            <div><strong>Email:</strong> ${acc.email || 'N/A'} <button type="button" style="background:none;border:none;color:var(--color-primary);cursor:pointer;" onclick="navigator.clipboard.writeText('${acc.email}'); showToast('Email copiado', 'info');"><i class="fas fa-copy"></i></button></div>
                            <div style="margin-top: 2px;"><strong>Clave:</strong> <span style="font-family: monospace; background: var(--bg-hover); padding: 1px 5px; border-radius: 4px;">${acc.password || 'N/A'}</span> <button type="button" style="background:none;border:none;color:var(--color-primary);cursor:pointer;" onclick="navigator.clipboard.writeText('${acc.password}'); showToast('Clave copiada', 'info');"><i class="fas fa-copy"></i></button></div>
                            ${acc.activation_link ? `<div style="margin-top: 4px;"><a href="${acc.activation_link}" target="_blank" style="font-size: 11px; color: var(--color-primary);"><i class="fas fa-external-link-alt"></i> Link extra</a></div>` : ''}
                        </div>
                    `}
                </td>
                <td style="padding: 14px 16px; font-size: 13px;">
                    <div><strong>Perfil:</strong> <span style="color: var(--color-secondary); font-weight: 700;">${acc.profile_name || 'N/A'}</span></div>
                    ${acc.profile_pin ? `<div style="margin-top: 2px;"><strong>PIN:</strong> <span style="color: #f59e0b; font-weight: 800; letter-spacing: 1px;">${acc.profile_pin}</span></div>` : '<span style="font-size: 11px; color: var(--text-muted);">Sin PIN</span>'}
                </td>
                <td style="padding: 14px 16px; min-width: 185px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        ${statusBadge}
                        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${percent}%</span>
                    </div>
                    <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden;">
                        <div style="width: ${percent}%; height: 100%; background: ${progressColor}; border-radius: 4px;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-top: 5px;">
                        <span>Libres: <strong style="color: #10b981;">${acc.available_slots}</strong></span>
                        <span>Ocupados: <strong style="color: #f59e0b;">${used}</strong></span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted); margin-top: 4px; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.08);">
                        <span>Límite: <strong style="color: var(--text-primary); font-size: 12px;">${max} cupo(s)</strong></span>
                        <button type="button" class="btn-outline" style="padding: 2px 7px; font-size: 10.5px; border-radius: 4px;" title="Modificar cupos de esta cuenta" onclick="quickEditStreamingAccountLimit(${acc.id}, ${max}, '${acc.platform}')">
                            <i class="fas fa-edit"></i> Cambiar
                        </button>
                    </div>
                </td>
                <td style="padding: 14px 16px; max-width: 180px;">
                    ${acc.usage_instructions ? `
                        <div style="font-size: 11.5px; color: var(--text-secondary); max-height: 48px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;" title="${acc.usage_instructions}">
                            <i class="fas fa-shield-alt" style="color: #f59e0b;"></i> ${acc.usage_instructions}
                        </div>
                    ` : '<span style="font-size: 11.5px; color: var(--text-muted);">Sin reglas específicas</span>'}
                </td>
                <td style="padding: 14px 16px; min-width: 190px;">
                    ${assignmentsList}
                </td>
                <td style="padding: 14px 16px; text-align: right;">
                    <div style="display: flex; gap: 6px; justify-content: flex-end;">
                        <button class="btn-outline" style="padding: 5px 8px; font-size: 12px;" title="Asignar Usuario a esta cuenta" onclick="openAssignStreamingUserModal(${acc.id})"><i class="fas fa-user-plus"></i></button>
                        <button class="btn-outline" style="padding: 5px 8px; font-size: 12px;" title="Editar Cuenta / Límite" onclick="openStreamingAccountModal(${acc.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn-outline" style="padding: 5px 8px; font-size: 12px; color: var(--danger);" title="Eliminar Cuenta" onclick="handleDeleteStreamingAccount(${acc.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.filterStreamingAccounts = () => {
    const search = document.getElementById('search-streaming')?.value.toLowerCase() || '';
    const platform = document.getElementById('filter-streaming-platform')?.value.toLowerCase() || '';
    const status = document.getElementById('filter-streaming-status')?.value || '';
    const accounts = window._cachedStreamingAccounts || [];

    const filtered = accounts.filter(acc => {
        const matchSearch = !search || 
            (acc.email && acc.email.toLowerCase().includes(search)) || 
            (acc.profile_name && acc.profile_name.toLowerCase().includes(search)) || 
            (acc.platform && acc.platform.toLowerCase().includes(search)) ||
            (acc.activation_link && acc.activation_link.toLowerCase().includes(search));

        const matchPlat = !platform || acc.platform.toLowerCase() === platform;

        let matchStatus = true;
        if (status === 'full') matchStatus = acc.is_full && !acc.is_expired;
        else if (status === 'available') matchStatus = !acc.is_full && !acc.is_expired;
        else if (status === 'near_full') matchStatus = acc.is_near_full && !acc.is_expired;
        else if (status === 'expired') matchStatus = acc.is_expired;

        return matchSearch && matchPlat && matchStatus;
    });

    const tbody = document.getElementById('streaming-accounts-tbody');
    if (tbody) {
        tbody.innerHTML = renderStreamingAccountsRows(filtered);
    }
};

window.createProductForPlatform = async (platformName, imageUrl) => {
    await openProductFormModal(null);
    const nameInput = document.getElementById('prod-name');
    if (nameInput) {
        nameInput.value = `Pantalla / Cuenta ${platformName}`;
        nameInput.dispatchEvent(new Event('input'));
    }
    const typeSelect = document.getElementById('prod-type');
    if (typeSelect) {
        typeSelect.value = 'digital';
        toggleProductTypeForm('digital');
    }
    const catSelect = document.getElementById('prod-category');
    if (catSelect) {
        for (let i = 0; i < catSelect.options.length; i++) {
            const txt = catSelect.options[i].text.toLowerCase();
            if (txt.includes('streaming') || txt.includes('digital')) {
                catSelect.selectedIndex = i;
                break;
            }
        }
    }
    const platformSelect = document.getElementById('prod-streaming-platform-select');
    if (platformSelect) {
        platformSelect.value = platformName;
        handleStreamingPlatformSelectChange(platformSelect);
    }
    const platformInput = document.getElementById('prod-streaming-platform');
    if (platformInput) {
        platformInput.value = platformName;
    }
    const priceNormal = document.getElementById('prod-price-normal');
    if (priceNormal) priceNormal.value = '15.00';
    const priceOffer = document.getElementById('prod-price-offer');
    if (priceOffer) priceOffer.value = '12.00';
    if (imageUrl) {
        window.currentProductCover = imageUrl;
        const preview = document.getElementById('cover-img-preview');
        if (preview) {
            preview.src = imageUrl;
            preview.style.display = 'block';
        }
        const ph = document.getElementById('cover-img-placeholder');
        if (ph) ph.style.display = 'none';
        const urlInput = document.getElementById('prod-cover-url');
        if (urlInput) urlInput.value = imageUrl;
    }
};

// ==========================================
// MODAL DE GESTIÓN DE PLATAFORMAS (Crear / Editar)
// ==========================================
window.openStreamingPlatformModal = (platformId = null) => {
    const plat = platformId && window._cachedStreamingPlatforms 
        ? window._cachedStreamingPlatforms.find(p => p.id === platformId)
        : null;

    const html = `
        <div style="padding: 24px; max-width: 550px; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="font-size: 18px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-layer-group" style="color: var(--color-primary);"></i> ${plat ? 'Editar' : 'Nueva'} Plataforma de Streaming
                </h3>
                <button class="btn-icon" onclick="closeAdminModalModal()"><i class="fas fa-times"></i></button>
            </div>
            <form onsubmit="handleSaveStreamingPlatform(event, ${plat ? plat.id : 'null'})">
                <div class="form-group" style="margin-bottom: 16px;">
                    <label>Nombre de la Plataforma *</label>
                    <input type="text" id="plat-name" class="form-control" required value="${plat ? plat.name : ''}" placeholder="ej: Netflix, Spotify, Gemini AI, Max, Disney+">
                </div>

                <div class="form-group" style="margin-bottom: 16px;">
                    <label>Logo / Imagen de la Plataforma (URL)</label>
                    <input type="url" id="plat-image-url" class="form-control" value="${plat && plat.image_url ? plat.image_url : ''}" placeholder="https://..." oninput="const img = document.getElementById('plat-preview-img'); if(img){ img.src = this.value; img.style.display = this.value ? 'block' : 'none'; }">
                    <img id="plat-preview-img" src="${plat && plat.image_url ? plat.image_url : ''}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover; margin-top: 8px; display: ${plat && plat.image_url ? 'block' : 'none'}; border: 1px solid var(--border-color);">
                </div>

                <div class="form-group" style="margin-bottom: 16px;">
                    <label>Tipo de Entrega al Cliente *</label>
                    <select id="plat-account-type" class="form-control">
                        <option value="credentials" ${!plat || plat.account_type === 'credentials' ? 'selected' : ''}>👤 Perfil y Clave (Email / Contraseña / PIN)</option>
                        <option value="activation_link" ${plat && plat.account_type === 'activation_link' ? 'selected' : ''}>🔗 Link de Activación (Lista de enlaces individuales)</option>
                        <option value="personal_account" ${plat && plat.account_type === 'personal_account' ? 'selected' : ''}>📧 Agregar a Cuenta Propia (El cliente enviará su correo)</option>
                    </select>
                </div>

                <!-- Límite de usuarios permitidos -->
                <div class="form-group" style="margin-bottom: 16px; background: rgba(99,102,241,0.06); padding: 12px; border-radius: 8px; border: 1px dashed var(--color-primary);">
                    <label style="color: var(--color-primary); font-weight: 700; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-users-cog"></i> Límite de Usuarios / Cupos Permitidos *
                    </label>
                    <input type="number" id="plat-default-max-devices" class="form-control" required value="${plat && plat.default_max_devices ? plat.default_max_devices : 1}" min="1" max="100">
                    <small style="color: var(--text-muted); font-size: 11.5px; display: block; margin-top: 4px;">
                        Cantidad máxima de clientes o dispositivos permitidos para las cuentas de esta plataforma (ej: 1 para individual, 4 para estándar, 6 para familiar).
                    </small>
                    ${plat ? `
                        <label style="font-size: 12px; display: flex; align-items: center; gap: 8px; margin-top: 8px; color: var(--color-primary); cursor: pointer; font-weight: 600;">
                            <input type="checkbox" id="plat-sync-accounts"> Actualizar también el límite de todas las cuentas ya creadas en esta plataforma
                        </label>
                    ` : ''}
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label>Instrucciones de Uso y Advertencias por Defecto</label>
                    <textarea id="plat-default-instructions" class="form-control" rows="3" placeholder="Reglas del servicio para el cliente (ej: usar solo en 1 dispositivo, no cambiar contraseña, etc.)">${plat && plat.default_instructions ? plat.default_instructions : ''}</textarea>
                    <small style="color: var(--text-muted); font-size: 11.5px;">Estas advertencias se cargarán automáticamente al registrar cuentas de esta plataforma.</small>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
                    ${plat ? `
                        <button type="button" class="btn-outline" style="color: var(--danger); border-color: var(--danger);" onclick="handleDeleteStreamingPlatform(${plat.id})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    ` : '<div></div>'}
                    <div style="display: flex; gap: 10px;">
                        <button type="button" class="btn-outline" onclick="closeAdminModalModal()">Cancelar</button>
                        <button type="submit" class="btn-primary">Guardar Plataforma</button>
                    </div>
                </div>
            </form>
        </div>
    `;
    openAdminModalModal(html);
};

window.handleSaveStreamingPlatform = async (e, platformId) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('plat-name').value.trim(),
        image_url: document.getElementById('plat-image-url').value.trim() || null,
        account_type: document.getElementById('plat-account-type').value,
        default_max_devices: Number(document.getElementById('plat-default-max-devices')?.value) || 1,
        sync_existing_accounts: document.getElementById('plat-sync-accounts')?.checked || false,
        default_instructions: document.getElementById('plat-default-instructions').value.trim() || null
    };

    try {
        if (platformId) {
            const res = await AdminService.updateStreamingPlatform(platformId, data);
            showToast(res.message, 'success');
        } else {
            const res = await AdminService.createStreamingPlatform(data);
            showToast(res.message, 'success');
        }
        closeAdminModalModal();
        switchTab('streaming');
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.handleDeleteStreamingPlatform = async (platformId) => {
    if (!confirm('¿Eliminar esta plataforma? Las cuentas asociadas no se borrarán pero quedarán desvinculadas.')) return;
    try {
        const res = await AdminService.deleteStreamingPlatform(platformId);
        showToast(res.message, 'success');
        closeAdminModalModal();
        switchTab('streaming');
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// ==========================================
// MODAL DE GESTIÓN DE CUENTAS / PERFILES (Crear / Editar)
// ==========================================
window.quickEditStreamingAccountLimit = async (accountId, currentLimit, platformName) => {
    const newLimitStr = prompt(`Modificar cupos de "${platformName}" (ID #${accountId}):\n\nIngresa la cantidad máxima de usuarios/perfiles permitidos para esta cuenta:`, currentLimit);
    if (newLimitStr === null) return;
    const newLimit = parseInt(newLimitStr.trim(), 10);
    if (isNaN(newLimit) || newLimit < 1) {
        showToast('Por favor ingresa un número válido (mínimo 1).', 'error');
        return;
    }
    try {
        await AdminService.updateStreamingAccount(accountId, { max_devices: newLimit });
        showToast(`Límite de "${platformName}" actualizado a ${newLimit} cupo(s).`, 'success');
        switchTab('streaming');
    } catch (err) {
        showToast(err.message || 'Error al actualizar cupo.', 'error');
    }
};

window.openStreamingAccountModal = async (accountId = null) => {
    let acc = null;
    if (accountId && window._cachedStreamingAccounts) {
        acc = window._cachedStreamingAccounts.find(a => a.id === accountId);
    }

    const platforms = window._cachedStreamingPlatforms || [];

    let products = [];
    try {
        const prodRes = await AdminService.getProducts({ type: 'digital' });
        products = prodRes.products || prodRes || [];
    } catch (e) {}

    const prodOptions = products.map(p => 
        `<option value="${p.id}" ${acc && acc.product_id === p.id ? 'selected' : ''}>${p.name}</option>`
    ).join('');

    const currentPlat = acc ? acc.platform : '';
    const currentType = acc ? (acc.account_type || 'credentials') : 'credentials';

    const html = `
        <div style="padding: 24px; max-width: 650px; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="font-size: 18px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-key" style="color: var(--color-primary);"></i> ${acc ? 'Editar' : 'Registrar'} Cuenta / Perfil Streaming
                </h3>
                <button class="btn-icon" onclick="closeAdminModalModal()"><i class="fas fa-times"></i></button>
            </div>
            <form onsubmit="handleSaveStreamingAccount(event, ${acc ? acc.id : 'null'})">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    
                    <!-- Plataforma -->
                    <div class="form-group" style="grid-column: span 2;">
                        <label>Plataforma *</label>
                        <select id="stream-platform-select" class="form-control" required onchange="handlePlatformSelectChange(this.value)">
                            <option value="">Seleccionar plataforma existente...</option>
                            ${platforms.map(p => `<option value="${p.name}" data-img="${p.image_url || ''}" data-type="${p.account_type || 'credentials'}" data-instr="${(p.default_instructions || '').replace(/"/g, '&quot;')}" ${currentPlat === p.name ? 'selected' : ''}>${p.name}</option>`).join('')}
                            <option value="__custom__" ${acc && !platforms.some(p => p.name === acc.platform) ? 'selected' : ''}>➕ Otra / Personalizada...</option>
                        </select>
                        <input type="text" id="stream-platform-custom" class="form-control" style="margin-top: 8px; display: ${acc && !platforms.some(p => p.name === acc.platform) ? 'block' : 'none'};" value="${acc ? acc.platform : ''}" placeholder="Escribe el nombre de la plataforma...">
                    </div>

                    <!-- Tipo de Entrega -->
                    <div class="form-group" style="grid-column: span 2;">
                        <label>Tipo de Entrega al Cliente *</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 4px;">
                            <label style="border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 12.5px;">
                                <input type="radio" name="stream_acc_type" value="credentials" ${currentType === 'credentials' ? 'checked' : ''} onchange="toggleAccountTypeFields(this.value)">
                                <div><strong>👤 Perfil / Clave</strong><br><small style="color:var(--text-muted);">Netflix, Disney, Max</small></div>
                            </label>
                            <label style="border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 12.5px;">
                                <input type="radio" name="stream_acc_type" value="activation_link" ${currentType === 'activation_link' ? 'checked' : ''} onchange="toggleAccountTypeFields(this.value)">
                                <div><strong>🔗 Link de Activación</strong><br><small style="color:var(--text-muted);">Spotify, Gemini, Canva</small></div>
                            </label>
                            <label style="border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 12.5px;">
                                <input type="radio" name="stream_acc_type" value="personal_account" ${currentType === 'personal_account' ? 'checked' : ''} onchange="toggleAccountTypeFields(this.value)">
                                <div><strong>📧 Cuenta Propia</strong><br><small style="color:var(--text-muted);">El cliente envía su correo</small></div>
                            </label>
                        </div>
                    </div>

                    <!-- Link de Activación (Resaltado si aplica) -->
                    <div class="form-group" id="field-activation-link" style="grid-column: span 2; ${currentType === 'activation_link' ? 'display: block;' : 'display: none;'}">
                        ${acc ? `
                            <label style="color: #10b981; font-weight: 700;">
                                <i class="fas fa-link"></i> Enlace de Activación
                            </label>
                            <input type="url" id="stream-activation-link" class="form-control" value="${acc && acc.activation_link ? acc.activation_link : ''}" placeholder="https://spotify.com/family/join/...">
                        ` : `
                            <label style="color: #10b981; font-weight: 700; display: flex; align-items: center; justify-content: space-between;">
                                <span><i class="fas fa-list-ol"></i> Lista de Enlaces de Activación (1 por línea) *</span>
                                <span style="font-size: 11px; font-weight: 400; color: var(--text-muted);">Entrega automática individual</span>
                            </label>
                            <textarea id="stream-activation-links-list" class="form-control" rows="4" placeholder="https://spotify.com/family/join/invite/abc1&#10;https://spotify.com/family/join/invite/abc2&#10;https://spotify.com/family/join/invite/abc3"></textarea>
                            <small style="color: var(--text-muted); font-size: 11.5px; display: block; margin-top: 4px;">
                                💡 Puedes pegar 1 o una lista de varios links. Cada link se registrará como 1 unidad de stock y al confirmar cada compra se entregará automáticamente 1 link único al cliente.
                            </small>
                            <input type="hidden" id="stream-activation-link" value="">
                        `}
                    </div>

                    <!-- Aviso de Cuenta Propia -->
                    <div class="form-group" id="notice-personal-account" style="grid-column: span 2; display: ${currentType === 'personal_account' ? 'block' : 'none'}; background: rgba(99,102,241,0.08); border: 1px dashed var(--color-primary); border-radius: 8px; padding: 12px;">
                        <div style="font-weight: 700; color: var(--color-primary); font-size: 13px; margin-bottom: 4px;">
                            <i class="fas fa-user-check"></i> Modalidad: Agregar a Cuenta Propia
                        </div>
                        <p style="font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.4;">
                            En esta modalidad <strong>no necesitas ingresar contraseñas</strong>. El cliente recibirá un formulario en su panel para ingresar el correo personal que desea vincular, y tú como Admin podrás ver su correo y confirmar la activación con un solo clic.
                        </p>
                    </div>

                    <!-- Credenciales (Email y Contraseña) -->
                    <div class="form-group" id="field-email" style="${currentType === 'activation_link' ? 'opacity: 0.7;' : ''}">
                        <label>Correo / Usuario <span id="email-req-star">${currentType === 'activation_link' ? '(Opcional)' : '*'}</span></label>
                        <input type="text" id="stream-email" class="form-control" value="${acc ? (acc.email || '') : ''}" placeholder="cuenta@correo.com">
                    </div>

                    <div class="form-group" id="field-password" style="${currentType === 'activation_link' ? 'opacity: 0.7;' : ''}">
                        <label>Contraseña <span id="pass-req-star">${currentType === 'activation_link' ? '(Opcional)' : '*'}</span></label>
                        <input type="text" id="stream-password" class="form-control" value="${acc ? (acc.password || '') : ''}" placeholder="Contraseña de la cuenta">
                    </div>

                    <!-- Perfil y PIN -->
                    <div class="form-group" id="field-profile-name">
                        <label>Nombre de Perfil Asignado</label>
                        <input type="text" id="stream-profile-name" class="form-control" value="${acc && acc.profile_name ? acc.profile_name : ''}" placeholder="ej: Perfil 1 / Joel / Pantalla 3">
                    </div>

                    <div class="form-group" id="field-profile-pin">
                        <label>PIN de Seguridad del Perfil</label>
                        <input type="text" id="stream-profile-pin" class="form-control" value="${acc && acc.profile_pin ? acc.profile_pin : ''}" placeholder="ej: 1234">
                    </div>

                    <!-- Límite de la Cuenta (Solo Admin) -->
                    <div class="form-group" style="background: rgba(99,102,241,0.06); padding: 12px; border-radius: 8px; border: 1px dashed var(--color-primary);">
                        <label style="color: var(--color-primary); font-weight: 700; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-tachometer-alt"></i> Límite de la Cuenta (Cupos Máximos) *
                        </label>
                        <input type="number" id="stream-max-devices" class="form-control" required value="${acc ? acc.max_devices : 1}" min="1" max="50">
                        <small style="color: var(--text-muted); font-size: 11px; display: block; margin-top: 4px;">
                            Cantidad máxima de clientes o dispositivos que pueden usar esta cuenta de manera independiente. (Ej: 1 para perfil único, 4 para cuenta completa, 5 o 6 para familiar).
                        </small>
                        ${acc ? `
                            <div style="margin-top: 8px; font-size: 11.5px; padding: 6px 10px; background: rgba(0,0,0,0.2); border-radius: 6px; display: flex; justify-content: space-between;">
                                <span>Cupos ocupados actualmente: <strong style="color: #f59e0b;">${acc.current_users_count || 0}</strong></span>
                                <span>Cupos libres: <strong style="color: #10b981;">${acc.available_slots || 0}</strong></span>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Logo / Imagen específica -->
                    <div class="form-group">
                        <label>Imagen / Logo de la Plataforma (URL)</label>
                        <input type="url" id="stream-platform-image" class="form-control" value="${acc && acc.platform_image ? acc.platform_image : ''}" placeholder="https://...">
                    </div>

                    <!-- Vencimiento y Producto Asociado -->
                    <div class="form-group">
                        <label>Fecha de Vencimiento</label>
                        <input type="date" id="stream-expiration-date" class="form-control" value="${acc && acc.expiration_date ? acc.expiration_date.substring(0, 10) : ''}">
                    </div>

                    <div class="form-group">
                        <label>Producto del Catálogo Asociado (Opcional)</label>
                        <select id="stream-product-id" class="form-control">
                            <option value="">Ninguno / Libre (Asignación por nombre)</option>
                            ${prodOptions}
                        </select>
                    </div>

                    <!-- Instrucciones de Uso y Advertencias para el Cliente -->
                    <div class="form-group" style="grid-column: span 2;">
                        <label style="color: #f59e0b; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-exclamation-triangle"></i> Información de Uso y Advertencias para el Cliente
                        </label>
                        <textarea id="stream-usage-instructions" class="form-control" rows="3" placeholder="Instrucciones y reglas de garantía que el cliente verá en su panel...">${acc && acc.usage_instructions ? acc.usage_instructions : ''}</textarea>
                    </div>

                    <!-- Notas internas -->
                    <div class="form-group" style="grid-column: span 2;">
                        <label>Notas Internas (Solo Admin)</label>
                        <textarea id="stream-notes" class="form-control" rows="2" placeholder="Notas sobre el proveedor, número de teléfono, costos, etc.">${acc && acc.notes ? acc.notes : ''}</textarea>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                    <button type="button" class="btn-outline" onclick="closeAdminModalModal()">Cancelar</button>
                    <button type="submit" class="btn-primary">Guardar Cuenta / Perfil</button>
                </div>
            </form>
        </div>
    `;
    openAdminModalModal(html);
};

window.handlePlatformSelectChange = (platformName) => {
    const customInput = document.getElementById('stream-platform-custom');
    const imageInput = document.getElementById('stream-platform-image');
    const instrInput = document.getElementById('stream-usage-instructions');
    const select = document.getElementById('stream-platform-select');

    if (platformName === '__custom__') {
        if (customInput) { customInput.style.display = 'block'; customInput.focus(); }
        return;
    } else {
        if (customInput) customInput.style.display = 'none';
    }

    const selectedOption = select ? select.options[select.selectedIndex] : null;
    if (selectedOption) {
        const img = selectedOption.getAttribute('data-img');
        const type = selectedOption.getAttribute('data-type');
        const instr = selectedOption.getAttribute('data-instr');

        if (imageInput && img && !imageInput.value) imageInput.value = img;
        if (instrInput && instr && !instrInput.value) instrInput.value = instr;
        if (type) {
            const radio = document.querySelector(`input[name="stream_acc_type"][value="${type}"]`);
            if (radio) {
                radio.checked = true;
                toggleAccountTypeFields(type);
            }
        }
    }
};

window.toggleAccountTypeFields = (type) => {
    const linkField = document.getElementById('field-activation-link');
    const personalNotice = document.getElementById('notice-personal-account');
    const emailField = document.getElementById('field-email');
    const passField = document.getElementById('field-password');
    const profileField = document.getElementById('field-profile-name');
    const pinField = document.getElementById('field-profile-pin');
    const emailStar = document.getElementById('email-req-star');
    const passStar = document.getElementById('pass-req-star');

    if (type === 'activation_link') {
        if (linkField) linkField.style.display = 'block';
        if (personalNotice) personalNotice.style.display = 'none';
        if (emailField) emailField.style.display = 'none';
        if (passField) passField.style.display = 'none';
        if (profileField) profileField.style.display = 'none';
        if (pinField) pinField.style.display = 'none';
    } else if (type === 'personal_account') {
        if (linkField) linkField.style.display = 'none';
        if (personalNotice) personalNotice.style.display = 'block';
        if (emailField) emailField.style.display = 'none';
        if (passField) passField.style.display = 'none';
        if (profileField) profileField.style.display = 'block';
        if (pinField) pinField.style.display = 'none';
    } else {
        // credentials
        if (linkField) linkField.style.display = 'none';
        if (personalNotice) personalNotice.style.display = 'none';
        if (emailField) { emailField.style.display = 'block'; emailField.style.opacity = '1'; }
        if (passField) { passField.style.display = 'block'; passField.style.opacity = '1'; }
        if (profileField) profileField.style.display = 'block';
        if (pinField) pinField.style.display = 'block';
        if (emailStar) emailStar.innerText = '*';
        if (passStar) passStar.innerText = '*';
    }
};

window.handleSaveStreamingAccount = async (e, accountId) => {
    e.preventDefault();

    const platformSelect = document.getElementById('stream-platform-select').value;
    const platformCustom = document.getElementById('stream-platform-custom')?.value.trim();
    const finalPlatform = platformSelect === '__custom__' ? platformCustom : platformSelect;

    if (!finalPlatform) {
        showToast('Por favor selecciona o ingresa el nombre de la plataforma', 'error');
        return;
    }

    const typeRadio = document.querySelector('input[name="stream_acc_type"]:checked');
    const accountType = typeRadio ? typeRadio.value : 'credentials';

    const activationLink = document.getElementById('stream-activation-link')?.value.trim() || null;
    const email = document.getElementById('stream-email')?.value.trim() || null;
    const password = document.getElementById('stream-password')?.value.trim() || null;

    const linksList = document.getElementById('stream-activation-links-list')?.value.trim() || null;

    if (accountType === 'activation_link' && !activationLink && !linksList) {
        showToast('Para cuentas tipo activación, ingresa al menos un enlace de activación', 'error');
        return;
    }

    if (accountType === 'credentials' && !email && !password) {
        showToast('Ingresa el correo o contraseña de la cuenta', 'error');
        return;
    }

    // Buscar platform_id
    const platObj = (window._cachedStreamingPlatforms || []).find(p => p.name.toLowerCase() === finalPlatform.toLowerCase());

    const data = {
        platform: finalPlatform,
        platform_id: platObj ? platObj.id : null,
        platform_image: document.getElementById('stream-platform-image')?.value.trim() || null,
        account_type: accountType,
        email: email,
        password: password,
        profile_name: document.getElementById('stream-profile-name')?.value.trim() || null,
        profile_pin: document.getElementById('stream-profile-pin')?.value.trim() || null,
        activation_link: activationLink,
        activation_links_list: linksList,
        usage_instructions: document.getElementById('stream-usage-instructions')?.value.trim() || null,
        max_devices: Number(document.getElementById('stream-max-devices').value) || 1,
        expiration_date: document.getElementById('stream-expiration-date')?.value || null,
        product_id: document.getElementById('stream-product-id')?.value ? Number(document.getElementById('stream-product-id').value) : null,
        notes: document.getElementById('stream-notes')?.value.trim() || null
    };

    try {
        if (accountId) {
            const res = await AdminService.updateStreamingAccount(accountId, data);
            showToast(res.message, 'success');
        } else {
            const res = await AdminService.createStreamingAccount(data);
            showToast(res.message, 'success');
        }
        closeAdminModalModal();
        switchTab('streaming');
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.handleDeleteStreamingAccount = async (accountId) => {
    if (!confirm('¿Estás seguro de eliminar esta cuenta de streaming? Se liberarán todas sus asignaciones.')) return;
    try {
        const res = await AdminService.deleteStreamingAccount(accountId);
        showToast(res.message, 'success');
        switchTab('streaming');
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.openAssignStreamingUserModal = async (accountId) => {
    const acc = (window._cachedStreamingAccounts || []).find(a => a.id === accountId);
    if (!acc) return;

    const availableSlots = Math.max(0, (acc.max_devices || 1) - (acc.current_users_count || 0));

    const html = `
        <div style="padding: 24px; max-width: 500px; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="font-size: 18px; font-weight: 700; margin: 0;">Asignar Usuario a Cuenta Streaming</h3>
                <button class="btn-icon" onclick="closeAdminModalModal()"><i class="fas fa-times"></i></button>
            </div>
            <div style="margin-bottom: 16px; background: var(--bg-hover); padding: 14px; border-radius: 8px; font-size: 13px;">
                <div><strong>Plataforma:</strong> ${acc.platform}</div>
                <div><strong>Cuenta:</strong> ${acc.email || acc.activation_link || 'Sin correo'} (${acc.profile_name || 'Sin perfil'})</div>
                <div style="margin-top: 4px; color: ${availableSlots > 0 ? '#10b981' : '#ef4444'}; font-weight: 700;">
                    ${availableSlots > 0 ? `✅ ${availableSlots} cupo(s) disponible(s) de ${acc.max_devices}` : `🚫 Cuenta Llena (${acc.max_devices}/${acc.max_devices})`}
                </div>
            </div>
            <form onsubmit="handleSubmitAssignStreamingUser(event, ${acc.id})">
                <div class="form-group" style="margin-bottom: 16px;">
                    <label>ID del Usuario / Cliente *</label>
                    <input type="number" id="assign-user-id" class="form-control" required placeholder="ej: 3">
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label>ID del Pedido / Orden (Opcional)</label>
                    <input type="number" id="assign-order-id" class="form-control" placeholder="ej: 14">
                </div>
                <div class="form-group" style="margin-bottom: 20px;">
                    <label>Fecha de Expiración del Acceso (Opcional)</label>
                    <input type="date" id="assign-expires-at" class="form-control" value="${acc.expiration_date ? acc.expiration_date.substring(0, 10) : ''}">
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 12px;">
                    <button type="button" class="btn-outline" onclick="closeAdminModalModal()">Cancelar</button>
                    <button type="submit" class="btn-primary" ${availableSlots <= 0 ? 'disabled' : ''}>Asignar Cupo</button>
                </div>
            </form>
        </div>
    `;
    openAdminModalModal(html);
};

window.handleSubmitAssignStreamingUser = async (e, accountId) => {
    e.preventDefault();
    const payload = {
        account_id: accountId,
        user_id: Number(document.getElementById('assign-user-id').value),
        order_id: document.getElementById('assign-order-id').value ? Number(document.getElementById('assign-order-id').value) : null,
        expires_at: document.getElementById('assign-expires-at').value || null
    };

    try {
        const res = await AdminService.assignStreamingUser(payload);
        showToast(res.message, 'success');
        closeAdminModalModal();
        switchTab('streaming');
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.handleUnassignStreamingUser = async (assignmentId) => {
    if (!confirm('¿Liberar este cupo de usuario?')) return;
    try {
        const res = await AdminService.unassignStreamingUser(assignmentId);
        showToast(res.message, 'success');
        switchTab('streaming');
    } catch (err) {
        showToast(err.message, 'error');
    }
};



window.handleMarkAssignmentLinked = async (assignmentId) => {
    try {
        const res = await AdminService.markStreamingAssignmentLinked(assignmentId);
        showToast(res.message, 'success');
        switchTab('streaming');
    } catch (err) {
        showToast(err.message || 'Error al actualizar vinculación', 'error');
    }
};
