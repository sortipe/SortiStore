@extends('layouts.store')

@section('title', 'Sorti - Plataforma de Comercio Electrónico Premium')

@section('content')
    <!-- Hero Slider -->
    <div class="hero-slider">
        @foreach($banners as $index => $banner)
            <div class="hero-slide glass-panel" style="background-image: url('{{ $banner['image'] }}'); display: {{ $index === 0 ? 'flex' : 'none' }};">
                <div class="hero-overlay"></div>
                <div class="hero-content">
                    <h1>{{ $banner['title'] }}</h1>
                    <p>{{ $banner['subtitle'] }}</p>
                    <a href="{{ $banner['link'] }}" class="btn btn-primary">Ver Catálogo <i class="fa-solid fa-arrow-right"></i></a>
                </div>
            </div>
        @endforeach
    </div>

    <!-- Category Quick Grid -->
    <div class="section-wrapper">
        <h2 class="section-title" style="margin-bottom: 24px;">Explorar Categorías</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px;">
            <a href="/store?category=tecnologia" class="glass-panel" style="padding: 24px; text-align: center; display: block; border-radius: 16px;">
                <div style="font-size: 2.5rem; margin-bottom: 12px; color: var(--primary-color);"><i class="fa-solid fa-laptop"></i></div>
                <div style="font-weight: 700;">Tecnología</div>
            </a>
            <a href="/store?category=ropa" class="glass-panel" style="padding: 24px; text-align: center; display: block; border-radius: 16px;">
                <div style="font-size: 2.5rem; margin-bottom: 12px; color: var(--accent-color);"><i class="fa-solid fa-shirt"></i></div>
                <div style="font-weight: 700;">Moda & Ropa</div>
            </a>
            <a href="/store?type=software" class="glass-panel" style="padding: 24px; text-align: center; display: block; border-radius: 16px;">
                <div style="font-size: 2.5rem; margin-bottom: 12px; color: var(--color-success);"><i class="fa-solid fa-database"></i></div>
                <div style="font-weight: 700;">Sistemas & CRM</div>
            </a>
            <a href="/store?type=course" class="glass-panel" style="padding: 24px; text-align: center; display: block; border-radius: 16px;">
                <div style="font-size: 2.5rem; margin-bottom: 12px; color: var(--sorti-gold);"><i class="fa-solid fa-graduation-cap"></i></div>
                <div style="font-weight: 700;">Cursos Online</div>
            </a>
            <a href="/store?type=project" class="glass-panel" style="padding: 24px; text-align: center; display: block; border-radius: 16px;">
                <div style="font-size: 2.5rem; margin-bottom: 12px; color: var(--color-info);"><i class="fa-solid fa-rocket"></i></div>
                <div style="font-weight: 700;">Proyectos Demo</div>
            </a>
        </div>
    </div>

    <!-- Active Promoted Offers -->
    @if(count($promotedOffers) > 0)
        <div class="section-wrapper">
            <div class="section-header">
                <h2 class="section-title"><i class="fa-solid fa-fire" style="color: var(--accent-color);"></i> Ofertas de Temporada</h2>
                <a href="/store?promo=1" style="color: var(--primary-color); font-weight: 600;">Ver todo <i class="fa-solid fa-angle-right"></i></a>
            </div>
            <div class="carousel-container">
                @foreach($promotedOffers as $offer)
                    @php $product = $offer->product; @endphp
                    @if($product)
                        <div class="product-card glass-panel" onclick="window.location.href='/product/{{ $product->slug }}'">
                            <span class="badge badge-offer">-{{ round($offer->discount_percent) }}%</span>
                            <div class="card-img-wrapper">
                                <img src="{{ $product->primary_image_url }}" alt="{{ $product->name }}" loading="lazy">
                            </div>
                            <div class="card-info">
                                <div class="card-category">{{ $product->type }}</div>
                                <h3 class="card-title">{{ $product->name }}</h3>
                                <div class="price-row">
                                    <span class="price-current" style="color: var(--accent-color);">S/ {{ round($product->price * (1 - $offer->discount_percent / 100), 2) }}</span>
                                    <span class="price-original">S/ {{ $product->price }}</span>
                                </div>
                                @if($product->sorti_coins_price)
                                    <div class="coins-price-row">
                                        <i class="fa-solid fa-coins"></i> ★ {{ $product->sorti_coins_price }} monedas
                                    </div>
                                @endif
                            </div>
                        </div>
                    @endif
                @endforeach
            </div>
        </div>
    @endif

    <!-- Featured Products -->
    <div class="section-wrapper">
        <div class="section-header">
            <h2 class="section-title">Productos Destacados</h2>
            <a href="/store?sort=featured" style="color: var(--primary-color); font-weight: 600;">Ver todo <i class="fa-solid fa-angle-right"></i></a>
        </div>
        <div class="products-grid">
            @forelse($featuredProducts as $product)
                <div class="product-card glass-panel" onclick="window.location.href='/product/{{ $product->slug }}'">
                    @if($product->offer_price)
                        <span class="badge badge-offer">Oferta</span>
                    @endif
                    <div class="card-img-wrapper">
                        <img src="{{ $product->primary_image_url }}" alt="{{ $product->name }}" loading="lazy">
                    </div>
                    <div class="card-info">
                        <div class="card-category">{{ $product->type }}</div>
                        <h3 class="card-title">{{ $product->name }}</h3>
                        <div class="price-row">
                            @if($product->offer_price)
                                <span class="price-current">S/ {{ $product->offer_price }}</span>
                                <span class="price-original">S/ {{ $product->price }}</span>
                            @else
                                <span class="price-current">S/ {{ $product->price }}</span>
                            @endif
                        </div>
                        @if($product->sorti_coins_price)
                            <div class="coins-price-row">
                                <i class="fa-solid fa-coins"></i> ★ {{ $product->sorti_coins_price }} monedas
                            </div>
                        @endif
                    </div>
                </div>
            @empty
                @for($i = 0; $i < 4; $i++)
                    <div class="skeleton-card glass-panel skeleton">
                        <div class="skeleton-img skeleton"></div>
                        <div class="skeleton-title skeleton"></div>
                        <div class="skeleton-price skeleton"></div>
                    </div>
                @endfor
            @endforelse
        </div>
    </div>

    <!-- Pre-Sales Section -->
    @if(count($preSales) > 0)
        <div class="section-wrapper" style="background: rgba(99, 102, 241, 0.02); padding: 40px 24px; border-radius: var(--border-radius); border: 1px solid var(--glass-border);">
            <div class="section-header">
                <h2 class="section-title"><i class="fa-solid fa-hourglass-start" style="color: var(--color-warning);"></i> Próximos Lanzamientos & Preventas</h2>
            </div>
            <div class="products-grid">
                @foreach($preSales as $product)
                    <div class="product-card glass-panel" onclick="window.location.href='/product/{{ $product->slug }}'">
                        <span class="badge badge-presale">Preventa</span>
                        <div class="card-img-wrapper">
                            <img src="{{ $product->primary_image_url }}" alt="{{ $product->name }}" loading="lazy">
                        </div>
                        <div class="card-info">
                            <div class="card-category">{{ $product->type }}</div>
                            <h3 class="card-title">{{ $product->name }}</h3>
                            <div class="price-row">
                                <span class="price-current">S/ {{ $product->final_price }}</span>
                            </div>
                            
                            @if($product->presale_launch_date)
                                <div style="font-size: 0.8rem; font-weight:600; color: var(--color-warning); margin-top: 8px;">
                                    Lanzamiento: {{ $product->presale_launch_date->format('d/m/Y') }}
                                </div>
                            @endif
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    @endif

    <!-- Virtual Currency Explainer Banner -->
    <div class="section-wrapper glass-panel" style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%); padding: 48px; border-radius: 24px; display: flex; align-items: center; justify-content: space-between; gap: 40px; border: 1px solid rgba(234, 179, 8, 0.2);">
        <div style="max-width: 600px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <span style="font-size: 2.5rem; color: var(--sorti-gold);"><i class="fa-solid fa-coins"></i></span>
                <h2 style="font-weight: 800; font-size: 2rem;">Acumula Monedas Sorti</h2>
            </div>
            <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 24px;">Por cada compra que realices en nuestra tienda, acumulas monedas Sorti automáticamente. Úsalas para obtener precios especiales en software, proyectos, cursos y productos exclusivos, o realiza canjes totales.</p>
            <a href="/dashboard/coins" class="btn btn-sorti">Ver Mi Billetera</a>
        </div>
        <div style="font-size: 8rem; color: rgba(234, 179, 8, 0.15); font-weight: 800;" class="d-none d-md-block">★ SORTI</div>
    </div>
@endsection
