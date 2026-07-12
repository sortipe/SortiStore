@extends('layouts.admin')

@section('title', 'Gestión de Productos - Admin')

@section('content')
<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 32px; flex-wrap:wrap; gap:16px;">
    <div>
        <h1 style="font-weight: 800; font-size: 2rem; margin-bottom: 6px;">Catálogo de Productos</h1>
        <p style="color: var(--text-secondary);">Administra todos los productos físicos, digitales, licencias, cursos y preventas de Sorti.</p>
    </div>
    <a href="{{ route('admin.products.create') }}" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Crear Producto</a>
</div>

<div class="glass-panel" style="padding: 24px;">
    @if($products->count() === 0)
        <p style="color:var(--text-muted); text-align:center; padding:40px 0;">No tienes productos creados en el catálogo.</p>
    @else
        <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.95rem;">
                <thead>
                    <tr style="border-bottom:1px solid var(--glass-border); color:var(--text-secondary);">
                        <th style="padding:12px 8px;">Imagen</th>
                        <th style="padding:12px 8px;">Nombre</th>
                        <th style="padding:12px 8px;">Tipo</th>
                        <th style="padding:12px 8px;">SKU</th>
                        <th style="padding:12px 8px;">Precio</th>
                        <th style="padding:12px 8px;">Stock</th>
                        <th style="padding:12px 8px;">Monedas</th>
                        <th style="padding:12px 8px; text-align:center;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($products as $product)
                        <tr style="border-bottom:1px solid var(--glass-border);">
                            <td style="padding:12px 8px;">
                                <img src="{{ $product->primary_image_url }}" alt="{{ $product->name }}" style="width:50px; height:50px; border-radius:8px; object-fit:cover; background:var(--bg-tertiary);">
                            </td>
                            <td style="padding:12px 8px; font-weight:700;">{{ $product->name }}</td>
                            <td style="padding:12px 8px;"><span style="background:var(--bg-tertiary); padding:4px 8px; border-radius:6px; font-size:0.8rem; font-weight:600;">{{ ucfirst($product->type) }}</span></td>
                            <td style="padding:12px 8px; color:var(--text-secondary);">{{ $product->sku ?? 'N/A' }}</td>
                            <td style="padding:12px 8px; font-weight:700;">
                                @if($product->offer_price)
                                    <span style="color:var(--accent-color);">S/ {{ $product->offer_price }}</span>
                                    <span style="text-decoration:line-through; font-size:0.8rem; color:var(--text-muted); margin-left:4px;">S/ {{ $product->price }}</span>
                                @else
                                    S/ {{ $product->price }}
                                @endif
                            </td>
                            <td style="padding:12px 8px;">
                                @if($product->type === 'physical')
                                    <strong style="color: {{ $product->stock > 0 ? 'var(--color-success)' : 'var(--color-danger)' }};">{{ $product->stock }} unids.</strong>
                                @else
                                    <span style="color:var(--text-muted);">Ilimitado (Digital)</span>
                                @endif
                            </td>
                            <td style="padding:12px 8px; font-weight:700; color:var(--sorti-gold);">
                                {{ $product->sorti_coins_price ? '★ ' . $product->sorti_coins_price : 'N/A' }}
                            </td>
                            <td style="padding:12px 8px; text-align:center;">
                                <div style="display:flex; gap:8px; justify-content:center;">
                                    <a href="{{ route('admin.products.edit', $product->id) }}" class="btn btn-secondary" style="padding:6px 12px; font-size:0.8rem;"><i class="fa-solid fa-pen-to-square"></i> Editar</a>
                                    <form action="{{ route('admin.products.destroy', $product->id) }}" method="POST" onsubmit="return confirm('¿Seguro que deseas eliminar este producto?')">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-accent" style="padding:6px 12px; font-size:0.8rem; cursor:pointer;"><i class="fa-solid fa-trash"></i> Eliminar</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        
        <!-- Pagination -->
        <div style="margin-top: 24px; display:flex; justify-content:center;">
            {{ $products->links() }}
        </div>
    @endif
</div>
@endsection
