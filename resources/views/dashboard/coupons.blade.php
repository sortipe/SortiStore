@extends('layouts.store')

@section('title', 'Mis Cupones - Sorti')

@section('content')
<div class="section-wrapper">
    <div class="dashboard-grid">
        @include('dashboard.sidebar')

        <div class="glass-panel" style="padding: 32px;">
            <h1 style="font-weight: 800; font-size: 1.8rem; margin-bottom: 24px;"><i class="fa-solid fa-tags"></i> Mis Cupones Disponibles</h1>
            <p style="color:var(--text-secondary); margin-bottom:32px;">Aplica estos códigos al realizar tu pago para obtener grandes descuentos.</p>

            @if(count($coupons) === 0)
                <p style="color:var(--text-muted); text-align:center; padding:40px 0;">No tienes cupones asignados actualmente.</p>
            @else
                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">
                    @foreach($coupons as $coupon)
                        <div class="glass-panel" style="padding:24px; border:2px dashed var(--primary-color); background:var(--bg-tertiary); position:relative; overflow:hidden;">
                            <!-- Top code pill -->
                            <div style="background:var(--primary-gradient); color:white; padding:8px 16px; border-radius:8px; font-weight:800; font-size:1.2rem; text-align:center; letter-spacing:1px; margin-bottom:16px;">
                                {{ $coupon->code }}
                            </div>

                            <div style="font-size:0.95rem; text-align:center;">
                                <strong style="font-size:1.1rem; display:block; margin-bottom:6px;">
                                    @if($coupon->type === 'percentage')
                                        {{ round($coupon->value) }}% de Descuento
                                    @elseif($coupon->type === 'fixed')
                                        S/ {{ $coupon->value }} de Descuento
                                    @else
                                        Envío Gratis
                                    @endif
                                </strong>
                                <span style="font-size:0.85rem; color:var(--text-secondary); display:block; margin-bottom:12px;">
                                    Compra mínima: S/ {{ $coupon->min_spend }}
                                </span>
                            </div>

                            @if($coupon->expires_at)
                                <div style="font-size:0.75rem; color:var(--text-muted); text-align:center; border-top:1px solid var(--glass-border); padding-top:12px; margin-top:12px;">
                                    Vence: {{ $coupon->expires_at->format('d/m/Y') }}
                                </div>
                            @endif
                        </div>
                    @endforeach
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
