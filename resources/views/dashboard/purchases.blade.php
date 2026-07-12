@extends('layouts.store')

@section('title', 'Mis Compras - Sorti')

@section('content')
<div class="section-wrapper">
    <div class="dashboard-grid">
        @include('dashboard.sidebar')

        <div class="glass-panel" style="padding: 32px;">
            <h1 style="font-weight: 800; font-size: 1.8rem; margin-bottom: 24px;"><i class="fa-solid fa-basket-shopping"></i> Historial de Compras</h1>

            @if(count($orders) === 0)
                <p style="color:var(--text-muted); text-align:center; padding:40px 0;">Aún no has realizado ninguna compra.</p>
            @else
                <div style="display:flex; flex-direction:column; gap:20px;">
                    @foreach($orders as $order)
                        <div style="background:var(--bg-tertiary); border:1px solid var(--glass-border); padding:24px; border-radius:12px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-bottom:1px solid var(--glass-border); padding-bottom:16px; margin-bottom:16px;">
                                <div>
                                    <h3 style="font-weight:800; font-size:1.1rem;">Pedido #{{ $order->id }}</h3>
                                    <span style="font-size:0.85rem; color:var(--text-muted);">Fecha: {{ $order->created_at->format('d/m/Y h:i A') }}</span>
                                </div>
                                <div style="display:flex; gap:10px; align-items:center;">
                                    <span style="background: {{ $order->payment_status === 'confirmed' ? 'rgba(16,185,129,0.15); color:var(--color-success);' : 'rgba(245,158,11,0.15); color:var(--color-warning);' }} padding:6px 12px; border-radius:50px; font-size:0.8rem; font-weight:700;">
                                        Pago: {{ $order->payment_status === 'confirmed' ? 'Confirmado' : 'Pendiente Verificación' }}
                                    </span>
                                    <span style="background: {{ $order->status === 'completed' ? 'rgba(16,185,129,0.15); color:var(--color-success);' : 'rgba(99,102,241,0.15); color:var(--primary-color);' }} padding:6px 12px; border-radius:50px; font-size:0.8rem; font-weight:700;">
                                        Entrega: {{ ucfirst($order->status) }}
                                    </span>
                                </div>
                            </div>

                            <div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:24px;">
                                <!-- Order Info Details -->
                                <div>
                                    <div style="font-size:0.9rem; margin-bottom:12px;">
                                        <strong>Método de entrega:</strong> {{ $order->delivery_method === 'delivery' ? 'Delivery a domicilio' : 'Recojo en local' }}
                                    </div>
                                    @if($order->delivery_method === 'delivery')
                                        <div style="font-size:0.9rem; margin-bottom:12px;">
                                            <strong>Dirección:</strong> {{ $order->delivery_address }}
                                        </div>
                                    @endif
                                    <div style="font-size:0.9rem; margin-bottom:12px;">
                                        <strong>Método de Pago:</strong> {{ $order->payment_method === 'yape' ? 'Yape' : 'Transferencia Bancaria' }}
                                    </div>

                                    @if($order->payment_receipt)
                                        <div style="font-size:0.9rem; margin-top:16px;">
                                            <strong>Comprobante enviado:</strong> 
                                            <a href="{{ asset('storage/' . $order->payment_receipt) }}" target="_blank" style="color:var(--primary-color); font-weight:600; display:inline-flex; align-items:center; gap:4px; margin-left:8px;">
                                                <i class="fa-solid fa-image"></i> Ver captura de pantalla
                                            </a>
                                        </div>
                                    @endif
                                </div>

                                <!-- Financial Totals box -->
                                <div style="background:var(--bg-secondary); padding:16px; border-radius:8px; height:fit-content; font-size:0.9rem; display:flex; flex-direction:column; gap:8px;">
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>Descuento</span>
                                        <strong>S/ {{ $order->discount }}</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>Costo Envío</span>
                                        <strong>S/ {{ $order->shipping_cost }}</strong>
                                    </div>
                                    @if($order->sorti_coins_spent > 0)
                                        <div style="display:flex; justify-content:space-between; color:var(--sorti-gold);">
                                            <span>Monedas Canjeadas</span>
                                            <strong>- {{ $order->sorti_coins_spent }} monedas</strong>
                                        </div>
                                    @endif
                                    <div style="display:flex; justify-content:space-between; border-top:1px solid var(--glass-border); padding-top:8px; font-weight:700; font-size:1rem;">
                                        <span>Total Pagado</span>
                                        <span style="color:var(--primary-color);">S/ {{ $order->total }}</span>
                                    </div>
                                    @if($order->sorti_coins_earned > 0)
                                        <div style="font-size:0.8rem; font-weight:700; color:var(--sorti-gold); margin-top:8px; text-align:center;">
                                            ★ Acumuló: +{{ $order->sorti_coins_earned }} monedas
                                        </div>
                                    @endif
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
