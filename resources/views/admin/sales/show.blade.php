@extends('layouts.admin')

@section('title', 'Detalle de Venta #' . $order->id . ' - Admin')

@section('content')
<div style="margin-bottom: 32px;">
    <a href="{{ route('admin.sales.index') }}" style="color:var(--primary-color); font-weight:600; font-size:0.9rem; display:inline-flex; align-items:center; gap:6px; margin-bottom:12px;">
        <i class="fa-solid fa-arrow-left-long"></i> Volver a pedidos
    </a>
    <h1 style="font-weight: 800; font-size: 2rem; margin-bottom: 6px;">Detalle de Pedido #{{ $order->id }}</h1>
    <p style="color: var(--text-secondary);">Revisa el comprobante y aprueba la entrega de la orden.</p>
</div>

<div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:32px;" class="dashboard-grid">
    <!-- Left: Order Items & Client Info -->
    <div style="display:flex; flex-direction:column; gap:24px;">
        <!-- Items details table -->
        <div class="glass-panel" style="padding: 24px;">
            <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Productos Solicitados</h3>
            
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                    <thead>
                        <tr style="border-bottom:1px solid var(--glass-border); color:var(--text-secondary);">
                            <th style="padding:10px 4px;">Producto</th>
                            <th style="padding:10px 4px;">Cantidad</th>
                            <th style="padding:10px 4px;">Precio Unit.</th>
                            <th style="padding:10px 4px; text-align:right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($order->items as $item)
                            <tr style="border-bottom:1px solid var(--glass-border);">
                                <td style="padding:10px 4px; font-weight:700;">
                                    {{ $item->product->name }}
                                    @if($item->variant)
                                        <div style="font-size:0.75rem; color:var(--primary-color); font-weight:600;">
                                            {{ $item->variant->name }}: {{ $item->variant->value }}
                                        </div>
                                    @endif
                                </td>
                                <td style="padding:10px 4px;">{{ $item->quantity }}</td>
                                <td style="padding:10px 4px;">S/ {{ $item->price }}</td>
                                <td style="padding:10px 4px; text-align:right; font-weight:700;">S/ {{ $item->total }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Receipt Capture Preview card -->
        <div class="glass-panel" style="padding: 24px;">
            <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Comprobante de Pago Cargado</h3>
            @if($order->payment_receipt)
                <div style="text-align:center;">
                    <img src="{{ asset('storage/' . $order->payment_receipt) }}" alt="Comprobante de pago" style="max-width:100%; max-height:480px; border-radius:12px; box-shadow:var(--shadow-md); border:1px solid var(--glass-border);">
                    <div style="margin-top:16px;">
                        <a href="{{ asset('storage/' . $order->payment_receipt) }}" target="_blank" class="btn btn-secondary"><i class="fa-solid fa-expand"></i> Ver en tamaño completo</a>
                    </div>
                </div>
            @else
                <p style="color:var(--text-muted); text-align:center; padding:20px 0;">No se ha cargado ninguna captura de pantalla para este pedido.</p>
            @endif
        </div>
    </div>

    <!-- Right: Payment & Delivery states controls -->
    <div style="display:flex; flex-direction:column; gap:24px;">
        <!-- Order Stats Panel -->
        <div class="glass-panel" style="padding:24px;">
            <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Estado del Pedido</h3>
            
            <div style="display:flex; flex-direction:column; gap:12px; font-size:0.95rem; margin-bottom:24px;">
                <div><strong>Cliente:</strong> {{ $order->user ? $order->user->name : 'Compra como Invitado' }}</div>
                @if($order->user)
                    <div><strong>Email:</strong> {{ $order->user->email }}</div>
                @else
                    <div><strong>Email:</strong> {{ $order->guest_email }}</div>
                @endif
                <div><strong>Celular:</strong> {{ $order->guest_phone }}</div>
                <div><strong>Método Entrega:</strong> {{ $order->delivery_method === 'delivery' ? 'Envío a domicilio' : 'Recojo en local' }}</div>
                @if($order->delivery_method === 'delivery')
                    <div><strong>Dirección:</strong> {{ $order->delivery_address }} (Distrito: {{ $order->delivery_district }})</div>
                @endif
                <div style="border-top:1px dashed var(--glass-border); padding-top:12px; margin-top:12px;"></div>
                
                <div style="display:flex; justify-content:space-between;">
                    <span>Total Pedido:</span>
                    <strong style="font-size:1.2rem; color:var(--primary-color);">S/ {{ $order->total }}</strong>
                </div>
                @if($order->sorti_coins_spent > 0)
                    <div style="display:flex; justify-content:space-between; color:var(--sorti-gold); font-weight:600;">
                        <span>Canjeó:</span>
                        <span>- {{ $order->sorti_coins_spent }} monedas (S/ {{ round($order->sorti_coins_spent/100, 2) }})</span>
                    </div>
                @endif
                @if($order->sorti_coins_earned > 0)
                    <div style="font-size:0.85rem; font-weight:700; color:var(--sorti-gold); text-align:center; background:rgba(234,179,8,0.05); padding:8px; border-radius:6px; border:1px solid rgba(234,179,8,0.1); margin-top:8px;">
                        ★ Abonará al confirmar: +{{ $order->sorti_coins_earned }} monedas
                    </div>
                @endif
            </div>

            <!-- Confirm Payment Button -->
            @if($order->payment_status !== 'confirmed')
                <form action="/admin/sales/{{ $order->id }}/confirm" method="POST" style="margin-bottom:16px;">
                    @csrf
                    <button type="submit" class="btn btn-primary" style="width:100%; font-size:0.95rem; padding:12px;"><i class="fa-solid fa-circle-check"></i> Confirmar Pago Recibido</button>
                </form>
            @else
                <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2); padding:16px; border-radius:12px; color:var(--color-success); text-align:center; font-weight:700; margin-bottom:20px;">
                    ✓ Pago Validado y Confirmado
                </div>
            @endif

            <!-- Delivery status selector -->
            <form action="/admin/sales/{{ $order->id }}/status" method="POST">
                @csrf
                <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Actualizar Estado de Despacho</label>
                <div style="display:flex; gap:8px;">
                    <select name="status" class="search-input" style="padding-left:12px; font-size:0.9rem; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--glass-border); outline:none;">
                        <option value="pending" {{ $order->status === 'pending' ? 'selected' : '' }}>Pendiente</option>
                        <option value="paid" {{ $order->status === 'paid' ? 'selected' : '' }}>Pagado</option>
                        <option value="shipped" {{ $order->status === 'shipped' ? 'selected' : '' }}>Enviado</option>
                        <option value="completed" {{ $order->status === 'completed' ? 'selected' : '' }}>Entregado</option>
                        <option value="cancelled" {{ $order->status === 'cancelled' ? 'selected' : '' }}>Cancelado</option>
                    </select>
                    <button type="submit" class="btn btn-secondary" style="padding:10px 16px;">Actualizar</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
