@extends('layouts.store')

@section('title', 'Mis Cursos LMS - Sorti')

@section('content')
<div class="section-wrapper">
    <div class="dashboard-grid">
        @include('dashboard.sidebar')

        <div class="glass-panel" style="padding: 32px;">
            <h1 style="font-weight: 800; font-size: 1.8rem; margin-bottom: 24px;"><i class="fa-solid fa-graduation-cap"></i> Mis Cursos Online</h1>
            <p style="color:var(--text-secondary); margin-bottom:32px;">Entra a tus cursos comprados, mira las clases cuando quieras y obtén tu certificado.</p>

            @if($courses->count() === 0)
                <div style="text-align:center; padding:40px 24px; border: 1px dashed var(--glass-border); border-radius:12px;">
                    <div style="font-size:3rem; color:var(--text-muted); margin-bottom:16px;"><i class="fa-solid fa-graduation-cap"></i></div>
                    <h3>No estás inscrito en ningún curso</h3>
                    <p style="color:var(--text-secondary); margin-top:8px;">Una vez que compres un curso y confirmemos tu pago, aparecerá aquí.</p>
                    <a href="/store?type=course" class="btn btn-primary" style="margin-top:20px;">Explorar Cursos</a>
                </div>
            @else
                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:24px;">
                    @foreach($courses as $uc)
                        @php $course = $uc->course; @endphp
                        @if($course)
                            <div class="product-card glass-panel">
                                <div class="card-img-wrapper" style="height:180px;">
                                    <img src="{{ $course->primary_image_url }}" alt="{{ $course->name }}">
                                </div>
                                <div class="card-info" style="padding: 20px 20px 24px 20px;">
                                    <h3 style="font-weight:700; font-size:1.1rem; margin-bottom:12px; height:44px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                                        {{ $course->name }}
                                    </h3>
                                    
                                    <!-- Progress bar -->
                                    <div style="margin-bottom:20px;">
                                        <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:600; color:var(--text-secondary); margin-bottom:6px;">
                                            <span>Progreso</span>
                                            <span>{{ $uc->progress_percent }}%</span>
                                        </div>
                                        <div style="width:100%; height:8px; background:var(--bg-tertiary); border-radius:50px; overflow:hidden;">
                                            <div style="width: {{ $uc->progress_percent }}%; height:100%; background:var(--primary-gradient); border-radius:50px;"></div>
                                        </div>
                                    </div>

                                    <a href="{{ route('dashboard.courses.show', $course->id) }}" class="btn btn-primary" style="width:100%; text-align:center;">
                                        Entrar a Estudiar
                                    </a>
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
