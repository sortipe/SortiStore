@extends('layouts.store')

@section('title', 'Mi Cuenta - Sorti')

@section('content')
<div class="section-wrapper">
    <div class="dashboard-grid">
        <!-- Sidebar Navigation -->
        @include('dashboard.sidebar')

        <!-- Main Panel Content -->
        <div style="display:flex; flex-direction:column; gap:24px;">
            <!-- Welcome Box -->
            <div class="glass-panel" style="padding: 32px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%);">
                <h1 style="font-weight: 800; font-size: 1.8rem; margin-bottom: 8px;">¡Hola, {{ Auth::user()->name }}!</h1>
                <p style="color: var(--text-secondary);">Bienvenido a tu panel de control de Sorti. Administra tus compras físicas, descargas de software, avance de cursos y tus monedas virtuales acumuladas.</p>
            </div>

            <!-- Stats Grid KPI cards -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                <div class="glass-panel" style="padding: 24px; text-align: center;">
                    <div style="font-size: 2rem; color: var(--sorti-gold); margin-bottom: 8px;"><i class="fa-solid fa-coins"></i></div>
                    <div style="font-size: 1.5rem; font-weight: 800;">{{ Auth::user()->sorti_coins_balance }}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">Monedas Sorti</div>
                </div>
                <div class="glass-panel" style="padding: 24px; text-align: center;">
                    <div style="font-size: 2rem; color: var(--primary-color); margin-bottom: 8px;"><i class="fa-solid fa-graduation-cap"></i></div>
                    <div style="font-size: 1.5rem; font-weight: 800;">{{ $activeCoursesCount }}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">Mis Cursos LMS</div>
                </div>
                <div class="glass-panel" style="padding: 24px; text-align: center;">
                    <div style="font-size: 2rem; color: var(--color-info); margin-bottom: 8px;"><i class="fa-solid fa-cloud-arrow-down"></i></div>
                    <div style="font-size: 1.5rem; font-weight: 800;">{{ $downloadsCount }}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">Descargas Activas</div>
                </div>
            </div>

            <!-- Recent Orders table -->
            <div class="glass-panel" style="padding: 32px;">
                <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;">Compras Recientes</h3>
                @if(count($recentOrders) === 0)
                    <p style="color:var(--text-muted); text-align:center; padding:20px 0;">No tienes pedidos registrados aún.</p>
                @else
                    <div style="overflow-x:auto;">
                        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.95rem;">
                            <thead>
                                <tr style="border-bottom:1px solid var(--glass-border); color:var(--text-secondary);">
                                    <th style="padding:12px 8px;">Pedido</th>
                                    <th style="padding:12px 8px;">Fecha</th>
                                    <th style="padding:12px 8px;">Total</th>
                                    <th style="padding:12px 8px;">Pago</th>
                                    <th style="padding:12px 8px;">Estado</th>
                                    <th style="padding:12px 8px;">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($recentOrders as $order)
                                    <tr style="border-bottom:1px solid var(--glass-border);">
                                        <td style="padding:12px 8px; font-weight:700;">#{{ $order->id }}</td>
                                        <td style="padding:12px 8px;">{{ $order->created_at->format('d/m/Y') }}</td>
                                        <td style="padding:12px 8px; font-weight:700;">S/ {{ $order->total }}</td>
                                        <td style="padding:12px 8px;">
                                            <span style="background: {{ $order->payment_status === 'confirmed' ? 'rgba(16,185,129,0.15); color:var(--color-success);' : 'rgba(245,158,11,0.15); color:var(--color-warning);' }} padding:4px 8px; border-radius:4px; font-size:0.8rem; font-weight:600;">
                                                {{ $order->payment_status === 'confirmed' ? 'Confirmado' : 'Pendiente' }}
                                            </span>
                                        </td>
                                        <td style="padding:12px 8px;">
                                            <span style="background: {{ $order->status === 'completed' ? 'rgba(16,185,129,0.15); color:var(--color-success);' : 'rgba(99,102,241,0.15); color:var(--primary-color);' }} padding:4px 8px; border-radius:4px; font-size:0.8rem; font-weight:600;">
                                                {{ ucfirst($order->status) }}
                                            </span>
                                        </td>
                                        <td style="padding:12px 8px;">
                                            <a href="/dashboard/purchases" class="btn btn-secondary" style="padding:6px 12px; font-size:0.8rem; font-weight:500;">Detalles</a>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                @endif
            </div>
        </div>
    </div>
</div>
@endsection
