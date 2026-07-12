@extends('layouts.store')

@section('title', 'Mis Descargas - Sorti')

@section('content')
<div class="section-wrapper">
    <div class="dashboard-grid">
        @include('dashboard.sidebar')

        <div class="glass-panel" style="padding: 32px;">
            <h1 style="font-weight: 800; font-size: 1.8rem; margin-bottom: 24px;"><i class="fa-solid fa-cloud-arrow-down"></i> Centro de Descargas</h1>
            <p style="color:var(--text-secondary); margin-bottom: 32px;">Encuentra y descarga todos los recursos digitales, software, aplicaciones, juegos y e-books comprados.</p>

            @if(count($items) === 0)
                <div style="text-align:center; padding:40px 24px; border: 1px dashed var(--glass-border); border-radius:12px;">
                    <div style="font-size:3rem; color:var(--text-muted); margin-bottom:16px;"><i class="fa-solid fa-cloud"></i></div>
                    <h3>No tienes descargas disponibles</h3>
                    <p style="color:var(--text-secondary); margin-top:8px;">Una vez que compres un recurso digital y el administrador confirme el pago, aparecerá aquí.</p>
                </div>
            @else
                <div style="display:grid; grid-template-columns: 1fr; gap:16px;">
                    @foreach($items as $item)
                        @php $product = $item->product; @endphp
                        @if($product)
                            <div class="glass-panel" style="padding:20px; display:flex; align-items:center; justify-content:between; flex-wrap:wrap; gap:20px; background:var(--bg-tertiary);">
                                <div style="display:flex; align-items:center; gap:16px; flex:1;">
                                    <div style="font-size:2.2rem; color:var(--primary-color);"><i class="fa-solid fa-file-code"></i></div>
                                    <div>
                                        <h3 style="font-weight:700; font-size:1.05rem;">{{ $product->name }}</h3>
                                        <div style="font-size:0.85rem; color:var(--text-secondary); display:flex; gap:16px; margin-top:4px;">
                                            <span>Versión: <strong>{{ $product->download_version ?? '1.0.0' }}</strong></span>
                                            <span>Tamaño: <strong>{{ $product->download_size ?? 'N/A' }}</strong></span>
                                            <span>Comprado: <strong>{{ $item->created_at->format('d/m/Y') }}</strong></span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    @if($product->download_file)
                                        <a href="{{ route('dashboard.download', $product->id) }}" class="btn btn-primary" style="padding:10px 20px; font-size:0.9rem;">
                                            <i class="fa-solid fa-download"></i> Descargar Archivo
                                        </a>
                                    @else
                                        <span style="color:var(--text-muted); font-size:0.9rem; font-weight:600;">Archivo no cargado aún</span>
                                    @endif
                                </div>
                            </div>
                        @endif
                    @endforeach
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
