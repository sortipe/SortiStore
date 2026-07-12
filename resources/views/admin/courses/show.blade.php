@extends('layouts.admin')

@section('title', 'Constructor de Syllabus - Admin')

@section('content')
<div style="margin-bottom: 32px;">
    <a href="/admin/courses" style="color:var(--primary-color); font-weight:600; font-size:0.9rem; display:inline-flex; align-items:center; gap:6px; margin-bottom:12px;">
        <i class="fa-solid fa-arrow-left-long"></i> Volver a cursos
    </a>
    <h1 style="font-weight: 800; font-size: 2rem; margin-bottom: 6px;">Syllabus de: {{ $course->name }}</h1>
    <p style="color: var(--text-secondary);">Agrega módulos organizadores y publica lecciones con videos interactivos, tareas y archivos adjuntos.</p>
</div>

<!-- Display success flash -->
@if(session('success'))
    <div style="background: rgba(16, 185, 129, 0.15); color: var(--color-success); border: 1px solid var(--color-success); padding: 16px; border-radius: 12px; margin-bottom: 24px; font-weight: 600;">
        ✨ {{ session('success') }}
    </div>
@endif

<div style="display:grid; grid-template-columns: 1.1fr 0.9fr; gap:32px;" class="dashboard-grid">
    <!-- Left: Syllabus Structure -->
    <div class="glass-panel" style="padding: 24px;">
        <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Plan de Estudios Actual</h3>
        
        @if($course->modules->count() === 0)
            <p style="color:var(--text-muted); text-align:center; padding:20px 0;">No se registran módulos ni lecciones creadas aún.</p>
        @else
            <div style="display:flex; flex-direction:column; gap:20px;">
                @foreach($course->modules as $mod)
                    <div style="border:1px solid var(--glass-border); border-radius:12px; overflow:hidden;">
                        <!-- Module Header bar -->
                        <div style="background:var(--bg-tertiary); padding:16px 20px; display:flex; justify-content:space-between; align-items:center; font-weight:700;">
                            <span>{{ $mod->title }} (Orden: {{ $mod->sort_order }})</span>
                            <form action="/admin/courses/{{ $course->id }}/modules/{{ $mod->id }}" method="POST" onsubmit="return confirm('¿Eliminar módulo y todas sus clases?')">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="btn btn-accent" style="padding:4px 8px; font-size:0.75rem;"><i class="fa-solid fa-trash"></i> Eliminar Módulo</button>
                            </form>
                        </div>

                        <!-- Lectures list -->
                        <div style="padding:10px 0;">
                            @foreach($mod->lectures as $lect)
                                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 20px; border-bottom:1px solid var(--glass-border); font-size:0.9rem;">
                                    <div>
                                        <strong>#{{ $lect->sort_order }} - {{ $lect->title }}</strong>
                                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                                            @if($lect->video_url) 🎥 Video @endif
                                            @if($lect->pdf_file) 📄 PDF @endif
                                            @if($lect->resource_file) 📦 Material @endif
                                        </div>
                                    </div>
                                    <form action="/admin/courses/{{ $course->id }}/lectures/{{ $lect->id }}" method="POST" onsubmit="return confirm('¿Eliminar clase?')">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-accent" style="padding:2px 6px; font-size:0.7rem;"><i class="fa-solid fa-xmark"></i></button>
                                    </form>
                                </div>
                            @endforeach
                            @if($mod->lectures->count() === 0)
                                <p style="color:var(--text-muted); font-size:0.85rem; padding:10px 20px;">No hay clases en este módulo.</p>
                            @endif
                        </div>
                    </div>
                @endforeach
            </div>
        @endif
    </div>

    <!-- Right: Creation Panels -->
    <div style="display:flex; flex-direction:column; gap:24px;">
        <!-- Add Module form -->
        <div class="glass-panel" style="padding:24px;">
            <h3 style="font-weight:700; margin-bottom:16px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Crear Módulo</h3>
            
            <form action="/admin/courses/{{ $course->id }}/modules" method="POST">
                @csrf
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <div>
                        <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:4px;">Título del Módulo *</label>
                        <input type="text" name="title" class="search-input" style="padding-left:12px; font-size:0.9rem;" placeholder="Ej: Módulo 1: Fundamentos" required>
                    </div>
                    <div>
                        <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:4px;">Orden de Clasificación *</label>
                        <input type="number" name="sort_order" value="{{ $course->modules->count() + 1 }}" class="search-input" style="padding-left:12px; font-size:0.9rem;" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;"><i class="fa-solid fa-plus"></i> Guardar Módulo</button>
                </div>
            </form>
        </div>

        <!-- Add Lecture form -->
        <div class="glass-panel" style="padding:24px;">
            <h3 style="font-weight:700; margin-bottom:16px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Agregar Clase al Módulo</h3>
            
            <form action="/admin/courses/{{ $course->id }}/lectures" method="POST" enctype="multipart/form-data">
                @csrf
                
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <div>
                        <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:4px;">Seleccionar Módulo Organismo *</label>
                        <select name="module_id" class="search-input" style="padding-left:12px; font-size:0.9rem; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--glass-border); outline:none;" required>
                            @foreach($course->modules as $mod)
                                <option value="{{ $mod->id }}">{{ $mod->title }}</option>
                            @endforeach
                        </select>
                    </div>

                    <div>
                        <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:4px;">Título de la Clase *</label>
                        <input type="text" name="title" class="search-input" style="padding-left:12px; font-size:0.9rem;" required>
                    </div>

                    <div>
                        <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:4px;">URL de Video (Youtube, MP4)</label>
                        <input type="text" name="video_url" class="search-input" style="padding-left:12px; font-size:0.9rem;" placeholder="Ej: https://www.youtube.com/watch?v=...">
                    </div>

                    <div>
                        <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:4px;">Contenido / Texto Explicativo</label>
                        <textarea name="content" rows="4" class="search-input" style="padding:8px 12px; font-size:0.9rem; height:auto; resize:vertical;"></textarea>
                    </div>

                    <div>
                        <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:4px;">Cargar Documento PDF Adjunto</label>
                        <input type="file" name="pdf_file" accept=".pdf" style="width:100%; padding:8px; border:1px dashed var(--glass-border); border-radius:6px; background:var(--bg-tertiary);">
                    </div>

                    <div>
                        <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:4px;">Cargar Recurso ZIP Adjunto</label>
                        <input type="file" name="resource_file" accept=".zip,.rar,.rar5" style="width:100%; padding:8px; border:1px dashed var(--glass-border); border-radius:6px; background:var(--bg-tertiary);">
                    </div>

                    <div>
                        <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:4px;">Orden de Clasificación *</label>
                        <input type="number" name="sort_order" value="1" class="search-input" style="padding-left:12px; font-size:0.9rem;" required>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width:100%;"><i class="fa-solid fa-plus"></i> Guardar Clase</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
