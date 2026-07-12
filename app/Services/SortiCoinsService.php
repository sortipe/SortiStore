<?php

namespace App\Services;

use App\Models\User;
use App\Models\SortiTransaction;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

class SortiCoinsService
{
    /**
     * Get equivalence: how many coins = 1 SOL (PE)
     */
    public function getEquivalenceRate()
    {
        // Default: 100 coins = S/ 1.00
        return (int)Setting::get('sorti_rate_equivalence', 100);
    }

    /**
     * Get earning rate: how many coins earned per 1 SOL spent
     */
    public function getEarningRate()
    {
        // Default: 1 coin per S/ 1.00 spent
        return (float)Setting::get('sorti_rate_earning', 1.0);
    }

    /**
     * Convert coins to cash amount
     */
    public function coinsToCash(int $coins): float
    {
        $rate = $this->getEquivalenceRate();
        return $rate > 0 ? round($coins / $rate, 2) : 0.00;
    }

    /**
     * Convert cash to coins amount
     */
    public function cashToCoins(float $cash): int
    {
        $rate = $this->getEquivalenceRate();
        return (int)round($cash * $rate);
    }

    /**
     * Calculate how many coins a user will earn based on amount spent
     */
    public function calculateCoinsEarned(float $amountSpent): int
    {
        $rate = $this->getEarningRate();
        return (int)floor($amountSpent * $rate);
    }

    /**
     * Add coins to user wallet
     */
    public function addCoins(int $userId, int $amount, string $type, ?string $description = null): SortiTransaction
    {
        return DB::transaction(function () use ($userId, $amount, $type, $description) {
            $user = User::findOrFail($userId);
            $user->sorti_coins_balance += $amount;
            $user->save();

            return SortiTransaction::create([
                'user_id' => $userId,
                'amount' => $amount,
                'type' => $type,
                'description' => $description,
            ]);
        });
    }

    /**
     * Deduct coins from user wallet
     */
    public function deductCoins(int $userId, int $amount, string $type, ?string $description = null): SortiTransaction
    {
        return DB::transaction(function () use ($userId, $amount, $type, $description) {
            $user = User::findOrFail($userId);
            if ($user->sorti_coins_balance < $amount) {
                throw new \Exception("Saldo de monedas Sorti insuficiente.");
            }
            $user->sorti_coins_balance -= $amount;
            $user->save();

            return SortiTransaction::create([
                'user_id' => $userId,
                'amount' => -$amount,
                'type' => $type,
                'description' => $description,
            ]);
        });
    }
}
