@extends('layouts.store')

@section('title', $product->name . ' - Sorti')

@section('content')
<div class="detail-grid">
    <!-- Left Column: Gallery & Video -->
    <div class="gallery-container">
        <!-- Main Image -->
        <div class="gallery-main glass-panel">
            <img id="main-product-image" src="{{ $product->primary_image_url }}" alt="{{ $product->name }}">
        </div>
        
        <!-- Image Thumbnails -->
        @if($product->images->count() > 1)
            <div class="gallery-thumbs">
                @foreach($product->images as $index => $img)
                    <div class="gallery-thumb {{ $img->is_primary ? 'active' : '' }}" onclick="changeMainImage('{{ asset('storage/' . $img->image_path) }}', this)">
                        <img src="{{ asset('storage/' . $img->image_path) }}" alt="Thumbnail">
                    </div>
                @endforeach
            </div>
        @endif

        <!-- Product Tech Stack Details / Metadata (Software and Projects) -->
        @php
            $metadata = $product->metadata_array;
        @endphp
        
        @if(count($metadata) > 0)
            <div class="glass-panel" style="padding: 24px; margin-top: 24px;">
                <h3 style="font-weight:700; margin-bottom:16px;">Especificaciones Técnicas</h3>
                
                @if($product->type === 'software' || $product->type === 'project')
                    @if(isset($metadata['technologies']))
                        <div style="margin-bottom: 16px;">
                            <strong>Tecnologías utilizadas:</strong>
                            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">
                                @foreach(explode(',', $metadata['technologies']) as $tech)
                                    <span style="background:var(--bg-tertiary); padding:6px 12px; border-radius:6px; font-size:0.85rem; font-weight:600;">
                                        {{ trim($tech) }}
                                    </span>
                                @endforeach
                            </div>
                        </div>
                    @endif
                    @if(isset($metadata['state']))
                        <div style="margin-bottom: 8px;">
                            <strong>Estado de desarrollo:</strong> <span style="font-weight:600; color:var(--primary-color);">{{ $metadata['state'] }}</span>
                        </div>
                    @endif
                @elseif($product->type === 'streaming')
                    @if(isset($metadata['platform']))
                        <div style="margin-bottom: 8px;">
                            <strong>Plataforma:</strong> {{ $metadata['platform'] }}
                        </div>
                    @endif
                    @if(isset($metadata['screens']))
                        <div style="margin-bottom: 8px;">
                            <strong>Pantallas simultáneas:</strong> {{ $metadata['screens'] }}
                        </div>
                    @endif
                    @if(isset($metadata['duration']))
                        <div style="margin-bottom: 8px;">
                            <strong>Duración suscripción:</strong> {{ $metadata['duration'] }}
                        </div>
                    @endif
                @endif
            </div>
        @endif

        <!-- Description and long details -->
        <div class="glass-panel" style="padding: 32px; margin-top: 24px;">
            <h2 style="font-weight: 800; margin-bottom: 16px;">Descripción del Producto</h2>
            <div style="color: var(--text-secondary); font-size: 1.05rem;">
                {!! nl2br(e($product->description)) !!}
            </div>
            
            @if($product->details)
                <h3 style="font-weight: 700; margin-top: 32px; margin-bottom: 16px;">Detalles Adicionales</h3>
                <div style="color: var(--text-secondary); font-size: 0.95rem;">
                    {!! nl2br(e($product->details)) !!}
                </div>
            @endif
        </div>
    </div>

    <!-- Right Column: Purchasing Panel -->
    <div style="display:flex; flex-direction:column; gap:24px;">
        <div class="glass-panel" style="padding: 32px; position: sticky; top: 110px;">
            <!-- Brand & Badges -->
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                <span style="font-size:0.85rem; font-weight:700; color:var(--primary-color); text-transform:uppercase;">
                    {{ $product->brand ?? 'Marca Sorti' }}
                </span>
                
                @if($product->is_presale)
                    <span style="background:rgba(245,158,11,0.15); color:var(--color-warning); padding:4px 10px; border-radius:50px; font-size:0.75rem; font-weight:700; text-transform:uppercase;">Preventa</span>
                @elseif($product->stock > 0 || $product->type !== 'physical')
                    <span style="background:rgba(16,185,129,0.15); color:var(--color-success); padding:4px 10px; border-radius:50px; font-size:0.75rem; font-weight:700; text-transform:uppercase;">Disponible</span>
                @else
                    <span style="background:rgba(239,68,68,0.15); color:var(--color-danger); padding:4px 10px; border-radius:50px; font-size:0.75rem; font-weight:700; text-transform:uppercase;">Agotado</span>
                @endif
            </div>

            <!-- Product Title -->
            <h1 style="font-weight: 800; font-size: 1.8rem; line-height: 1.2; margin-bottom: 16px;">
                {{ $product->name }}
            </h1>

            <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:20px;">
                <span>SKU: <strong>{{ $product->sku ?? 'N/A' }}</strong></span>
                <span style="margin-left: 16px;">Tipo: <strong>{{ ucfirst($product->type) }}</strong></span>
            </div>

            <!-- Prices Box -->
            <div style="background:var(--bg-tertiary); padding:20px; border-radius:12px; margin-bottom:24px;">
                <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:6px;">Precio en Efectivo</div>
                <div class="price-row" style="margin-bottom:0;">
                    @if($product->offer_price)
                        <span class="price-current" style="font-size:2rem; color:var(--accent-color);">S/ {{ $product->offer_price }}</span>
                        <span class="price-original" style="font-size:1.2rem;">S/ {{ $product->price }}</span>
                    @else
                        <span class="price-current" style="font-size:2rem;">S/ {{ $product->price }}</span>
                    @endif
                </div>

                <!-- Sorti Coin Price -->
                @if($product->sorti_coins_price)
                    <div style="border-top:1px dashed var(--glass-border); margin-top:16px; padding-top:16px;">
                        <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:6px;">Precio Exclusivo Sorti Coins</div>
                        <div style="font-size:1.5rem; font-weight:800; color:var(--sorti-gold); display:flex; align-items:center; gap:8px;">
                            <i class="fa-solid fa-coins"></i> ★ {{ $product->sorti_coins_price }} monedas
                        </div>
                    </div>
                @endif
            </div>

            <!-- Pre-Sale Countdown timer -->
            @if($product->is_presale && $product->presale_launch_date)
                <div class="countdown-timer-data" data-date="{{ $product->presale_launch_date->toIso8601String() }}">
                    <div style="font-weight:700; margin-bottom:8px; font-size:0.9rem; text-transform:uppercase; color:var(--color-warning);">
                        <i class="fa-regular fa-clock"></i> El lanzamiento finaliza en:
                    </div>
                    <div class="countdown-box">
                        <div class="countdown-item">
                            <div class="countdown-num days-val">00</div>
                            <div class="countdown-label">Días</div>
                        </div>
                        <div class="countdown-item">
                            <div class="countdown-num hours-val">00</div>
                            <div class="countdown-label">Hrs</div>
                        </div>
                        <div class="countdown-item">
                            <div class="countdown-num minutes-val">00</div>
                            <div class="countdown-label">Min</div>
                        </div>
                        <div class="countdown-item">
                            <div class="countdown-num seconds-val">00</div>
                            <div class="countdown-label">Seg</div>
                        </div>
                    </div>
                    @if($product->presale_delivery_date)
                        <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:8px;">
                            Fecha estimada de entrega: <strong>{{ $product->presale_delivery_date->format('d/m/Y') }}</strong>
                        </div>
                    @endif
                </div>
            @endif

            <!-- Quantity Discounts Tier config -->
            @if($product->quantityDiscounts->count() > 0)
                <div class="qty-discounts-box">
                    <h4 style="font-weight:700; font-size:0.9rem; color:var(--primary-color); margin-bottom:10px;">
                        <i class="fa-solid fa-tags"></i> Promociones por Volumen
                    </h4>
                    @foreach($product->quantityDiscounts as $qd)
                        <div class="qty-discount-row">
                            <span>Lleva <strong>{{ $qd->min_qty }}+</strong> unidades</span>
                            <span style="font-weight:700; color:var(--color-success);">
                                @if($qd->discount_type === 'percentage')
                                    -{{ round($qd->discount_value) }}% desc.
                                @elseif($qd->discount_type === 'fixed')
                                    -S/ {{ $qd->discount_value }} desc. por unidad
                                @elseif($qd->discount_type === 'free_items')
                                    Paga solo {{ $qd->min_qty - $qd->discount_value }}
                                @endif
                            </span>
                        </div>
                    @endforeach
                </div>
            @endif

            <!-- Purchasing inputs (Variants and Quantity) -->
            @if($product->stock > 0 || $product->type !== 'physical')
                <div style="margin-top: 24px; display:flex; flex-direction:column; gap:16px;">
                    <!-- Variants Select -->
                    @if($product->variants->count() > 0)
                        <div>
                            <label for="variant-selector-dropdown" style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:8px;">
                                Selecciona variante:
                            </label>
                            <select id="variant-selector-dropdown" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--glass-border); background:var(--bg-secondary); color:var(--text-primary); outline:none;">
                                @foreach($product->variants as $variant)
                                    <option value="{{ $variant->id }}">
                                        {{ $variant->name }}: {{ $variant->value }} 
                                        @if($variant->additional_price > 0)
                                            (+ S/ {{ $variant->additional_price }})
                                        @endif
                                    </option>
                                @endforeach
                            </select>
                        </div>
                    @endif

                    <!-- Quantity Input -->
                    <div>
                        <label for="qty-selector-input" style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:8px;">Cantidad:</label>
                        <input type="number" id="qty-selector-input" value="1" min="1" max="{{ $product->type === 'physical' ? $product->stock : 99 }}" style="width:80px; padding:10px; border-radius:8px; border:1px solid var(--glass-border); background:var(--bg-secondary); color:var(--text-primary); text-align:center; font-weight:700;">
                    </div>

                    <!-- Buy Buttons -->
                    <button class="btn btn-primary add-to-cart-btn" data-product-id="{{ $product->id }}" style="width:100%; margin-top:8px;">
                        🛒 Agregar al Carrito
                    </button>
                </div>
            @else
                <div style="background:rgba(239,68,68,0.05); border:1px solid rgba(239,68,68,0.2); padding:16px; border-radius:12px; margin-top:24px; color:var(--color-danger); text-align:center; font-weight:700;">
                    Producto Temporalmente Agotado
                </div>
            @endif
        </div>
    </div>
</div>

<!-- Related Products -->
@if(count($relatedProducts) > 0)
    <div class="section-wrapper" style="margin-top: 80px;">
        <h2 class="section-title" style="margin-bottom: 24px;">Productos Relacionados</h2>
        <div class="products-grid">
            @foreach($relatedProducts as $p)
                <div class="product-card glass-panel" onclick="window.location.href='/product/{{ $p->slug }}'">
                    <div class="card-img-wrapper">
                        <img src="{{ $p->primary_image_url }}" alt="{{ $p->name }}" loading="lazy">
                    </div>
                    <div class="card-info">
                        <div class="card-category">{{ $p->type }}</div>
                        <h3 class="card-title">{{ $p->name }}</h3>
                        <div class="price-row">
                            <span class="price-current">S/ {{ $p->final_price }}</span>
                        </div>
                    </div>
                </div>
            @endforeach
        </div>
    </div>
@endif
@endsection

@section('scripts')
<script>
    function changeMainImage(url, thumbEl) {
        document.getElementById('main-product-image').src = url;
        document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
        thumbEl.classList.add('active');
    }
</script>
@endsection
