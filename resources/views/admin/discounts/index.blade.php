@extends('layouts.admin')

@section('title', 'Descuentos por Volumen - Admin')

@section('content')
<div style="margin-bottom: 32px;">
    <h1 style="font-weight: 800; font-size: 2rem; margin-bottom: 6px;">Descuentos por Cantidad / Volumen</h1>
    <p style="color: var(--text-secondary);">Configura descuentos automáticos cuando los clientes compren al por mayor un mismo producto.</p>
</div>

<div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:32px;" class="dashboard-grid">
    <!-- Discounts List -->
    <div class="glass-panel" style="padding:24px;">
        <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Reglas Activas</h3>
        
        @if($discounts->count() === 0)
            <p style="color:var(--text-muted); text-align:center; padding:20px 0;">No hay reglas de descuento creadas.</p>
        @else
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                    <thead>
                        <tr style="border-bottom:1px solid var(--glass-border); color:var(--text-secondary);">
                            <th style="padding:10px 4px;">Producto</th>
                            <th style="padding:10px 4px;">Min. Cantidad</th>
                            <th style="padding:10px 4px;">Tipo</th>
                            <th style="padding:10px 4px;">Valor Desc.</th>
                            <th style="padding:10px 4px; text-align:center;">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($discounts as $discount)
                            <tr style="border-bottom:1px solid var(--glass-border);">
                                <td style="padding:10px 4px; font-weight:700; color:var(--primary-color);">
                                    {{ $discount->product ? $discount->product->name : 'Aplicar a Todos' }}
                                </td>
                                <td style="padding:10px 4px; font-weight:700;">{{ $discount->min_qty }}+ unidades</td>
                                <td style="padding:10px 4px;"><span style="background:var(--bg-tertiary); padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:600;">{{ strtoupper($discount->discount_type) }}</span></td>
                                <td style="padding:10px 4px; font-weight:700; color:var(--color-success);">
                                    @if($discount->discount_type === 'percentage')
                                        -{{ round($discount->discount_value) }}%
                                    @elseif($discount->discount_type === 'fixed')
                                        -S/ {{ $discount->discount_value }} por unid
                                    @elseif($discount->discount_type === 'free_items')
                                        {{ $discount->discount_value }} unidades gratis
                                    @endif
                                </td>
                                <td style="padding:10px 4px; text-align:center;">
                                    <form action="{{ route('admin.discounts.destroy', $discount->id) }}" method="POST" onsubmit="return confirm('¿Seguro?')">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-accent" style="padding:4px 10px; font-size:0.75rem;"><i class="fa-solid fa-trash"></i> Eliminar</button>
                                    </form>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </div>

    <!-- Create Rule Form -->
    <div class="glass-panel" style="padding:24px; height:fit-content;">
        <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Crear Regla de Volumen</h3>
        
        <form action="{{ route('admin.discounts.store') }}" method="POST">
            @csrf
            
            <div style="display:flex; flex-direction:column; gap:16px;">
                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Asociar a Producto (Opcional)</label>
                    <select name="product_id" class="search-input" style="padding-left:12px; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--glass-border); outline:none;">
                        <option value="">Aplicar a TODO el catálogo</option>
                        @foreach($products as $prod)
                            <option value="{{ $prod->id }}">{{ $prod->name }}</option>
                        @endforeach
                    </select>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Cantidad Mínima Requerida *</label>
                    <input type="number" name="min_qty" min="2" class="search-input" style="padding-left:12px; font-size:0.9rem;" placeholder="Ej: 3" required>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Tipo de Beneficio *</label>
                    <select name="discount_type" class="search-input" style="padding-left:12px; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--glass-border); outline:none;" required>
                        <option value="percentage">Porcentaje Descuento (%)</option>
                        <option value="fixed">Monto Descuento Fijo (S/)</option>
                        <option value="free_items">Unidades Gratis (Ej: 3x2, Paga X Lleva Y)</option>
                    </select>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Valor del Beneficio *</label>
                    <input type="number" step="0.01" name="discount_value" class="search-input" style="padding-left:12px; font-size:0.9rem;" placeholder="Ej: 10% -> 10, 3x2 -> 1" required>
                </div>

                <button type="submit" class="btn btn-primary" style="width:100%;"><i class="fa-solid fa-plus"></i> Guardar Regla</button>
            </div>
        </form>
    </div>
</div>
@endsection
