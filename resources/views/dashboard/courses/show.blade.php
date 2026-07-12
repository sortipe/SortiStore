@extends('layouts.store')

@section('title', $course->name . ' - Syllabus')

@section('content')
<div class="section-wrapper">
    <div style="margin-bottom: 32px; display:flex; gap:20px; align-items:center; flex-wrap:wrap;">
        <img src="{{ $course->primary_image_url }}" alt="{{ $course->name }}" style="width:120px; height:80px; border-radius:12px; object-fit:cover;">
        <div>
            <h1 style="font-weight: 800; font-size: 2rem; margin-bottom: 6px;">{{ $course->name }}</h1>
            <p style="color:var(--text-secondary);">Avance general: <strong>{{ $userCourse->progress_percent }}% completado</strong></p>
        </div>
    </div>

    <div style="display:grid; grid-template-columns: 280px 1fr; gap:32px;" class="dashboard-grid">
        <!-- Sidebar Navigation -->
        @include('dashboard.sidebar')

        <!-- Modules Syllabus List -->
        <div class="glass-panel" style="padding:32px;">
            <h3 style="font-weight:700; margin-bottom:24px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;">Plan de Estudios (Syllabus)</h3>

            @if($course->modules->count() === 0)
                <p style="color:var(--text-muted); text-align:center; padding:32px 0;">Las clases de este curso se están preparando. Próximamente disponibles.</p>
            @else
                <div style="display:flex; flex-direction:column; gap:16px;">
                    @foreach($course->modules as $module)
                        <div style="border:1px solid var(--glass-border); border-radius:12px; overflow:hidden;">
                            <!-- Module header bar -->
                            <div style="background:var(--bg-tertiary); padding:16px 20px; font-weight:700; display:flex; justify-content:space-between; align-items:center;">
                                <span>{{ $module->title }}</span>
                                <span style="font-size:0.8rem; color:var(--text-secondary); font-weight:500;">{{ $module->lectures->count() }} clases</span>
                            </div>

                            <!-- Lectures inside module -->
                            <div style="padding:8px 0;">
                                @foreach($module->lectures as $lecture)
                                    @php
                                        $isCompleted = $userCourse->isLectureCompleted($lecture->id);
                                    @endphp
                                    <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 24px; border-bottom:1px solid var(--glass-border); font-size:0.95rem;">
                                        <div style="display:flex; align-items:center; gap:12px;">
                                            <span style="font-size:1.1rem;">
                                                {!! $isCompleted ? '✅' : '📖' !!}
                                            </span>
                                            <span style="{{ $isCompleted ? 'color:var(--text-secondary); text-decoration:line-through;' : 'font-weight:600;' }}">
                                                {{ $lecture->title }}
                                            </span>
                                        </div>
                                        <div>
                                            <a href="{{ route('dashboard.courses.lecture', [$course->id, $lecture->id]) }}" class="btn btn-secondary" style="padding:6px 12px; font-size:0.8rem;">
                                                <i class="fa-solid fa-play"></i> Ver clase
                                            </a>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endforeach
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
