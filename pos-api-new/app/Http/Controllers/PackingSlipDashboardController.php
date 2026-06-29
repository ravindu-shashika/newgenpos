<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use App\Models\PackingSlip;
use App\Models\PackingSlipProduct;
use App\Models\Product;
use App\Models\Product_Sale;
use App\Models\ProductVariant;
use App\Models\Product_Warehouse;
use App\Models\Sale;
use App\Models\Variant;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class PackingSlipDashboardController extends Controller
{
    use SpaResponse;

    public function userCanAccess(): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);
        $names = [
            'packing_slip_challan',
            'packing-slip-challan',
            'packing_slip',
            'packing-slips.view',
            'packing-slips-index',
        ];

        foreach ($names as $permission) {
            try {
                if ($role && $role->hasPermissionTo($permission)) {
                    return true;
                }
            } catch (PermissionDoesNotExist $e) {
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
            $search = trim((string) $request->input('search', ''));

            $q = PackingSlip::query()->with([
                'sale:id,reference_no',
                'delivery:id,reference_no',
            ]);

            if ($search !== '') {
                $term = $search;
                if (preg_match('/^p/i', $term)) {
                    $term = substr($term, 1);
                } elseif (preg_match('/^n/i', $term)) {
                    $term = strtoupper($term);
                }

                $q->where(function ($query) use ($term) {
                    $query->where('packing_slips.reference_no', 'LIKE', "%{$term}%")
                        ->orWhereHas('sale', function ($saleQuery) use ($term) {
                            $saleQuery->whereNull('deleted_at')
                                ->where('reference_no', 'LIKE', "%{$term}%");
                        });
                });
            }

            $slips = $q->orderByRaw('CAST(packing_slips.reference_no AS SIGNED) DESC')->get();
            $itemLists = $this->buildItemLists($slips->pluck('id')->all());

            return $this->spaJson($request, [
                'data' => $slips->map(fn ($slip) => $this->formatRow($slip, $itemLists[$slip->id] ?? '')),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load packing slips'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $packingSlip = PackingSlip::with('sale')->find($id);
        if (!$packingSlip || !$packingSlip->sale) {
            return response()->json(['message' => __('db.Packing slip not found')], 404);
        }

        DB::beginTransaction();
        try {
            $packingSlipProducts = PackingSlipProduct::where('packing_slip_id', $id)->get();

            foreach ($packingSlipProducts as $packingSlipProduct) {
                $productData = Product::find($packingSlipProduct->product_id);
                $productSaleData = Product_Sale::where([
                    ['sale_id', $packingSlip->sale_id],
                    ['product_id', $packingSlipProduct->product_id],
                    ['variant_id', $packingSlipProduct->variant_id],
                ])->first();

                if (!$productData || !$productSaleData) {
                    continue;
                }

                $productWarehouseData = Product_Warehouse::where([
                    ['product_id', $packingSlipProduct->product_id],
                    ['warehouse_id', $packingSlip->sale->warehouse_id],
                    ['variant_id', $packingSlipProduct->variant_id],
                ])->first();

                if ($packingSlipProduct->variant_id) {
                    $productVariantData = ProductVariant::where([
                        ['product_id', $packingSlipProduct->product_id],
                        ['variant_id', $packingSlipProduct->variant_id],
                    ])->first();
                    if ($productVariantData) {
                        $productVariantData->qty += $productSaleData->qty;
                        $productVariantData->save();
                    }
                }

                if ($productWarehouseData) {
                    $productWarehouseData->qty += $productSaleData->qty;
                    $productWarehouseData->save();
                }

                $productData->qty += $productSaleData->qty;
                $productData->save();

                $productSaleData->is_packing = 0;
                $productSaleData->save();

                $packingSlipProduct->delete();
            }

            $packingSlip->sale->sale_status = 2;
            $packingSlip->sale->save();

            $delivery = Delivery::where('sale_id', $packingSlip->sale_id)->first();
            if ($delivery) {
                $delivery->delete();
            }

            $packingSlip->delete();
            DB::commit();

            return $this->spaJson($request, ['message' => __('db.Packing Slip deletes successfully')]);
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to delete packing slip'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * @param  array<int>  $slipIds
     * @return array<int, string>
     */
    private function buildItemLists(array $slipIds): array
    {
        if ($slipIds === []) {
            return [];
        }

        $rows = PackingSlipProduct::query()
            ->whereIn('packing_slip_id', $slipIds)
            ->with('product:id,name')
            ->orderBy('id')
            ->get();

        $variantIds = $rows->pluck('variant_id')->filter()->unique()->values()->all();
        $variants = $variantIds
            ? Variant::whereIn('id', $variantIds)->pluck('name', 'id')
            : collect();

        $lists = [];
        foreach ($rows as $row) {
            $name = $row->product->name ?? '—';
            if ($row->variant_id && isset($variants[$row->variant_id])) {
                $name .= ' [' . $variants[$row->variant_id] . ']';
            }
            $lists[$row->packing_slip_id] = isset($lists[$row->packing_slip_id])
                ? $lists[$row->packing_slip_id] . ', ' . $name
                : $name;
        }

        return $lists;
    }

    private function formatRow(PackingSlip $slip, string $itemList): array
    {
        $decimals = (int) (config('decimal') ?? 2);

        return [
            'id' => $slip->id,
            'reference' => 'P' . $slip->reference_no,
            'reference_no' => $slip->reference_no,
            'sale_id' => $slip->sale_id,
            'sale_reference' => $slip->sale->reference_no ?? '—',
            'delivery_reference' => $slip->delivery->reference_no ?? '—',
            'item_list' => $itemList,
            'amount' => round((float) $slip->amount, $decimals),
            'status' => $slip->status,
            'can_select_for_challan' => $slip->status === 'Pending',
        ];
    }
}
