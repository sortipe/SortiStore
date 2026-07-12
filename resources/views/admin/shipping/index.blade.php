@extends('layouts.admin')

@section('title', 'Zonas de Envío - Admin')

@section('content')
<div style="margin-bottom: 32px;">
    <h1 style="font-weight: 800; font-size: 2rem; margin-bottom: 6px;">Zonas y Costos de Envío</h1>
    <p style="color: var(--text-secondary);">Configura los distritos autorizados para entrega física a domicilio y sus tarifas correspondientes.</p>
</div>

<div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:32px;" class="dashboard-grid">
    <!-- Districts List -->
    <div class="glass-panel" style="padding:24px;">
        <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Zonas Registradas</h3>
        
        @if($districts->count() === 0)
            <p style="color:var(--text-muted); text-align:center; padding:20px 0;">No hay zonas de envío registradas.</p>
        @else
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                    <thead>
                        <tr style="border-bottom:1px solid var(--glass-border); color:var(--text-secondary);">
                            <th style="padding:10px 4px;">Zona / Distrito</th>
                            <th style="padding:10px 4px;">Costo de Envío</th>
                            <th style="padding:10px 4px;">Plazo Estimado</th>
                            <th style="padding:10px 4px; text-align:center;">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($districts as $district)
                            <tr style="border-bottom:1px solid var(--glass-border);">
                                <td style="padding:10px 4px; font-weight:700; color:var(--primary-color);">{{ $district->name }}</td>
                                <td style="padding:10px 4px; font-weight:700;">S/ {{ $district->cost }}</td>
                                <td style="padding:10px 4px; color:var(--text-secondary);">{{ $district->delivery_time }}</td>
                                <td style="padding:10px 4px; text-align:center;">
                                    <form action="{{ route('admin.shipping.destroy', $district->id) }}" method="POST" onsubmit="return confirm('¿Seguro?')">
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

    <!-- Create District Form -->
    <div class="glass-panel" style="padding:24px; height:fit-content;">
        <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Agregar Zona de Envío</h3>
        
        <form action="{{ route('admin.shipping.store') }}" method="POST">
            @csrf
            
            <div style="display:flex; flex-direction:column; gap:16px;">
                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Nombre del Distrito *</label>
                    <input type="text" name="name" class="search-input" style="padding-left:12px; font-size:0.9rem;" placeholder="Ej: Miraflores" required>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Costo de Delivery (S/) *</label>
                    <input type="number" step="0.01" name="cost" class="search-input" style="padding-left:12px; font-size:0.9rem;" placeholder="Ej: 10.00" required>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Plazo de Entrega *</label>
                    <input type="text" name="delivery_time" class="search-input" style="padding-left:12px; font-size:0.9rem;" placeholder="Ej: 24 a 48 horas" required>
                </div>

                <button type="submit" class="btn btn-primary" style="width:100%;"><i class="fa-solid fa-plus"></i> Guardar Zona</button>
            </div>
        </form>
    </div>
</div>
@endsection
