@extends('layouts.admin')

@section('title', 'Ofertas Promocionadas - Admin')

@section('content')
<div style="margin-bottom: 32px;">
    <h1 style="font-weight: 800; font-size: 2rem; margin-bottom: 6px;">Programador de Ofertas Especiales</h1>
    <p style="color: var(--text-secondary);">Destaca ofertas especiales en la página principal con porcentajes de descuento y plazos definidos.</p>
</div>

<div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:32px;" class="dashboard-grid">
    <!-- Offers List -->
    <div class="glass-panel" style="padding:24px;">
        <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Ofertas Programadas</h3>
        
        @if($offers->count() === 0)
            <p style="color:var(--text-muted); text-align:center; padding:20px 0;">No hay ofertas programadas.</p>
        @else
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                    <thead>
                        <tr style="border-bottom:1px solid var(--glass-border); color:var(--text-secondary);">
                            <th style="padding:10px 4px;">Producto</th>
                            <th style="padding:10px 4px;">Desc.</th>
                            <th style="padding:10px 4px;">Inicio</th>
                            <th style="padding:10px 4px;">Término</th>
                            <th style="padding:10px 4px;">Prioridad</th>
                            <th style="padding:10px 4px; text-align:center;">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($offers as $offer)
                            <tr style="border-bottom:1px solid var(--glass-border);">
                                <td style="padding:10px 4px; font-weight:700; color:var(--primary-color);">
                                    {{ $offer->product ? $offer->product->name : 'N/A' }}
                                </td>
                                <td style="padding:10px 4px; font-weight:700; color:var(--color-success);">-{{ round($offer->discount_percent) }}%</td>
                                <td style="padding:10px 4px; font-size:0.8rem; color:var(--text-secondary);">{{ $offer->start_date ? $offer->start_date->format('d/m/Y') : 'Inmediato' }}</td>
                                <td style="padding:10px 4px; font-size:0.8rem; color:var(--text-secondary);">{{ $offer->end_date ? $offer->end_date->format('d/m/Y') : 'Indefinido' }}</td>
                                <td style="padding:10px 4px;">{{ $offer->priority }}</td>
                                <td style="padding:10px 4px; text-align:center;">
                                    <form action="{{ route('admin.offers.destroy', $offer->id) }}" method="POST" onsubmit="return confirm('¿Seguro?')">
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

    <!-- Create Offer Form -->
    <div class="glass-panel" style="padding:24px; height:fit-content;">
        <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Programar Nueva Oferta</h3>
        
        <form action="{{ route('admin.offers.store') }}" method="POST">
            @csrf
            
            <div style="display:flex; flex-direction:column; gap:16px;">
                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Seleccionar Producto *</label>
                    <select name="product_id" class="search-input" style="padding-left:12px; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--glass-border); outline:none;" required>
                        @foreach($products as $prod)
                            <option value="{{ $prod->id }}">{{ $prod->name }}</option>
                        @endforeach
                    </select>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Porcentaje Descuento (%) *</label>
                    <input type="number" step="0.1" name="discount_percent" class="search-input" style="padding-left:12px; font-size:0.9rem;" placeholder="Ej: 20" required>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Fecha Inicio</label>
                    <input type="date" name="start_date" class="search-input" style="padding-left:12px; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--glass-border); outline:none;">
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Fecha Término</label>
                    <input type="date" name="end_date" class="search-input" style="padding-left:12px; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--glass-border); outline:none;">
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Prioridad en Carrusel *</label>
                    <input type="number" name="priority" value="0" class="search-input" style="padding-left:12px; font-size:0.9rem;" required>
                </div>

                <button type="submit" class="btn btn-primary" style="width:100%;"><i class="fa-solid fa-plus"></i> Programar Oferta</button>
            </div>
        </form>
    </div>
</div>
@endsection
