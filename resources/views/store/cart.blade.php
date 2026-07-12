@extends('layouts.store')

@section('title', 'Mi Carrito de Compras - Sorti')

@section('content')
<div class="section-wrapper">
    <h1 style="font-weight: 800; font-size: 2.2rem; margin-bottom: 32px;"><i class="fa-solid fa-cart-shopping"></i> Mi Carrito</h1>

    @if(empty($cartItems))
        <div class="glass-panel" style="text-align: center; padding: 80px 24px;">
            <div style="font-size: 4rem; color: var(--text-muted); margin-bottom: 24px;"><i class="fa-solid fa-basket-shopping"></i></div>
            <h2>Tu carrito está vacío</h2>
            <p style="color: var(--text-secondary); margin-top: 8px;">¡Añade productos de nuestro catálogo para comenzar tu compra!</p>
            <a href="/store" class="btn btn-primary" style="margin-top: 24px;">Ir a la Tienda</a>
        </div>
    @else
        <div class="cart-grid">
            <!-- Left Column: Items List -->
            <div class="glass-panel" style="padding: 32px;">
                @foreach($cartItems as $key => $item)
                    <div class="cart-item">
                        <img src="{{ $item['image'] }}" alt="{{ $item['name'] }}">
                        <div class="cart-item-info">
                            <h3 style="font-weight:700; font-size:1.1rem; margin-bottom:4px;">
                                <a href="/product/{{ $item['slug'] }}">{{ $item['name'] }}</a>
                            </h3>
                            @if($item['variant_name'])
                                <div style="font-size:0.85rem; color:var(--primary-color); font-weight:600; margin-bottom:12px;">
                                    {{ $item['variant_name'] }}
                                </div>
                            @endif

                            <div style="display:flex; align-items:center; justify-content:space-between; margin-top:auto; flex-wrap:wrap; gap:12px;">
                                <!-- Qty Selector -->
                                <form action="{{ route('cart.update') }}" method="POST">
                                    @csrf
                                    <input type="hidden" name="key" value="{{ $key }}">
                                    <div class="qty-selector">
                                        <button type="submit" name="quantity" value="{{ $item['quantity'] - 1 }}" class="qty-btn" {{ $item['quantity'] <= 1 ? 'disabled' : '' }}>-</button>
                                        <span class="qty-num">{{ $item['quantity'] }}</span>
                                        <button type="submit" name="quantity" value="{{ $item['quantity'] + 1 }}" class="qty-btn">+</button>
                                    </div>
                                </form>

                                <!-- Unit Price / Discount Info -->
                                <div>
                                    @if($item['discount'] > 0)
                                        <div style="font-size: 0.85rem; color: var(--color-success); font-weight: 700; text-align:right;">
                                            Ahorraste S/ {{ $item['discount'] }} por volumen
                                        </div>
                                    @endif
                                    <div style="text-align: right;">
                                        <span style="font-weight: 800; font-size: 1.15rem;">S/ {{ $item['total'] }}</span>
                                        <span style="font-size: 0.85rem; color: var(--text-muted); display: block;">S/ {{ $item['discounted_price'] }} c/u</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Remove Button -->
                        <div style="align-self: flex-start;">
                            <a href="{{ route('cart.remove', $key) }}" style="color: var(--text-muted); font-size: 1.2rem; padding: 4px;" title="Remover producto">
                                <i class="fa-solid fa-trash-can"></i>
                            </a>
                        </div>
                    </div>
                @endforeach
            </div>

            <!-- Right Column: Summary Panel -->
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <div class="glass-panel" style="padding: 32px;">
                    <h3 style="font-weight: 800; margin-bottom: 24px; font-size: 1.2rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 12px;">Resumen de la Orden</h3>

                    <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; font-size: 0.95rem;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-secondary);">Subtotal original</span>
                            <strong>S/ {{ $totals['subtotal'] + $totals['quantity_discount_savings'] }}</strong>
                        </div>
                        @if($totals['quantity_discount_savings'] > 0)
                            <div style="display: flex; justify-content: space-between; color: var(--color-success);">
                                <span>Ahorro por volumen</span>
                                <strong>- S/ {{ $totals['quantity_discount_savings'] }}</strong>
                            </div>
                        @endif
                        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--glass-border); padding-top: 16px;">
                            <span style="color: var(--text-secondary);">Subtotal neto</span>
                            <strong>S/ {{ $totals['subtotal'] }}</strong>
                        </div>
                    </div>

                    <!-- Total Savings notification -->
                    @if($totals['quantity_discount_savings'] > 0)
                        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 12px 16px; border-radius: 12px; display: flex; align-items: center; gap: 8px; margin-bottom: 24px; color: var(--color-success); font-size: 0.9rem; font-weight: 600;">
                            🎉 ¡Estás ahorrando S/ {{ $totals['quantity_discount_savings'] }} en esta compra!
                        </div>
                    @endif

                    <a href="/checkout" class="btn btn-primary" style="width: 100%;">Proceder al Pago <i class="fa-solid fa-arrow-right"></i></a>
                    
                    <a href="/store" class="btn btn-secondary" style="width: 100%; margin-top: 12px; text-align: center;">Seguir Comprando</a>
                </div>
            </div>
        </div>
    @endif
</div>
@endsection
