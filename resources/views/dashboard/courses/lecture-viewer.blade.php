@extends('layouts.store')

@section('title', $lecture->title . ' - LMS Viewer')

@section('content')
<div class="lms-viewer-container">
    <!-- Left Syllabus Sidebar -->
    <aside class="lms-sidebar">
        <div style="margin-bottom: 24px;">
            <a href="{{ route('dashboard.courses.show', $course->id) }}" style="color:var(--primary-color); font-weight:600; font-size:0.9rem; display:inline-flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-arrow-left-long"></i> Volver al Syllabus
            </a>
            <h2 style="font-weight:800; font-size:1.2rem; margin-top:12px; line-height:1.2;">{{ $course->name }}</h2>
            
            <!-- Progress Bar -->
            <div style="margin-top:16px;">
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">
                    <span>Progreso del Curso</span>
                    <span id="course-progress-percent-text">{{ $userCourse->progress_percent }}%</span>
                </div>
                <div style="width:100%; height:6px; background:var(--bg-tertiary); border-radius:50px; overflow:hidden;">
                    <div id="course-progress-bar-fill" style="width: {{ $userCourse->progress_percent }}%; height:100%; background:var(--primary-gradient); border-radius:50px; transition: width 0.4s ease;"></div>
                </div>
            </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px;">
            @foreach($course->modules as $mod)
                <div>
                    <div style="font-size:0.8rem; font-weight:800; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px; padding-left:4px;">
                        {{ $mod->title }}
                    </div>
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        @foreach($mod->lectures as $lect)
                            @php
                                $lectCompleted = $userCourse->isLectureCompleted($lect->id);
                            @endphp
                            <a href="{{ route('dashboard.courses.lecture', [$course->id, $lect->id]) }}" class="lecture-sidebar-item {{ $lecture->id == $lect->id ? 'active' : '' }}" data-lecture-id="{{ $lect->id }}">
                                <span class="lecture-status-icon">{!! $lectCompleted ? '✅' : '📖' !!}</span>
                                <span>{{ $lect->title }}</span>
                            </a>
                        @endforeach
                    </div>
                </div>
            @endforeach
        </div>
    </aside>

    <!-- Right Video Content -->
    <main class="lms-content-view">
        <!-- Display success/error flashes -->
        @if(session('success'))
            <div style="background: rgba(16, 185, 129, 0.15); color: var(--color-success); border: 1px solid var(--color-success); padding: 16px; border-radius: 12px; margin-bottom: 24px; font-weight: 600;">
                ✨ {{ session('success') }}
            </div>
        @endif

        <h1 style="font-weight:800; font-size:1.8rem; margin-bottom:20px;">{{ $lecture->title }}</h1>

        <!-- Video Player -->
        @if($lecture->video_url)
            <div class="lms-video-wrapper">
                @if(Str::contains($lecture->video_url, ['youtube.com', 'youtu.be']))
                    @php
                        // Simple YouTube Embed generator
                        $videoId = '';
                        if (preg_match('%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\.be/)([^"&?/ ]{11})%i', $lecture->video_url, $match)) {
                            $videoId = $match[1];
                        }
                    @endphp
                    <iframe id="lms-class-video" data-course-id="{{ $course->id }}" data-lecture-id="{{ $lecture->id }}" src="https://www.youtube.com/embed/{{ $videoId }}?enablejsapi=1" allowfullscreen></iframe>
                @else
                    <!-- Native HTML5 Video -->
                    <video id="lms-class-video" data-course-id="{{ $course->id }}" data-lecture-id="{{ $lecture->id }}" controls>
                        <source src="{{ $lecture->video_url }}" type="video/mp4">
                        Tu navegador no soporta reproducción de videos HTML5.
                    </video>
                @endif
            </div>
        @else
            <div style="background:var(--bg-secondary); padding:40px; border-radius:var(--border-radius); text-align:center; border:1px solid var(--glass-border); margin-bottom:24px;">
                <div style="font-size:3rem; color:var(--text-muted); margin-bottom:12px;"><i class="fa-solid fa-book-open-reader"></i></div>
                <h3>Esta clase es de lectura</h3>
                <p style="color:var(--text-secondary); margin-top:8px;">Lee el material a continuación para completar la clase.</p>
                <button class="btn btn-primary" onclick="markTextLectureCompleted()" style="margin-top:16px;">Completar Clase</button>
            </div>
        @endif

        <!-- Class Body Content -->
        <div class="glass-panel" style="padding:32px; margin-bottom:32px;">
            <h3 style="font-weight:700; margin-bottom:12px;">Detalles de la Clase</h3>
            <p style="color:var(--text-secondary); font-size:1rem; line-height:1.7;">
                {!! nl2br(e($lecture->content)) !!}
            </p>
        </div>

        <!-- Resources & Assignments -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
            <!-- Visor PDF / Resource downloads -->
            <div class="glass-panel" style="padding:24px;">
                <h3 style="font-weight:700; margin-bottom:16px; font-size:1.1rem;"><i class="fa-solid fa-paperclip"></i> Material de Estudio</h3>
                
                @if($lecture->pdf_file)
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:12px; background:var(--bg-tertiary); border-radius:8px; margin-bottom:12px;">
                        <span style="font-size:0.9rem; font-weight:600;"><i class="fa-solid fa-file-pdf" style="color:var(--accent-color);"></i> Documento Guía PDF</span>
                        <a href="{{ asset('storage/' . $lecture->pdf_file) }}" target="_blank" class="btn btn-secondary" style="padding:4px 10px; font-size:0.75rem;">Ver PDF</a>
                    </div>
                @endif

                @if($lecture->resource_file)
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:12px; background:var(--bg-tertiary); border-radius:8px;">
                        <span style="font-size:0.9rem; font-weight:600;"><i class="fa-solid fa-file-archive" style="color:var(--primary-color);"></i> Archivos Complementarios</span>
                        <a href="{{ asset('storage/' . $lecture->resource_file) }}" download class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem;">Descargar</a>
                    </div>
                @endif

                @if(!$lecture->pdf_file && !$lecture->resource_file)
                    <p style="color:var(--text-muted); font-size:0.9rem; text-align:center; padding:20px 0;">No hay archivos adicionales para esta clase.</p>
                @endif
            </div>

            <!-- Homework Submitter -->
            <div class="glass-panel" style="padding:24px;">
                <h3 style="font-weight:700; margin-bottom:16px; font-size:1.1rem;"><i class="fa-solid fa-file-arrow-up"></i> Entregar Tarea / Proyecto</h3>
                
                @if($task)
                    <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2); padding:16px; border-radius:12px;">
                        <strong style="color:var(--color-success); font-size:0.95rem;"><i class="fa-solid fa-circle-check"></i> Tarea enviada correctamente</strong>
                        <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:6px;">
                            Fecha de carga: {{ $task->created_at->format('d/m/Y') }}
                        </div>
                        @if($task->grade)
                            <div style="border-top:1px dashed var(--glass-border); margin-top:10px; padding-top:10px;">
                                <strong>Calificación:</strong> <span style="color:var(--primary-color); font-weight:800;">{{ $task->grade }}</span>
                                <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:4px;">Feedback: {{ $task->feedback }}</div>
                            </div>
                        @endif
                    </div>
                @else
                    <form action="/dashboard/courses/tasks/submit" method="POST" enctype="multipart/form-data">
                        @csrf
                        <input type="hidden" name="lecture_id" value="{{ $lecture->id }}">
                        <div style="margin-bottom:12px;">
                            <input type="file" name="task_file" style="width:100%; padding:10px; border:1px dashed var(--glass-border); border-radius:8px; background:var(--bg-tertiary);" required>
                        </div>
                        <button type="submit" class="btn btn-secondary" style="width:100%;">Subir Archivo</button>
                    </form>
                @endif
            </div>
        </div>
    </main>
