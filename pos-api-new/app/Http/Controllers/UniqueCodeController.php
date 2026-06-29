<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UniqueCodeController extends Controller
{
    /** @var array<string, array{column: string, active: string}> */
    private const TABLES = [
        'products' => ['column' => 'code', 'active' => 'is_active'],
        'expense_categories' => ['column' => 'code', 'active' => 'is_active'],
        'income_categories' => ['column' => 'code', 'active' => 'is_active'],
        'coupons' => ['column' => 'code', 'active' => 'is_active'],
        'gift_cards' => ['column' => 'card_no', 'active' => 'is_active'],
    ];

    public function check(Request $request)
    {
        $validated = $request->validate([
            'table' => ['required', 'string', Rule::in(array_keys(self::TABLES))],
            'value' => 'required|string|max:255',
            'except_id' => 'nullable|integer|min:1',
        ]);

        $config = self::TABLES[$validated['table']];
        $column = $config['column'];
        $value = trim($validated['value']);

        $query = DB::table($validated['table'])
            ->where($column, $value)
            ->where($config['active'], 1);

        if (!empty($validated['except_id'])) {
            $query->where('id', '!=', $validated['except_id']);
        }

        return response()->json([
            'exists' => $query->exists(),
            'table' => $validated['table'],
            'column' => $column,
            'value' => $value,
        ]);
    }
}
