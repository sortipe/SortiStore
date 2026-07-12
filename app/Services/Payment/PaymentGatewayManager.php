<?php

namespace App\Services\Payment;

class PaymentGatewayManager
{
    /**
     * Resolve the payment gateway implementation by name
     */
    public static function make(string $method): PaymentGatewayInterface
    {
        switch (strtolower($method)) {
            case 'yape':
                return new YapePayment();
            case 'bank_transfer':
            case 'transferencia':
                return new BankTransferPayment();
            case 'stripe':
                return new StripePayment();
            default:
                throw new \InvalidArgumentException("Método de pago no soportado: {$method}");
        }
    }
}
