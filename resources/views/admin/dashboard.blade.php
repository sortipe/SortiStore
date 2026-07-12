@extends('layouts.admin')

@section('title', 'Dashboard Administrativo - Sorti')

@section('content')
<div style="margin-bottom: 32px;">
    <h1 style="font-weight: 800; font-size: 2rem; margin-bottom: 6px;">Dashboard Administrativo</h1>
    <p style="color: var(--text-secondary);">Resumen comercial de ventas, monedas Sorti y estado general de la plataforma.</p>
</div>

<!-- KPI Cards -->
<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px;">
    <div class="glass-panel" style="padding: 24px; display: flex; align-items: center; gap: 16px;">
        <div style="font-size: 2.2rem; color: var(--color-success);"><i class="fa-solid fa-money-bill-trend-up"></i></div>
        <div>
            <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Ventas Totales</span>
            <div style="font-size: 1.4rem; font-weight: 800; margin-top: 4px;">S/ {{ number_format($totalSales, 2) }}</div>
        </div>
    </div>
    <div class="glass-panel" style="padding: 24px; display: flex; align-items: center; gap: 16px;">
        <div style="font-size: 2.2rem; color: var(--color-warning);"><i class="fa-solid fa-circle-exclamation"></i></div>
        <div>
            <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Pedidos Pendientes</span>
            <div style="font-size: 1.4rem; font-weight: 800; margin-top: 4px;">{{ $pendingOrdersCount }} pedidos</div>
        </div>
    </div>
    <div class="glass-panel" style="padding: 24px; display: flex; align-items: center; gap: 16px;">
        <div style="font-size: 2.2rem; color: var(--primary-color);"><i class="fa-solid fa-users"></i></div>
        <div>
            <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Clientes Registrados</span>
            <div style="font-size: 1.4rem; font-weight: 800; margin-top: 4px;">{{ $totalCustomers }} usuarios</div>
        </div>
    </div>
    <div class="glass-panel" style="padding: 24px; display: flex; align-items: center; gap: 16px;">
        <div style="font-size: 2.2rem; color: var(--color-info);"><i class="fa-solid fa-boxes-stacked"></i></div>
        <div>
            <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Productos Catálogo</span>
            <div style="font-size: 1.4rem; font-weight: 800; margin-top: 4px;">{{ $totalProducts }} items</div>
        </div>
    </div>
</div>

<div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 32px;" class="dashboard-grid">
    <!-- Recent Orders table -->
    <div class="glass-panel" style="padding: 24px;">
        <h3 style="font-weight: 700; margin-bottom: 20px; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px;">Ventas Recientes</h3>
        @if($recentOrders->count() === 0)
            <p style="color:var(--text-muted); text-align:center; padding:20px 0;">No hay ventas registradas aún.</p>
        @else
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                    <thead>
                        <tr style="border-bottom:1px solid var(--glass-border); color:var(--text-secondary);">
                            <th style="padding:10px 4px;">Pedido</th>
                            <th style="padding:10px 4px;">Cliente</th>
                            <th style="padding:10px 4px;">Monto</th>
                            <th style="padding:10px 4px;">Pago</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($recentOrders as $order)
                            <tr style="border-bottom:1px solid var(--glass-border);">
                                <td style="padding:10px 4px; font-weight:700;"><a href="/admin/sales/{{ $order->id }}" style="color:var(--primary-color);">#{{ $order->id }}</a></td>
                                <td style="padding:10px 4px; font-size:0.85rem;">{{ $order->user ? $order->user->name : $order->guest_email }}</td>
                                <td style="padding:10px 4px; font-weight:700;">S/ {{ $order->total }}</td>
                                <td style="padding:10px 4px;">
                                    <span style="background: {{ $order->payment_status === 'confirmed' ? 'rgba(16,185,129,0.15); color:var(--color-success);' : 'rgba(245,158,11,0.15); color:var(--color-warning);' }} padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:600;">
                                        {{ $order->payment_status === 'confirmed' ? 'Confirmado' : 'Pendiente' }}
                                    </span>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </div>

    <!-- Monthly Stats placeholder chart list -->
    <div class="glass-panel" style="padding: 24px;">
        <h3 style="font-weight: 700; margin-bottom: 20px; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px;">Gráfico de Ventas Mensuales</h3>
        <div style="margin-top: 20px; display:flex; flex-direction:column; gap:16px;">
            @foreach($salesStats as $stat)
                @php
                    $monthName = DateTime::createFromFormat('!m', $stat->month)->format('F');
                    // Translate month to spanish
                    $monthsEs = ['January'=>'Enero','February'=>'Febrero','March'=>'Marzo','April'=>'Abril','May'=>'Mayo','June'=>'Junio','July'=>'Julio','August'=>'Agosto','September'=>'Septiembre','October'=>'Octubre','November'=>'Noviembre','December'=>'Diciembre'];
                    $monthEs = $monthsEs[$monthName] ?? $monthName;
                @endphp
                <div>
                    <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:6px;">
                        <span>{{ $monthEs }}</span>
                        <strong>S/ {{ number_format($stat->total, 2) }}</strong>
                    </div>
                    <!-- simple CSS progress bar as visual chart -->
                    <div style="width:100%; height:12px; background:var(--bg-tertiary); border-radius:50px; overflow:hidden;">
                        <div style="width: {{ min(100, round(($stat->total / max(1, $totalSales)) * 100)) }}%; height:100%; background:var(--primary-gradient); border-radius:50px;"></div>
                    </div>
                </div>
            @endforeach
            @if($salesStats->count() === 0)
                <p style="color:var(--text-muted); text-align:center; padding:20px 0;">Esperando por confirmar pagos para generar gráficos.</p>
            @endif
        </div>
    </div>
</div>
@endsection
