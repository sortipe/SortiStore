<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\Setting;

class BankTransferPayment implements PaymentGatewayInterface
{
    public function getPaymentInstructions(): array
    {
        // Sample bank accounts if none is configured
        $defaultAccounts = [
            [
                'bank' => 'BCP',
                'account_number' => '191-xxxxxx-x-xx',
                'cci' => '002-191-xxxxxxxxxx-xx',
                'holder' => 'Sorti S.A.C.'
            ],
            [
                'bank' => 'Interbank',
                'account_number' => '200-xxxxxx-xx',
                'cci' => '003-200-xxxxxxxxxx-xx',
                'holder' => 'Sorti S.A.C.'
            ]
        ];

        return [
            'name' => 'Transferencia Bancaria',
            'accounts' => Setting::get('bank_accounts', $defaultAccounts),
            'instructions' => 'Realiza la transferencia desde la app de tu banco a cualquiera de las cuentas indicadas y adjunta la captura del comprobante.'
        ];
    }

    public function processPayment(Order $order, array $inputData): array
    {
        if (isset($inputData['payment_receipt'])) {
            $order->payment_receipt = $inputData['payment_receipt'];
        }
        
        $order->payment_status = 'pending';
        $order->save();

        return [
            'success' => true,
            'status' => 'pending',
            'message' => 'Comprobante de transferencia bancaria recibido. En proceso de verificación manual.'
        ];
    }
}