</div>

<!-- Congratulations pop-up modal -->
<div id="congrats-modal-popup" class="congrats-modal">
    <div class="congrats-card glass-panel">
        <div class="congrats-icon">🏆</div>
        <h2 style="font-weight: 800; font-size: 1.8rem; margin-bottom: 12px;">¡Felicidades!</h2>
        <p style="color:var(--text-secondary); font-size: 1.05rem; margin-bottom: 24px;">Has completado exitosamente todas las lecciones del curso.</p>
        <div style="font-weight:700; color:var(--sorti-gold); margin-bottom:24px;">Curso Completado</div>
        <button class="btn btn-primary" onclick="closeCongratsModal()">Listo, volver a estudiar</button>
    </div>
</div>
@endsection

@section('scripts')
<script>
    function markTextLectureCompleted() {
        const courseId = "{{ $course->id }}";
        const lectureId = "{{ $lecture->id }}";

        fetch(`/dashboard/courses/${courseId}/lectures/${lectureId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Update Sidebar
                const activeItem = document.querySelector(`.lecture-sidebar-item[data-lecture-id="${lectureId}"]`);
                if (activeItem) {
                    activeItem.querySelector('.lecture-status-icon').innerText = '✅';
                }
                
                document.getElementById('course-progress-percent-text').innerText = `${data.progress_percent}%`;
                document.getElementById('course-progress-bar-fill').style.width = `${data.progress_percent}%`;

                if (data.progress_percent >= 100) {
                    document.getElementById('congrats-modal-popup').classList.add('show');
                }
                showToast('success', '¡Clase completada!');
            }
        })
        .catch(err => console.error('Error completing text lecture:', err));
    }

    function closeCongratsModal() {
        document.getElementById('congrats-modal-popup').classList.remove('show');
    }
</script>
@endsection
