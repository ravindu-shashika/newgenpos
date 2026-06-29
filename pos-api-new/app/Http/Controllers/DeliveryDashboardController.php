<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use App\Models\PackingSlip;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class DeliveryDashboardController extends Controller
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

        try {
            if ($role && $role->hasPermissionTo('delivery')) {
                return true;
            }
        } catch (PermissionDoesNotExist $e) {
            // fall through
        }

        return $user->can('delivery');
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $search = trim((string) $request->input('search', ''));

            $query = Delivery::with([
                'sale:id,reference_no,customer_id,grand_total',
                'sale.customer:id,name,phone_number',
                'courier:id,name',
            ])
                ->leftJoin('sales', 'deliveries.sale_id', '=', 'sales.id')
                ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
                ->select('deliveries.*')
                ->whereNull('sales.deleted_at');

            if (Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $query->where('deliveries.user_id', Auth::id());
            }

            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('deliveries.reference_no', 'LIKE', "%{$search}%")
                        ->orWhere('sales.reference_no', 'LIKE', "%{$search}%")
                        ->orWhere('customers.name', 'LIKE', "%{$search}%")
                        ->orWhere('customers.phone_number', 'LIKE', "%{$search}%")
                        ->orWhere('deliveries.packing_slip_ids', 'LIKE', "%{$search}%");
                });
            }

            $deliveries = $query->orderBy('deliveries.id', 'desc')->get();

            $saleIds = $deliveries->pluck('sale_id')->filter()->unique();
            $productNamesBySale = collect();
            if ($saleIds->isNotEmpty()) {
                $productNamesBySale = DB::table('product_sales')
                    ->join('products', 'products.id', '=', 'product_sales.product_id')
                    ->whereIn('product_sales.sale_id', $saleIds)
                    ->select('product_sales.sale_id', 'products.name')
                    ->get()
                    ->groupBy('sale_id');
            }

            return $this->spaJson($request, [
                'data' => $deliveries->map(fn ($d) => $this->formatRow($d, $productNamesBySale)),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load deliveries'),
                'error' => config('app.debug') ? $e->message : null,
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $delivery = Delivery::find($id);
        if (!$delivery) {
            return response()->json(['message' => __('db.Delivery not found')], 404);
        }

        if ($delivery->file) {
            $this->fileDelete(public_path('documents/delivery/'), $delivery->file);
        }

        $delivery->delete();

        return $this->spaJson($request, ['message' => __('db.Delivery deleted successfully')]);
    }

    private function formatRow(Delivery $delivery, $productNamesBySale): array
    {
        $productNames = ($productNamesBySale[$delivery->sale_id] ?? collect())
            ->pluck('name')
            ->implode(', ');

        $packingRefs = '—';
        if ($delivery->packing_slip_ids) {
            $ids = array_filter(array_map('trim', explode(',', $delivery->packing_slip_ids)));
            $refs = PackingSlip::whereIn('id', $ids)->pluck('reference_no')->toArray();
            $packingRefs = $refs ? implode(', ', $refs) : '—';
        }

        $customer = $delivery->sale?->customer;
        $decimals = (int) (config('decimal') ?? 2);

        return [
            'id' => $delivery->id,
            'date' => $delivery->created_at
                ? $delivery->created_at->format('d-m-Y')
                : '—',
            'reference_no' => $delivery->reference_no,
            'sale_reference' => $delivery->sale->reference_no ?? '—',
            'packing_slip_references' => $packingRefs,
            'customer_name' => $customer->name ?? '—',
            'customer_phone' => $customer->phone_number ?? '',
            'courier_name' => $delivery->courier->name ?? '—',
            'tracking_code' => $delivery->tracking_code ?: '—',
            'address' => $delivery->address ?: '—',
            'products' => $productNames ?: '—',
            'grand_total' => round((float) ($delivery->sale->grand_total ?? 0), $decimals),
            'status' => (int) $delivery->status,
            'status_label' => $this->statusLabel($delivery),
        ];
    }

    private function statusLabel(Delivery $delivery): string
    {
        if ($delivery->tracking_code) {
            if ((int) $delivery->status === 3) {
                return __('db.Delivered');
            }

            return __('db.Delivering');
        }

        return __('db.Packing');
    }
}
