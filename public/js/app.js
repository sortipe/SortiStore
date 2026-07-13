/* ==========================================================================
   LÓGICA PRINCIPAL Y RUTAS DE LA TIENDA CLIENTE (SORTISTORE SPA)
   ========================================================================== */

// Estado global de la aplicación
const AppState = {
    user: null,
    currentView: 'home',
    currentParams: {},
    activeTimer: null
};

// ==========================================
// RUTEADOR DE LA SPA
// ==========================================
async function router() {
    // Limpiar cualquier intervalo activo (ej: temporizadores de preventa)
    if (AppState.activeTimer) {
        clearInterval(AppState.activeTimer);
        AppState.activeTimer = null;
    }
    
    if (sliderAutoplayInterval) {
        clearInterval(sliderAutoplayInterval);
        sliderAutoplayInterval = null;
    }

    const hash = window.location.hash || '#/';
    const viewContainer = document.getElementById('app-view');
    viewContainer.innerHTML = ''; // Limpiar contenedor

    // Autenticar al usuario si hay token disponible
    if (!AppState.user) {
        try {
            const data = await AuthService.getMe();
            if (data && data.user) {
                AppState.user = data.user;
                updateHeaderAuthUI();
            }
        } catch (e) {
            AuthService.logout();
            AppState.user = null;
        }
    }

    // Ruta: Detalle de Producto (#/product/slug)
    if (hash.startsWith('#/product/')) {
        const slug = hash.replace('#/product/', '');
        AppState.currentView = 'product-detail';
        renderProductDetail(slug);
        return;
    }

    // Ruta: Categoría (#/category/slug)
    if (hash.startsWith('#/category/')) {
        const catSlug = hash.replace('#/category/', '');
        AppState.currentView = 'category';
        renderCategoryPage(catSlug);
        return;
    }

    // Rutas simples
    switch (hash) {
        case '#/':
        default:
            AppState.currentView = 'home';
            renderHome();
            break;
        case '#/shop':
            AppState.currentView = 'shop';
            renderShopPage();
            break;
        case '#/checkout':
            AppState.currentView = 'checkout';
            renderCheckout();
            break;
        case '#/dashboard':
            AppState.currentView = 'dashboard';
            if (!AppState.user) {
                window.location.hash = '#/auth';
            } else {
                renderDashboard();
            }
            break;
        case '#/auth':
            AppState.currentView = 'auth';
            if (AppState.user) {
                window.location.hash = '#/';
            } else {
                renderAuth();
            }
            break;
    }
}

// Escuchar cambios de ruta y carga inicial
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const settings = await ShopService.getSettings();
        if (settings.site_branding) {
            const branding = typeof settings.site_branding === 'string' ? JSON.parse(settings.site_branding) : settings.site_branding;
            
            if (branding.site_name) {
                document.title = branding.site_name;
                const logoBtn = document.getElementById('logo-btn');
                if (logoBtn) {
                    logoBtn.innerHTML = `<i class="fas fa-shopping-bag"></i> ${branding.site_name.replace(/(store|tienda)/i, '<span>$1</span>')}`;
                }
            }
            if (branding.primary_color) {
                document.documentElement.style.setProperty('--color-primary', branding.primary_color);
            }
            if (branding.accent_color) {
                document.documentElement.style.setProperty('--color-accent', branding.accent_color);
            }
        }
    } catch (e) {
        console.error('Error al aplicar marca personalizada:', e);
    }

    router();
    initGlobalEvents();
});

// ==========================================
// ACTUALIZACIÓN DE CABECERA
// ==========================================
function updateHeaderAuthUI() {
    const walletDisplay = document.getElementById('header-wallet-display');
    const walletBalance = document.getElementById('header-wallet-balance');
    const adminShortcut = document.getElementById('admin-shortcut-btn');

    if (AppState.user) {
        if (AppState.user.role === 'client') {
            walletDisplay.style.display = 'flex';
            walletBalance.textContent = AppState.user.sortiBalance || 0;
            adminShortcut.style.display = 'none';
        } else {
            // Empleado o Admin
            walletDisplay.style.display = 'none';
            adminShortcut.style.display = 'inline-flex';
        }
    } else {
        walletDisplay.style.display = 'none';
        adminShortcut.style.display = 'none';
    }
}

