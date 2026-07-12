@extends('layouts.admin')

@section('title', 'Configuración General - Admin')

@section('content')
<div style="margin-bottom: 32px;">
    <h1 style="font-weight: 800; font-size: 2rem; margin-bottom: 6px;">Configuración de la Plataforma</h1>
    <p style="color: var(--text-secondary);">Ajusta los parámetros financieros de las monedas Sorti y configura los datos para cobros mediante Yape y bancos.</p>
</div>

<!-- Display success flash -->
@if(session('success'))
    <div style="background: rgba(16, 185, 129, 0.15); color: var(--color-success); border: 1px solid var(--color-success); padding: 16px; border-radius: 12px; margin-bottom: 24px; font-weight: 600;">
        ✨ {{ session('success') }}
    </div>
@endif

<form action="{{ route('admin.settings.store') }}" method="POST" enctype="multipart/form-data">
    @csrf

    <div style="display:grid; grid-template-columns:1.1fr 0.9fr; gap:32px;" class="dashboard-grid">
        <!-- Left: Payments settings (Yape & Banks) -->
        <div style="display:flex; flex-direction:column; gap:24px;">
            <!-- Yape Specs -->
            <div class="glass-panel" style="padding:24px;">
                <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;"><i class="fa-solid fa-qrcode" style="color:var(--primary-color);"></i> Configuración de Yape</h3>
                
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
                    <div>
                        <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Celular Titular *</label>
                        <input type="text" name="yape_phone" value="{{ $settings['yape_phone'] }}" class="search-input" style="padding-left:12px;" required>
                    </div>
                    <div>
                        <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Nombre del Titular *</label>
                        <input type="text" name="yape_holder" value="{{ $settings['yape_holder'] }}" class="search-input" style="padding-left:12px;" required>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:140px 1fr; gap:20px; align-items:center;">
                    <!-- QR Thumbnail preview -->
                    <div style="border:1px solid var(--glass-border); padding:8px; border-radius:8px; background:var(--bg-tertiary);">
                        <img src="{{ asset('storage/' . $settings['yape_qr']) }}" alt="QR" style="width:100%; height:120px; object-fit:contain;">
                    </div>
                    <div>
                        <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Reemplazar Código QR de Yape</label>
                        <input type="file" name="yape_qr_file" accept="image/*" style="width:100%; padding:10px; border:1px dashed var(--glass-border); border-radius:8px; background:var(--bg-tertiary);">
                    </div>
                </div>
            </div>

            <!-- Bank Accounts specs -->
            <div class="glass-panel" style="padding:24px;">
                <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;"><i class="fa-solid fa-bank" style="color:var(--primary-color);"></i> Cuentas de Transferencia Bancaria</h3>
                
                <div id="bank-accounts-wrapper" style="display:flex; flex-direction:column; gap:16px; margin-bottom:16px;">
                    @foreach($settings['bank_accounts'] as $index => $acc)
                        <div style="border:1px solid var(--glass-border); padding:16px; border-radius:12px; position:relative; background:var(--bg-tertiary);">
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px;">
                                <div>
                                    <label style="font-size:0.75rem; font-weight:600;">Nombre del Banco</label>
                                    <input type="text" name="bank_name[]" value="{{ $acc['bank'] }}" class="search-input" style="padding-left:8px; height:32px; font-size:0.85rem;">
                                </div>
                                <div>
                                    <label style="font-size:0.75rem; font-weight:600;">Titular de la Cuenta</label>
                                    <input type="text" name="holder[]" value="{{ $acc['holder'] }}" class="search-input" style="padding-left:8px; height:32px; font-size:0.85rem;">
                                </div>
                            </div>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                                <div>
                                    <label style="font-size:0.75rem; font-weight:600;">N° Cuenta</label>
                                    <input type="text" name="account_number[]" value="{{ $acc['account_number'] }}" class="search-input" style="padding-left:8px; height:32px; font-size:0.85rem;">
                                </div>
                                <div>
                                    <label style="font-size:0.75rem; font-weight:600;">Código Interbancario (CCI)</label>
                                    <input type="text" name="cci[]" value="{{ $acc['cci'] }}" class="search-input" style="padding-left:8px; height:32px; font-size:0.85rem;">
                                </div>
                            </div>
                            <button type="button" onclick="this.parentNode.remove()" style="position:absolute; top:-6px; right:-6px; background:var(--accent-color); color:white; border:none; width:20px; height:20px; border-radius:50%; font-size:0.75rem; font-weight:700; cursor:pointer;">&times;</button>
                        </div>
                    @endforeach
                </div>

                <button type="button" class="btn btn-secondary" onclick="addBankAccountRow()" style="width:100%; font-size:0.85rem;"><i class="fa-solid fa-plus"></i> Añadir Cuenta Bancaria</button>
            </div>
        </div>

        <!-- Right: Sorti Coins params -->
        <div style="display:flex; flex-direction:column; gap:24px;">
            <!-- Virtual Currency params -->
            <div class="glass-panel" style="padding:24px;">
                <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;"><i class="fa-solid fa-coins" style="color:var(--sorti-gold);"></i> Moneda Virtual (Sorti Coins)</h3>
                
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div>
                        <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Tasa de Equivalencia (Monedas por S/ 1)</label>
                        <input type="number" name="sorti_rate_equivalence" value="{{ $settings['sorti_rate_equivalence'] }}" class="search-input" style="padding-left:12px;" required>
                        <span style="font-size:0.75rem; color:var(--text-muted); display:block; margin-top:4px;">Define cuántas monedas corresponden a S/ 1.00 de descuento en el checkout. (Ej: 100 equivale a 100 monedas = S/ 1)</span>
                    </div>

                    <div>
                        <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Tasa de Acumulación (Monedas ganadas por S/ 1 gastado)</label>
                        <input type="number" step="0.1" name="sorti_rate_earning" value="{{ $settings['sorti_rate_earning'] }}" class="search-input" style="padding-left:12px;" required>
                        <span style="font-size:0.75rem; color:var(--text-muted); display:block; margin-top:4px;">Define cuántas monedas acumula el cliente por cada sol gastado. (Ej: 1.0 significa que por S/ 10 gastados, gana 10 monedas)</span>
                    </div>
                </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; font-size:1.05rem; padding:14px;"><i class="fa-solid fa-save"></i> Guardar Todo</button>
        </div>
    </div>
