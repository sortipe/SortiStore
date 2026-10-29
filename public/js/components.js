/* ==========================================================================
   COMPONENTES UI Y DE NEGOCIO EN EL FRONTEND (SORTISTORE)
   ========================================================================== */

// 1. GESTIONADOR DE NOTIFICACIONES (TOASTS)
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';

    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <div>${message}</div>
    `;

    container.appendChild(toast);

    // Eliminar después de 3.5 segundos
    setTimeout(() => {
        toast.style.animation = 'toast-in 0.35s ease reverse forwards';
        setTimeout(() => toast.remove(), 350);
    }, 3500);
}

// 2. CONTADORES REGRESIVOS (PREVENTAS Y OFERTAS)
function startCountdown(targetDateStr, elementId, callbackOnExpiry = null) {
    const targetDate = new Date(targetDateStr).getTime();
    
    const interval = setInterval(() => {
        const now = new Date().getTime();
        const difference = targetDate - now;
        const element = document.getElementById(elementId);

        if (!element) {
            clearInterval(interval);
            return;
        }

        if (difference < 0) {
            clearInterval(interval);
            element.innerHTML = '¡LANZADO!';
            if (callbackOnExpiry) callbackOnExpiry();
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        element.innerHTML = `
            <span>${days}d</span> : 
            <span>${hours.toString().padStart(2, '0')}h</span> : 
            <span>${minutes.toString().padStart(2, '0')}m</span> : 
            <span>${seconds.toString().padStart(2, '0')}s</span>
        `;
    }, 1000);

    return interval;
}

// 3. SKELETON LOADERS
const Skeletons = {
    getProductGrid(count = 4) {
        let cards = '';
        for (let i = 0; i < count; i++) {
            cards += `
                <div class="product-card skeleton-card" style="height: 400px; display: flex; flex-direction: column; gap: 12px; padding: 16px;">
                    <div class="skeleton" style="height: 200px; width: 100%; border-radius: 12px;"></div>
                    <div class="skeleton" style="height: 16px; width: 40%; margin-top: 8px;"></div>
                    <div class="skeleton" style="height: 24px; width: 85%;"></div>
                    <div class="skeleton" style="height: 20px; width: 60%;"></div>
                    <div class="skeleton" style="height: 38px; width: 100%; border-radius: 8px; margin-top: auto;"></div>
                </div>
            `;
        }
        return cards;
    }
};

// 4. CONTROLADOR DE CARRITO DE COMPRAS (LOCAL STORAGE)
const Cart = {
    getItems() {
        const cart = localStorage.getItem('sortistore_cart');
        return cart ? JSON.parse(cart) : [];
    },

    saveItems(items) {
        localStorage.setItem('sortistore_cart', JSON.stringify(items));
        // Disparar evento para que otras partes del app se enteren si es necesario
        window.dispatchEvent(new Event('cartUpdated'));
    },

    addItem(product, quantity = 1, selectedVariants = {}) {
        const cart = this.getItems();
        
        // Crear una clave única combinando producto y variantes seleccionadas
        const variantString = Object.entries(selectedVariants)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([k, v]) => `${k}:${v}`)
            .join('|');
        
        const cartKey = `${product.id}[${variantString}]`;

        const existingItemIndex = cart.findIndex(item => item.cartKey === cartKey);

        // Calcular ajuste de precio por variantes
        let priceOffset = 0;
        if (product.variants && product.variants.length > 0) {
            Object.entries(selectedVariants).forEach(([type, value]) => {
                const found = product.variants.find(v => v.type === type && v.value === value);
                if (found) priceOffset += found.price_offset;
            });
        }

        const basePrice = product.price_offer ? product.price_offer : product.price_normal;
        const finalPrice = basePrice + priceOffset;

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += Number(quantity);
            if (product.type === 'physical' && cart[existingItemIndex].quantity > product.stock) {
                cart[existingItemIndex].quantity = product.stock;
                showToast(`Se limitó la cantidad al stock máximo disponible (${product.stock})`, 'info');
            }
        } else {
            cart.push({
                cartKey,
                product_id: product.id,
                name: product.name,
                slug: product.slug,
                type: product.type,
                price: finalPrice,
                price_sorti: product.price_sorti,
                image_url: product.media && product.media.length > 0 ? product.media[0].media_url : 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300',
                quantity: Number(quantity),
                variants: selectedVariants,
                stock: product.stock
            });
        }

        this.saveItems(cart);
        showToast('Producto agregado al carrito', 'success');
    },

    removeItem(cartKey) {
        let cart = this.getItems();
        cart = cart.filter(item => item.cartKey !== cartKey);
        this.saveItems(cart);
        showToast('Producto removido del carrito', 'info');
    },

    updateQty(cartKey, newQty) {
        const cart = this.getItems();
        const item = cart.find(item => item.cartKey === cartKey);
        
        if (item) {
            item.quantity = Number(newQty);
            if (item.quantity <= 0) {
                this.removeItem(cartKey);
                return;
            }
            if (item.type === 'physical' && item.quantity > item.stock) {
                item.quantity = item.stock;
                showToast(`Máximo stock disponible alcanzado: ${item.stock}`, 'info');
            }
            this.saveItems(cart);
        }
    },

    clear() {
        this.saveItems([]);
    },

    getSubtotal() {
        const cart = this.getItems();
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    getSortiCoinsEquivalent() {
        const cart = this.getItems();
        return cart.reduce((sum, item) => sum + ((item.price_sorti || 0) * item.quantity), 0);
    },

    getItemCount() {
        const cart = this.getItems();
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }
};

// 5. CONTROLADOR DE TEMA (CLARO / OSCURO)
function initTheme() {
    const savedTheme = localStorage.getItem('sortistore_theme') || 'light';
    const body = document.body;
    
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
    } else {
        body.classList.remove('light-mode');
    }
    const themeIcon = document.querySelector('#theme-toggle-btn i');
    if (themeIcon) themeIcon.className = body.classList.contains('light-mode') ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('light-mode');
    
    if (body.classList.contains('light-mode')) {
        localStorage.setItem('sortistore_theme', 'light');
        showToast('Modo Claro activado', 'info');
    } else {
        localStorage.setItem('sortistore_theme', 'dark');
        showToast('Modo Oscuro activado', 'info');
    }
}

// Inicializar tema al cargar el script
initTheme();

// 6. CONTROLADOR DE MARCA DINÁMICA (BRANDING & COLORES PERSONALIZADOS)
function hexToHoverColor(hex, percent = -12) {
    try {
        let col = hex.replace('#', '');
        if (col.length === 3) col = col.split('').map(c => c + c).join('');
        const num = parseInt(col, 16);
        let r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * (percent / 100))));
        let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + Math.round(255 * (percent / 100))));
        let bVal = Math.min(255, Math.max(0, (num & 0x0000FF) + Math.round(255 * (percent / 100))));
        return `#${(r << 16 | g << 8 | bVal).toString(16).padStart(6, '0')}`;
    } catch (e) {
        return hex;
    }
}