// ==========================================
// VISTA: INICIO / HOME
// ==========================================
async function renderHome() {
    const container = document.getElementById('app-view');
    
    // Inyectar esqueleto mientras carga
    container.innerHTML = `
        <div class="hero-slider skeleton" style="height: 350px; border-radius: var(--radius-lg); margin-top: 24px;"></div>
        <div class="main-storefront">
            <div class="section-header" style="margin-top: 32px;"><div class="skeleton" style="height: 32px; width: 250px;"></div></div>
            <div class="product-grid">${Skeletons.getProductGrid(4)}</div>
        </div>
    `;

    try {
        // Cargar productos destacados, ofertas y configuraciones en paralelo
        const [products, settings] = await Promise.all([
            ShopService.getProducts(),
            ShopService.getSettings().catch(() => ({}))
        ]);
        
        // Filtrar destacados y ofertas
        const featuredProducts = products.filter(p => p.is_featured);
        const offerProducts = products.filter(p => p.price_offer !== null);
        const presaleProducts = products.filter(p => p.is_presale);

        let banners = [];
        if (settings.home_banners) {
            banners = typeof settings.home_banners === 'string' ? JSON.parse(settings.home_banners) : settings.home_banners;
        } else if (settings.home_banner) {
            const single = typeof settings.home_banner === 'string' ? JSON.parse(settings.home_banner) : settings.home_banner;
            banners = [single];
        }

        if (!banners || banners.length === 0) {
            banners = [
                {
                    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600',
                    badge: 'Campaña de Julio',
                    title: 'Tecnología y Software en un solo lugar',
                    description: 'Descubre hardware premium, cursos interactivos LMS y software empresarial con entrega instantánea.',
                    link: '#/category/tecnologia',
                    bg_y: 50
                }
            ];
        }

        currentSlideIndex = 0;

        // Estructura HTML de la página principal
        container.innerHTML = `
            <!-- Banner / Hero Premium Slider -->
            <div class="hero-slider" id="hero-carousel-container">
                ${banners.map((slide, index) => `
                    <div class="slide ${index === 0 ? 'active' : ''}" style="background-image: url('${slide.image_url}'); background-position: center ${slide.bg_y !== undefined ? slide.bg_y : 50}%;">
                        <div class="slide-content animate-fade-in">
                            ${slide.badge ? `<span class="badge badge-featured" style="margin-bottom: 12px; background: rgba(99,102,241,0.2); color: white;">${slide.badge}</span>` : ''}
                            <h2>${slide.title}</h2>
                            <p>${slide.description}</p>
                            <a href="${slide.link || '#/'}" class="btn-primary"><i class="fas fa-shopping-bag"></i> Explorar Tienda</a>
                        </div>
                    </div>
                `).join('')}
                
                ${banners.length > 1 ? `
                    <button class="slider-arrow prev" onclick="moveSliderCall(-1)"><i class="fas fa-chevron-left"></i></button>
                    <button class="slider-arrow next" onclick="moveSliderCall(1)"><i class="fas fa-chevron-right"></i></button>
                    <div class="slider-dots">
                        ${banners.map((_, index) => `
                            <span class="dot ${index === 0 ? 'active' : ''}" onclick="setSliderCall(${index})"></span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>

            <div class="main-storefront">
                <!-- Zona de Ofertas (Con Temporizador) -->
                ${offerProducts.length > 0 ? `
                    <div class="section-header" style="margin-top: 48px;">
                        <h2><i class="fas fa-bolt" style="color: var(--color-accent);"></i> Zona de Ofertas Flash</h2>
                        <div class="countdown-timer" id="home-flash-timer">
                            Cargando...
                        </div>
                    </div>
                    <div class="product-grid">
                        ${offerProducts.slice(0, 4).map(p => getProductCardHtml(p)).join('')}
                    </div>
                ` : ''}

                <!-- Preventas Especiales -->
                ${presaleProducts.length > 0 ? `
                    <div class="section-header" style="margin-top: 48px;">
                        <h2><i class="fas fa-hourglass-start" style="color: var(--color-accent);"></i> Próximos Lanzamientos / Preventas</h2>
                    </div>
                    <div class="product-grid">
                        ${presaleProducts.slice(0, 4).map(p => getProductCardHtml(p)).join('')}
                    </div>
                ` : ''}

                <!-- Destacados Generales -->
                <div class="section-header" style="margin-top: 48px;">
                    <h2><i class="fas fa-star" style="color: var(--color-accent);"></i> Productos Destacados</h2>
                    <a href="#/category/tecnologia" class="btn-outline" style="padding: 8px 16px; font-size: 13px;">Ver todos</a>
                </div>
                <div class="product-grid">
                    ${featuredProducts.map(p => getProductCardHtml(p)).join('')}
                </div>
            </div>
        `;

        // Inicializar temporizador de ofertas (simulado a las 11:59 PM de hoy)
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        if (document.getElementById('home-flash-timer')) {
            AppState.activeTimer = startCountdown(endOfDay.toISOString(), 'home-flash-timer');
        }

        // Inicializar contadores de preventa individuales
        presaleProducts.forEach(p => {
            if (p.presale_launch_date) {
                startCountdown(p.presale_launch_date, `card-timer-${p.id}`);
            }
        });

        if (banners.length > 1) {
            resetSliderAutoplay(banners.length);
        }

    } catch (error) {
        showToast('Error al cargar la página principal', 'error');
    }
}

// ==========================================
// CONTROLADOR DEL CAROUSEL DEL HOME BANNER
// ==========================================
let currentSlideIndex = 0;
let sliderAutoplayInterval = null;

window.moveSliderCall = (direction) => {
    const slides = document.querySelectorAll('#hero-carousel-container .slide');
    const dots = document.querySelectorAll('#hero-carousel-container .dot');
    if (slides.length <= 1) return;
    
    slides[currentSlideIndex].classList.remove('active');
    if (dots.length > 0) dots[currentSlideIndex].classList.remove('active');
    
    currentSlideIndex = (currentSlideIndex + direction + slides.length) % slides.length;
    
    slides[currentSlideIndex].classList.add('active');
    if (dots.length > 0) dots[currentSlideIndex].classList.add('active');
    
    resetSliderAutoplay(slides.length);
};

window.setSliderCall = (index) => {
    const slides = document.querySelectorAll('#hero-carousel-container .slide');
    const dots = document.querySelectorAll('#hero-carousel-container .dot');
    if (slides.length <= 1) return;
    
    slides[currentSlideIndex].classList.remove('active');
    if (dots.length > 0) dots[currentSlideIndex].classList.remove('active');
    
    currentSlideIndex = index;
    
    slides[currentSlideIndex].classList.add('active');
    if (dots.length > 0) dots[currentSlideIndex].classList.add('active');
    
    resetSliderAutoplay(slides.length);
};

function resetSliderAutoplay(slidesLength) {
    if (sliderAutoplayInterval) clearInterval(sliderAutoplayInterval);
    sliderAutoplayInterval = setInterval(() => {
        window.moveSliderCall(1);
    }, 6000);
}

// ==========================================
// VISTA: DETALLE DEL PRODUCTO
// ==========================================
async function renderProductDetail(slug) {
    const container = document.getElementById('app-view');
    container.innerHTML = `
        <div class="product-detail-layout">
            <div class="skeleton" style="height: 500px; border-radius: var(--radius-lg);"></div>
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div class="skeleton" style="height: 48px; width: 80%;"></div>
                <div class="skeleton" style="height: 24px; width: 30%;"></div>
                <div class="skeleton" style="height: 120px; width: 100%;"></div>
                <div class="skeleton" style="height: 80px; width: 100%; border-radius: 12px;"></div>
                <div class="skeleton" style="height: 50px; width: 50%; border-radius: 8px;"></div>
            </div>
        </div>
    `;

    try {
        const product = await ShopService.getProductBySlug(slug);
        
        // Agrupar variantes por tipo
        const variantsByType = {};
        if (product.variants && product.variants.length > 0) {
            product.variants.forEach(v => {
                if (!variantsByType[v.type]) variantsByType[v.type] = [];
                variantsByType[v.type].push(v.value);
            });
        }

        const isPresaleActive = product.is_presale && product.presale_launch_date;
        const mainImage = product.media && product.media.length > 0 ? product.media[0].media_url : 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600';

        container.innerHTML = `
            <div class="product-detail-layout animate-fade-in">
                <!-- Galería multimedia -->
                <div class="product-gallery">
                    <div class="gallery-main">
                        <img src="${mainImage}" alt="${product.name}" id="detail-main-img">
                    </div>
                    <div class="gallery-thumbs">
                        ${(product.media || []).map((m, idx) => `
                            <div class="thumb-item ${idx === 0 ? 'active' : ''}" onclick="document.getElementById('detail-main-img').src='${m.media_url}'; document.querySelectorAll('.thumb-item').forEach(t=>t.classList.remove('active')); this.classList.add('active');">
                                <img src="${m.media_url}" alt="thumb">
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Detalles e Información -->
                <div class="product-info">
                    <div class="product-meta-list">
                        <span class="badge ${product.type === 'physical' ? 'badge-featured' : 'badge-new'}">${product.type.toUpperCase()}</span>
                        ${product.is_featured ? '<span class="badge badge-featured">Destacado</span>' : ''}
                        ${product.is_new ? '<span class="badge badge-new">Nuevo</span>' : ''}
                        ${product.is_presale ? '<span class="badge badge-presale">Preventa</span>' : ''}
                    </div>

                    <h1>${product.name}</h1>
                    <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">SKU: ${product.sku || 'N/A'} | Marca: ${product.brand || 'Original'}</p>
                    
                    <!-- Precios -->
                    <div class="product-price-box">
                        <div class="card-price-row">
                            <span class="card-price-offer" style="font-size: 32px;">S/. ${(product.price_offer || product.price_normal).toFixed(2)}</span>
                            ${product.price_offer ? `<span class="card-price-normal" style="font-size: 20px;">S/. ${product.price_normal.toFixed(2)}</span>` : ''}
                        </div>
                        ${product.price_sorti ? `
                            <div class="card-sorti-price" style="font-size: 14px;">
                                <i class="fas fa-coins"></i> Precio Exclusivo Sorti: <strong>${product.price_sorti} monedas</strong>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Si es preventa, mostrar cuenta regresiva y fecha de lanzamiento -->
                    ${isPresaleActive ? `
                        <div class="glass-panel" style="padding: 20px; margin-bottom: 32px; border-left: 4px solid var(--color-accent);">
                            <h4 style="color: var(--color-accent); margin-bottom: 8px;"><i class="fas fa-clock"></i> Lanzamiento Oficial en:</h4>
                            <div id="detail-presale-timer" style="font-size: 24px; font-weight: 800; color: var(--text-primary);">--d --h --m --s</div>
                            <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">Fecha estimada de entrega: 5-7 días hábiles después del lanzamiento oficial.</p>
                        </div>
                    ` : ''}

                    <p style="color: var(--text-secondary); margin-bottom: 32px; font-size: 15px;">${product.description}</p>

                    <!-- Selectores de Variantes -->
                    ${Object.keys(variantsByType).map(type => `
                        <div class="product-variants-box">
                            <div class="variant-selector">
                                <label>Selecciona ${type}:</label>
                                <div class="variant-options" data-variant-type="${type}">
                                    ${variantsByType[type].map((val, idx) => `
                                        <div class="variant-option ${idx === 0 ? 'selected' : ''}" onclick="selectVariantOption(this, '${type}', '${val}')">${val}</div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `).join('')}

                    <!-- Controles de Compra -->
                    <div style="display: flex; gap: 16px; margin-top: 24px;">
                        <div style="display: flex; align-items: center; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            <button onclick="adjustDetailQty(-1)" style="padding: 12px 16px; font-weight: bold; color: var(--text-secondary);"><i class="fas fa-minus"></i></button>
                            <span id="detail-qty-val" style="padding: 0 16px; font-weight: bold; font-size: 16px;">1</span>
                            <button onclick="adjustDetailQty(1)" style="padding: 12px 16px; font-weight: bold; color: var(--text-secondary);"><i class="fas fa-plus"></i></button>
                        </div>

                        <button class="btn-primary" id="detail-add-cart-btn" style="flex: 1; padding: 16px;">
                            <i class="fas fa-shopping-cart"></i> Agregar al Carrito
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Activar timer de preventa
        if (isPresaleActive) {
            AppState.activeTimer = startCountdown(product.presale_launch_date, 'detail-presale-timer');
        }

        // Listener para agregar al carrito
        document.getElementById('detail-add-cart-btn').addEventListener('click', () => {
            const qty = Number(document.getElementById('detail-qty-val').textContent);
            
            // Recoger variantes seleccionadas
            const selectedVariants = {};
            const optionContainers = container.querySelectorAll('.variant-options');
            optionContainers.forEach(container => {
                const type = container.getAttribute('data-variant-type');
                const selectedOption = container.querySelector('.variant-option.selected');
                if (selectedOption) {
                    selectedVariants[type] = selectedOption.textContent;
                }
            });

            Cart.addItem(product, qty, selectedVariants);
            renderCartDrawerList();
            document.getElementById('cart-drawer-container').classList.add('active');
            document.getElementById('cart-drawer-overlay').classList.add('active');
        });

    } catch (error) {
        container.innerHTML = `<div class="main-storefront" style="text-align: center; padding: 80px 24px;"><h2>Error: Producto no encontrado.</h2><a href="#/" class="btn-primary" style="margin-top:20px;">Volver a Inicio</a></div>`;
    }
}

// Helpers globales para lecciones, variantes e incrementador de cantidad en detalle
window.selectVariantOption = (el, type, val) => {
    const parent = el.closest('.variant-options');
    parent.querySelectorAll('.variant-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
};

window.adjustDetailQty = (offset) => {
    const valEl = document.getElementById('detail-qty-val');
    let cur = Number(valEl.textContent);
    cur += offset;
    if (cur < 1) cur = 1;
    valEl.textContent = cur;
};

// ==========================================
// VISTA: PÁGINA DE CATEGORÍA
// ==========================================
async function renderCategoryPage(catSlug) {
    const container = document.getElementById('app-view');
    container.innerHTML = `
        <div class="main-storefront" style="margin-top: 32px;">
            <div class="section-header"><div class="skeleton" style="height: 32px; width: 200px;"></div></div>
            <div class="product-grid">${Skeletons.getProductGrid(4)}</div>
        </div>
    `;

    try {
        const products = await ShopService.getProducts({ category: catSlug });
        
        container.innerHTML = `
            <div class="main-storefront animate-fade-in" style="margin-top: 40px;">
                <div class="section-header">
                    <h2 style="text-transform: capitalize;"><i class="fas fa-tags" style="color: var(--color-primary);"></i> Categoría: ${catSlug.replace('-', ' ')}</h2>
                    <span style="color: var(--text-muted); font-weight: 600;">${products.length} productos encontrados</span>
                </div>
                
                ${products.length === 0 ? `
                    <div style="text-align: center; padding: 80px 24px; background-color: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
                        <i class="fas fa-folder-open" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
                        <h3>Aún no hay productos disponibles en esta categoría.</h3>
                        <a href="#/" class="btn-primary" style="margin-top: 20px;">Explorar otras categorías</a>
                    </div>
                ` : `
                    <div class="product-grid">
                        ${products.map(p => getProductCardHtml(p)).join('')}
                    </div>
                `}
            </div>
        `;
    } catch (error) {
        showToast('Error al cargar la categoría', 'error');
    }
}

// ==========================================
// VISTA: TIENDA DE PRODUCTOS FÍSICOS
// ==========================================
async function renderShopPage() {
    const container = document.getElementById('app-view');
    container.innerHTML = `
        <div class="main-storefront animate-fade-in" style="margin-top: 40px;">
            <div class="section-header">
                <h2><i class="fas fa-store" style="color: var(--color-primary);"></i> Tienda de Productos Físicos</h2>
                <span style="color: var(--text-muted); font-weight: 600;">Cargando productos...</span>
            </div>
            <div class="skeleton" style="height: 350px; border-radius: var(--radius-lg);"></div>
        </div>
    `;

    try {
        const allProducts = await ShopService.getProducts();
        const products = allProducts.filter(p => p.type === 'physical');

        container.innerHTML = `
            <div class="main-storefront animate-fade-in" style="margin-top: 40px;">
                <div class="section-header">
                    <h2><i class="fas fa-store" style="color: var(--color-primary);"></i> Tienda de Productos Físicos</h2>
                    <span style="color: var(--text-muted); font-weight: 600;">${products.length} productos físicos encontrados</span>
                </div>
                
                ${products.length === 0 ? `
                    <div style="text-align: center; padding: 80px 24px; background-color: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
                        <i class="fas fa-box-open" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
                        <h3>Aún no hay productos físicos disponibles en la tienda.</h3>
                        <a href="#/" class="btn-primary" style="margin-top: 20px;">Explorar Inicio</a>
                    </div>
                ` : `
                    <div class="product-grid">
                        ${products.map(p => getProductCardHtml(p)).join('')}
                    </div>
                `}
            </div>
        `;
    } catch (error) {
        showToast('Error al cargar la tienda física', 'error');
    }
}

// ==========================================
// GENERADOR DE CARTA DE PRODUCTO EN TIENDA
// ==========================================
function getProductCardHtml(product) {
    const basePrice = product.price_offer ? product.price_offer : product.price_normal;
    const isOffer = product.price_offer !== null;
    const mainImage = product.media && product.media.length > 0 ? product.media[0].media_url : 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300';
    
    // Decidir etiqueta / badge
    let badgeHtml = '';
    if (product.is_presale) badgeHtml = '<span class="badge badge-presale card-badge">PREVENTA</span>';
    else if (product.is_new) badgeHtml = '<span class="badge badge-new card-badge">NUEVO</span>';
    else if (product.is_sold_out || product.stock <= 0) badgeHtml = '<span class="badge badge-soldout card-badge">AGOTADO</span>';
    else if (product.is_featured) badgeHtml = '<span class="badge badge-featured card-badge">RECOMENDADO</span>';

    return `
        <div class="product-card animate-fade-in">
            ${badgeHtml}
            <div class="card-image" onclick="window.location.hash='#/product/${product.slug}'" style="cursor: pointer;">
                <img src="${mainImage}" alt="${product.name}">
            </div>
            <div class="card-details">
                <div class="card-category">${product.type.toUpperCase()} | ${product.brand || 'Original'}</div>
                <h3 class="card-title" onclick="window.location.hash='#/product/${product.slug}'" style="cursor: pointer;">${product.name}</h3>
                
                <!-- Si es preventa, mostrar cuenta regresiva en miniatura -->
                ${product.is_presale && product.presale_launch_date ? `
                    <div style="font-size: 11px; color: var(--color-accent); font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-clock"></i> Lanzamiento: <span id="card-timer-${product.id}">Cargando...</span>
                    </div>
                ` : ''}

                <div class="card-price-row">
                    <span class="card-price-offer">S/. ${basePrice.toFixed(2)}</span>
                    ${isOffer ? `<span class="card-price-normal">S/. ${product.price_normal.toFixed(2)}</span>` : ''}
                </div>
                ${product.price_sorti ? `
                    <div class="card-sorti-price">
                        <i class="fas fa-coins"></i> O con Sorti: ${product.price_sorti}
                    </div>
                ` : ''}

                <div class="card-action">
                    <button class="btn-outline-card" onclick="quickAddToCart(${product.id})">
                        <i class="fas fa-shopping-cart"></i> Agregar
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Añadir rápido al carrito desde la carta sin variante
window.quickAddToCart = async (productId) => {
    try {
        const products = await ShopService.getProducts();
        const product = products.find(p => p.id === productId);
        if (product) {
            // Si tiene variantes complejas, mejor ir al detalle
            if (product.variants && product.variants.length > 0) {
                window.location.hash = `#/product/${product.slug}`;
                showToast('Seleccione las opciones de variantes primero.', 'info');
            } else {
                Cart.addItem(product, 1);
                renderCartDrawerList();
            }
        }
    } catch (e) {
        showToast('Error al agregar al carrito.', 'error');
    }
};

// ==========================================
// VISTA: CHECKOUT ESTILO TEMU
// ==========================================
async function renderCheckout() {
    const container = document.getElementById('app-view');
    const items = Cart.getItems();

    if (items.length === 0) {
        container.innerHTML = `<div class="main-storefront" style="text-align: center; padding: 80px 24px;"><h2>Tu carrito está vacío.</h2><a href="#/" class="btn-primary" style="margin-top:20px;">Ir a Comprar</a></div>`;
        return;
    }

    // Inicializar variables de checkout
    let discountCoupon = 0;
    let couponCodeApplied = '';
    let discountSorti = 0;
    let sortiCoinsApplied = 0;
    let selectedDeliveryType = 'delivery'; // o 'pickup'
    let currentDeliveryCost = 7.00; // Costo por defecto

    const cartSubtotal = Cart.getSubtotal();

    // Intentar traer los datos de configuración públicos
    let bankAccounts = [
        { bank: 'BCP', account: '191-98765432-0-99', CCI: '002-19198765432099-54', owner: 'Sortistore SAC' }
    ];
    let yapeQrImage = 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=400';
    let districts = [
        { name: 'Miraflores', cost: 7.00, time: '24-48 horas' },
        { name: 'San Isidro', cost: 7.00, time: '24-48 horas' },
        { name: 'Santiago de Surco', cost: 9.00, time: '24-48 horas' },
        { name: 'San Borja', cost: 8.00, time: '24-48 horas' }
    ];

    try {
        // Traer ajustes reales del endpoint público (aplica tanto a logueados como a invitados)
        const settings = await ShopService.getSettings();
        if (settings.bank_accounts) bankAccounts = settings.bank_accounts;
        if (settings.yape_qr) yapeQrImage = settings.yape_qr;
        if (settings.delivery_districts) districts = settings.delivery_districts;
    } catch (e) {
        console.warn('Usando datos de entrega / pago por defecto.');
    }

    container.innerHTML = `
        <div class="checkout-layout">
            <h2 style="font-size: 32px; margin-bottom: 24px;"><i class="fas fa-shield-alt" style="color: var(--color-secondary);"></i> Finalizar Pedido Seguro</h2>
            <div class="checkout-grid">
                
                <!-- COLUMNA 1: Datos de Envío y Delivery -->
                <div class="checkout-section animate-fade-in">
                    <h3><i class="fas fa-map-marker-alt" style="color: var(--color-primary);"></i> 1. Opciones de Entrega</h3>
                    
                    <!-- Selector de Entrega -->
                    <div class="delivery-options-grid">
                        <div class="delivery-card selected" id="opt-delivery-btn">
                            <i class="fas fa-truck" style="font-size: 24px; color: var(--color-primary); margin-bottom: 8px;"></i>
                            <h4 style="margin-bottom: 4px;">Delivery a Domicilio</h4>
                            <p style="font-size: 11px; color: var(--text-muted);">Recibe seguro en casa</p>
                        </div>
                        <div class="delivery-card" id="opt-pickup-btn">
                            <i class="fas fa-store" style="font-size: 24px; color: var(--color-primary); margin-bottom: 8px;"></i>
                            <h4 style="margin-bottom: 4px;">Recojo en Local</h4>
                            <p style="font-size: 11px; color: var(--text-muted);">Gratuito. Listo en 4 horas</p>
                        </div>
                    </div>

                    <!-- Formulario de datos -->
                    <div id="checkout-user-fields">
                        ${!AppState.user ? `
                            <div class="glass-panel" style="padding: 16px; margin-bottom: 20px; border-left: 4px solid var(--color-primary);">
                                <p style="font-size: 13px;"><i class="fas fa-info-circle"></i> ¿Ya tienes cuenta? <a href="#/auth" style="color: var(--color-primary); font-weight: 700;">Inicia Sesión aquí</a> para acumular monedas Sorti en tu compra.</p>
                            </div>
                            <div class="form-group">
                                <label>Nombre Completo</label>
                                <input type="text" id="chk-guest-name" class="form-control" placeholder="Escribe tu nombre completo">
                            </div>
                            <div class="form-group">
                                <label>Correo Electrónico</label>
                                <input type="email" id="chk-guest-email" class="form-control" placeholder="Escribe tu email de contacto">
                            </div>
                        ` : `
                            <div class="form-group">
                                <label>Cliente</label>
                                <input type="text" class="form-control" value="${AppState.user.name} (${AppState.user.email})" disabled>
                            </div>
                        `}

                        <!-- Campos para Delivery -->
                        <div id="delivery-details-inputs">
                            <div class="form-group">
                                <label>Distrito de Envío</label>
                                <select id="chk-district" class="form-control">
                                    ${districts.map(d => `<option value="${d.name}" data-cost="${d.cost}">${d.name} (S/. ${d.cost.toFixed(2)} - ${d.time})</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Dirección de Entrega</label>
                                <input type="text" id="chk-address" class="form-control" placeholder="Avenida, Jirón, Calle, Nro de Dpto...">
                            </div>
                            <div class="form-group">
                                <label>Teléfono de Contacto</label>
                                <input type="text" id="chk-phone" class="form-control" placeholder="Nro de celular">
                            </div>
                        </div>

                        <!-- Campos para Recojo -->
                        <div id="pickup-details-inputs" style="display: none;">
                            <div class="glass-panel" style="padding: 16px; font-size: 13px;">
                                <h4 style="margin-bottom: 8px;"><i class="fas fa-store"></i> Dirección de Tienda:</h4>
                                <p>Av. Larco 456, Oficina 102, Miraflores, Lima.</p>
                                <p style="margin-top: 4px; color: var(--text-muted);"><i class="fas fa-clock"></i> Horario: Lunes a Sábado de 9:00 AM a 8:00 PM.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- COLUMNA 2: Método de Pago (QR YAPE / TRANSFERENCIA BANCARIA) -->
                <div class="checkout-section animate-fade-in">
                    <h3><i class="fas fa-wallet" style="color: var(--color-primary);"></i> 2. Métodos de Pago</h3>
                    
                    <div class="payment-method-card selected" id="pm-yape-btn" data-method="yape">
                        <h4 style="display: flex; justify-content: space-between;">
                            <span><i class="fas fa-mobile-alt"></i> Yape / Plin</span>
                            <span style="color: var(--color-secondary); font-size: 12px; font-weight: 700;">Inmediato</span>
                        </h4>
                    </div>

                    <div class="payment-method-card" id="pm-bank-btn" data-method="bank_transfer">
                        <h4 style="display: flex; justify-content: space-between;">
                            <span><i class="fas fa-university"></i> Transferencia Bancaria</span>
                            <span style="color: var(--text-muted); font-size: 12px;">Validación manual</span>
                        </h4>
                    </div>

                    <!-- Cuadro informativo del pago seleccionado -->
                    <div class="payment-details-box" id="payment-instruction-box">
                        <!-- Yape QR instructions -->
                        <div id="pay-inst-yape" style="text-align: center;">
                            <p style="font-size: 13px; margin-bottom: 12px;">Escanea el código QR desde tu app bancaria y yapea el monto total.</p>
                            <img src="${yapeQrImage}" alt="QR Yape" style="width: 150px; height: 150px; margin: 0 auto 12px auto; display: block; border: 1px solid var(--border-color);">
                            <p style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Celular de soporte: 987 654 321</p>
                        </div>
                        
                        <!-- Bank Transfer instructions -->
                        <div id="pay-inst-bank" style="display: none;">
                            <p style="font-size: 13px; margin-bottom: 12px;">Transfiere desde tu banca móvil a cualquiera de nuestras cuentas:</p>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${bankAccounts.map(b => `
                                    <div class="glass-panel" style="padding: 10px; font-size: 12px;">
                                        <p><strong>Banco:</strong> ${b.bank} | <strong>Titular:</strong> ${b.owner}</p>
                                        <p><strong>Nro Cuenta:</strong> ${b.account}</p>
                                        <p><strong>Nro CCI:</strong> ${b.CCI}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Uploader del comprobante (Voucher) -->
                    <div class="voucher-uploader" id="voucher-upload-area">
                        <i class="fas fa-cloud-upload-alt" style="font-size: 32px; color: var(--color-primary); margin-bottom: 8px;"></i>
                        <h4 id="voucher-upload-status">Adjuntar Comprobante de Pago</h4>
                        <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Subir foto o captura del voucher (PNG, JPG, JPEG)</p>
                        <input type="file" id="voucher-file-input" accept="image/*" style="display: none;">
                    </div>
                    <div id="voucher-preview-container" style="display: none; text-align: center; margin-top: 12px;">
                        <img id="voucher-preview-img" src="" alt="Vista previa del voucher" style="max-height: 100px; display: inline-block;">
                    </div>
                </div>

                <!-- COLUMNA 3: Resumen del Pedido (Cupones, Monedas Sorti y Compra) -->
                <div class="checkout-section animate-fade-in" style="background-color: var(--bg-card-hover);">
                    <h3><i class="fas fa-clipboard-list" style="color: var(--color-accent);"></i> Resumen de Compra</h3>
                    
                    <!-- Lista rápida de productos del carro -->
                    <div style="max-height: 150px; overflow-y: auto; margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px;">
                        ${items.map(item => `
                            <div style="display: flex; justify-content: space-between; font-size: 13px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
                                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;">${item.name} (${item.quantity}x)</span>
                                <span>S/. ${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Aplicar Cupón de Descuento -->
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label>¿Tienes un cupón?</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="text" id="chk-coupon-input" class="form-control" placeholder="Código de cupón" style="text-transform: uppercase;">
                            <button class="btn-primary" id="apply-coupon-btn" style="padding: 10px 16px;">Aplicar</button>
                        </div>
                        <div id="coupon-feedback" style="font-size: 11px; margin-top: 4px;"></div>
                    </div>

                    <!-- Monedas Sorti Slider (Si está logueado) -->
                    ${AppState.user && AppState.user.role === 'client' && AppState.user.sortiBalance > 0 ? `
                        <div class="glass-panel" style="padding: 16px; margin-bottom: 24px;">
                            <h4 style="font-size: 13px; color: var(--color-accent); margin-bottom: 8px;"><i class="fas fa-coins"></i> Canjear Monedas Sorti</h4>
                            <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 10px;">Saldo disponible: <strong>${AppState.user.sortiBalance}</strong> monedas.</p>
                            
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <input type="range" id="sorti-slider" min="0" max="${AppState.user.sortiBalance}" value="0" step="50" style="width: 100%; accent-color: var(--color-accent);">
                                <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700;">
                                    <span>Canjear: <span id="sorti-val-text">0</span> monedas</span>
                                    <span>Ahorro: S/. <span id="sorti-discount-text">0.00</span></span>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Desglose de totales -->
                    <div style="margin-bottom: 20px;">
                        <div class="checkout-summary-item">
                            <span>Subtotal:</span>
                            <span>S/. ${cartSubtotal.toFixed(2)}</span>
                        </div>
                        <div class="checkout-summary-item" id="row-delivery-cost">
                            <span>Costo de envío:</span>
                            <span>S/. ${currentDeliveryCost.toFixed(2)}</span>
                        </div>
                        <div class="checkout-summary-item" id="row-coupon-discount" style="color: var(--color-secondary); display: none;">
                            <span>Descuento cupón:</span>
                            <span>- S/. 0.00</span>
                        </div>
                        <div class="checkout-summary-item" id="row-sorti-discount" style="color: var(--color-accent); display: none;">
                            <span>Ahorro Monedas Sorti:</span>
                            <span>- S/. 0.00</span>
                        </div>
                        <div class="checkout-summary-item grand-total" style="font-size: 24px; font-weight: 800; border-top: 1px solid var(--border-color); padding-top: 12px;">
                            <span>Total a pagar:</span>
                            <span id="checkout-grand-total-text" style="color: var(--text-primary);">S/. ${(cartSubtotal + currentDeliveryCost).toFixed(2)}</span>
                        </div>
                    </div>

                    <!-- Mensaje de ahorro total -->
                    <div class="checkout-savings" id="total-savings-badge" style="display: none;">
                        ¡Ahorraste S/. 0.00 en total!
                    </div>

                    <button class="btn-secondary" id="place-order-btn" style="width: 100%; padding: 16px; font-size: 16px;">
                        <i class="fas fa-check-circle"></i> Confirmar y Realizar Pedido
                    </button>
                </div>
            </div>
        </div>
    `;

    // LÓGICA DE INTERACCIÓN DE CHECKOUT
    const deliveryBtn = document.getElementById('opt-delivery-btn');
    const pickupBtn = document.getElementById('opt-pickup-btn');
    const deliveryInputs = document.getElementById('delivery-details-inputs');
    const pickupInputs = document.getElementById('pickup-details-inputs');
    const districtSelect = document.getElementById('chk-district');
    
    const yapeBtn = document.getElementById('pm-yape-btn');
    const bankBtn = document.getElementById('pm-bank-btn');
    const payInstYape = document.getElementById('pay-inst-yape');
    const payInstBank = document.getElementById('pay-inst-bank');
    
    const voucherUploadArea = document.getElementById('voucher-upload-area');
    const voucherFileInput = document.getElementById('voucher-file-input');
    const voucherPreviewContainer = document.getElementById('voucher-preview-container');
    const voucherPreviewImg = document.getElementById('voucher-preview-img');
    const voucherStatusText = document.getElementById('voucher-upload-status');

    let base64Voucher = '';

    // Manejar Tipo de Envío
    deliveryBtn.addEventListener('click', () => {
        selectedDeliveryType = 'delivery';
        deliveryBtn.classList.add('selected');
        pickupBtn.classList.remove('selected');
        deliveryInputs.style.display = 'block';
        pickupInputs.style.display = 'none';
        
        // Restaurar costo de envío
        const selectedOpt = districtSelect.options[districtSelect.selectedIndex];
        currentDeliveryCost = selectedOpt ? Number(selectedOpt.getAttribute('data-cost')) : 7.00;
        updateTotalsDisplay();
    });

    pickupBtn.addEventListener('click', () => {
        selectedDeliveryType = 'pickup';
        pickupBtn.classList.add('selected');
        deliveryBtn.classList.remove('selected');
        deliveryInputs.style.display = 'none';
        pickupInputs.style.display = 'block';
        
        // Sin costo de envío
        currentDeliveryCost = 0.00;
        updateTotalsDisplay();
    });

    if (districtSelect) {
        districtSelect.addEventListener('change', () => {
            if (selectedDeliveryType === 'delivery') {
                const selectedOpt = districtSelect.options[districtSelect.selectedIndex];
                currentDeliveryCost = Number(selectedOpt.getAttribute('data-cost')) || 0;
                updateTotalsDisplay();
            }
        });
    }

    // Manejar Métodos de Pago
    let selectedPaymentMethod = 'yape';
    yapeBtn.addEventListener('click', () => {
        selectedPaymentMethod = 'yape';
        yapeBtn.classList.add('selected');
        bankBtn.classList.remove('selected');
        payInstYape.style.display = 'block';
        payInstBank.style.display = 'none';
    });

    bankBtn.addEventListener('click', () => {
        selectedPaymentMethod = 'bank_transfer';
        bankBtn.classList.add('selected');
        yapeBtn.classList.remove('selected');
        payInstBank.style.display = 'block';
        payInstYape.style.display = 'none';
    });

    // Subida de Voucher y conversión a Base64
    voucherUploadArea.addEventListener('click', () => voucherFileInput.click());
    
    voucherFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            voucherStatusText.textContent = 'Procesando archivo...';
            const reader = new FileReader();
            reader.onload = (event) => {
                base64Voucher = event.target.result;
                voucherPreviewImg.src = base64Voucher;
                voucherPreviewContainer.style.display = 'block';
                voucherStatusText.innerHTML = `<i class="fas fa-check" style="color: var(--color-secondary);"></i> Voucher Adjuntado`;
                showToast('Comprobante de pago cargado.', 'success');
            };
            reader.readAsDataURL(file);
        }
    });

    // Lógica del Cupón
    const couponInput = document.getElementById('chk-coupon-input');
    const applyCouponBtn = document.getElementById('apply-coupon-btn');
    const couponFeedback = document.getElementById('coupon-feedback');

    applyCouponBtn.addEventListener('click', async () => {
        const code = couponInput.value.trim().toUpperCase();
        if (!code) {
            showToast('Escriba un código de cupón.', 'info');
            return;
        }

        try {
            // Simulamos validador de cupones rápido en BD
            // En producción llamamos al backend directamente
            const productsList = await ShopService.getProducts();
            const couponsResponse = await CustomerService.getCoupons();
            const foundCoupon = couponsResponse.available.find(c => c.code === code);

            if (foundCoupon) {
                if (cartSubtotal < foundCoupon.min_spend) {
                    couponFeedback.style.color = 'var(--danger)';
                    couponFeedback.textContent = `Compra mínima requerida: S/. ${foundCoupon.min_spend.toFixed(2)}`;
                    return;
                }

                couponCodeApplied = code;
                couponFeedback.style.color = 'var(--color-secondary)';
                couponFeedback.textContent = `¡Cupón aplicado con éxito!`;
                
                if (foundCoupon.type === 'percent') {
                    discountCoupon = (cartSubtotal * foundCoupon.value) / 100;
                } else if (foundCoupon.type === 'fixed') {
                    discountCoupon = foundCoupon.value;
                } else if (foundCoupon.type === 'free_shipping') {
                    discountCoupon = currentDeliveryCost;
                    currentDeliveryCost = 0;
                }

                updateTotalsDisplay();
                showToast('Cupón aplicado con éxito', 'success');
            } else {
                couponFeedback.style.color = 'var(--danger)';
                couponFeedback.textContent = 'Cupón inválido, expirado o agotado.';
            }
        } catch (err) {
            showToast('Error al validar cupón.', 'error');
        }
    });

    // Lógica del Slider de monedas Sorti
    const sortiSlider = document.getElementById('sorti-slider');
    const sortiValText = document.getElementById('sorti-val-text');
    const sortiDiscountText = document.getElementById('sorti-discount-text');

    if (sortiSlider) {
        sortiSlider.addEventListener('input', (e) => {
            const coins = Number(e.target.value);
            sortiCoinsApplied = coins;
            sortiValText.textContent = coins;
            
            // 100 Sorti = S/. 1.00
            discountSorti = coins / 100;
            sortiDiscountText.textContent = discountSorti.toFixed(2);

            updateTotalsDisplay();
        });
    }

    // Actualizador de Totales en Checkout
    function updateTotalsDisplay() {
        const rowDelivery = document.getElementById('row-delivery-cost');
        const rowCoupon = document.getElementById('row-coupon-discount');
        const rowSorti = document.getElementById('row-sorti-discount');
        const grandTotalText = document.getElementById('checkout-grand-total-text');
        const totalSavingsBadge = document.getElementById('total-savings-badge');

        // Mostrar / Ocultar costo de envío
        rowDelivery.querySelector('span:last-child').textContent = `S/. ${currentDeliveryCost.toFixed(2)}`;

        // Mostrar / Ocultar descuento de cupón
        if (discountCoupon > 0) {
            rowCoupon.style.display = 'flex';
            rowCoupon.querySelector('span:last-child').textContent = `- S/. ${discountCoupon.toFixed(2)}`;
        } else {
            rowCoupon.style.display = 'none';
        }

        // Mostrar / Ocultar ahorro Sorti
        if (discountSorti > 0) {
            rowSorti.style.display = 'flex';
            rowSorti.querySelector('span:last-child').textContent = `- S/. ${discountSorti.toFixed(2)}`;
        } else {
            rowSorti.style.display = 'none';
        }

        // Calcular total final
        let finalGrandTotal = cartSubtotal + currentDeliveryCost - discountCoupon - discountSorti;
        if (finalGrandTotal < 0) finalGrandTotal = 0;
        grandTotalText.textContent = `S/. ${finalGrandTotal.toFixed(2)}`;

        // Mostrar ahorro total
        const totalSavings = discountCoupon + discountSorti;
        if (totalSavings > 0) {
            totalSavingsBadge.style.display = 'block';
            totalSavingsBadge.textContent = `¡Ahorraste S/. ${totalSavings.toFixed(2)} en total!`;
        } else {
            totalSavingsBadge.style.display = 'none';
        }
    }

    // Registrar el Pedido Final al hacer click
    document.getElementById('place-order-btn').addEventListener('click', async () => {
        // Recoger datos
        let chkName = '';
        let chkEmail = '';
        let chkAddress = '';
        let chkPhone = '';
        const selectedOpt = districtSelect ? districtSelect.value : '';

        if (!AppState.user) {
            chkName = document.getElementById('chk-guest-name').value.trim();
            chkEmail = document.getElementById('chk-guest-email').value.trim();
            if (!chkName || !chkEmail) {
                showToast('Por favor ingrese su nombre y correo.', 'warning');
                return;
            }
        }

        if (selectedDeliveryType === 'delivery') {
            chkAddress = document.getElementById('chk-address').value.trim();
            chkPhone = document.getElementById('chk-phone').value.trim();
            if (!chkAddress || !chkPhone) {
                showToast('Por favor complete su dirección y celular de entrega.', 'warning');
                return;
            }
        }

        if (!base64Voucher) {
            showToast('Por favor adjunte la captura de pantalla de su pago (Yape/Transferencia).', 'warning');
            return;
        }

        // Formatear items del carrito
        const formattedItems = items.map(i => ({
            product_id: i.product_id,
            quantity: i.quantity,
            variant_info: i.variants
        }));

        const payload = {
            guest_name: AppState.user ? null : chkName,
            guest_email: AppState.user ? null : chkEmail,
            delivery_type: selectedDeliveryType,
            delivery_address: selectedDeliveryType === 'delivery' ? `${selectedOpt} - ${chkAddress} (Tlf: ${chkPhone})` : 'Recojo en local',
            delivery_cost: currentDeliveryCost,
            coupon_code: couponCodeApplied || null,
            sorti_coins_used: sortiCoinsApplied,
            payment_method: selectedPaymentMethod,
            items: formattedItems
        };

        try {
            document.getElementById('place-order-btn').disabled = true;
            document.getElementById('place-order-btn').textContent = 'Creando pedido...';

            const response = await OrderService.createOrder(payload);

            if (response.orderId) {
                // Subir el comprobante de pago adjuntado
                await OrderService.uploadPaymentProof(response.orderId, base64Voucher);
                
                showToast('¡Pedido realizado con éxito!', 'success');
                Cart.clear();
                updateCartCountUI();

                // Limpiar saldo local si está logueado
                if (AppState.user) {
                    AppState.user.sortiBalance -= sortiCoinsApplied;
                }

                // Redirigir
                if (AppState.user) {
                    window.location.hash = '#/dashboard';
                } else {
                    container.innerHTML = `
                        <div class="main-storefront" style="text-align: center; padding: 80px 24px;">
                            <i class="fas fa-check-circle" style="font-size: 64px; color: var(--color-secondary); margin-bottom: 24px;"></i>
                            <h2>¡Gracias por tu compra!</h2>
                            <p style="margin-top: 12px; color: var(--text-secondary);">Tu pedido #${response.orderId} se ha registrado correctamente y el comprobante está bajo verificación manual.</p>
                            <a href="#/" class="btn-primary" style="margin-top: 24px;">Volver a la Tienda</a>
                        </div>
                    `;
                }
            }
        } catch (error) {
            showToast(error.message, 'error');
            document.getElementById('place-order-btn').disabled = false;
            document.getElementById('place-order-btn').innerHTML = '<i class="fas fa-check-circle"></i> Confirmar y Realizar Pedido';
        }
    });
}

// ==========================================
// VISTA: PORTAL DEL CLIENTE (DASHBOARD)
// ==========================================
async function renderDashboard() {
    const container = document.getElementById('app-view');
    
    // Layout del portal
    container.innerHTML = `
        <div class="portal-layout animate-fade-in">
            <!-- Sidebar Navigation -->
            <div class="portal-sidebar">
                <div class="portal-user-info">
                    <div class="portal-user-avatar" id="avatar-letter">U</div>
                    <h3 id="sidebar-user-name">Cargando...</h3>
                    <p style="font-size: 12px; color: var(--text-muted);" id="sidebar-user-email">email@sortistore.com</p>
                </div>
                <div class="portal-nav-links">
                    <div class="portal-nav-link active" data-tab="purchases"><i class="fas fa-shopping-bag"></i> Mis Compras</div>
                    <div class="portal-nav-link" data-tab="downloads"><i class="fas fa-download"></i> Descargas</div>
                    <div class="portal-nav-link" data-tab="courses"><i class="fas fa-graduation-cap"></i> Mis Cursos</div>
                    <div class="portal-nav-link" data-tab="wallet"><i class="fas fa-coins"></i> Mis Monedas</div>
                    <div class="portal-nav-link" data-tab="coupons"><i class="fas fa-ticket-alt"></i> Mis Cupones</div>
                    <div class="portal-nav-link" data-tab="account"><i class="fas fa-user-cog"></i> Mi Cuenta</div>
                    <div class="portal-nav-link" id="logout-btn" style="color: var(--danger);"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</div>
                </div>
            </div>

            <!-- Content Area -->
            <div class="portal-content" id="portal-tab-content">
                <!-- Se inyecta dinámicamente -->
            </div>
        </div>
    `;

    // Cargar información del usuario en barra lateral
    if (AppState.user) {
        document.getElementById('sidebar-user-name').textContent = AppState.user.name;
        document.getElementById('sidebar-user-email').textContent = AppState.user.email;
        document.getElementById('avatar-letter').textContent = AppState.user.name.charAt(0).toUpperCase();
    }

    // Gestionar clicks en las pestañas laterales
    const tabLinks = container.querySelectorAll('.portal-nav-link[data-tab]');
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            tabLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const tabName = link.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Cerrar sesión
    document.getElementById('logout-btn').addEventListener('click', () => {
        AuthService.logout();
        AppState.user = null;
        updateHeaderAuthUI();
        window.location.hash = '#/';
        showToast('Sesión cerrada con éxito', 'info');
    });

    // Cargar pestaña predeterminada
    switchTab('purchases');
}

// Intercambiador de pestañas del panel del cliente
async function switchTab(tabName) {
    const tabContent = document.getElementById('portal-tab-content');
    tabContent.innerHTML = `<div class="skeleton" style="height: 32px; width: 200px; margin-bottom: 24px;"></div><div class="skeleton" style="height: 200px;"></div>`;

    try {
        switch (tabName) {
            case 'purchases':
                await renderPurchasesTab(tabContent);
                break;
            case 'downloads':
                await renderDownloadsTab(tabContent);
                break;
            case 'courses':
                await renderCoursesTab(tabContent);
                break;
            case 'wallet':
                await renderWalletTab(tabContent);
                break;
            case 'coupons':
                await renderCouponsTab(tabContent);
                break;
            case 'account':
                renderAccountTab(tabContent);
                break;
        }
    } catch (error) {
        tabContent.innerHTML = `<h3>Error al cargar los datos de la pestaña.</h3>`;
    }
}

// 1. Pestaña de compras / Pedidos
async function renderPurchasesTab(container) {
    const orders = await CustomerService.getOrders();

    container.innerHTML = `
        <h3 class="portal-section-title"><i class="fas fa-shopping-bag" style="color: var(--color-primary);"></i> Historial de Compras</h3>
        ${orders.length === 0 ? `
            <div style="text-align: center; padding: 40px 0;">
                <p style="color: var(--text-muted); margin-bottom: 16px;">Aún no has realizado ninguna compra.</p>
                <a href="#/" class="btn-primary">Ver Catálogo de Productos</a>
            </div>
        ` : orders.map(order => {
            const statusLabels = {
                pending_payment: { text: 'Pendiente Pago', color: 'badge-presale' },
                paid: { text: 'Pagado', color: 'badge-new' },
                processing: { text: 'En Proceso', color: 'badge-upcoming' },
                shipped: { text: 'Enviado', color: 'badge-featured' },
                completed: { text: 'Entregado', color: 'badge-new' },
                cancelled: { text: 'Cancelado', color: 'badge-soldout' }
            };

            const orderDate = new Date(order.created_at).toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            // Determinar progreso del seguimiento (0% a 100%)
            let trackingWidth = '0%';
            let stepStates = [false, false, false, false]; // [Pendiente, Verificado, Enviado, Completado]
            
            if (order.status === 'pending_payment') {
                trackingWidth = '0%'; stepStates[0] = true;
            } else if (order.status === 'paid' || order.status === 'processing') {
                trackingWidth = '33.3%'; stepStates[0] = true; stepStates[1] = true;
            } else if (order.status === 'shipped') {
                trackingWidth = '66.6%'; stepStates[0] = true; stepStates[1] = true; stepStates[2] = true;
            } else if (order.status === 'completed') {
                trackingWidth = '100%'; stepStates = [true, true, true, true];
            }

            const label = statusLabels[order.status] || { text: 'Desconocido', color: 'badge-upcoming' };

            return `
                <div class="order-list-card">
                    <div class="order-list-header">
                        <div>
                            <strong>Pedido #${order.id}</strong>
                            <p style="font-size: 11px; color: var(--text-muted);">${orderDate}</p>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span class="badge ${label.color}">${label.text}</span>
                            <span style="font-weight: 800; font-size: 16px; color: var(--color-secondary);">S/. ${order.total_amount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="order-items-container">
                        ${order.items.map(item => `
                            <div class="order-item-row">
                                <img src="${item.image_url || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100'}" alt="${item.name}">
                                <div>
                                    <h4 style="font-size: 14px;">${item.name}</h4>
                                    <p style="font-size: 11px; color: var(--text-muted);">Cantidad: ${item.quantity} | Variantes: ${item.variant_info ? Object.entries(item.variant_info).map(([k,v])=>`${k}: ${v}`).join(', ') : 'Ninguna'}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Si el pedido está cancelado, ocultar timeline de tracking -->
                    ${order.status !== 'cancelled' ? `
                        <div class="order-tracking-steps">
                            <div class="tracking-line-active" style="width: ${trackingWidth};"></div>
                            
                            <div class="tracking-step ${stepStates[0] ? 'active' : ''}">
                                <div class="tracking-icon"><i class="fas fa-receipt"></i></div>
                                <div class="tracking-label">Recibido</div>
                            </div>
                            <div class="tracking-step ${stepStates[1] ? 'active' : ''}">
                                <div class="tracking-icon"><i class="fas fa-check-double"></i></div>
                                <div class="tracking-label">Verificado</div>
                            </div>
                            <div class="tracking-step ${stepStates[2] ? 'active' : ''}">
                                <div class="tracking-icon"><i class="fas fa-shipping-fast"></i></div>
                                <div class="tracking-label">En camino</div>
                            </div>
                            <div class="tracking-step ${stepStates[3] ? 'active' : ''}">
                                <div class="tracking-icon"><i class="fas fa-home"></i></div>
                                <div class="tracking-label">Completado</div>
                            </div>
                        </div>
                    ` : `
                        <div class="glass-panel" style="padding: 12px; color: var(--danger); text-align: center;">El pedido fue cancelado.</div>
                    `}
                </div>
            `;
        }).join('')}
    `;
}

// 2. Pestaña de descargas digitales
async function renderDownloadsTab(container) {
    const downloads = await CustomerService.getDownloads();

    container.innerHTML = `
        <h3 class="portal-section-title"><i class="fas fa-download" style="color: var(--color-primary);"></i> Mis Descargas</h3>
        ${downloads.length === 0 ? `
            <div style="text-align: center; padding: 40px 0;">
                <p style="color: var(--text-muted);">No tienes archivos digitales o licencias de software pendientes de descarga.</p>
            </div>
        ` : `
            <div class="download-grid">
                ${downloads.map(d => `
                    <div class="download-card animate-fade-in">
                        <h4>${d.name}</h4>
                        <div class="download-meta">
                            <span><i class="fas fa-file"></i> Peso: ${d.download_file_size || 'N/A'}</span>
                            <span><i class="fas fa-code-branch"></i> Versión: ${d.download_version || 'v1.0'}</span>
                            <span><i class="fas fa-calendar-alt"></i> Comprado el: ${new Date(d.created_at).toLocaleDateString()}</span>
                        </div>
                        <button class="btn-primary" onclick="simulateFileDownload('${d.name}', '${d.download_url}')">
                            <i class="fas fa-download"></i> Descargar
                        </button>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}

window.simulateFileDownload = (filename, url) => {
    showToast(`Iniciando descarga segura de: ${filename}`, 'info');
    setTimeout(() => {
        showToast('Descarga completada con éxito.', 'success');
    }, 2000);
};

// 3. Pestaña de Cursos LMS
async function renderCoursesTab(container) {
    const courses = await CustomerService.getCourses();

    container.innerHTML = `
        <h3 class="portal-section-title"><i class="fas fa-graduation-cap" style="color: var(--color-primary);"></i> Mis Cursos</h3>
        ${courses.length === 0 ? `
            <div style="text-align: center; padding: 40px 0;">
                <p style="color: var(--text-muted); margin-bottom: 16px;">Aún no estás matriculado en ningún curso.</p>
                <a href="#/category/cursos" class="btn-primary">Ver Cursos Disponibles</a>
            </div>
        ` : courses.map(course => `
            <div class="course-card animate-fade-in">
                <div class="course-card-cover">
                    <img src="${course.cover_image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300'}" alt="${course.title}">
                </div>
                <div class="course-card-details">
                    <div>
                        <h4 style="font-size: 18px; margin-bottom: 8px;">${course.title}</h4>
                        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${course.description}</p>
                    </div>
                    <div>
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" style="width: ${course.progressPercent}%;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 12px; font-weight: 700; color: var(--color-primary);">${course.progressPercent}% Completado</span>
                            <button class="btn-secondary" style="padding: 8px 16px; font-size: 13px;" onclick="openCoursePlayer(${course.id})">
                                <i class="fas fa-play"></i> ${course.progressPercent === 100 ? 'Repasar Clases' : 'Continuar Aprendiendo'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('')}
    `;
}

// 4. Pestaña de Billetera Virtual (Monedas Sorti)
async function renderWalletTab(container) {
    const wallet = await CustomerService.getWallet();

    container.innerHTML = `
        <h3 class="portal-section-title"><i class="fas fa-wallet" style="color: var(--color-primary);"></i> Mi Billetera Sorti</h3>
        
        <!-- Tarjeta de Saldo Principal -->
        <div class="wallet-balance-card">
            <div class="wallet-balance-info">
                <h3>Saldo Disponible</h3>
                <div class="balance-value">
                    <i class="fas fa-coins" style="color: gold; text-shadow: 0 0 8px rgba(255,215,0,0.6);"></i>
                    <span>${wallet.balance}</span>
                </div>
            </div>
            <div>
                <p style="font-size: 12px; color: #334155; font-weight: 600; text-align: right;">100 Sorti Coins = S/. 1.00</p>
                <p style="font-size: 11px; color: #475569; margin-top: 4px; text-align: right;">¡Úsalas en el checkout para obtener descuentos instantáneos!</p>
            </div>
        </div>

        <h4>Historial de Transacciones</h4>
        ${wallet.transactions.length === 0 ? `
            <p style="color: var(--text-muted); margin-top: 16px;">Aún no tienes movimientos registrados.</p>
        ` : `
            <table class="wallet-history-table animate-fade-in">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Descripción</th>
                        <th>Tipo</th>
                        <th>Monedas</th>
                    </tr>
                </thead>
                <tbody>
                    ${wallet.transactions.map(t => {
                        const isPositive = t.amount > 0;
                        const date = new Date(t.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric', month: 'short', day: 'numeric'
                        });
                        return `
                            <tr>
                                <td>${date}</td>
                                <td>${t.description}</td>
                                <td><span class="badge ${isPositive ? 'badge-new' : 'badge-soldout'}">${t.type.toUpperCase()}</span></td>
                                <td class="${isPositive ? 'amount-positive' : 'amount-negative'}">
                                    ${isPositive ? '+' : ''}${t.amount}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `}
    `;
}

// 5. Pestaña de Cupones del Cliente
async function renderCouponsTab(container) {
    const coupons = await CustomerService.getCoupons();

    container.innerHTML = `
        <h3 class="portal-section-title"><i class="fas fa-ticket-alt" style="color: var(--color-primary);"></i> Mis Cupones</h3>
        
        <h4 style="margin-bottom: 16px;">Cupones Disponibles para Ti</h4>
        ${coupons.available.length === 0 ? `
            <p style="color: var(--text-muted); margin-bottom: 32px;">No tienes cupones de descuento activos en este momento.</p>
        ` : `
            <div class="download-grid" style="margin-bottom: 32px;">
                ${coupons.available.map(c => {
                    let desc = '';
                    if (c.type === 'percent') desc = `${c.value}% de descuento en tu compra`;
                    else if (c.type === 'fixed') desc = `S/. ${c.value.toFixed(2)} de descuento fijo`;
                    else if (c.type === 'free_shipping') desc = `Envío totalmente gratis`;

                    return `
                        <div class="glass-panel" style="padding: 20px; border-left: 4px solid var(--color-primary); display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <span class="badge badge-featured" style="font-size: 14px; letter-spacing: 0.1em; padding: 6px 12px; margin-bottom: 12px; display: inline-block;">${c.code}</span>
                                <p style="font-weight: 700; margin-bottom: 6px;">${desc}</p>
                                <p style="font-size: 11px; color: var(--text-muted);"><i class="fas fa-calendar-alt"></i> Expira: ${c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Sin expiración'}</p>
                            </div>
                            <button class="btn-outline" style="margin-top: 16px; padding: 6px 12px; font-size: 12px;" onclick="copyCouponCode('${c.code}')">
                                <i class="fas fa-copy"></i> Copiar Código
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `}

        <h4 style="margin-bottom: 16px;">Historial de Cupones Utilizados</h4>
        ${coupons.used.length === 0 ? `
            <p style="color: var(--text-muted);">No has utilizado ningún cupón anteriormente.</p>
        ` : `
            <table class="wallet-history-table animate-fade-in">
                <thead>
                    <tr>
                        <th>Fecha de Uso</th>
                        <th>Código</th>
                        <th>Descuento / Tipo</th>
                        <th>ID Pedido</th>
                    </tr>
                </thead>
                <tbody>
                    ${coupons.used.map(u => {
                        const date = new Date(u.used_at).toLocaleDateString();
                        return `
                            <tr>
                                <td>${date}</td>
                                <td><strong>${u.code}</strong></td>
                                <td><span class="badge badge-featured">${u.type.toUpperCase()}</span></td>
                                <td>Pedido #${u.order_id}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `}
    `;
}

window.copyCouponCode = (code) => {
    navigator.clipboard.writeText(code);
    showToast(`Código ${code} copiado al portapapeles.`, 'success');
};

// 6. Configuración de Cuenta de Usuario
function renderAccountTab(container) {
    container.innerHTML = `
        <h3 class="portal-section-title"><i class="fas fa-user-cog" style="color: var(--color-primary);"></i> Mi Cuenta</h3>
        
        <form id="profile-update-form" style="max-width: 600px;" class="animate-fade-in">
            <div class="form-group">
                <label>Nombre Completo</label>
                <input type="text" id="prof-name" class="form-control" value="${AppState.user.name}">
            </div>
            <div class="form-group">
                <label>Correo Electrónico</label>
                <input type="email" id="prof-email" class="form-control" value="${AppState.user.email}">
            </div>
            <div class="form-group">
                <label>Nueva Contraseña (Dejar vacío para mantener actual)</label>
                <input type="password" id="prof-password" class="form-control" placeholder="••••••••">
            </div>
            
            <button type="submit" class="btn-primary" style="margin-top: 12px; padding: 12px 24px;">
                <i class="fas fa-save"></i> Guardar Cambios
            </button>
        </form>
    `;

    document.getElementById('profile-update-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('prof-name').value.trim();
        const email = document.getElementById('prof-email').value.trim();
        const password = document.getElementById('prof-password').value;

        if (!name || !email) {
            showToast('El nombre y el correo son campos requeridos.', 'warning');
            return;
        }

        try {
            await CustomerService.updateProfile({ name, email, password });
            showToast('Perfil actualizado con éxito.', 'success');
            
            // Actualizar estado local
            AppState.user.name = name;
            AppState.user.email = email;
            
            // Refrescar cabeceras y sidebar
            document.getElementById('sidebar-user-name').textContent = name;
            document.getElementById('sidebar-user-email').textContent = email;
            document.getElementById('avatar-letter').textContent = name.charAt(0).toUpperCase();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

// ==========================================
// REPRODUCTOR DE CURSOS LMS (LÓGICA CLIENTE)
// ==========================================
let currentCourseStructure = null;
let currentActiveLessonId = null;

window.openCoursePlayer = async (courseId) => {
    const player = document.getElementById('lms-course-player');
    const playerModules = document.getElementById('lms-player-modules-list');
    
    // Cargar animación de cargando
    playerModules.innerHTML = '<div class="skeleton" style="height: 100px; margin: 16px;"></div>';
    player.classList.add('active');
    document.body.style.overflow = 'hidden'; // Evitar scroll de fondo

    try {
        const data = await CustomerService.getCourseDetails(courseId);
        currentCourseStructure = data;

        // Renderizar estructura en sidebar
        document.getElementById('lms-player-course-title').textContent = data.course.title;
        renderLMSStructure(data.modules);
        updateLMSProgressBar();

        // Cargar primera lección del primer módulo por defecto
        if (data.modules.length > 0 && data.modules[0].lessons.length > 0) {
            loadLMSLesson(data.modules[0].lessons[0].id);
        } else {
            showToast('Este curso no tiene lecciones estructuradas aún.', 'warning');
        }
        
    } catch (error) {
        showToast('No se pudo acceder a la estructura del curso.', 'error');
        closeCoursePlayer();
    }
};

function closeCoursePlayer() {
    document.getElementById('lms-course-player').classList.remove('active');
    document.body.style.overflow = ''; // Restaurar scroll
    document.getElementById('lms-lesson-video').src = ''; // Detener video
    // Refrescar pestaña de cursos por si actualizó progresos
    if (AppState.currentView === 'dashboard') {
        switchTab('courses');
    }
}

document.getElementById('close-lms-player-btn').addEventListener('click', closeCoursePlayer);

// Renderizar módulos y lecciones en barra lateral del reproductor
function renderLMSStructure(modules) {
    const container = document.getElementById('lms-player-modules-list');
    
    container.innerHTML = modules.map(mod => `
        <div class="lms-module-accordion">
            <div class="lms-module-title">
                <span>${mod.title}</span>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="lms-lessons-list">
                ${mod.lessons.map(les => `
                    <div class="lms-lesson-item ${les.completed ? 'completed' : ''}" 
                         id="les-item-${les.id}" 
                         onclick="loadLMSLesson(${les.id})">
                        <span><i class="${les.completed ? 'fas fa-check-circle' : 'far fa-play-circle'}" style="margin-right: 6px; color: ${les.completed ? 'var(--color-secondary)' : 'var(--text-muted)'};"></i> ${les.title}</span>
                        <span style="font-size: 11px; color: var(--text-muted);">${les.duration}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Cargar una lección en el reproductor principal
function loadLMSLesson(lessonId) {
    currentActiveLessonId = lessonId;
    
    // Buscar lección en la estructura cargada
    let activeLesson = null;
    currentCourseStructure.modules.forEach(m => {
        const found = m.lessons.find(l => l.id === lessonId);
        if (found) activeLesson = found;
    });

    if (!activeLesson) return;

    // Resaltar elemento activo en sidebar
    document.querySelectorAll('.lms-lesson-item').forEach(el => el.classList.remove('active'));
    const activeSidebarItem = document.getElementById(`les-item-${lessonId}`);
    if (activeSidebarItem) activeSidebarItem.classList.add('active');

    // Cargar contenido en video y textos
    document.getElementById('lms-player-lesson-title').textContent = activeLesson.title;
    document.getElementById('lms-player-lesson-duration').innerHTML = `<i class="fas fa-clock"></i> Duración: ${activeLesson.duration}`;
    
    const videoElement = document.getElementById('lms-lesson-video');
    videoElement.src = activeLesson.video_url || 'https://www.w3schools.com/html/mov_bbb.mp4';
    
    // Configurar checkbox de completado
    const checkbox = document.getElementById('lms-lesson-complete-checkbox');
    checkbox.checked = activeLesson.completed;

    // Quitar listeners anteriores para evitar duplicados
    checkbox.onchange = null;
    checkbox.onchange = async (e) => {
        const isChecked = e.target.checked;
        await toggleLessonStatus(lessonId, isChecked);
    };

    // Cargar recursos adicionales
    const resourcesContainer = document.getElementById('lms-resources-links-container');
    const resourcesBox = document.getElementById('lms-lesson-resources-box');
    
    let resourcesHtml = '';
    if (activeLesson.pdf_url) {
        resourcesHtml += `<button class="btn-outline" style="font-size: 12px; padding: 8px 16px;" onclick="simulateFileDownload('Diapositivas PDF', '${activeLesson.pdf_url}')"><i class="fas fa-file-pdf" style="color: #ef4444;"></i> Diapositivas de Clase</button>`;
    }
    if (activeLesson.resources_url) {
        resourcesHtml += `<button class="btn-outline" style="font-size: 12px; padding: 8px 16px;" onclick="simulateFileDownload('Archivos Código', '${activeLesson.resources_url}')"><i class="fas fa-file-archive" style="color: #eab308;"></i> Código Fuente</button>`;
    }

    if (resourcesHtml) {
        resourcesBox.style.display = 'block';
        resourcesContainer.innerHTML = resourcesHtml;
    } else {
        resourcesBox.style.display = 'none';
    }

    // Configurar Examenes de lección
    const examBox = document.getElementById('lms-lesson-exam-box');
    if (activeLesson.has_exam && activeLesson.exam_questions && activeLesson.exam_questions.length > 0) {
        examBox.style.display = 'block';
        renderLMSLessonExam(activeLesson.exam_questions);
    } else {
        examBox.style.display = 'none';
    }
}

// Alternar estado de completado en lección
async function toggleLessonStatus(lessonId, isCompleted) {
    try {
        const response = await CustomerService.toggleLessonComplete(lessonId, isCompleted);
        
        // Actualizar datos locales
        currentCourseStructure.modules.forEach(m => {
            const idx = m.lessons.findIndex(l => l.id === lessonId);
            if (idx > -1) {
                m.lessons[idx].completed = isCompleted;
            }
        });

        // Refrescar item visual
        const itemEl = document.getElementById(`les-item-${lessonId}`);
        if (itemEl) {
            const icon = itemEl.querySelector('i');
            if (isCompleted) {
                itemEl.classList.add('completed');
                icon.className = 'fas fa-check-circle';
                icon.style.color = 'var(--color-secondary)';
            } else {
                itemEl.classList.remove('completed');
                icon.className = 'far fa-play-circle';
                icon.style.color = 'var(--text-muted)';
            }
        }

        // Actualizar barra de progreso
        updateLMSProgressBar();

        // Si el curso llega al 100%, detonar pop-up de felicitación
        if (response.isCourseCompleted) {
            triggerCourseCompletionScreen(currentCourseStructure.course.title);
        }

    } catch (e) {
        showToast('Error al guardar progreso de clase.', 'error');
    }
}

function updateLMSProgressBar() {
    let total = 0;
    let completed = 0;
    
    currentCourseStructure.modules.forEach(m => {
        m.lessons.forEach(l => {
            total++;
            if (l.completed) completed++;
        });
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('lms-player-progress-bar').style.width = `${percent}%`;
    document.getElementById('lms-player-progress-text').textContent = `Progreso: ${percent}%`;
}

// Renderizar examen rápido interactivo
function renderLMSLessonExam(questions) {
    const card = document.getElementById('lms-exam-question-card');
    
    card.innerHTML = `
        <div id="exam-questions-list">
            ${questions.map((q, qIdx) => `
                <div style="margin-bottom: 20px;">
                    <p style="font-weight: 700; margin-bottom: 8px;">Pregunta ${qIdx + 1}: ${q.question}</p>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${q.options.map((opt, optIdx) => `
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;">
                                <input type="radio" name="question-${qIdx}" value="${optIdx}">
                                <span>${opt}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        <button class="btn-primary" style="margin-top: 12px; padding: 8px 16px; font-size: 13px;" onclick="validateLMSExam()">Enviar Respuestas</button>
        <div id="exam-feedback-text" style="margin-top: 12px; font-weight: 700; font-size: 14px;"></div>
    `;

    window.validateLMSExam = () => {
        let correctAnswers = 0;
        let hasErrors = false;

        questions.forEach((q, qIdx) => {
            const selected = card.querySelector(`input[name="question-${qIdx}"]:checked`);
            if (!selected) {
                hasErrors = true;
                return;
            }
            if (Number(selected.value) === q.answer) {
                correctAnswers++;
            }
        });

        if (hasErrors) {
            showToast('Por favor responda todas las preguntas.', 'warning');
            return;
        }

        const score = Math.round((correctAnswers / questions.length) * 100);
        const feedbackEl = document.getElementById('exam-feedback-text');
        
        if (score >= 70) {
            feedbackEl.style.color = 'var(--color-secondary)';
            feedbackEl.innerHTML = `<i class="fas fa-check-circle"></i> ¡Aprobado! Calificación: ${score}% (${correctAnswers}/${questions.length})`;
            showToast('Examen aprobado.', 'success');
        } else {
            feedbackEl.style.color = 'var(--danger)';
            feedbackEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> Reprobado. Calificación: ${score}% (${correctAnswers}/${questions.length}). Inténtalo de nuevo.`;
            showToast('Examen reprobado.', 'error');
        }
    };
}

// Pantalla final del curso
function triggerCourseCompletionScreen(courseTitle) {
    const popup = document.getElementById('lms-completion-popup');
    document.getElementById('completed-course-name-text').textContent = courseTitle;
    popup.classList.add('active');

    document.getElementById('close-completion-popup-btn').onclick = () => {
        popup.classList.remove('active');
    };

    document.getElementById('download-certificate-btn').onclick = () => {
        showToast('Generando certificado premium PDF...', 'info');
        setTimeout(() => {
            showToast('Certificado descargado con éxito.', 'success');
        }, 1500);
    };
}

// ==========================================
// VISTA: AUTENTICACIÓN (LOGIN / REGISTRO)
// ==========================================
function renderAuth() {
    const container = document.getElementById('app-view');
    container.innerHTML = `
        <div class="checkout-layout" style="max-width: 480px; margin: 80px auto;">
            <div class="checkout-section animate-fade-in">
                <!-- Tabs -->
                <div style="display: flex; border-bottom: 1px solid var(--border-color); margin-bottom: 24px;">
                    <button class="menu-trigger" id="tab-login-btn" style="flex: 1; padding: 12px; font-weight: 700; border-bottom: 2px solid var(--color-primary); color: var(--text-primary);">Iniciar Sesión</button>
                    <button class="menu-trigger" id="tab-register-btn" style="flex: 1; padding: 12px; font-weight: 600;">Registrarse</button>
                </div>

                <!-- Formulario de Login -->
                <form id="auth-login-form">
                    <div class="form-group">
                        <label>Correo Electrónico</label>
                        <input type="email" id="log-email" class="form-control" placeholder="correo@ejemplo.com" required>
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <input type="password" id="log-pass" class="form-control" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; padding: 12px;">Ingresar</button>
                    <p style="text-align: center; margin-top: 16px; font-size: 12px; color: var(--text-muted);">Prueba con: cliente@sortistore.com / cliente123</p>
                </form>

                <!-- Formulario de Registro (Oculto) -->
                <form id="auth-register-form" style="display: none;">
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" id="reg-name" class="form-control" placeholder="Juan Pérez" required>
                    </div>
                    <div class="form-group">
                        <label>Correo Electrónico</label>
                        <input type="email" id="reg-email" class="form-control" placeholder="correo@ejemplo.com" required>
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <input type="password" id="reg-pass" class="form-control" placeholder="Crear contraseña" required>
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; padding: 12px;">Crear Cuenta</button>
                </form>
            </div>
        </div>
    `;

    const tabLogin = document.getElementById('tab-login-btn');
    const tabRegister = document.getElementById('tab-register-btn');
    const formLogin = document.getElementById('auth-login-form');
    const formRegister = document.getElementById('auth-register-form');

    tabLogin.addEventListener('click', () => {
        formLogin.style.display = 'block';
        formRegister.style.display = 'none';
        tabLogin.style.borderBottom = '2px solid var(--color-primary)';
        tabLogin.style.color = 'var(--text-primary)';
        tabRegister.style.borderBottom = 'none';
        tabRegister.style.color = 'var(--text-muted)';
    });

    tabRegister.addEventListener('click', () => {
        formRegister.style.display = 'block';
        formLogin.style.display = 'none';
        tabRegister.style.borderBottom = '2px solid var(--color-primary)';
        tabRegister.style.color = 'var(--text-primary)';
        tabLogin.style.borderBottom = 'none';
        tabLogin.style.color = 'var(--text-muted)';
    });

    // Enviar Login
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('log-email').value.trim();
        const pass = document.getElementById('log-pass').value;

        try {
            const data = await AuthService.login(email, pass);
            AppState.user = data.user;
            updateHeaderAuthUI();
            showToast('Inicio de sesión exitoso', 'success');
            window.location.hash = '#/';
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // Enviar Registro
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const pass = document.getElementById('reg-pass').value;

        try {
            const data = await AuthService.register(name, email, pass);
            AppState.user = data.user;
            updateHeaderAuthUI();
            showToast('Cuenta creada con éxito', 'success');
            window.location.hash = '#/';
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

// ==========================================
// GESTIÓN DEL CARRITO DESLIZABLE Y GLOBAL EVENTS
// ==========================================
function initGlobalEvents() {
    const cartBtn = document.getElementById('cart-drawer-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartDrawer = document.getElementById('cart-drawer-container');
    const cartOverlay = document.getElementById('cart-drawer-overlay');
    const checkoutBtn = document.getElementById('go-to-checkout-btn');
    
    // Toggle Cart Drawer
    cartBtn.addEventListener('click', () => {
        renderCartDrawerList();
        cartDrawer.classList.add('active');
        cartOverlay.classList.add('active');
    });

    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    function closeCart() {
        cartDrawer.classList.remove('active');
        cartOverlay.classList.remove('active');
    }

    checkoutBtn.addEventListener('click', () => {
        closeCart();
        window.location.hash = '#/checkout';
    });

    // Menú de Categorías (Mega Menu)
    const megaMenuTrigger = document.getElementById('categories-menu-trigger');
    const megaMenu = document.getElementById('store-mega-menu');

    megaMenuTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        megaMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!megaMenu.contains(e.target) && e.target !== megaMenuTrigger) {
            megaMenu.classList.remove('active');
        }
    });

    // Links de Categorías en Mega Menu
    const categoryLinks = document.querySelectorAll('.category-link');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = link.getAttribute('data-cat');
            megaMenu.classList.remove('active');
            window.location.hash = `#/category/${cat}`;
        });
    });

    // Botones rápidos del Mega Menu
    const navShopBtn = document.getElementById('nav-shop-btn');
    if (navShopBtn) {
        navShopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = '#/shop';
        });
    }

    document.getElementById('nav-offers-btn').addEventListener('click', () => {
        window.location.hash = '#/'; // Filtros en Home
        setTimeout(() => {
            const section = document.querySelector('.section-header');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    });

    document.getElementById('nav-software-btn').addEventListener('click', () => {
        window.location.hash = '#/category/sistemas-y-software';
    });

    document.getElementById('nav-courses-btn').addEventListener('click', () => {
        window.location.hash = '#/category/cursos';
    });

    document.getElementById('nav-presales-btn').addEventListener('click', () => {
        window.location.hash = '#/';
        setTimeout(() => {
            const headers = document.querySelectorAll('.section-header');
            headers.forEach(h => {
                if (h.textContent.includes('Lanzamientos')) h.scrollIntoView({ behavior: 'smooth' });
            });
        }, 100);
    });

    // Buscador Inteligente con Autocompletado
    const searchInput = document.getElementById('store-search-input');
    const suggestionsBox = document.getElementById('search-suggestions-box');

    searchInput.addEventListener('input', async (e) => {
        const val = e.target.value.trim();
        if (val.length < 2) {
            suggestionsBox.style.display = 'none';
            return;
        }

        try {
            const results = await ShopService.getProducts({ q: val });
            if (results.length > 0) {
                suggestionsBox.innerHTML = results.slice(0, 5).map(p => `
                    <div class="suggestion-item" onclick="selectSuggestion('${p.slug}')">
                        <img src="${p.media && p.media.length > 0 ? p.media[0].media_url : 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=50'}" alt="img">
                        <div class="info">
                            <div class="title">${p.name}</div>
                            <div class="price">S/. ${(p.price_offer || p.price_normal).toFixed(2)}</div>
                        </div>
                    </div>
                `).join('');
                suggestionsBox.style.display = 'block';
            } else {
                suggestionsBox.innerHTML = `<div style="padding:12px; color:var(--text-muted); text-align:center;">No se encontraron resultados</div>`;
                suggestionsBox.style.display = 'block';
            }
        } catch (err) {
            suggestionsBox.style.display = 'none';
        }
    });

    window.selectSuggestion = (slug) => {
        suggestionsBox.style.display = 'none';
        searchInput.value = '';
        window.location.hash = `#/product/${slug}`;
    };

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.style.display = 'none';
        }
    });

    // Botón de Perfil / Dashboard
    document.getElementById('profile-menu-btn').addEventListener('click', () => {
        if (AppState.user) {
            window.location.hash = '#/dashboard';
        } else {
            window.location.hash = '#/auth';
        }
    });

    // Switch de Tema
    document.getElementById('theme-toggle-btn').addEventListener('click', () => {
        toggleTheme();
        const icon = document.getElementById('theme-toggle-btn').querySelector('i');
        if (document.body.classList.contains('light-mode')) {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    });

    // Logo / Inicio
    document.getElementById('logo-btn').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = '#/';
    });

    // Inicializar totales del carro en UI
    updateCartCountUI();
}

// Dibujar lista de productos en el Cart Drawer
function renderCartDrawerList() {
    const list = document.getElementById('cart-items-list-container');
    const items = Cart.getItems();

    if (items.length === 0) {
        list.innerHTML = `<div style="text-align: center; padding: 48px 0; color: var(--text-muted);"><i class="fas fa-shopping-basket" style="font-size: 32px; margin-bottom: 8px;"></i><p>El carrito está vacío</p></div>`;
        updateCartCountUI();
        return;
    }

    list.innerHTML = items.map(item => `
        <div class="cart-item animate-fade-in">
            <img src="${item.image_url}" alt="${item.name}">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-variants">${Object.entries(item.variants).map(([k,v])=>`${k}: ${v}`).join(', ') || 'Sin opciones'}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <span class="cart-item-price">S/. ${(item.price).toFixed(2)}</span>
                    <div class="cart-qty-ctrl">
                        <button onclick="changeCartItemQty('${item.cartKey}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeCartItemQty('${item.cartKey}', 1)">+</button>
                    </div>
                </div>
            </div>
            <button onclick="Cart.removeItem('${item.cartKey}'); renderCartDrawerList();" style="color: var(--danger); font-size: 14px; align-self: flex-start; margin-left: 8px;"><i class="fas fa-trash-alt"></i></button>
        </div>
    `).join('');

    updateCartCountUI();
}

window.changeCartItemQty = (cartKey, offset) => {
    const items = Cart.getItems();
    const item = items.find(i => i.cartKey === cartKey);
    if (item) {
        Cart.updateQty(cartKey, item.quantity + offset);
        renderCartDrawerList();
    }
};

// Sincronizar contadores e importes de carrito en UI global
function updateCartCountUI() {
    const badge = document.getElementById('cart-count-badge');
    const subtotalText = document.getElementById('cart-subtotal-text');
    const sortiText = document.getElementById('cart-sorti-equivalent-text');
    const totalText = document.getElementById('cart-total-text');

    const count = Cart.getItemCount();
    badge.textContent = count;

    const subtotal = Cart.getSubtotal();
    subtotalText.textContent = `S/. ${subtotal.toFixed(2)}`;
    totalText.textContent = `S/. ${subtotal.toFixed(2)}`;

    // Cada S/. 1.00 de compra acumula unas 10 monedas en equivalente para canje o bonificaciones
    const sortiEquivalent = Math.round(subtotal * 10);
    sortiText.textContent = sortiEquivalent;
}
