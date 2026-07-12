@extends('layouts.admin')

@section('title', 'Control de Clientes - Admin')

@section('content')
<div style="margin-bottom: 32px;">
    <h1 style="font-weight: 800; font-size: 2rem; margin-bottom: 6px;">Gestión de Clientes</h1>
    <p style="color: var(--text-secondary);">Visualiza el historial de transacciones de tus clientes y administra manualmente sus billeteras Sorti.</p>
</div>

<div class="glass-panel" style="padding:24px;">
    @if($customers->count() === 0)
        <p style="color:var(--text-muted); text-align:center; padding:40px 0;">No hay clientes registrados en la plataforma.</p>
    @else
        <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.95rem;">
                <thead>
                    <tr style="border-bottom:1px solid var(--glass-border); color:var(--text-secondary);">
                        <th style="padding:12px 8px;">ID</th>
                        <th style="padding:12px 8px;">Nombre</th>
                        <th style="padding:12px 8px;">Correo</th>
                        <th style="padding:12px 8px;">Saldo Monedas</th>
                        <th style="padding:12px 8px;">Equivalente</th>
                        <th style="padding:12px 8px; text-align:center;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($customers as $customer)
                        <tr style="border-bottom:1px solid var(--glass-border);">
                            <td style="padding:12px 8px; font-weight:700;">#{{ $customer->id }}</td>
                            <td style="padding:12px 8px; font-weight:700;">{{ $customer->name }}</td>
                            <td style="padding:12px 8px; color:var(--text-secondary);">{{ $customer->email }}</td>
                            <td style="padding:12px 8px; font-weight:800; color:var(--sorti-gold);"><i class="fa-solid fa-coins"></i> ★ {{ $customer->sorti_coins_balance }}</td>
                            <td style="padding:12px 8px; font-weight:600;">S/ {{ round($customer->sorti_coins_balance / 100, 2) }}</td>
                            <td style="padding:12px 8px; text-align:center;">
                                <a href="/admin/customers/{{ $customer->id }}" class="btn btn-secondary" style="padding:6px 12px; font-size:0.8rem;"><i class="fa-solid fa-wallet"></i> Billetera & Historial</a>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div style="margin-top:24px; display:flex; justify-content:center;">
            {{ $customers->links() }}
        </div>
    @endif
</div>
@endsection