window.applyDynamicBranding = function(branding) {
    if (!branding) return;
    const b = typeof branding === 'string' ? JSON.parse(branding) : branding;

    if (b.site_name) {
        document.title = b.site_name;
        const logoBtn = document.getElementById('logo-btn');
        if (logoBtn) {
            logoBtn.innerHTML = `<i class="fas fa-shopping-bag"></i> ${b.site_name.replace(/(store|tienda)/i, '<span>$1</span>')}`;
        }
        const adminLogo = document.querySelector('.admin-logo');
        if (adminLogo) {
            adminLogo.innerHTML = `<i class="fas fa-tools"></i> ${b.site_name}<span>admin</span>`;
        }
    }

    const primaryColor = b.primary_color;
    const accentColor = b.accent_color;

    if (primaryColor || accentColor) {
        let styleTag = document.getElementById('sortistore-custom-branding-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'sortistore-custom-branding-style';
            document.head.appendChild(styleTag);
        }

        let css = ':root, html, body, body.light-mode, body.dark-mode, .admin-layout, .admin-sidebar, header {\n';
        if (primaryColor) {
            const primaryHover = hexToHoverColor(primaryColor, -12);
            css += `    --color-primary: ${primaryColor} !important;\n`;
            css += `    --color-primary-hover: ${primaryHover} !important;\n`;
            css += `    --border-focus: ${primaryColor} !important;\n`;
        }
        if (accentColor) {
            const accentHover = hexToHoverColor(accentColor, -12);
            css += `    --color-accent: ${accentColor} !important;\n`;
            css += `    --color-accent-hover: ${accentHover} !important;\n`;
        }
        css += '}\n';

        styleTag.innerHTML = css;

        try {
            localStorage.setItem('sortistore_cached_branding', JSON.stringify(b));
        } catch (e) {}
    }
};

// Cargar branding previo en caché para aplicar inmediatamente sin parpadeos visuales
try {
    const cachedBranding = localStorage.getItem('sortistore_cached_branding');
    if (cachedBranding) {
        window.applyDynamicBranding(cachedBranding);
    }
} catch (e) {}