</form>
@endsection

@section('scripts')
<script>
    function addBankAccountRow() {
        const wrapper = document.getElementById('bank-accounts-wrapper');
        const div = document.createElement('div');
        div.style.cssText = 'border:1px solid var(--glass-border); padding:16px; border-radius:12px; position:relative; background:var(--bg-tertiary);';
        
        div.innerHTML = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px;">
                <div>
                    <label style="font-size:0.75rem; font-weight:600;">Nombre del Banco</label>
                    <input type="text" name="bank_name[]" class="search-input" style="padding-left:8px; height:32px; font-size:0.85rem;" placeholder="Ej: BCP">
                </div>
                <div>
                    <label style="font-size:0.75rem; font-weight:600;">Titular de la Cuenta</label>
                    <input type="text" name="holder[]" class="search-input" style="padding-left:8px; height:32px; font-size:0.85rem;" placeholder="Ej: Sorti E.I.R.L.">
                </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div>
                    <label style="font-size:0.75rem; font-weight:600;">N° Cuenta</label>
                    <input type="text" name="account_number[]" class="search-input" style="padding-left:8px; height:32px; font-size:0.85rem;" placeholder="Ej: 191-...">
                </div>
                <div>
                    <label style="font-size:0.75rem; font-weight:600;">Código Interbancario (CCI)</label>
                    <input type="text" name="cci[]" class="search-input" style="padding-left:8px; height:32px; font-size:0.85rem;" placeholder="Ej: 002-...">
                </div>
            </div>
            <button type="button" onclick="this.parentNode.remove()" style="position:absolute; top:-6px; right:-6px; background:var(--accent-color); color:white; border:none; width:20px; height:20px; border-radius:50%; font-size:0.75rem; font-weight:700; cursor:pointer;">&times;</button>
        `;
        wrapper.appendChild(div);
    }
</script>
@endsection
