@extends('layouts.admin')

@section('title', 'Control de Ventas - Admin')

@section('content')
<div style="margin-bottom: 32px;">
    <h1 style="font-weight: 800; font-size: 2rem; margin-bottom: 6px;">Control de Ventas y Pedidos</h1>
    <p style="color: var(--text-secondary);">Verifica comprobantes de pago subidos por Yape o transferencia y autoriza el despacho de órdenes.</p>
</div>

<div class="glass-panel" style="padding: 24px;">
    @if($orders->count() === 0)
        <p style="color:var(--text-muted); text-align:center; padding:40px 0;">No hay pedidos registrados en la plataforma.</p>
    @else
        <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.95rem;">
                <thead>
                    <tr style="border-bottom:1px solid var(--glass-border); color:var(--text-secondary);">
                        <th style="padding:12px 8px;">Pedido</th>
                        <th style="padding:12px 8px;">Fecha</th>
                        <th style="padding:12px 8px;">Cliente</th>
                        <th style="padding:12px 8px;">Total</th>
                        <th style="padding:12px 8px;">Método Pago</th>
                        <th style="padding:12px 8px;">Estado Pago</th>
                        <th style="padding:12px 8px;">Entrega</th>
                        <th style="padding:12px 8px; text-align:center;">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($orders as $order)
                        <tr style="border-bottom:1px solid var(--glass-border);">
                            <td style="padding:12px 8px; font-weight:700;">#{{ $order->id }}</td>
                            <td style="padding:12px 8px; font-size:0.85rem;">{{ $order->created_at->format('d/m/Y h:i A') }}</td>
                            <td style="padding:12px 8px;">
                                @if($order->user)
                                    <strong>{{ $order->user->name }}</strong>
                                @else
                                    <span style="color:var(--text-muted);">{{ $order->guest_email }} (Invitado)</span>
                                @endif
                            </td>
                            <td style="padding:12px 8px; font-weight:800; color:var(--primary-color);">S/ {{ $order->total }}</td>
                            <td style="padding:12px 8px;"><span style="background:var(--bg-tertiary); padding:4px 8px; border-radius:6px; font-size:0.8rem; font-weight:600;">{{ strtoupper($order->payment_method) }}</span></td>
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
                            <td style="padding:12px 8px; text-align:center;">
                                <a href="/admin/sales/{{ $order->id }}" class="btn btn-secondary" style="padding:6px 12px; font-size:0.8rem;"><i class="fa-solid fa-magnifying-glass"></i> Administrar</a>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div style="margin-top:24px; display:flex; justify-content:center;">
            {{ $orders->links() }}
        </div>
    @endif
</div>
@endsection
