<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductPurchase;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\ReturnPurchase;
use App\Models\Tax;
use App\Models\Unit;
use App\Models\Warehouse;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class ReturnPurchaseDashboardController extends Controller
{
    use SpaResponse;

    protected function userCanAccess(string $permission = 'returns-index'): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }
        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }
        $role = Role::find($user->role_id);
        foreach ([$permission, 'returns-index', 'purchase-return-index', 'purchase-returns-view'] as $name) {
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

    protected function userCan(string $permission): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }
        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }
        $role = Role::find($user->role_id);
        $aliases = [
            'purchase-return-add' => ['purchase-returns-create', 'returns-add'],
            'purchase-return-delete' => ['purchase-returns-delete', 'returns-delete'],
            'purchase-return-edit' => ['purchase-returns-edit', 'returns-edit'],
        ];
        foreach (array_merge([$permission], $aliases[$permission] ?? []) as $name) {
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

    protected function applyStaffAccessFilter($query): void
    {
        $user = Auth::user();
        if (!$user || !$user->role_id || $user->role_id <= 2) {
            return;
        }
        if (config('staff_access') === 'own') {
            $query->where('return_purchases.user_id', $user->id);
        } elseif (config('staff_access') === 'warehouse' && $user->warehouse_id) {
            $query->where('return_purchases.warehouse_id', $user->warehouse_id);
        }
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }
        try {
            $startingDate = $request->input('starting_date') ?: date('Y-m-d', strtotime('-1 year'));
            $endingDate = $request->input('ending_date') ?: date('Y-m-d');
            $warehouseId = (int) $request->input('warehouse_id', 0);
            $search = trim((string) $request->input('search', ''));
            $q = ReturnPurchase::query()->with(['supplier:id,name', 'warehouse:id,name', 'purchase:id,reference_no']);
            $q->whereDate('return_purchases.created_at', '>=', $startingDate)
                ->whereDate('return_purchases.created_at', '<=', $endingDate);
            $this->applyStaffAccessFilter($q);
            if ($warehouseId) {
                $q->where('return_purchases.warehouse_id', $warehouseId);
            }
            if ($search !== '') {
                $q->where(function ($query) use ($search) {
                    $query->where('return_purchases.reference_no', 'LIKE', "%{$search}%")
                        ->orWhereHas('supplier', fn ($s) => $s->where('name', 'LIKE', "%{$search}%"))
                        ->orWhereHas('purchase', fn ($p) => $p->where('reference_no', 'LIKE', "%{$search}%")->whereNull('deleted_at'));
                });
            }
            $returns = $q->orderBy('return_purchases.created_at', 'desc')->get();
            $warehouseQuery = Warehouse::query();
            if (Schema::hasColumn('warehouses', 'is_active')) {
                $warehouseQuery->where('is_active', true);
            }
            $user = Auth::user();
            return $this->spaJson($request, [
                'data' => $returns->map(fn ($r) => $this->formatRow($r)),
                'warehouses' => $warehouseQuery->get(['id', 'name'])->map(fn ($w) => ['id' => $w->id, 'name' => $w->name]),
                'filters' => ['starting_date' => $startingDate, 'ending_date' => $endingDate, 'warehouse_id' => $warehouseId],
                'show_warehouse_filter' => $user && $user->role_id && $user->role_id <= 2,
            ]);
        } catch (\Throwable $e) {
            report($e);
            return $this->spaJson($request, ['message' => __('db.Failed to load purchase returns'), 'error' => config('app.debug') ? $e->getMessage() : null], 500);
        }
    }

    public function create(Request $request)
    {
        if (!$this->userCan('purchase-return-add')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }
        $referenceNo = trim((string) $request->input('reference_no', ''));
        if ($referenceNo === '') {
            return $this->spaJson($request, ['message' => __('db.Purchase Reference') . ' is required.'], 422);
        }
        $purchase = Purchase::query()->where('reference_no', $referenceNo)->whereNull('deleted_at')->first();
        if (!$purchase) {
            return $this->spaJson($request, ['message' => __('db.This reference no does not exist!')], 404);
        }
        try {
            $decimal = (int) (config('decimal') ?? 2);
            $paymentAcc = Payment::select('account_id')->where('purchase_id', $purchase->id)->first();
            $lines = [];
            foreach (ProductPurchase::where('purchase_id', $purchase->id)->get() as $pp) {
                $line = $this->formatPurchaseLine($pp, $decimal);
                if ($line) {
                    $lines[] = $line;
                }
            }
            if (empty($lines)) {
                return $this->spaJson($request, ['message' => __('db.No products found for this purchase.')], 422);
            }
            return $this->spaJson($request, [
                'purchase' => ['id' => $purchase->id, 'reference_no' => $purchase->reference_no, 'warehouse_id' => $purchase->warehouse_id, 'supplier_id' => $purchase->supplier_id],
                'lines' => $lines,
                'accounts' => Account::where('is_active', true)->get(['id', 'name', 'is_default']),
                'taxes' => Tax::where('is_active', true)->get(['id', 'name', 'rate']),
                'default_account_id' => $paymentAcc?->account_id,
                'decimal' => $decimal,
            ]);
        } catch (\Throwable $e) {
            report($e);
            return $this->spaJson($request, ['message' => __('db.Failed to load purchase return form'), 'error' => config('app.debug') ? $e->getMessage() : null], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCan('purchase-return-delete') && !$this->userCan('returns-delete')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }
        if (!ReturnPurchase::find($id)) {
            return response()->json(['message' => __('db.Return not found')], 404);
        }
        try {
            app(ReturnPurchaseController::class)->destroy($id);

            return $this->spaJson($request, ['message' => __('db.Data deleted successfully')]);
        } catch (\Throwable $e) {
            report($e);
            return $this->spaJson($request, ['message' => __('db.Failed to delete return'), 'error' => config('app.debug') ? $e->getMessage() : null], 500);
        }
    }

    public function show(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $return = ReturnPurchase::with(['supplier', 'warehouse', 'user', 'purchase'])->find($id);
        if (!$return) {
            return response()->json(['message' => __('db.Return not found')], 404);
        }

        $rawLines = app(ReturnPurchaseController::class)->productReturnData($id);
        $products = [];
        if (is_array($rawLines) && isset($rawLines[0])) {
            $count = count($rawLines[0]);
            for ($i = 0; $i < $count; $i++) {
                $qty = (float) ($rawLines[1][$i] ?? 0);
                $subtotal = (float) ($rawLines[6][$i] ?? 0);
                $products[] = [
                    'name' => strip_tags((string) ($rawLines[0][$i] ?? '')),
                    'batch_no' => $rawLines[7][$i] ?? 'N/A',
                    'qty' => $qty,
                    'unit' => $rawLines[2][$i] ?? '',
                    'unit_price' => $qty > 0 ? round($subtotal / $qty, (int) (config('decimal') ?? 2)) : 0,
                    'tax' => (float) ($rawLines[3][$i] ?? 0),
                    'tax_rate' => (float) ($rawLines[4][$i] ?? 0),
                    'discount' => (float) ($rawLines[5][$i] ?? 0),
                    'subtotal' => $subtotal,
                ];
            }
        }

        $supplier = $return->supplier;
        $warehouse = $return->warehouse;

        return $this->spaJson($request, [
            'return' => [
                'id' => $return->id,
                'reference_no' => $return->reference_no,
                'purchase_reference' => $return->purchase->reference_no ?? 'N/A',
                'date' => $return->created_at
                    ? date(config('date_format') ?: 'd-m-Y', strtotime($return->created_at->toDateString()))
                    : '',
                'total_tax' => (float) $return->total_tax,
                'total_discount' => (float) $return->total_discount,
                'total_cost' => (float) $return->total_cost,
                'order_tax' => (float) $return->order_tax,
                'order_tax_rate' => (float) $return->order_tax_rate,
                'grand_total' => (float) $return->grand_total,
                'return_note' => $return->return_note,
                'staff_note' => $return->staff_note,
                'document' => $return->document,
                'exchange_rate' => $return->exchange_rate,
            ],
            'warehouse' => $warehouse ? [
                'name' => $warehouse->name,
                'phone' => $warehouse->phone ?? '',
                'address' => $warehouse->address ?? '',
            ] : null,
            'supplier' => $supplier ? [
                'name' => $supplier->name,
                'company_name' => $supplier->company_name ?? '',
                'email' => $supplier->email ?? '',
                'phone_number' => $supplier->phone_number ?? '',
                'address' => $supplier->address ?? '',
                'city' => $supplier->city ?? '',
            ] : null,
            'user' => $return->user ? ['name' => $return->user->name, 'email' => $return->user->email] : null,
            'products' => $products,
        ]);
    }

    private function formatRow(ReturnPurchase $return): array
    {
        $rate = $return->exchange_rate ?: 1;
        $decimals = (int) (config('decimal') ?? 2);
        $purchaseReference = 'N/A';
        if ($return->purchase_id) {
            $purchase = $return->purchase ?: Purchase::whereNull('deleted_at')->select('reference_no')->find($return->purchase_id);
            $purchaseReference = $purchase->reference_no ?? 'N/A';
        }
        return [
            'id' => $return->id,
            'date' => $return->created_at ? date(config('date_format') ?: 'd-m-Y', strtotime($return->created_at->toDateString())) : '—',
            'reference_no' => $return->reference_no,
            'purchase_reference' => $purchaseReference,
            'warehouse_name' => $return->warehouse->name ?? '—',
            'supplier_name' => $return->supplier->name ?? 'N/A',
            'grand_total' => round((float) $return->grand_total / (float) $rate, $decimals),
        ];
    }

    private function formatPurchaseLine(ProductPurchase $pp, int $decimal): ?array
    {
        $product = Product::find($pp->product_id);
        if (!$product) {
            return null;
        }

        $variantId = null;
        $code = $product->code;
        if ($pp->variant_id) {
            $variant = ProductVariant::select('id', 'item_code')->FindExactProduct($product->id, $pp->variant_id)->first();
            if ($variant) {
                $variantId = $variant->id;
                $code = $variant->item_code;
            }
        }

        // Old Blade create: actual_qty and default qty use full purchase line qty (not remaining).
        $purchaseQty = (float) $pp->qty;
        if ($purchaseQty <= 0) {
            return null;
        }

        if ((int) $product->tax_method === 1) {
            $productCost = (float) $pp->net_unit_cost + ((float) $pp->discount / max($purchaseQty, 1));
        } else {
            $productCost = ((float) $pp->total / max($purchaseQty, 1)) + ((float) $pp->discount / max($purchaseQty, 1));
        }

        $tax = Tax::where('rate', $pp->tax_rate)->first();
        $unitName = 'n/a';
        if ($product->type === 'standard') {
            $unitRow = Unit::select('unit_name')->find($product->unit_id);
            $unitName = $unitRow->unit_name ?? 'n/a';
        }

        $batchNo = 'N/A';
        if ($pp->product_batch_id) {
            $batchNo = ProductBatch::select('batch_no')->find($pp->product_batch_id)->batch_no ?? 'N/A';
        }

        $unitCost = (float) $pp->total / max($purchaseQty, 1);
        $unitTax = (float) $pp->tax / max($purchaseQty, 1);

        return [
            'product_purchase_id' => $pp->id,
            'product_id' => $product->id,
            'product_variant_id' => $variantId,
            'product_batch_id' => $pp->product_batch_id,
            'name' => $product->name,
            'code' => $code,
            'batch_no' => $batchNo,
            'actual_qty' => round($purchaseQty, $decimal),
            'qty' => round($purchaseQty, $decimal),
            'net_unit_cost' => round((float) $pp->net_unit_cost, $decimal),
            'line_discount' => round((float) $pp->discount, $decimal),
            'line_tax' => round((float) $pp->tax, $decimal),
            'line_subtotal' => round((float) $pp->total, $decimal),
            'discount' => round((float) $pp->discount, $decimal),
            'tax' => round((float) $pp->tax, $decimal),
            'subtotal' => round((float) $pp->total, $decimal),
            'tax_rate' => (float) $pp->tax_rate,
            'tax_name' => $tax->name ?? 'No Tax',
            'tax_method' => (int) $product->tax_method,
            'unit_cost' => round($unitCost, $decimal),
            'unit_tax' => round($unitTax, $decimal),
            'product_cost' => round($productCost, $decimal),
            'purchase_unit' => $unitName,
            'is_imei' => (bool) $product->is_imei,
            'imei_number' => $pp->imei_number ?? '',
            'return_qty' => round((float) ($pp->return_qty ?? 0), $decimal),
        ];
    }
}
