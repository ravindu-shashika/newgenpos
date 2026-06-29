<?php

namespace App\Http\Controllers;

use App\Models\Challan;
use App\Models\Courier;
use App\Models\PackingSlip;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class ChallanDashboardController extends Controller
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
        $names = ['packing_slip_challan', 'challans.view', 'challans-index'];

        foreach ($names as $permission) {
            try {
                if ($role && $role->hasPermissionTo($permission)) {
                    return true;
                }
            } catch (PermissionDoesNotExist $e) {
                // continue
            }
            if ($user->can($permission)) {
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
            $courierId = $request->input('courier_id', '0');
            $status = $request->input('status', '0');
            $search = trim((string) $request->input('search', ''));

            $q = Challan::query()->with(['courier', 'createdBy', 'closedBy']);

            if ($courierId && $courierId !== '0' && $courierId !== 'All Courier') {
                $q->where('courier_id', (int) $courierId);
            }

            if ($status && $status !== '0' && $status !== 'All') {
                $q->where('status', $status);
            }

            if ($search !== '') {
                $q->where(function ($query) use ($search) {
                    $ref = $search;
                    if (preg_match('/^dc[-\s]?/i', $search)) {
                        $ref = preg_replace('/^dc[-\s]?/i', '', $search);
                    }
                    $query->where('reference_no', 'LIKE', "%{$ref}%")
                        ->orWhere('status', 'LIKE', "%{$search}%")
                        ->orWhereHas('courier', function ($c) use ($search) {
                            $c->where('name', 'LIKE', "%{$search}%")
                                ->orWhere('phone_number', 'LIKE', "%{$search}%");
                        });
                });
            }

            $challans = $q->orderBy('created_at', 'desc')->get();

            $couriers = Courier::where('is_active', true)->get(['id', 'name', 'phone_number']);

            return $this->spaJson($request, [
                'data' => $challans->map(fn ($c) => $this->formatRow($c)),
                'couriers' => $couriers->map(fn ($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'phone_number' => $c->phone_number,
                    'label' => $c->name . ' [' . $c->phone_number . ']',
                ]),
                'filters' => [
                    'courier_id' => $courierId,
                    'status' => $status,
                ],
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load challans'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    private function formatRow(Challan $challan): array
    {
        $amountList = $challan->amount_list
            ? array_map('floatval', explode(',', $challan->amount_list))
            : [];
        $totalAmount = array_sum($amountList);

        $saleRefs = [];
        if ($challan->packing_slip_list) {
            foreach (explode(',', $challan->packing_slip_list) as $packingSlipId) {
                $packingSlipId = trim($packingSlipId);
                if ($packingSlipId === '') {
                    continue;
                }
                $packingSlip = PackingSlip::with('sale')->find($packingSlipId);
                if ($packingSlip?->sale?->reference_no) {
                    $saleRefs[] = $packingSlip->sale->reference_no;
                }
            }
        }

        $decimals = (int) (config('decimal') ?? 2);

        return [
            'id' => $challan->id,
            'date' => $challan->created_at
                ? $challan->created_at->format('d-m-Y h:i A')
                : '—',
            'reference_no' => 'DC-' . $challan->reference_no,
            'sale_reference' => $saleRefs ? implode(', ', $saleRefs) : '—',
            'courier_name' => $challan->courier
                ? $challan->courier->name . ' [' . $challan->courier->phone_number . ']'
                : '—',
            'status' => $challan->status,
            'closing_date' => $challan->closing_date
                ? date(config('date_format') ?: 'd-m-Y', strtotime($challan->closing_date))
                : '—',
            'total_amount' => round($totalAmount, $decimals),
            'created_by' => $challan->createdBy->name ?? '—',
            'closed_by' => $challan->closedBy->name ?? '—',
        ];
    }
}
