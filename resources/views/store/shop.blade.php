@extends('layouts.store')

@section('title', 'Catálogo de Productos - Sorti')

@section('content')
<div class="section-wrapper">
    <div style="margin-bottom: 32px;">
        <h1 style="font-weight: 800; font-size: 2.2rem; margin-bottom: 8px;">Catálogo de Productos</h1>
        <p style="color: var(--text-secondary);">Encuentra los mejores productos físicos y digitales adaptados a tus necesidades.</p>
    </div>

    <div style="display: grid; grid-template-columns: 300px 1fr; gap: 32px;" class="dashboard-grid">
        <!-- Sidebar Filters -->
        <aside class="glass-panel" style="padding: 24px; height: fit-content;">
            <h3 style="font-weight: 700; margin-bottom: 20px; font-size: 1.1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px;">Filtros</h3>

            <!-- Search query indicator -->
            @if(request('q'))
                <div style="margin-bottom: 20px; background: rgba(99, 102, 241, 0.1); padding: 12px; border-radius: 8px; font-size: 0.9rem;">
                    Búsqueda: <strong>"{{ request('q') }}"</strong>
                    <a href="{{ request()->fullUrlWithQuery(['q' => null]) }}" style="float: right; color: var(--accent-color); font-weight: 700;">&times;</a>
                </div>
            @endif

            <!-- Filter by Product Type -->
            <div style="margin-bottom: 24px;">
                <h4 style="font-weight: 600; margin-bottom: 12px; font-size: 0.95rem; color: var(--primary-color);">Tipo de Producto</h4>
                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.95rem;">
                    <a href="{{ request()->fullUrlWithQuery(['type' => null]) }}" style="{{ !request('type') ? 'color: var(--primary-color); font-weight: 700;' : '' }}">Todos</a>
                    <a href="{{ request()->fullUrlWithQuery(['type' => 'physical']) }}" style="{{ request('type') === 'physical' ? 'color: var(--primary-color); font-weight: 700;' : '' }}">Productos Físicos</a>
                    <a href="{{ request()->fullUrlWithQuery(['type' => 'digital']) }}" style="{{ request('type') === 'digital' ? 'color: var(--primary-color); font-weight: 700;' : '' }}">Contenido Digital</a>
                    <a href="{{ request()->fullUrlWithQuery(['type' => 'software']) }}" style="{{ request('type') === 'software' ? 'color: var(--primary-color); font-weight: 700;' : '' }}">Software & Sistemas</a>
                    <a href="{{ request()->fullUrlWithQuery(['type' => 'course']) }}" style="{{ request('type') === 'course' ? 'color: var(--primary-color); font-weight: 700;' : '' }}">Cursos LMS</a>
                    <a href="{{ request()->fullUrlWithQuery(['type' => 'project']) }}" style="{{ request('type') === 'project' ? 'color: var(--primary-color); font-weight: 700;' : '' }}">Proyectos Realizados</a>
                </div>
            </div>

            <!-- Filter by Categories -->
            <div style="margin-bottom: 24px;">
                <h4 style="font-weight: 600; margin-bottom: 12px; font-size: 0.95rem; color: var(--primary-color);">Categorías</h4>
                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.95rem; max-height: 250px; overflow-y: auto; padding-right: 5px;">
                    <a href="{{ request()->fullUrlWithQuery(['category' => null]) }}" style="{{ !request('category') ? 'color: var(--primary-color); font-weight: 700;' : '' }}">Todas las Categorías</a>
                    @foreach($categories as $category)
                        <a href="{{ request()->fullUrlWithQuery(['category' => $category->slug]) }}" style="{{ request('category') === $category->slug ? 'color: var(--primary-color); font-weight: 700;' : '' }}">
                            {{ $category->name }}
                        </a>
                        @if($category->children->count() > 0)
                            @foreach($category->children as $subcat)
                                <a href="{{ request()->fullUrlWithQuery(['category' => $subcat->slug]) }}" style="padding-left: 15px; font-size: 0.85rem; {{ request('category') === $subcat->slug ? 'color: var(--primary-color); font-weight: 700;' : '' }}">
                                    • {{ $subcat->name }}
                                </a>
                            @endforeach
                        @endif
                    @endforeach
                </div>
            </div>

            <!-- Sort option -->
            <div>
                <h4 style="font-weight: 600; margin-bottom: 12px; font-size: 0.95rem; color: var(--primary-color);">Ordenar por</h4>
                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.95rem;">
                    <a href="{{ request()->fullUrlWithQuery(['sort' => 'newest']) }}" style="{{ request('sort', 'newest') === 'newest' ? 'color: var(--primary-color); font-weight: 700;' : '' }}">Más recientes</a>
                    <a href="{{ request()->fullUrlWithQuery(['sort' => 'price_low']) }}" style="{{ request('sort') === 'price_low' ? 'color: var(--primary-color); font-weight: 700;' : '' }}">Menor precio</a>
                    <a href="{{ request()->fullUrlWithQuery(['sort' => 'price_high']) }}" style="{{ request('sort') === 'price_high' ? 'color: var(--primary-color); font-weight: 700;' : '' }}">Mayor precio</a>
                </div>
            </div>
        </aside>

        <!-- Product Grid & Pagination -->
        <div>
            <!-- Products count and current filters display -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; font-size: 0.95rem; color: var(--text-secondary);">
                <div>Mostrando <strong>{{ $products->count() }}</strong> de <strong>{{ $products->total() }}</strong> productos</div>
            </div>

            <div class="products-grid">
                @forelse($products as $product)
                    <div class="product-card glass-panel" onclick="window.location.href='/product/{{ $product->slug }}'">
                        @if($product->is_presale)
                            <span class="badge badge-presale">Preventa</span>
                        @elseif($product->offer_price)
                            <span class="badge badge-offer">Oferta</span>
                        @elseif($product->is_new)
                            <span class="badge badge-new">Nuevo</span>
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
                    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 24px;" class="glass-panel">
                        <div style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"><i class="fa-solid fa-folder-open"></i></div>
                        <h3>No se encontraron productos</h3>
                        <p style="color: var(--text-secondary); margin-top: 8px;">Intenta cambiar los filtros o el término de búsqueda.</p>
                        <a href="/store" class="btn btn-primary" style="margin-top: 20px;">Limpiar Filtros</a>
                    </div>
                @endforelse
            </div>

            <!-- Custom Premium Pagination -->
            <div style="margin-top: 40px; display: flex; justify-content: center; gap: 8px;">
                {{ $products->links() }}
            </div>
        </div>
    </div>
</div>
@endsection
