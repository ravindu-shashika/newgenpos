<?php

namespace App\Http\Requests\Purchase;

use App\Http\Requests\PurchaseRequest;

class UpdatePurchaseRequest extends PurchaseRequest
{
    public function rules(): array
    {
        return [
            'warehouse_id' => 'required|exists:warehouses,id',
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
            'warehouse_id.required' => 'Select a warehouse',
            'product_code.required' => 'Please insert a product.',
            'qty.required' => 'At least one quantity is required.',
            'qty.array' => 'The quantities must be in an array format.',
            'qty.*.required' => 'Each quantity must be provided.',
            'qty.*.numeric' => 'Each quantity must be a valid number.',
            'qty.*.min' => 'Each quantity must be at least 1.',
        ];
    }
}
