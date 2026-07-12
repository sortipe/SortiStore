<?php

namespace App\Services\Payment;

use App\Models\Order;

class StripePayment implements PaymentGatewayInterface
{
    public function getPaymentInstructions(): array
    {
        return [
            'name' => 'Stripe (Tarjeta de Crédito)',
            'instructions' => 'Paga de forma segura usando tu tarjeta de crédito o débito a través de la pasarela Stripe.'
        ];
    }

    public function processPayment(Order $order, array $inputData): array
    {
        // This is a placeholder stub for future integration.
        // In a real Stripe implementation, you would consume the Stripe SDK,
        // create a PaymentIntent, and capture the token from frontend.
        
        $order->payment_status = 'confirmed';
        $order->status = 'paid';
        $order->save();

        return [
            'success' => true,
            'status' => 'confirmed',
            'transaction_id' => 'ch_' . uniqid(),
            'message' => 'Pago por tarjeta de crédito procesado exitosamente vía Stripe.'
        ];
    }
}
