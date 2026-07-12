@extends('layouts.store')

@section('title', '¡Pedido Completado! - Sorti')

@section('content')
<div class="section-wrapper" style="max-width: 800px; text-align: center;">
    <div style="font-size: 5rem; color: var(--color-success); margin-bottom: 24px; animation: jump 1s ease;"><i class="fa-solid fa-circle-check"></i></div>
    <h1 style="font-weight: 800; font-size: 2.2rem; margin-bottom: 8px;">¡Gracias por tu compra!</h1>
    <p style="color: var(--text-secondary); font-size: 1.1rem; margin-bottom: 40px;">Tu pedido #<strong>{{ $order->id }}</strong> ha sido registrado con éxito y se encuentra en estado: <strong style="color:var(--color-warning);">Pendiente de Verificación</strong>.</p>

    <!-- Payment details card -->
    <div class="glass-panel" style="padding: 32px; text-align: left; margin-bottom: 32px;">
        <h3 style="font-weight: 700; margin-bottom: 16px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;">Detalles de la Transferencia</h3>
        <p style="font-size:0.95rem; color:var(--text-secondary); margin-bottom:20px;">Nuestro equipo revisará el comprobante adjunto a la brevedad para validar el pago y activar tus productos digitales, descargas y accesos a cursos.</p>

        @if($order->payment_method === 'yape')
            <div style="background:var(--bg-tertiary); padding:16px; border-radius:12px; display:flex; align-items:center; gap:16px;">
                <span style="font-size:2rem; color:var(--primary-color);"><i class="fa-solid fa-qrcode"></i></span>
                <div>
                    <strong>Pago vía Yape</strong>
                    <div style="font-size:0.9rem; color:var(--text-secondary); margin-top:2px;">Celular: {{ $instructions['phone'] }} | Titular: {{ $instructions['holder'] }}</div>
                </div>
            </div>
        @else
            <div>
                <strong style="display:block; margin-bottom:10px;">Cuentas bancarias de depósito:</strong>
                @foreach($instructions['accounts'] as $acc)
                    <div style="background:var(--bg-tertiary); padding:12px 16px; border-radius:8px; margin-bottom:8px; font-size:0.9rem;">
                        <strong>{{ $acc['bank'] }}</strong>: {{ $acc['account_number'] }} (CCI: {{ $acc['cci'] }})
                    </div>
                @endforeach
            </div>
        @endif
    </div>

    <!-- Summary Details -->
    <div class="glass-panel" style="padding: 32px; text-align: left; margin-bottom: 40px;">
        <h3 style="font-weight: 700; margin-bottom: 16px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;">Resumen del Pedido</h3>
        <div style="display:flex; flex-direction:column; gap:12px; font-size:0.95rem;">
            <div style="display:flex; justify-content:space-between;">
                <span>Subtotal</span>
                <strong>S/ {{ $order->total + $order->discount - $order->shipping_cost }}</strong>
            </div>
            @if($order->discount > 0)
                <div style="display:flex; justify-content:space-between; color:var(--color-success);">
                    <span>Descuento aplicado</span>
                    <strong>- S/ {{ $order->discount }}</strong>
                </div>
            @endif
            <div style="display:flex; justify-content:space-between;">
                <span>Costo de envío</span>
                <strong>S/ {{ $order->shipping_cost }}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; border-top:1px solid var(--glass-border); padding-top:12px; font-size:1.15rem;">
                <strong>Total registrado</strong>
                <strong style="color:var(--primary-color);">S/ {{ $order->total }}</strong>
            </div>
        </div>
    </div>

    <div style="display:flex; gap:16px; justify-content:center;">
        @auth
            <a href="/dashboard/purchases" class="btn btn-primary">Ir a Mis Compras</a>
            <a href="/dashboard" class="btn btn-secondary">Ver Mi Panel</a>
        @else
            <a href="/store" class="btn btn-primary">Seguir Comprando</a>
        @endauth
    </div>
</div>
@endsection
