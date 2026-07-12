@extends('layouts.admin')

@section('title', 'Editar Producto - Admin')

@section('content')
<div style="margin-bottom: 32px;">
    <a href="{{ route('admin.products.index') }}" style="color:var(--primary-color); font-weight:600; font-size:0.9rem; display:inline-flex; align-items:center; gap:6px; margin-bottom:12px;">
        <i class="fa-solid fa-arrow-left-long"></i> Volver a listado
    </a>
    <h1 style="font-weight: 800; font-size: 2rem; margin-bottom: 6px;">Editar Producto: {{ $product->name }}</h1>
    <p style="color: var(--text-secondary);">Modifica las especificaciones, precios o archivos descargables de este producto.</p>
</div>

<form action="{{ route('admin.products.update', $product->id) }}" method="POST" enctype="multipart/form-data">
    @csrf
    @method('PUT')

    <div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:32px;" class="dashboard-grid">
        <!-- Left: Product Specs & Content -->
        <div style="display:flex; flex-direction:column; gap:24px;">
            <!-- Core Specs Card -->
            <div class="glass-panel" style="padding: 24px;">
                <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Datos Básicos</h3>
                
                <div style="display:grid; grid-template-columns:1fr; gap:16px; margin-bottom:16px;">
                    <div>
                        <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Nombre del Producto *</label>
                        <input type="text" name="name" value="{{ $product->name }}" class="search-input" style="padding-left:16px;" required>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
                    <div>
                        <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Tipo de Producto *</label>
                        <select name="type" class="search-input" style="padding-left:16px; background:var(--bg-secondary); color:var(--text-primary); border: 1px solid var(--glass-border); outline:none;" required>
                            <option value="physical" {{ $product->type === 'physical' ? 'selected' : '' }}>Físico</option>
                            <option value="digital" {{ $product->type === 'digital' ? 'selected' : '' }}>Digital</option>
                            <option value="software" {{ $product->type === 'software' ? 'selected' : '' }}>Software</option>
                            <option value="course" {{ $product->type === 'course' ? 'selected' : '' }}>Curso Online</option>
                            <option value="project" {{ $product->type === 'project' ? 'selected' : '' }}>Proyecto Realizado</option>
                            <option value="streaming" {{ $product->type === 'streaming' ? 'selected' : '' }}>Servicio Streaming</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Categoría</label>
                        <select name="category_id" class="search-input" style="padding-left:16px; background:var(--bg-secondary); color:var(--text-primary); border: 1px solid var(--glass-border); outline:none;">
                            <option value="">Selecciona categoría...</option>
                            @foreach($categories as $category)
                                <option value="{{ $category->id }}" {{ $product->category_id == $category->id ? 'selected' : '' }}>{{ $category->name }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;">
                    <div>
                        <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">SKU (Código)</label>
                        <input type="text" name="sku" value="{{ $product->sku }}" class="search-input" style="padding-left:16px;">
                    </div>
                    <div>
                        <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Marca</label>
                        <input type="text" name="brand" value="{{ $product->brand }}" class="search-input" style="padding-left:16px;">
                    </div>
                    <div>
                        <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Stock Físico *</label>
                        <input type="number" name="stock" value="{{ $product->stock }}" class="search-input" style="padding-left:16px;" required>
                    </div>
                </div>
            </div>

            <!-- Prices specs -->
            <div class="glass-panel" style="padding: 24px;">
                <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Precios & Finanzas</h3>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;">
                    <div>
                        <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Precio Normal (S/) *</label>
                        <input type="number" step="0.01" name="price" value="{{ $product->price }}" class="search-input" style="padding-left:16px;" required>
                    </div>
                    <div>
                        <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Precio Oferta (S/)</label>
                        <input type="number" step="0.01" name="offer_price" value="{{ $product->offer_price }}" class="search-input" style="padding-left:16px;">
                    </div>
                    <div>
                        <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Precio Monedas Sorti</label>
                        <input type="number" name="sorti_coins_price" value="{{ $product->sorti_coins_price }}" class="search-input" style="padding-left:16px;">
                    </div>
                </div>
            </div>

            <!-- Descriptions -->
            <div class="glass-panel" style="padding: 24px;">
                <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Detalles & Textos</h3>
                <div style="margin-bottom:16px;">
                    <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Descripción del Producto</label>
                    <textarea name="description" rows="5" class="search-input" style="padding:12px 16px; border-radius:12px; height:auto; resize:vertical;">{{ $product->description }}</textarea>
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Especificaciones Técnicas / Detalles Largos</label>
                    <textarea name="details" rows="5" class="search-input" style="padding:12px 16px; border-radius:12px; height:auto; resize:vertical;">{{ $product->details }}</textarea>
                </div>
            </div>

            <!-- LMS / Digital File Details -->
            <div class="glass-panel" style="padding: 24px;">
                <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Descarga de Archivos (Digital / Software)</h3>
                @if($product->download_file)
                    <div style="background:rgba(99,102,241,0.05); padding:12px 16px; border-radius:8px; font-size:0.9rem; margin-bottom:16px; font-weight:600;">
                        Archivo actual: 📁 {{ $product->download_file }} ({{ $product->download_size }})
                    </div>
                @endif
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
                    <div>
                        <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Actualizar Archivo Descargable</label>
                        <input type="file" name="download_file" style="width:100%; padding:10px; border:1px dashed var(--glass-border); border-radius:8px; background:var(--bg-tertiary);">
                    </div>
                    <div>
                        <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Versión del Software / Archivo</label>
                        <input type="text" name="download_version" value="{{ $product->download_version }}" class="search-input" style="padding-left:16px;">
                    </div>
                </div>
            </div>
        </div>

        <!-- Right: Image uploads, Tags, Pre-sale & Variants -->
        <div style="display:flex; flex-direction:column; gap:24px;">
            <!-- Primary Image -->
            <div class="glass-panel" style="padding: 24px;">
                <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Imágenes</h3>
                <img src="{{ $product->primary_image_url }}" alt="Preview" style="width:100%; height:180px; border-radius:12px; object-fit:cover; margin-bottom:16px; background:var(--bg-tertiary);">
                <div>
                    <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Reemplazar Imagen Principal</label>
                    <input type="file" name="image" accept="image/*" style="width:100%; padding:10px; border:1px dashed var(--glass-border); border-radius:8px; background:var(--bg-tertiary);">
                </div>
            </div>

            <!-- Pre-Sale options -->
            <div class="glass-panel" style="padding: 24px;">
                <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Lanzamiento & Preventas</h3>
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:600; margin-bottom:16px;">
                    <input type="checkbox" name="is_presale" value="1" {{ $product->is_presale ? 'checked' : '' }} style="width:18px; height:18px;"> Activar Preventa
                </label>
                
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <div>
                        <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Fecha de Lanzamiento</label>
                        <input type="datetime-local" name="presale_launch_date" value="{{ $product->presale_launch_date ? $product->presale_launch_date->format('Y-m-d\TH:i') : '' }}" class="search-input" style="padding-left:16px; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--glass-border); outline:none;">
                    </div>
                    <div>
                        <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Fecha de Entrega Estimada</label>
                        <input type="date" name="presale_delivery_date" value="{{ $product->presale_delivery_date ? $product->presale_delivery_date->format('Y-m-d') : '' }}" class="search-input" style="padding-left:16px; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--glass-border); outline:none;">
                    </div>
                </div>
            </div>

            <!-- Marketing Tags -->
            <div class="glass-panel" style="padding: 24px;">
                <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Etiquetas de Marketing</h3>
                <div style="display:flex; flex-direction:column; gap:10px; font-weight:600;">
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" name="is_featured" value="1" {{ $product->is_featured ? 'checked' : '' }} style="width:18px; height:18px;"> Producto Destacado
                    </label>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" name="is_recommended" value="1" {{ $product->is_recommended ? 'checked' : '' }} style="width:18px; height:18px;"> Producto Recomendado
                    </label>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" name="is_new" value="1" {{ $product->is_new ? 'checked' : '' }} style="width:18px; height:18px;"> Producto Nuevo
                    </label>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" name="is_soon" value="1" {{ $product->is_soon ? 'checked' : '' }} style="width:18px; height:18px;"> Próximo Lanzamiento
                    </label>
                </div>
            </div>

            <!-- Variants builder -->
            <div class="glass-panel" style="padding: 24px;">
                <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Variantes del Producto</h3>
                
                <div id="variants-fields-wrapper" style="display:flex; flex-direction:column; gap:12px; margin-bottom:16px;">
                    @foreach($product->variants as $variant)
                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:8px; border:1px solid var(--glass-border); padding:10px; border-radius:8px; position:relative;">
                            <div>
                                <input type="text" name="variant_names[]" value="{{ $variant->name }}" class="search-input" style="padding-left:8px; font-size:0.8rem; height:32px;">
                            </div>
                            <div>
                                <input type="text" name="variant_values[]" value="{{ $variant->value }}" class="search-input" style="padding-left:8px; font-size:0.8rem; height:32px;">
                            </div>
                            <div>
                                <input type="number" name="variant_prices[]" value="{{ $variant->additional_price }}" step="0.01" class="search-input" style="padding-left:8px; font-size:0.8rem; height:32px;">
                            </div>
                            <input type="hidden" name="variant_stocks[]" value="999">
                            <button type="button" onclick="this.parentNode.remove()" style="position:absolute; top:-6px; right:-6px; background:var(--accent-color); color:white; border:none; width:18px; height:18px; border-radius:50%; font-size:0.7rem; font-weight:700; cursor:pointer;">&times;</button>
                        </div>
                    @endforeach
                </div>

                <button type="button" class="btn btn-secondary" onclick="addVariantRow()" style="width:100%; font-size:0.85rem;"><i class="fa-solid fa-plus"></i> Añadir Variante</button>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; font-size:1.05rem; padding:14px;"><i class="fa-solid fa-circle-check"></i> Guardar Cambios</button>
        </div>
    </div>
</form>
@endsection

@section('scripts')
<script>
    function addVariantRow() {
        const wrapper = document.getElementById('variants-fields-wrapper');
        const div = document.createElement('div');
        div.style.cssText = 'display:grid; grid-template-columns: 1fr 1fr 1fr; gap:8px; border:1px solid var(--glass-border); padding:10px; border-radius:8px; position:relative;';
        
        div.innerHTML = `
            <div>
                <input type="text" name="variant_names[]" class="search-input" style="padding-left:8px; font-size:0.8rem; height:32px;" placeholder="Tipo: Color">
            </div>
            <div>
                <input type="text" name="variant_values[]" class="search-input" style="padding-left:8px; font-size:0.8rem; height:32px;" placeholder="Valor: Azul">
            </div>
            <div>
                <input type="number" name="variant_prices[]" value="0.00" step="0.01" class="search-input" style="padding-left:8px; font-size:0.8rem; height:32px;" placeholder="Precio Adic.">
            </div>
            <input type="hidden" name="variant_stocks[]" value="999">
            <button type="button" onclick="this.parentNode.remove()" style="position:absolute; top:-6px; right:-6px; background:var(--accent-color); color:white; border:none; width:18px; height:18px; border-radius:50%; font-size:0.7rem; font-weight:700; cursor:pointer;">&times;</button>
        `;
        wrapper.appendChild(div);
    }
</script>
@endsection
