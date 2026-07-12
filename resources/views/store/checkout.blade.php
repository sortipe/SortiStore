@extends('layouts.store')

@section('title', 'Finalizar Compra - Sorti')

@section('content')
<div class="section-wrapper">
    <h1 style="font-weight: 800; font-size: 2.2rem; margin-bottom: 32px;"><i class="fa-solid fa-cash-register"></i> Finalizar Compra</h1>

    <form action="{{ route('checkout.place') }}" method="POST" enctype="multipart/form-data">
        @csrf
        
        <div class="cart-grid">
            <!-- Left Column: Checkout Form Details -->
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <!-- 1. Contact Info -->
                <div class="glass-panel" style="padding: 32px;">
                    <h3 style="font-weight: 800; margin-bottom: 20px; font-size: 1.15rem; display:flex; align-items:center; gap:8px;">
                        <span style="background:var(--primary-color); color:white; width:28px; height:28px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:0.9rem;">1</span>
                        Información de Contacto
                    </h3>
                    
                    @guest
                        <div style="background: rgba(99, 102, 241, 0.05); padding: 16px; border-radius: 12px; margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.9rem; color:var(--text-secondary);">¿Ya tienes una cuenta?</span>
                            <a href="{{ route('login') }}" class="btn btn-secondary" style="padding: 6px 16px; font-size:0.85rem;">Iniciar Sesión</a>
                        </div>
                    @endguest

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                        <div>
                            <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Correo Electrónico *</label>
                            <input type="email" name="email" value="{{ auth()->check() ? auth()->user()->email : old('email') }}" class="search-input" style="padding-left:16px;" placeholder="nombre@correo.com" {{ auth()->check() ? 'readonly' : '' }}>
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Teléfono Celular *</label>
                            <input type="text" name="phone" value="{{ old('phone') }}" class="search-input" style="padding-left:16px;" placeholder="Ej: 987654321" required>
                        </div>
                    </div>
                </div>

                <!-- 2. Delivery Method -->
                <div class="glass-panel" style="padding: 32px;">
                    <h3 style="font-weight: 800; margin-bottom: 20px; font-size: 1.15rem; display:flex; align-items:center; gap:8px;">
                        <span style="background:var(--primary-color); color:white; width:28px; height:28px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:0.9rem;">2</span>
                        Método de Entrega
                    </h3>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom: 24px;">
                        <label class="glass-panel" style="padding: 20px; display: flex; align-items: center; gap: 12px; cursor: pointer; border-radius: 12px;">
                            <input type="radio" name="delivery_method" value="delivery" checked style="width: 18px; height: 18px;">
                            <div>
                                <strong style="display:block;">Envío a Domicilio</strong>
                                <span style="font-size:0.85rem; color:var(--text-secondary);">Delivery a tu distrito</span>
                            </div>
                        </label>
                        <label class="glass-panel" style="padding: 20px; display: flex; align-items: center; gap: 12px; cursor: pointer; border-radius: 12px;">
                            <input type="radio" name="delivery_method" value="pickup" style="width: 18px; height: 18px;">
                            <div>
                                <strong style="display:block;">Recojo en Tienda</strong>
                                <span style="font-size:0.85rem; color:var(--text-secondary);">Sin costo de envío</span>
                            </div>
                        </label>
                    </div>

                    <!-- Address fields, hidden if local pickup -->
                    <div id="checkout-address-row">
                        <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Dirección de Envío *</label>
                        <input type="text" name="address" value="{{ old('address') }}" class="search-input" style="padding-left:16px; margin-bottom: 20px;" placeholder="Calle, Avenida, Mz. Lte., Dpto.">
                    </div>

                    <div id="checkout-district-row">
                        <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Distrito de Envío *</label>
                        <select name="district_id" id="checkout-district-select" style="width:100%; padding:12px; border-radius:8px; border:1px solid var(--glass-border); background:var(--bg-secondary); color:var(--text-primary); outline:none;">
                            <option value="">Selecciona tu distrito...</option>
                            @foreach($districts as $district)
                                <option value="{{ $district->id }}">
                                    {{ $district->name }} - S/ {{ $district->cost }} ({{ $district->delivery_time }})
                                </option>
                            @endforeach
                        </select>
                    </div>
                </div>

                <!-- 3. Payment Method & Receipt Upload -->
                <div class="glass-panel" style="padding: 32px;">
                    <h3 style="font-weight: 800; margin-bottom: 20px; font-size: 1.15rem; display:flex; align-items:center; gap:8px;">
                        <span style="background:var(--primary-color); color:white; width:28px; height:28px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:0.9rem;">3</span>
                        Método de Pago
                    </h3>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom: 24px;">
                        <label class="glass-panel" style="padding: 20px; display: flex; align-items: center; gap: 12px; cursor: pointer; border-radius: 12px;" onclick="switchPaymentView('yape')">
                            <input type="radio" name="payment_method" value="yape" checked style="width: 18px; height: 18px;">
                            <div>
                                <strong style="display:block;">Yape</strong>
                                <span style="font-size:0.85rem; color:var(--text-secondary);">Pago inmediato QR</span>
                            </div>
                        </label>
                        <label class="glass-panel" style="padding: 20px; display: flex; align-items: center; gap: 12px; cursor: pointer; border-radius: 12px;" onclick="switchPaymentView('bank')">
                            <input type="radio" name="payment_method" value="bank_transfer" style="width: 18px; height: 18px;">
                            <div>
                                <strong style="display:block;">Transferencia</strong>
                                <span style="font-size:0.85rem; color:var(--text-secondary);">Cuentas bancarias</span>
                            </div>
                        </label>
                    </div>

                    <!-- Yape payment panel -->
                    <div id="payment-yape-panel" class="qr-payment-panel">
                        <h4>Paga con Yape</h4>
                        <p style="font-size:0.9rem; color:var(--text-secondary); margin-top:6px;">Escanea el código QR y envía a nombre de: <strong>{{ $yapeInstructions['holder'] }}</strong></p>
                        <!-- QR image -->
                        <img src="{{ asset('storage/' . $yapeInstructions['qr_image']) }}" alt="Yape QR">
                        <p style="font-size:1rem; font-weight:700;">Celular Yape: {{ $yapeInstructions['phone'] }}</p>
                    </div>

                    <!-- Bank Transfer payment panel -->
                    <div id="payment-bank-panel" class="qr-payment-panel" style="display: none; text-align: left;">
                        <h4 style="text-align: center; margin-bottom: 16px;">Cuentas de Transferencia</h4>
                        @foreach($bankInstructions['accounts'] as $acc)
                            <div style="background:var(--bg-secondary); padding:16px; border-radius:8px; border:1px solid var(--glass-border); margin-bottom:12px;">
                                <strong style="color:var(--primary-color);">{{ $acc['bank'] }}</strong>
                                <div style="font-size:0.9rem; margin-top:4px;">N° Cuenta: <strong>{{ $acc['account_number'] }}</strong></div>
                                <div style="font-size:0.9rem;">CCI: <strong>{{ $acc['cci'] }}</strong></div>
                                <div style="font-size:0.85rem; color:var(--text-secondary);">Titular: {{ $acc['holder'] }}</div>
                            </div>
                        @endforeach
                    </div>

                    <!-- Receipt file upload -->
                    <div style="margin-top: 24px;">
                        <label style="font-weight: 700; font-size: 0.95rem; display:block; margin-bottom:8px; color:var(--accent-color);">
                            Adjuntar captura de comprobante de pago *
                        </label>
                        <input type="file" name="payment_receipt_file" accept="image/*" style="width:100%; padding:12px; border-radius:8px; border:1px dashed var(--glass-border); background:var(--bg-tertiary);" required>
                        <span style="font-size:0.8rem; color:var(--text-muted); display:block; margin-top:6px;">Sube un archivo de imagen (PNG, JPG) con la captura clara del Yape o la transferencia.</span>
                    </div>
                </div>
            </div>

            <!-- Right Column: Cart Totals & Placer -->
            <div style="display:flex; flex-direction:column; gap:24px;">
                <div class="glass-panel" style="padding: 32px; position: sticky; top: 110px;">
                    <h3 style="font-weight: 800; margin-bottom: 20px; font-size: 1.2rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 12px;">Resumen del Pedido</h3>

                    <!-- Coupons Entry -->
                    <div style="margin-bottom: 24px;">
                        <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">¿Tienes un cupón?</label>
                        <div style="display:flex; gap:8px;">
                            <input type="text" name="coupon_code" id="checkout-coupon-input" class="search-input" style="padding-left:16px; border-radius:8px;" placeholder="CÓDIGO">
                            <button type="button" id="checkout-coupon-apply-btn" class="btn btn-secondary" style="padding:10px 16px;">Aplicar</button>
                        </div>
                        <div id="coupon-error-box" style="color:var(--color-danger); font-size:0.8rem; margin-top:6px; font-weight:600; display:none;"></div>
                    </div>

                    <!-- Sorti Coins check Toggle -->
                    @auth
                        @if(Auth::user()->sorti_coins_balance > 0)
                            <div style="background:rgba(234,179,8,0.05); border:1px solid rgba(234,179,8,0.2); padding:16px; border-radius:12px; margin-bottom:24px;">
                                <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:700; color:var(--sorti-gold);">
                                    <input type="checkbox" name="use_sorti_coins" id="checkout-sorti-toggle" value="1" style="width:18px; height:18px;">
                                    Usar mis Monedas Sorti
                                </label>
                                <span style="font-size:0.8rem; color:var(--text-secondary); display:block; margin-top:6px; margin-left:28px;">
                                    Disponibles: <strong>{{ Auth::user()->sorti_coins_balance }} monedas</strong> (Equivale a S/ {{ round(Auth::user()->sorti_coins_balance / 100, 2) }})
                                </span>
                            </div>
                        @endif
                    @endauth

                    <!-- Totals Table -->
                    <div style="display:flex; flex-direction:column; gap:12px; font-size:0.95rem; margin-bottom:24px; border-bottom:1px solid var(--glass-border); padding-bottom:20px;">
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:var(--text-secondary);">Subtotal original</span>
                            <span id="summary-subtotal">S/ {{ $totals['subtotal'] }}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; color:var(--color-success);">
                            <span style="color:var(--text-secondary);">Ahorro por volumen</span>
                            <span id="summary-qty-savings">- S/ 0.00</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; color:var(--color-success);">
                            <span style="color:var(--text-secondary);">Descuento cupón</span>
                            <span id="summary-coupon-discount">- S/ 0.00</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; color:var(--sorti-gold); font-weight:600;">
                            <span style="color:var(--text-secondary);">Descuento Monedas Sorti</span>
                            <span id="summary-sorti-discount">- S/ 0.00</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size: 0.85rem; color: var(--text-muted); margin-left: 15px;">
                            <span>Monedas canjeadas</span>
                            <span id="summary-coins-spent">0 monedas</span>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:var(--text-secondary);">Costo de envío</span>
                            <span id="summary-shipping-cost">S/ 0.00</span>
                        </div>
                    </div>

                    <!-- Grand Total -->
                    <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:24px;">
                        <span style="font-weight:700; font-size:1.1rem;">Total a Pagar</span>
                        <span id="summary-grand-total" style="font-size:1.8rem; font-weight:800; color:var(--primary-color);">S/ {{ $totals['total'] }}</span>
                    </div>

                    <!-- Acumulation detail -->
                    @auth
                        <div style="font-size:0.85rem; font-weight:700; color:var(--sorti-gold); margin-bottom:20px; text-align:center;" id="summary-coins-earned">
                            ★ Con esta compra acumularás +{{ $totals['sorti_coins_earned'] }} monedas Sorti
                        </div>
                    @endauth

                    <button type="submit" class="btn btn-primary" style="width: 100%; font-size:1.05rem;">
                        <i class="fa-solid fa-circle-check"></i> Registrar Pedido
                    </button>
                </div>
            </div>
        </div>
    </form>
</div>
@endsection

@section('scripts')
<script>
    function switchPaymentView(method) {
        const yapePanel = document.getElementById('payment-yape-panel');
        const bankPanel = document.getElementById('payment-bank-panel');
        
        if (method === 'yape') {
            yapePanel.style.display = 'block';
            bankPanel.style.display = 'none';
        } else {
            yapePanel.style.display = 'none';
            bankPanel.style.display = 'block';
        }
    }
</script>
@endsection
