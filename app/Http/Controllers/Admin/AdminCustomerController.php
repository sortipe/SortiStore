<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\SortiTransaction;
use App\Services\SortiCoinsService;
use Illuminate\Http\Request;

class AdminCustomerController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'admin']);
    }

    /**
     * List all customers
     */
    public function index()
    {
        $customers = User::where('role', 'customer')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return view('admin.customers.index', compact('customers'));
    }

    /**
     * Customer details and transaction history
     */
    public function show($id)
    {
        $customer = User::findOrFail($id);
        $transactions = SortiTransaction::where('user_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return view('admin.customers.show', compact('customer', 'transactions'));
    }

    /**
     * Adjust customer Sorti Coins balance manually
     */
    public function adjustCoins(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|integer',
            'action' => 'required|string|in:add,deduct',
            'description' => 'required|string|max:255'
        ]);

        $amount = (int)$request->amount;
        $action = $request->action;
        $description = $request->description;

        $coinsService = new SortiCoinsService();

        try {
            if ($action === 'add') {
                $coinsService->addCoins($id, $amount, 'manual_admin', $description);
                $msg = "Se abonaron {$amount} monedas Sorti al cliente.";
            } else {
                $coinsService->deductCoins($id, $amount, 'manual_admin', $description);
                $msg = "Se descontaron {$amount} monedas Sorti al cliente.";
            }
            return redirect()->back()->with('success', $msg);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
