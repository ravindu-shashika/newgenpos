<?php

namespace App\Http\Controllers;

use App\Models\GeneralSetting;
use App\Models\Language;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class NavbarController extends Controller
{
    use SpaResponse;

    public function bootstrap(Request $request)
    {
        $user = Auth::user();
        $general = GeneralSetting::latest()->first();
        $days = (int) ($general->expiry_alert_days ?? 0);

        $alertProduct = DB::table('products')
            ->where('is_active', true)
            ->whereColumn('alert_quantity', '>', 'qty')
            ->count();

        $dsoRow = DB::table('dso_alerts')
            ->select('number_of_products')
            ->whereDate('created_at', date('Y-m-d'))
            ->first();
        $dsoAlert = $dsoRow ? (int) $dsoRow->number_of_products : 0;

        $expireAlert = DB::table('product_batches')
            ->join('products', 'products.id', '=', 'product_batches.product_id')
            ->where('products.is_active', true)
            ->where('product_batches.qty', '>', 0)
            ->whereDate('product_batches.expired_date', '<=', now()->addDays($days)->format('Y-m-d'))
            ->count();

      

        $reminders = $user->unreadNotifications
            ->filter(function ($notification) {
                $date = data_get($notification->data, 'reminder_date');

                return $date && $date === date('Y-m-d');
            })
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'message' => data_get($notification->data, 'message'),
                    'document_name' => data_get($notification->data, 'document_name'),
                ];
            })
            ->values();

        $reminderCount = $reminders->count();

        return $this->spaJson($request, [
            'theme' => $_COOKIE['theme'] ?? 'light',
            'site_title' => $general->site_title ?? config('app.name'),
            'expiry_alert_days' => $days,
            'alerts' => [
                'qty' => $alertProduct,
                'dso' => $dsoAlert,
                'expiry' => $expireAlert,
                'reminders' => $reminderCount,
            ],
            'reminder_items' => $reminders,
            'user' => [
                'id' => $user->id,
                'name' => $user->username,
                'username' => $user->username,
                'role_id' => $user->role_id,
            ],
        ]);
    }

    public function switchLanguage(Request $request, $id)
    {
        if (!Schema::hasTable('languages')) {
            return $this->spaJson($request, ['message' => 'Languages are not available.'], 404);
        }

        Language::setDefaultLanguage($id);

        return $this->spaJson($request, [
            'message' => 'Language switched successfully.',
        ]);
    }
}
