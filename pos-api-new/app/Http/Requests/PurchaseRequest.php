<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation()
    {
        if (!$this->has('products') || !is_array($this->products)) {
            return;
        }

        $products = $this->products;
        $defaultUnit = \App\Models\Unit::orderBy('id')->first();
        $defaultUnitName = $defaultUnit ? $defaultUnit->unit_name : 'pc';

        $product_id = [];
        $product_code = [];
        $qty = [];
        $recieved = [];
        $batch_no = [];
        $expired_date = [];
        $purchase_unit = [];
        $purchase_unit_id = [];
        $unit_cost = [];
        $net_unit_cost = [];
        $net_unit_margin = [];
        $net_unit_margin_type = [];
        $net_unit_price = [];
        $discount = [];
        $discount_type = [];
        $tax_rate = [];
        $tax = [];
        $subtotal = [];
        $imei_number = [];

        foreach ($products as $product) {
            $product_id[] = $product['product_id'] ?? $product['id'] ?? null;
            $product_code[] = $product['code'] ?? '';
            $qty[] = $product['qty'] ?? 1;
            $recieved[] = $product['recieved'] ?? $product['qty'] ?? 1;
            $batch_no[] = $product['batch_no'] ?? '';
            $expired_date[] = $product['expired_date'] ?? '';

            if (isset($product['purchase_unit'])) {
                $purchase_unit[] = $product['purchase_unit'];
            } elseif (isset($product['purchase_unit_id'])) {
                $unit = \App\Models\Unit::find($product['purchase_unit_id']);
                $purchase_unit[] = $unit ? $unit->unit_name : $defaultUnitName;
            } else {
                $purchase_unit[] = $defaultUnitName;
            }

            $purchase_unit_id[] = $product['purchase_unit_id'] ?? null;
            $unit_cost[] = $product['unit_cost'] ?? $product['net_unit_cost'] ?? $product['cost'] ?? 0;
            $net_unit_cost[] = $product['net_unit_cost'] ?? $product['cost'] ?? 0;
            $net_unit_margin[] = $product['net_unit_margin'] ?? $product['margin'] ?? 0;
            $net_unit_margin_type[] = $product['net_unit_margin_type'] ?? 'percentage';
            $net_unit_price[] = $product['net_unit_price'] ?? $product['price'] ?? 0;
            $discount[] = $product['discount'] ?? 0;
            $discount_type[] = in_array($product['discount_type'] ?? 'flat', ['flat', 'percentage'], true)
                ? $product['discount_type']
                : 'flat';
            $tax_rate[] = $product['tax_rate'] ?? 0;
            $tax[] = $product['tax'] ?? 0;
            $subtotal[] = $product['subtotal'] ?? (($product['qty'] ?? 1) * ($product['net_unit_cost'] ?? $product['cost'] ?? 0));
            $imei_number[] = $product['imei_number'] ?? '';
        }

        $this->merge([
            'product_id' => $product_id,
            'product_code' => $product_code,
            'qty' => $qty,
            'recieved' => $recieved,
            'batch_no' => $batch_no,
            'expired_date' => $expired_date,
            'purchase_unit' => $purchase_unit,
            'purchase_unit_id' => $purchase_unit_id,
            'unit_cost' => $unit_cost,
            'net_unit_cost' => $net_unit_cost,
            'net_unit_margin' => $net_unit_margin,
            'net_unit_margin_type' => $net_unit_margin_type,
            'net_unit_price' => $net_unit_price,
            'discount' => $discount,
            'discount_type' => $discount_type,
            'tax_rate' => $tax_rate,
            'tax' => $tax,
            'subtotal' => $subtotal,
            'imei_number' => $imei_number,
        ]);
    }

    public function rules(): array
    {
        return [
            'warehouse_id' => 'required|exists:warehouses,id',
            'currency_id' => 'required',
            'exchange_rate' => 'required|numeric',
            'product_code' => 'required|array',
            'product_code.*' => 'required|string',
            'qty' => 'required|array',
            'qty.*' => 'required|numeric|min:0.01',
            'discount_type' => 'nullable|array',
            'discount_type.*' => 'nullable|in:flat,percentage',
            'document' => 'nullable|file|mimes:jpg,jpeg,png,gif,pdf,csv,docx,xlsx,txt',
        ];
    }

    public function messages(): array
    {
        return [
            'warehouse_id.required' => 'select a warehouse',
            'currency_id.required' => 'currency field is required.',
            'exchange_rate.required' => 'The exchange rate is required.',
            'exchange_rate.numeric' => 'The exchange rate must be a valid number.',
            'product_code.required' => 'Please insert a product.',
            'qty.required' => 'At least one quantity is required.',
            'qty.array' => 'The quantities must be in an array format.',
            'qty.*.required' => 'Each quantity must be provided.',
            'qty.*.numeric' => 'Each quantity must be a valid number.',
            'qty.*.min' => 'Each quantity must be at least 1.',
        ];
    }
}
