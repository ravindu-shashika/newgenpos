<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\MoneyTransfer;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class MoneyTransferDashboardController extends Controller
{
    use SpaResponse;

    protected function userCanAccess(): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }
        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }
        $role = Role::find($user->role_id);
        foreach (['money-transfer', 'money-transfers'] as $name) {
            try {
                if ($role && $role->hasPermissionTo($name)) {
                    return true;
                }
            } catch (PermissionDoesNotExist $e) {
            }
            if ($user->can($name)) {
                return true;
            }
        }

        return false;
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $decimals = (int) (config('decimal') ?? 2);
            $dateFormat = config('date_format') ?: 'd-m-Y';

            $transfers = MoneyTransfer::query()
                ->with(['fromAccount:id,name,account_no', 'toAccount:id,name,account_no'])
                ->orderByDesc('created_at')
                ->get();

            return $this->spaJson($request, [
                'data' => $transfers->map(fn ($row) => $this->formatRow($row, $decimals, $dateFormat)),
                'accounts' => $this->accountOptions(),
                'decimal' => $decimals,
                'default_created_at' => date($dateFormat),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load money transfers'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        $transfer = MoneyTransfer::find($id);
        if (!$transfer) {
            return $this->spaJson($request, ['message' => __('db.Money transfer not found')], 404);
        }

        $transfer->delete();

        return $this->spaJson($request, ['message' => __('db.Data deleted successfully')]);
    }

    private function formatRow(MoneyTransfer $transfer, int $decimals, string $dateFormat): array
    {
        $createdAt = $transfer->created_at;

        return [
            'id' => $transfer->id,
            'date' => $createdAt
                ? date($dateFormat, strtotime($createdAt->toDateString()))
                : '—',
            'datetime' => $createdAt
                ? date($dateFormat, strtotime($createdAt->toDateString())).' '.$createdAt->toTimeString()
                : '—',
            'reference_no' => $transfer->reference_no,
            'from_account' => $transfer->fromAccount
                ? "{$transfer->fromAccount->name} [{$transfer->fromAccount->account_no}]"
                : '—',
            'to_account' => $transfer->toAccount
                ? "{$transfer->toAccount->name} [{$transfer->toAccount->account_no}]"
                : '—',
            'from_account_id' => $transfer->from_account_id,
            'to_account_id' => $transfer->to_account_id,
            'amount' => number_format((float) $transfer->amount, $decimals, '.', ''),
            'amount_raw' => (float) $transfer->amount,
        ];
    }

    private function accountOptions(): array
    {
        return Account::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'account_no'])
            ->map(fn ($a) => [
                'id' => $a->id,
                'name' => $a->name,
                'label' => "{$a->name} [{$a->account_no}]",
            ])
            ->values()
            ->all();
    }
}
