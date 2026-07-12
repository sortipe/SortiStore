@extends('layouts.admin')

@section('title', 'Cupones - Admin')

@section('content')
<div style="margin-bottom: 32px;">
    <h1 style="font-weight: 800; font-size: 2rem; margin-bottom: 6px;">Gestión de Cupones</h1>
    <p style="color: var(--text-secondary);">Crea cupones de descuento fijos o porcentuales, envíos gratis y define sus límites de uso.</p>
</div>

<div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:32px;" class="dashboard-grid">
    <!-- Coupons List -->
    <div class="glass-panel" style="padding:24px;">
        <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Cupones Registrados</h3>
        
        @if($coupons->count() === 0)
            <p style="color:var(--text-muted); text-align:center; padding:20px 0;">No hay cupones creados aún.</p>
        @else
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                    <thead>
                        <tr style="border-bottom:1px solid var(--glass-border); color:var(--text-secondary);">
                            <th style="padding:10px 4px;">Código</th>
                            <th style="padding:10px 4px;">Tipo</th>
                            <th style="padding:10px 4px;">Valor</th>
                            <th style="padding:10px 4px;">Mín. Compra</th>
                            <th style="padding:10px 4px;">Usos</th>
                            <th style="padding:10px 4px;">Vence</th>
                            <th style="padding:10px 4px; text-align:center;">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($coupons as $coupon)
                            <tr style="border-bottom:1px solid var(--glass-border);">
                                <td style="padding:10px 4px; font-weight:800; color:var(--primary-color);">{{ $coupon->code }}</td>
                                <td style="padding:10px 4px;"><span style="background:var(--bg-tertiary); padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:600;">{{ strtoupper($coupon->type) }}</span></td>
                                <td style="padding:10px 4px; font-weight:700;">
                                    @if($coupon->type === 'percentage')
                                        {{ round($coupon->value) }}%
                                    @elseif($coupon->type === 'fixed')
                                        S/ {{ $coupon->value }}
                                    @else
                                        Gratis
                                    @endif
                                </td>
                                <td style="padding:10px 4px;">S/ {{ $coupon->min_spend }}</td>
                                <td style="padding:10px 4px;">{{ $coupon->used_uses }} / {{ $coupon->limit_uses ?? 'Ilimitado' }}</td>
                                <td style="padding:10px 4px; color:var(--text-secondary); font-size:0.8rem;">
                                    {{ $coupon->expires_at ? $coupon->expires_at->format('d/m/Y') : 'Nunca' }}
                                </td>
                                <td style="padding:10px 4px; text-align:center;">
                                    <form action="{{ route('admin.coupons.destroy', $coupon->id) }}" method="POST" onsubmit="return confirm('¿Seguro?')">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-accent" style="padding:4px 10px; font-size:0.75rem;"><i class="fa-solid fa-trash"></i></button>
                                    </form>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </div>

    <!-- Create Coupon Form -->
    <div class="glass-panel" style="padding:24px; height:fit-content;">
        <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Crear Cupón</h3>
        
        <form action="{{ route('admin.coupons.store') }}" method="POST">
            @csrf
            
            <div style="display:flex; flex-direction:column; gap:16px;">
                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Código del Cupón *</label>
                    <input type="text" name="code" class="search-input" style="padding-left:12px; font-size:0.9rem;" placeholder="Ej: DESCUENTO10" required>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Tipo de Descuento *</label>
                    <select name="type" class="search-input" style="padding-left:12px; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--glass-border); outline:none;" required>
                        <option value="percentage">Porcentaje (%)</option>
                        <option value="fixed">Monto Fijo (S/)</option>
                        <option value="free_shipping">Envío Gratis</option>
                    </select>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Valor del Descuento *</label>
                    <input type="number" step="0.01" name="value" class="search-input" style="padding-left:12px; font-size:0.9rem;" placeholder="Ej: 10" required>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Compra Mínima (S/) *</label>
                    <input type="number" step="0.01" name="min_spend" value="0.00" class="search-input" style="padding-left:12px; font-size:0.9rem;" required>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Límite de Usos (Opcional)</label>
                    <input type="number" name="limit_uses" class="search-input" style="padding-left:12px; font-size:0.9rem;">
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Fecha de Expiración</label>
                    <input type="date" name="expires_at" class="search-input" style="padding-left:12px; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--glass-border); outline:none;">
                </div>

                <button type="submit" class="btn btn-primary" style="width:100%;"><i class="fa-solid fa-plus"></i> Crear Cupón</button>
            </div>
        </form>
    </div>
</div>
@endsection
