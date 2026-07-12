@extends('layouts.admin')

@section('title', 'Gestión de Cursos LMS - Admin')

@section('content')
<div style="margin-bottom: 32px;">
    <h1 style="font-weight: 800; font-size: 2rem; margin-bottom: 6px;">Gestión de Cursos (Syllabus)</h1>
    <p style="color: var(--text-secondary);">Administra el árbol de módulos y lecciones de cada uno de tus cursos online en venta.</p>
</div>

<div class="glass-panel" style="padding:24px;">
    @if($courses->count() === 0)
        <p style="color:var(--text-muted); text-align:center; padding:40px 0;">No tienes productos de tipo "Curso" creados en el catálogo.</p>
        <div style="text-align:center;">
            <a href="{{ route('admin.products.create') }}" class="btn btn-primary">Crear Producto de tipo Curso</a>
        </div>
    @else
        <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.95rem;">
                <thead>
                    <tr style="border-bottom:1px solid var(--glass-border); color:var(--text-secondary);">
                        <th style="padding:12px 8px;">Imagen</th>
                        <th style="padding:12px 8px;">Curso</th>
                        <th style="padding:12px 8px;">Módulos</th>
                        <th style="padding:12px 8px;">Clases Totales</th>
                        <th style="padding:12px 8px; text-align:center;">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($courses as $course)
                        <tr style="border-bottom:1px solid var(--glass-border);">
                            <td style="padding:12px 8px;">
                                <img src="{{ $course->primary_image_url }}" alt="{{ $course->name }}" style="width:60px; height:40px; border-radius:6px; object-fit:cover; background:var(--bg-tertiary);">
                            </td>
                            <td style="padding:12px 8px; font-weight:700;">{{ $course->name }}</td>
                            <td style="padding:12px 8px; font-weight:600;">{{ $course->modules->count() }} módulos</td>
                            <td style="padding:12px 8px; font-weight:600; color:var(--primary-color);">
                                @php
                                    $totLectures = 0;
                                    foreach($course->modules as $m) { $totLectures += $m->lectures->count(); }
                                @endphp
                                {{ $totLectures }} clases
                            </td>
                            <td style="padding:12px 8px; text-align:center;">
                                <a href="/admin/courses/{{ $course->id }}" class="btn btn-secondary" style="padding:6px 12px; font-size:0.8rem;"><i class="fa-solid fa-folder-tree"></i> Construir Syllabus</a>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div style="margin-top:24px; display:flex; justify-content:center;">
            {{ $courses->links() }}
        </div>
    @endif
</div>
@endsection
