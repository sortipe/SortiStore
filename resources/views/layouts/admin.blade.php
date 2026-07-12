<!DOCTYPE html>
<html lang="es" data-theme="dark"> <!-- Admin default dark for professional look -->
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Admin - Panel de Control Sorti')</title>
    
    <!-- Fonts & Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="{{ asset('css/sorti.css') }}">
    @yield('styles')
</head>
<body>

    <!-- Header Section -->
    <header class="sorti-header" style="background: var(--bg-secondary);">
        <div class="navbar-container">
            <a href="/admin" class="logo-link" style="font-size: 1.6rem;">Sorti <span style="font-size: 0.9rem; font-weight: 500; opacity: 0.7; color: var(--primary-color);">Admin</span></a>
            
            <div class="nav-actions">
                <a href="/" class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.85rem;"><i class="fa-solid fa-globe"></i> Ver Tienda</a>
                <button id="theme-toggle-btn" class="theme-switch-btn" aria-label="Cambiar tema">🌙</button>
                
                <div style="font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-user-shield"></i> {{ Auth::user()->name }}
                </div>
                <a href="#" class="btn btn-accent" style="padding: 8px 16px; font-size: 0.85rem;" 
                   onclick="event.preventDefault(); document.getElementById('logout-form-admin').submit();">
                   Salir
                </a>
                <form id="logout-form-admin" action="{{ route('logout') }}" method="POST" style="display: none;">
                    @csrf
                </form>
            </div>
        </div>
    </header>

    <!-- Main Sidebar Dashboard Layout -->
    <div class="dashboard-grid" style="margin-top: 24px;">
        <!-- Left Sidebar Navigation -->
        <aside class="dashboard-sidebar glass-panel" style="padding: 16px;">
            <div style="padding: 8px 18px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px;">Gestión Comercial</div>
            <ul class="sidebar-menu">
                <li>
                    <a href="/admin" class="sidebar-menu-item {{ Request::is('admin') ? 'active' : '' }}">
                        <i class="fa-solid fa-chart-line"></i> Dashboard
                    </a>
                </li>
                <li>
                    <a href="/admin/sales" class="sidebar-menu-item {{ Request::is('admin/sales*') ? 'active' : '' }}">
                        <i class="fa-solid fa-receipt"></i> Ventas & Pedidos
                    </a>
                </li>
                <li>
                    <a href="/admin/customers" class="sidebar-menu-item {{ Request::is('admin/customers*') ? 'active' : '' }}">
                        <i class="fa-solid fa-users"></i> Clientes
                    </a>
                </li>
            </ul>

            <div style="padding: 16px 8px 8px 18px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px;">Catálogo & Contenido</div>
            <ul class="sidebar-menu">
                <li>
                    <a href="/admin/products" class="sidebar-menu-item {{ Request::is('admin/products*') ? 'active' : '' }}">
                        <i class="fa-solid fa-box-open"></i> Productos
                    </a>
                </li>
                <li>
                    <a href="/admin/categories" class="sidebar-menu-item {{ Request::is('admin/categories*') ? 'active' : '' }}">
                        <i class="fa-solid fa-folder-tree"></i> Categorías
                    </a>
                </li>
                <li>
                    <a href="/admin/courses" class="sidebar-menu-item {{ Request::is('admin/courses*') ? 'active' : '' }}">
                        <i class="fa-solid fa-graduation-cap"></i> LMS (Cursos)
                    </a>
                </li>
            </ul>

            <div style="padding: 16px 8px 8px 18px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px;">Marketing & Logística</div>
            <ul class="sidebar-menu">
                <li>
                    <a href="/admin/coupons" class="sidebar-menu-item {{ Request::is('admin/coupons*') ? 'active' : '' }}">
                        <i class="fa-solid fa-tags"></i> Cupones
                    </a>
                </li>
                <li>
                    <a href="/admin/discounts" class="sidebar-menu-item {{ Request::is('admin/discounts*') ? 'active' : '' }}">
                        <i class="fa-solid fa-percent"></i> Descuentos Qty
                    </a>
                </li>
                <li>
                    <a href="/admin/offers" class="sidebar-menu-item {{ Request::is('admin/offers*') ? 'active' : '' }}">
                        <i class="fa-solid fa-fire-flame-curved"></i> Ofertas Especiales
                    </a>
                </li>
                <li>
                    <a href="/admin/shipping" class="sidebar-menu-item {{ Request::is('admin/shipping*') ? 'active' : '' }}">
                        <i class="fa-solid fa-truck-ramp-box"></i> Zonas de Envío
                    </a>
                </li>
            </ul>

            <div style="padding: 16px 8px 8px 18px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px;">Ajustes del Sistema</div>
            <ul class="sidebar-menu">
                <li>
                    <a href="/admin/settings" class="sidebar-menu-item {{ Request::is('admin/settings*') ? 'active' : '' }}">
                        <i class="fa-solid fa-sliders"></i> Configuración General
                    </a>
                </li>
            </ul>
        </aside>

        <!-- Right Main Panel -->
        <main class="glass-panel" style="padding: 32px; min-height: 70vh;">
            <!-- Display success or error flash messages -->
            @if(session('success'))
                <div style="background: rgba(16, 185, 129, 0.15); color: var(--color-success); border: 1px solid var(--color-success); padding: 16px; border-radius: 12px; margin-bottom: 24px; font-weight: 600;">
                    ✨ {{ session('success') }}
                </div>
            @endif
            @if(session('error'))
                <div style="background: rgba(239, 68, 68, 0.15); color: var(--color-danger); border: 1px solid var(--color-danger); padding: 16px; border-radius: 12px; margin-bottom: 24px; font-weight: 600;">
                    ❌ {{ session('error') }}
                </div>
            @endif
            @if ($errors->any())
                <div style="background: rgba(239, 68, 68, 0.15); color: var(--color-danger); border: 1px solid var(--color-danger); padding: 16px; border-radius: 12px; margin-bottom: 24px;">
                    <ul style="margin-left: 20px;">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            @yield('content')
        </main>
    </div>

    <!-- Custom JS -->
    <script src="{{ asset('js/sorti.js') }}"></script>
    @yield('scripts')
</body>
</html>
