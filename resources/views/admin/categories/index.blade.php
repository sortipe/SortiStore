@extends('layouts.admin')

@section('title', 'Gestión de Categorías - Admin')

@section('content')
<div style="margin-bottom: 32px;">
    <h1 style="font-weight: 800; font-size: 2rem; margin-bottom: 6px;">Categorías del Catálogo</h1>
    <p style="color: var(--text-secondary);">Organiza tu catálogo asignando categorías principales y subcategorías ilimitadas.</p>
</div>

<!-- Display success flash -->
@if(session('success'))
    <div style="background: rgba(16, 185, 129, 0.15); color: var(--color-success); border: 1px solid var(--color-success); padding: 16px; border-radius: 12px; margin-bottom: 24px; font-weight: 600;">
        ✨ {{ session('success') }}
    </div>
@endif

<div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:32px;" class="dashboard-grid">
    <!-- Categories List -->
    <div class="glass-panel" style="padding:24px;">
        <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Listado de Categorías</h3>
        
        @if($categories->count() === 0)
            <p style="color:var(--text-muted); text-align:center; padding:20px 0;">No hay categorías creadas aún.</p>
        @else
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                    <thead>
                        <tr style="border-bottom:1px solid var(--glass-border); color:var(--text-secondary);">
                            <th style="padding:10px 4px;">Nombre</th>
                            <th style="padding:10px 4px;">Tipo de Sección</th>
                            <th style="padding:10px 4px;">Categoría Superior</th>
                            <th style="padding:10px 4px; text-align:center;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($categories as $cat)
                            <tr style="border-bottom:1px solid var(--glass-border);">
                                <td style="padding:10px 4px; font-weight:700; color: {{ $cat->parent_id ? 'var(--text-secondary)' : 'var(--primary-color)' }}">
                                    {{ $cat->parent_id ? '↳ ' : '' }}{{ $cat->name }}
                                </td>
                                <td style="padding:10px 4px;"><span style="background:var(--bg-tertiary); padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:600;">{{ strtoupper($cat->type) }}</span></td>
                                <td style="padding:10px 4px; color:var(--text-muted);">{{ $cat->parent ? $cat->parent->name : 'Categoría Raíz' }}</td>
                                <td style="padding:10px 4px; text-align:center;">
                                    <div style="display:flex; gap:8px; justify-content:center;">
                                        <button type="button" class="btn btn-secondary" style="padding:4px 10px; font-size:0.75rem; cursor:pointer;" onclick="openEditCategoryModal({{ $cat->id }}, '{{ addslashes($cat->name) }}', '{{ $cat->type }}', '{{ $cat->parent_id }}', '{{ addslashes($cat->icon) }}')">
                                            <i class="fa-solid fa-pen-to-square"></i> Editar
                                        </button>
                                        <form action="{{ route('admin.categories.destroy', $cat->id) }}" method="POST" onsubmit="return confirm('¿Seguro que deseas eliminar esta categoría?')">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="btn btn-accent" style="padding:4px 10px; font-size:0.75rem; cursor:pointer;"><i class="fa-solid fa-trash"></i> Eliminar</button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </div>

    <!-- Create Category Form -->
    <div class="glass-panel" style="padding:24px; height:fit-content;">
        <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Crear Categoría</h3>
        
        <form action="{{ route('admin.categories.store') }}" method="POST">
            @csrf
            
            <div style="display:flex; flex-direction:column; gap:16px;">
                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Nombre de Categoría *</label>
                    <input type="text" name="name" class="search-input" style="padding-left:12px; font-size:0.9rem;" placeholder="Ej: Ropa de Hombre" required>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Sección / Tipo de Contenido *</label>
                    <select name="type" class="search-input" style="padding-left:12px; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--glass-border); outline:none;" required>
                        <option value="store">Tienda (Hogar, Ropa, etc.)</option>
                        <option value="software">Software (CRM, ERP)</option>
                        <option value="course">Cursos (LMS)</option>
                        <option value="digital">Contenido Digital (E-books, Licencias)</option>
                        <option value="project">Proyectos Realizados</option>
                    </select>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Categoría Superior (Opcional)</label>
                    <select name="parent_id" class="search-input" style="padding-left:12px; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--glass-border); outline:none;">
                        <option value="">Ninguna (Categoría Principal)</option>
                        @foreach($parentCategories as $parent)
                            <option value="{{ $parent->id }}">{{ $parent->name }} ({{ $parent->type }})</option>
                        @endforeach
                    </select>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Icono (Clase FontAwesome, Opcional)</label>
                    <input type="text" name="icon" class="search-input" style="padding-left:12px; font-size:0.9rem;" placeholder="Ej: fa-shirt">
                </div>

                <button type="submit" class="btn btn-primary" style="width:100%;"><i class="fa-solid fa-plus"></i> Crear Categoría</button>
            </div>
        </form>
    </div>
</div>

<!-- Edit Category Modal -->
<div id="edit-category-modal" class="congrats-modal">
    <div class="congrats-card glass-panel" style="max-width:500px; text-align:left; padding: 32px;">
        <h3 style="font-weight:800; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Editar Categoría</h3>
        
        <form id="edit-category-form" method="POST">
            @csrf
            @method('PUT')
            
            <div style="display:flex; flex-direction:column; gap:16px;">
                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Nombre de Categoría *</label>
                    <input type="text" name="name" id="edit-category-name" class="search-input" style="padding-left:12px; font-size:0.9rem;" required>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Sección / Tipo de Contenido *</label>
                    <select name="type" id="edit-category-type" class="search-input" style="padding-left:12px; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--glass-border); outline:none;" required>
                        <option value="store">Tienda (Hogar, Ropa, etc.)</option>
                        <option value="software">Software (CRM, ERP)</option>
                        <option value="course">Cursos (LMS)</option>
                        <option value="digital">Contenido Digital (E-books, Licencias)</option>
                        <option value="project">Proyectos Realizados</option>
                    </select>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Categoría Superior (Opcional)</label>
                    <select name="parent_id" id="edit-category-parent" class="search-input" style="padding-left:12px; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--glass-border); outline:none;">
                        <option value="">Ninguna (Categoría Principal)</option>
                        @foreach($parentCategories as $parent)
                            <option value="{{ $parent->id }}">{{ $parent->name }} ({{ $parent->type }})</option>
                        @endforeach
                    </select>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Icono (Clase FontAwesome, Opcional)</label>
                    <input type="text" name="icon" id="edit-category-icon" class="search-input" style="padding-left:12px; font-size:0.9rem;">
                </div>

                <div style="display:flex; gap:12px; margin-top:8px;">
                    <button type="submit" class="btn btn-primary" style="flex:1;"><i class="fa-solid fa-save"></i> Guardar</button>
                    <button type="button" class="btn btn-secondary" onclick="closeEditCategoryModal()" style="flex:1;">Cancelar</button>
                </div>
            </div>
        </form>
    </div>
</div>
@endsection

@section('scripts')
<script>
    function openEditCategoryModal(id, name, type, parentId, icon) {
        const modal = document.getElementById('edit-category-modal');
        const form = document.getElementById('edit-category-form');
        
        form.action = `/admin/categories/${id}`;
        document.getElementById('edit-category-name').value = name;
        document.getElementById('edit-category-type').value = type;
        document.getElementById('edit-category-parent').value = parentId || '';
        document.getElementById('edit-category-icon').value = icon || '';
        
        modal.classList.add('show');
    }

    function closeEditCategoryModal() {
        document.getElementById('edit-category-modal').classList.remove('show');
    }
</script>
@endsection
