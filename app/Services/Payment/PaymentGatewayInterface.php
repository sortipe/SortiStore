<?php

namespace App\Services\Payment;

use App\Models\Order;

interface PaymentGatewayInterface
{
    /**
     * Get details for displaying payment instructions to the customer
     */
    public function getPaymentInstructions(): array;

    /**
     * Process the payment request (returns status and details)
     */
    public function processPayment(Order $order, array $inputData): array;
}
