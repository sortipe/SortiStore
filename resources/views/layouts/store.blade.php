<!DOCTYPE html>
<html lang="es" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Sorti - Plataforma de Comercio Electrónico Premium')</title>
    
    <!-- Meta SEO -->
    <meta name="description" content="@yield('meta_description', 'Descubre productos físicos, digitales, software a medida y cursos interactivos en Sorti.')">
    <meta name="keywords" content="sorti, ecommerce, tienda, software, cursos, preventas, monedas virtual">
    
    <!-- Fonts & Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="{{ asset('css/sorti.css') }}">
    @yield('styles')
</head>
<body>

    <!-- Header Section -->
    <header class="sorti-header">
        <div class="navbar-container">
            <!-- Logo -->
            <a href="/" class="logo-link">Sorti</a>

            <!-- Smart Search Bar -->
            <div class="search-wrapper">
                <form action="/store" method="GET">
                    <button type="submit" class="search-icon-btn">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                    <input type="text" name="q" id="sorti-search-input" class="search-input" placeholder="Buscar productos, cursos, software, proyectos..." value="{{ request('q') }}" autocomplete="off">
                </form>
                <!-- Autocomplete Dropdown -->
                <div id="search-autocomplete-dropdown" class="autocomplete-dropdown"></div>
            </div>

            <!-- Navigation Actions -->
            <div class="nav-actions">
                <!-- Theme Toggle -->
                <button id="theme-toggle-btn" class="theme-switch-btn" aria-label="Cambiar tema">☀️</button>

                <!-- Sorti Wallet Pill -->
                @auth
                    <a href="/dashboard/coins" class="wallet-pill" title="Tus Monedas Sorti">
                        ★ <span id="header-coins-balance">{{ Auth::user()->sorti_coins_balance }}</span>
                    </a>
                @endauth

                <!-- Cart Button -->
                <a href="/cart" class="nav-btn" aria-label="Ver carrito">
                    <i class="fa-solid fa-cart-shopping"></i>
                    @php
                        $cartCount = count(session('cart', []));
                    @endphp
                    <span class="badge-count cart-badge-count-value" style="{{ $cartCount > 0 ? '' : 'display: none;' }}">
                        {{ $cartCount }}
                    </span>
                </a>

                <!-- User Dropdown / Login -->
                @auth
                    <div style="position: relative;" class="user-dropdown-wrapper">
                        <a href="/dashboard" class="nav-btn" style="border-radius: 50px; padding: 8px 16px; gap: 8px; font-size: 0.9rem; font-weight: 600;">
                            <i class="fa-solid fa-user"></i> {{ explode(' ', Auth::user()->name)[0] }}
                        </a>
                    </div>
                    @if(Auth::user()->isAdmin() || Auth::user()->isEmployee())
                        <a href="/admin" class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.85rem;">Panel Admin</a>
                    @endif
                    <a href="#" class="btn btn-accent" style="padding: 8px 16px; font-size: 0.85rem;" 
                       onclick="event.preventDefault(); document.getElementById('logout-form-header').submit();">
                       Salir
                    </a>
                    <form id="logout-form-header" action="{{ route('logout') }}" method="POST" style="display: none;">
                        @csrf
                    </form>
                @else
                    <a href="{{ route('login') }}" class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.9rem;">Ingresar</a>
                    <a href="{{ route('register') }}" class="btn btn-primary" style="padding: 8px 16px; font-size: 0.9rem;">Registrarse</a>
                @endauth
            </div>
        </div>

        <!-- Subnav / Mega Menu -->
        <nav class="sub-nav">
            <div class="sub-nav-container">
                <div class="mega-menu-trigger">
                    <i class="fa-solid fa-bars"></i> <strong>Categorías</strong>
                    <!-- Mega Menu Dropdown -->
                    <div class="mega-menu">
                        <div class="mega-menu-container">
                            <div class="mega-menu-col">
                                <h3>Hogar & Estilo</h3>
                                <ul>
                                    <li><a href="/store?category=hogar">Hogar</a></li>
                                    <li><a href="/store?category=cocina">Cocina</a></li>
                                    <li><a href="/store?category=muebles">Muebles</a></li>
                                    <li><a href="/store?category=jardin">Jardín</a></li>
                                </ul>
                            </div>
                            <div class="mega-menu-col">
                                <h3>Moda & Ropa</h3>
                                <ul>
                                    <li><a href="/store?category=ropa-hombre">Moda Hombre</a></li>
                                    <li><a href="/store?category=ropa-mujer">Moda Mujer</a></li>
                                    <li><a href="/store?category=ropa-ninos">Moda Niños</a></li>
                                    <li><a href="/store?category=ropa-bebes">Moda Bebés</a></li>
                                </ul>
                            </div>
                            <div class="mega-menu-col">
                                <h3>Tecnología & Ocio</h3>
                                <ul>
                                    <li><a href="/store?category=tecnologia">Tecnología</a></li>
                                    <li><a href="/store?category=juegos">Juegos & Consolas</a></li>
                                    <li><a href="/store?category=juguetes">Juguetes</a></li>
                                    <li><a href="/store?category=mascotas">Mascotas</a></li>
                                </ul>
                            </div>
                            <div class="mega-menu-col">
                                <h3>Software & Proyectos</h3>
                                <ul>
                                    <li><a href="/store?type=software">Sistemas Administrativos</a></li>
                                    <li><a href="/store?type=software">CRM & ERP</a></li>
                                    <li><a href="/store?type=software">Sistemas POS</a></li>
                                    <li><a href="/store?type=project">Proyectos Realizados</a></li>
                                </ul>
                            </div>
                            <div class="mega-menu-col">
                                <h3>Cursos & Contenido</h3>
                                <ul>
                                    <li><a href="/store?type=course">Cursos LMS</a></li>
                                    <li><a href="/store?type=digital">Libros & E-Books</a></li>
                                    <li><a href="/store?type=digital">Plantillas & Recursos</a></li>
                                    <li><a href="/store?type=digital">Licencias & Plugins</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <a href="/store" class="mega-menu-trigger" style="font-weight: 500;">Tienda</a>
                <a href="/store?type=software" class="mega-menu-trigger" style="font-weight: 500;">Software</a>
                <a href="/store?type=project" class="mega-menu-trigger" style="font-weight: 500;">Proyectos</a>
                <a href="/store?type=course" class="mega-menu-trigger" style="font-weight: 500;">Cursos</a>
                <a href="/store?promo=1" class="mega-menu-trigger" style="font-weight: 500; color: var(--accent-color);"><i class="fa-solid fa-fire"></i> Ofertas Especiales</a>
            </div>
        </nav>
    </header>

    <!-- Main Content Area -->
    <main>
        @yield('content')
    </main>

    <!-- Footer Section -->
    <footer style="background: var(--bg-secondary); border-top: 1px solid var(--glass-border); padding: 60px 0 30px 0; margin-top: 80px;">
        <div class="section-wrapper" style="margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px;">
            <div>
                <h2 style="font-weight: 800; font-size: 1.6rem; background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 20px;">Sorti</h2>
                <p style="color: var(--text-secondary); font-size: 0.95rem;">La plataforma de comercio electrónico de nueva generación para productos físicos, digitales, software empresarial y cursos interactivos.</p>
            </div>
            <div>
                <h4 style="font-weight: 700; margin-bottom: 20px;">Navegación</h4>
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 10px; font-size: 0.95rem; color: var(--text-secondary);">
                    <li><a href="/store">Todos los Productos</a></li>
                    <li><a href="/store?type=software">Sistemas & Apps</a></li>
                    <li><a href="/store?type=course">Academia (Cursos)</a></li>
                    <li><a href="/store?type=project">Proyectos Demo</a></li>
                </ul>
            </div>
            <div>
                <h4 style="font-weight: 700; margin-bottom: 20px;">Soporte y Cuenta</h4>
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 10px; font-size: 0.95rem; color: var(--text-secondary);">
                    <li><a href="/dashboard">Mi Cuenta</a></li>
                    <li><a href="/dashboard/purchases">Mis Compras</a></li>
                    <li><a href="/dashboard/coins">Mis Monedas Sorti</a></li>
                    <li><a href="/cart">Carrito de Compras</a></li>
                </ul>
            </div>
            <div>
                <h4 style="font-weight: 700; margin-bottom: 20px;">Métodos de Pago</h4>
                <div style="display: flex; gap: 10px; font-size: 1.8rem; color: var(--text-muted);">
                    <i class="fa-solid fa-qrcode" title="Yape"></i>
                    <i class="fa-solid fa-building-columns" title="Transferencia Bancaria"></i>
                    <i class="fa-brands fa-cc-stripe" title="Stripe (Próximamente)"></i>
                    <i class="fa-brands fa-cc-paypal" title="PayPal (Próximamente)"></i>
                </div>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 12px;">Comercio 100% seguro. Inicialmente aceptando Yape y transferencias bancarias manuales.</p>
            </div>
        </div>
        <div style="text-align: center; border-top: 1px solid var(--glass-border); padding-top: 30px; margin-top: 40px; font-size: 0.9rem; color: var(--text-muted);">
            &copy; {{ date('Y') }} Sorti. Todos los derechos reservados. Desarrollado con tecnología premium 2026-2027.
        </div>
    </footer>

    <!-- Custom JS -->
    <script src="{{ asset('js/sorti.js') }}"></script>
    @yield('scripts')
</body>
</html>
