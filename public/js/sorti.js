/* SORTI - Premium E-Commerce JavaScript (2026-2027) */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Management (Light / Dark Mode)
    initTheme();

    // 2. Search Autocomplete
    initAutocompleteSearch();

    // 3. Pre-Sale Countdown Timers
    initCountdowns();

    // 4. Cart Quick Actions
    initCartActions();

    // 5. Checkout Calculations & Coupon applying
    initCheckout();

    // 6. LMS video progress & Task submission
    initLMS();
});

/**
 * Theme Toggling
 */
function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (!toggleBtn) return;

    // Load saved or system default theme
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const currentTheme = savedTheme || systemTheme;
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(toggleBtn, currentTheme);

    toggleBtn.addEventListener('click', () => {
        const activeTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
        updateThemeIcon(toggleBtn, nextTheme);
    });
}

function updateThemeIcon(btn, theme) {
    if (theme === 'dark') {
        btn.innerHTML = '🌙'; // Crescent Moon
    } else {
        btn.innerHTML = '☀️'; // Sun
    }
}

/**
 * Smart Search Autocomplete
 */
function initAutocompleteSearch() {
    const searchInput = document.getElementById('sorti-search-input');
    const dropdown = document.getElementById('search-autocomplete-dropdown');
    
    if (!searchInput || !dropdown) return;

    let debounceTimeout;

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        const query = searchInput.value.trim();

        if (query.length < 2) {
            dropdown.style.display = 'none';
            return;
        }

        debounceTimeout = setTimeout(() => {
            fetch(`/api/search-suggest?q=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {
                    dropdown.innerHTML = '';
                    if (data.length === 0) {
                        dropdown.style.display = 'none';
                        return;
                    }

                    data.forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'autocomplete-item';
                        div.innerHTML = `
                            <img src="${item.image}" alt="${item.name}">
                            <div>
                                <div style="font-weight:600; font-size:0.95rem;">${item.name}</div>
                                <div style="color:var(--primary-color); font-size:0.85rem; font-weight:700;">
                                    S/ ${item.price} ${item.coins_price ? '• <span style="color:var(--sorti-gold)">★ ' + item.coins_price + '</span>' : ''}
                                </div>
                            </div>
                        `;
                        div.addEventListener('click', () => {
                            window.location.href = `/product/${item.slug}`;
                        });
                        dropdown.appendChild(div);
                    });

                    dropdown.style.display = 'block';
                })
                .catch(err => console.error('Error autocomplete search:', err));
        }, 300);
    });

    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

/**
 * Pre-Sale Countdowns
 */
function initCountdowns() {
    const countdowns = document.querySelectorAll('.countdown-timer-data');
    
    countdowns.forEach(container => {
        const launchDateStr = container.getAttribute('data-date');
        if (!launchDateStr) return;

        const launchTime = new Date(launchDateStr).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = launchTime - now;

            if (distance < 0) {
                container.innerHTML = '<div style="font-weight:700; color:var(--color-success)">¡PRODUCTO LANZADO!</div>';
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            container.querySelector('.days-val').innerText = String(days).padStart(2, '0');
            container.querySelector('.hours-val').innerText = String(hours).padStart(2, '0');
            container.querySelector('.minutes-val').innerText = String(minutes).padStart(2, '0');
            container.querySelector('.seconds-val').innerText = String(seconds).padStart(2, '0');
        };

        updateTimer();
        setInterval(updateTimer, 1000);
    });
}

/**
 * AJAX Cart Actions
 */
function initCartActions() {
    // Add to Cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const productId = btn.getAttribute('data-product-id');
            const qtyInput = document.getElementById('qty-selector-input');
            const variantSelect = document.getElementById('variant-selector-dropdown');
            
            const qty = qtyInput ? qtyInput.value : 1;
            const variantId = variantSelect ? variantSelect.value : null;

            btn.disabled = true;
            btn.innerText = 'Agregando...';

            fetch('/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken()
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: qty,
                    variant_id: variantId
                })
            })
            .then(res => res.json())
            .then(data => {
                btn.disabled = false;
                btn.innerHTML = '🛒 Agregar al Carrito';
                
                if (data.success) {
                    // Update header cart badge
                    updateCartBadge(data.cart_count);
                    showToast('success', 'Producto agregado al carrito con éxito.');
                } else {
                    showToast('error', data.message || 'Error al agregar al carrito.');
                }
            })
            .catch(err => {
                btn.disabled = false;
                btn.innerHTML = '🛒 Agregar al Carrito';
                showToast('error', 'Error de red al agregar al carrito.');
            });
        });
    });
}

/**
 * Checkout & calculations update
 */
function initCheckout() {
    const districtSelect = document.getElementById('checkout-district-select');
    const couponInput = document.getElementById('checkout-coupon-input');
    const applyCouponBtn = document.getElementById('checkout-coupon-apply-btn');
    const sortiCoinsToggle = document.getElementById('checkout-sorti-toggle');
    const deliveryRadio = document.querySelectorAll('input[name="delivery_method"]');

    if (!districtSelect && !couponInput && !sortiCoinsToggle && deliveryRadio.length === 0) return;

    const recalculateTotals = () => {
        const selectedMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'delivery';
        const districtId = districtSelect ? districtSelect.value : null;
        const couponCode = couponInput ? couponInput.value.trim() : '';
        const useCoins = sortiCoinsToggle ? sortiCoinsToggle.checked : false;

        fetch('/checkout/recalculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: JSON.stringify({
                delivery_method: selectedMethod,
                shipping_district_id: districtId,
                coupon_code: couponCode,
                use_sorti_coins: useCoins
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Update DOM elements with formatted currency
                setDomText('summary-subtotal', `S/ ${data.totals.subtotal}`);
                setDomText('summary-qty-savings', `- S/ ${data.totals.quantity_discount_savings}`);
                setDomText('summary-coupon-discount', `- S/ ${data.totals.coupon ? data.totals.coupon.discount : '0.00'}`);
                setDomText('summary-shipping-cost', `S/ ${data.totals.shipping_cost}`);
                setDomText('summary-sorti-discount', `- S/ ${data.totals.sorti_coins_discount}`);
                setDomText('summary-coins-spent', `${data.totals.sorti_coins_spent} monedas`);
                setDomText('summary-coins-earned', `★ +${data.totals.sorti_coins_earned} monedas`);
                setDomText('summary-grand-total', `S/ ${data.totals.total}`);
                setDomText('summary-total-savings', `S/ ${data.totals.total_savings}`);

                const errBox = document.getElementById('coupon-error-box');
                if (errBox) {
                    if (data.totals.coupon_error) {
                        errBox.style.display = 'block';
                        errBox.innerText = data.totals.coupon_error;
                    } else {
                        errBox.style.display = 'none';
                    }
                }
            }
        })
        .catch(err => console.error('Error recalculating checkout totals:', err));
    };

    if (districtSelect) districtSelect.addEventListener('change', recalculateTotals);
    if (applyCouponBtn) applyCouponBtn.addEventListener('click', recalculateTotals);
    if (sortiCoinsToggle) sortiCoinsToggle.addEventListener('change', recalculateTotals);
    deliveryRadio.forEach(radio => radio.addEventListener('change', (e) => {
        const addressRow = document.getElementById('checkout-address-row');
        const districtRow = document.getElementById('checkout-district-row');
        if (e.target.value === 'pickup') {
            if (addressRow) addressRow.style.display = 'none';
            if (districtRow) districtRow.style.display = 'none';
        } else {
            if (addressRow) addressRow.style.display = 'block';
            if (districtRow) districtRow.style.display = 'block';
        }
        recalculateTotals();
    }));
}

/**
 * LMS player & progress completion
 */
function initLMS() {
    const videoPlayer = document.getElementById('lms-class-video');
    if (!videoPlayer) return;

    const productId = videoPlayer.getAttribute('data-course-id');
    const lectureId = videoPlayer.getAttribute('data-lecture-id');

    videoPlayer.addEventListener('ended', () => {
        fetch(`/dashboard/courses/${productId}/lectures/${lectureId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Update lecture status icon in sidebar
                const activeItem = document.querySelector(`.lecture-sidebar-item[data-lecture-id="${lectureId}"]`);
                if (activeItem) {
                    const iconSpan = activeItem.querySelector('.lecture-status-icon');
                    if (iconSpan) iconSpan.innerText = '✅';
                }
                
                // Update progress percentage UI
                const progressText = document.getElementById('course-progress-percent-text');
                const progressBar = document.getElementById('course-progress-bar-fill');
                
                if (progressText) progressText.innerText = `${data.progress_percent}%`;
                if (progressBar) progressBar.style.width = `${data.progress_percent}%`;

                // If completed 100%, show congrats modal
                if (data.progress_percent >= 100) {
                    const congratsModal = document.getElementById('congrats-modal-popup');
                    if (congratsModal) {
                        congratsModal.classList.add('show');
                    }
                }
                
                showToast('success', '¡Clase completada!');
            }
        })
        .catch(err => console.error('Error updating LMS progress:', err));
    });
}

/* Common Helper Functions */
function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

function updateCartBadge(count) {
    document.querySelectorAll('.cart-badge-count-value').forEach(badge => {
        badge.innerText = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    });
}

function setDomText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function showToast(type, message) {
    // Simple custom floating notification
    const container = document.getElementById('sorti-toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        background: var(--bg-secondary);
        color: var(--text-primary);
        border-left: 4px solid ${type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'};
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: var(--shadow-md);
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 12px;
        min-width: 300px;
        animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;
    
    toast.innerHTML = `
        <span style="font-size: 1.2rem">${type === 'success' ? '✨' : '❌'}</span>
        <span style="font-weight: 500">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.style.transition = 'all 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

function createToastContainer() {
    const div = document.createElement('div');
    div.id = 'sorti-toast-container';
    div.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 10000;
        display: flex;
        flex-direction: column-reverse;
    `;
    document.body.appendChild(div);
    
    // Add slideIn animation to document
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
    
    return div;
}
