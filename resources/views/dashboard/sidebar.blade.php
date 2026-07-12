<aside class="dashboard-sidebar glass-panel" style="padding: 16px; height: fit-content;">
    <div style="padding: 8px 18px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px;">Mi Portal</div>
    <ul class="sidebar-menu">
        <li>
            <a href="/dashboard" class="sidebar-menu-item {{ Request::is('dashboard') ? 'active' : '' }}">
                <i class="fa-solid fa-gauge"></i> Resumen
            </a>
        </li>
        <li>
            <a href="/dashboard/purchases" class="sidebar-menu-item {{ Request::is('dashboard/purchases*') ? 'active' : '' }}">
                <i class="fa-solid fa-basket-shopping"></i> Mis Compras
            </a>
        </li>
        <li>
            <a href="/dashboard/downloads" class="sidebar-menu-item {{ Request::is('dashboard/downloads*') ? 'active' : '' }}">
                <i class="fa-solid fa-cloud-arrow-down"></i> Mis Descargas
            </a>
        </li>
        <li>
            <a href="/dashboard/courses" class="sidebar-menu-item {{ Request::is('dashboard/courses*') ? 'active' : '' }}">
                <i class="fa-solid fa-graduation-cap"></i> Mis Cursos
            </a>
        </li>
    </ul>

    <div style="padding: 16px 8px 8px 18px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px;">Billetera & Regalos</div>
    <ul class="sidebar-menu">
        <li>
            <a href="/dashboard/coins" class="sidebar-menu-item {{ Request::is('dashboard/coins*') ? 'active' : '' }}">
                <i class="fa-solid fa-coins"></i> Mis Monedas
            </a>
        </li>
        <li>
            <a href="/dashboard/coupons" class="sidebar-menu-item {{ Request::is('dashboard/coupons*') ? 'active' : '' }}">
                <i class="fa-solid fa-tags"></i> Mis Cupones
            </a>
        </li>
    </ul>

    <div style="padding: 16px 8px 8px 18px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px;">Ajustes</div>
    <ul class="sidebar-menu">
        <li>
            <a href="/dashboard/account" class="sidebar-menu-item {{ Request::is('dashboard/account*') ? 'active' : '' }}">
                <i class="fa-solid fa-gears"></i> Mi Cuenta
            </a>
        </li>
    </ul>
</aside>
