@extends('layouts.store')

@section('title', 'Mi Cuenta Settings - Sorti')

@section('content')
<div class="section-wrapper">
    <div class="dashboard-grid">
        @include('dashboard.sidebar')

        <div style="display:flex; flex-direction:column; gap:24px;">
            <!-- Display success or error flash messages -->
            @if(session('success'))
                <div style="background: rgba(16, 185, 129, 0.15); color: var(--color-success); border: 1px solid var(--color-success); padding: 16px; border-radius: 12px; font-weight: 600;">
                    ✨ {{ session('success') }}
                </div>
            @endif

            <!-- Profile Info Form -->
            <div class="glass-panel" style="padding: 32px;">
                <h2 style="font-weight: 800; font-size: 1.5rem; margin-bottom: 24px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;">Detalles Personales</h2>
                
                <form action="/dashboard/account/update" method="POST">
                    @csrf
                    <div style="display:grid; grid-template-columns:1fr; gap:16px; margin-bottom:20px;">
                        <div>
                            <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Nombre Completo</label>
                            <input type="text" name="name" value="{{ $user->name }}" class="search-input" style="padding-left:16px;" required>
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Correo Electrónico (No modificable)</label>
                            <input type="email" value="{{ $user->email }}" class="search-input" style="padding-left:16px; opacity:0.6;" readonly>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                </form>
            </div>

            <!-- Password Reset Form -->
            <div class="glass-panel" style="padding: 32px;">
                <h2 style="font-weight: 800; font-size: 1.5rem; margin-bottom: 24px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;">Seguridad y Contraseña</h2>
                
                <form action="/dashboard/account/password" method="POST">
                    @csrf
                    <div style="display:grid; grid-template-columns:1fr; gap:16px; margin-bottom:20px;">
                        <div>
                            <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Contraseña Actual</label>
                            <input type="password" name="current_password" class="search-input" style="padding-left:16px;" required>
                            @error('current_password')
                                <span style="color:var(--color-danger); font-size:0.8rem;">{{ $message }}</span>
                            @enderror
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Nueva Contraseña</label>
                            <input type="password" name="password" class="search-input" style="padding-left:16px;" required>
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom:6px;">Confirmar Nueva Contraseña</label>
                            <input type="password" name="password_confirmation" class="search-input" style="padding-left:16px;" required>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Actualizar Contraseña</button>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection
