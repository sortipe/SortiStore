@extends('layouts.store')

@section('title', 'Mis Monedas Sorti - Sorti')

@section('content')
<div class="section-wrapper">
    <div class="dashboard-grid">
        @include('dashboard.sidebar')

        <div class="glass-panel" style="padding: 32px;">
            <h1 style="font-weight: 800; font-size: 1.8rem; margin-bottom: 24px;"><i class="fa-solid fa-wallet"></i> Billetera de Monedas Sorti</h1>

            <!-- Wallet Card Summary -->
            <div class="glass-panel" style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%); padding: 32px; border-radius: 16px; border: 1px solid rgba(234, 179, 8, 0.2); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 24px; margin-bottom: 32px;">
                <div>
                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--sorti-gold); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Saldo Disponible</span>
                    <div style="font-size: 3rem; font-weight: 800; color: var(--sorti-gold); display: flex; align-items: center; gap: 12px; line-height: 1;">
                        <i class="fa-solid fa-coins"></i> ★ {{ $user->sorti_coins_balance }}
                    </div>
                </div>
                <div style="background: var(--bg-secondary); padding: 16px 24px; border-radius: 12px; border: 1px solid var(--glass-border); text-align: right;">
                    <span style="font-size: 0.85rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Equivalencia en Efectivo</span>
                    <strong style="font-size: 1.25rem;">S/ {{ round($user->sorti_coins_balance / 100, 2) }}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 4px;">Tasa: 100 monedas = S/ 1.00</span>
                </div>
            </div>

            <!-- Ledger transaction logs -->
            <h3 style="font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;">Historial de Movimientos</h3>
            
            @if(count($transactions) === 0)
                <p style="color:var(--text-muted); text-align:center; padding:20px 0;">No se registran movimientos en tu billetera.</p>
            @else
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.95rem;">
                        <thead>
                            <tr style="border-bottom:1px solid var(--glass-border); color:var(--text-secondary);">
                                <th style="padding:12px 8px;">Fecha</th>
                                <th style="padding:12px 8px;">Transacción</th>
                                <th style="padding:12px 8px;">Descripción</th>
                                <th style="padding:12px 8px; text-align:right;">Cantidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($transactions as $t)
                                <tr style="border-bottom:1px solid var(--glass-border);">
                                    <td style="padding:12px 8px;">{{ $t->created_at->format('d/m/Y h:i A') }}</td>
                                    <td style="padding:12px 8px;">
                                        <span style="background: {{ $t->amount > 0 ? 'rgba(16,185,129,0.15); color:var(--color-success);' : 'rgba(239,68,68,0.15); color:var(--color-danger);' }} padding:4px 8px; border-radius:4px; font-size:0.8rem; font-weight:600;">
                                            {{ $t->amount > 0 ? 'Abono' : 'Débito' }}
                                        </span>
                                    </td>
                                    <td style="padding:12px 8px; color:var(--text-secondary);">{{ $t->description }}</td>
                                    <td style="padding:12px 8px; text-align:right; font-weight:700; color: {{ $t->amount > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}">
                                        {{ $t->amount > 0 ? '+' : '' }}{{ $t->amount }}
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
