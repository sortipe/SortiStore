<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'admin']);
    }

    public function index()
    {
        $settings = [
            'yape_phone' => Setting::get('yape_phone', '999 999 999'),
            'yape_holder' => Setting::get('yape_holder', 'Sorti S.C.A.'),
            'yape_qr' => Setting::get('yape_qr', 'images/yape-default-qr.png'),
            'sorti_rate_equivalence' => Setting::get('sorti_rate_equivalence', 100),
            'sorti_rate_earning' => Setting::get('sorti_rate_earning', 1.0),
            'bank_accounts' => Setting::get('bank_accounts', [])
        ];

        return view('admin.settings.index', compact('settings'));
    }

    public function store(Request $request)
    {
        // Equivalence & earning rates
        Setting::set('yape_phone', $request->yape_phone);
        Setting::set('yape_holder', $request->yape_holder);
        Setting::set('sorti_rate_equivalence', $request->sorti_rate_equivalence);
        Setting::set('sorti_rate_earning', $request->sorti_rate_earning);

        // Handle Yape QR image upload
        if ($request->hasFile('yape_qr_file')) {
            $path = $request->file('yape_qr_file')->store('settings', 'public');
            Setting::set('yape_qr', $path);
        }

        // Handle Bank Accounts
        if ($request->has('bank_name')) {
            $accounts = [];
            foreach ($request->bank_name as $index => $bank) {
                if (!empty($bank)) {
                    $accounts[] = [
                        'bank' => $bank,
                        'account_number' => $request->account_number[$index] ?? '',
                        'cci' => $request->cci[$index] ?? '',
                        'holder' => $request->holder[$index] ?? ''
                    ];
                }
            }
            Setting::set('bank_accounts', $accounts);
        }

        return redirect()->route('admin.settings.index')->with('success', 'Configuración general guardada con éxito.');
    }
}
