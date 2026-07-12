@extends('layouts.admin')

@section('title', 'Expediente Cliente #' . $customer->id . ' - Admin')

@section('content')
<div style="margin-bottom: 32px;">
    <a href="{{ route('admin.customers.index') }}" style="color:var(--primary-color); font-weight:600; font-size:0.9rem; display:inline-flex; align-items:center; gap:6px; margin-bottom:12px;">
        <i class="fa-solid fa-arrow-left-long"></i> Volver a clientes
    </a>
    <h1 style="font-weight: 800; font-size: 2rem; margin-bottom: 6px;">Expediente de {{ $customer->name }}</h1>
    <p style="color: var(--text-secondary);">Administra la billetera Sorti y visualiza el historial de transacciones de este cliente.</p>
</div>

<div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:32px;" class="dashboard-grid">
    <!-- Left: Transaction ledger logs -->
    <div class="glass-panel" style="padding:24px;">
        <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Historial de Movimientos de Monedas</h3>
        
        @if(count($transactions) === 0)
            <p style="color:var(--text-muted); text-align:center; padding:20px 0;">Este cliente no registra movimientos aún.</p>
        @else
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                    <thead>
                        <tr style="border-bottom:1px solid var(--glass-border); color:var(--text-secondary);">
                            <th style="padding:10px 4px;">Fecha</th>
                            <th style="padding:10px 4px;">Tipo</th>
                            <th style="padding:10px 4px;">Detalle</th>
                            <th style="padding:10px 4px; text-align:right;">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($transactions as $t)
                            <tr style="border-bottom:1px solid var(--glass-border);">
                                <td style="padding:10px 4px; font-size:0.8rem;">{{ $t->created_at->format('d/m/Y h:i A') }}</td>
                                <td style="padding:10px 4px;">
                                    <span style="background: {{ $t->amount > 0 ? 'rgba(16,185,129,0.15); color:var(--color-success);' : 'rgba(239,68,68,0.15); color:var(--color-danger);' }} padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:600;">
                                        {{ $t->amount > 0 ? 'Abono' : 'Débito' }}
                                    </span>
                                </td>
                                <td style="padding:10px 4px; color:var(--text-secondary); font-size:0.85rem;">{{ $t->description }}</td>
                                <td style="padding:10px 4px; text-align:right; font-weight:700; color: {{ $t->amount > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}">
                                    {{ $t->amount > 0 ? '+' : '' }}{{ $t->amount }}
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </div>

    <!-- Right: Adjust Coins Form -->
    <div style="display:flex; flex-direction:column; gap:24px;">
        <!-- Wallet Pill Info -->
        <div class="glass-panel" style="padding:24px; text-align:center; background:rgba(234,179,8,0.05); border:1px solid rgba(234,179,8,0.2);">
            <span style="font-size:0.8rem; font-weight:700; color:var(--sorti-gold); text-transform:uppercase; letter-spacing:1px;">Saldo Actual</span>
            <div style="font-size:2.8rem; font-weight:800; color:var(--sorti-gold); margin:8px 0; display:flex; align-items:center; justify-content:center; gap:8px;">
                <i class="fa-solid fa-coins"></i> ★ {{ $customer->sorti_coins_balance }}
            </div>
            <span style="font-size:0.9rem; color:var(--text-secondary); font-weight:600;">Equivale a S/ {{ round($customer->sorti_coins_balance / 100, 2) }}</span>
        </div>

        <!-- Wallet Adjuster Form -->
        <div class="glass-panel" style="padding:24px;">
            <h3 style="font-weight:700; margin-bottom:16px; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">Ajustar Saldo Manuralmente</h3>
            
            <form action="/admin/customers/{{ $customer->id }}/coins" method="POST">
                @csrf
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div>
                        <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Acción *</label>
                        <select name="action" class="search-input" style="padding-left:12px; font-size:0.9rem; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--glass-border); outline:none;" required>
                            <option value="add">Abonar / Sumar Monedas</option>
                            <option value="deduct">Deducir / Restar Monedas</option>
                        </select>
                    </div>

                    <div>
                        <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Cantidad de Monedas *</label>
                        <input type="number" name="amount" min="1" class="search-input" style="padding-left:12px; font-size:0.9rem;" placeholder="Ej: 500" required>
                    </div>

                    <div>
                        <label style="font-weight: 600; font-size: 0.85rem; display:block; margin-bottom:6px;">Motivo / Descripción *</label>
                        <input type="text" name="description" class="search-input" style="padding-left:12px; font-size:0.9rem;" placeholder="Ej: Corrección manual de saldo" required>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width:100%;"><i class="fa-solid fa-circle-check"></i> Aplicar Ajuste</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
