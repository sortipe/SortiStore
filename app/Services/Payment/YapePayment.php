<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\Setting;

class YapePayment implements PaymentGatewayInterface
{
    public function getPaymentInstructions(): array
    {
        return [
            'name' => 'Yape',
            'phone' => Setting::get('yape_phone', '999 999 999'),
            'qr_image' => Setting::get('yape_qr', 'images/yape-default-qr.png'),
            'holder' => Setting::get('yape_holder', 'Sorti S.A.C.'),
            'instructions' => 'Escanea el código QR o realiza la transferencia al número telefónico indicado, y adjunta la captura de tu comprobante.'
        ];
    }

    public function processPayment(Order $order, array $inputData): array
    {
        // For manual verification: save the receipt upload path
        if (isset($inputData['payment_receipt'])) {
            $order->payment_receipt = $inputData['payment_receipt'];
        }
        
        $order->payment_status = 'pending';
        $order->save();

        return [
            'success' => true,
            'status' => 'pending',
            'message' => 'Comprobante de Yape recibido. El pago está en proceso de verificación manual.'
        ];
    }
}
