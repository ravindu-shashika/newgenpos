<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use App\Models\Role;
use App\Traits\SpaResponse;
use Auth;
use DB;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Keygen;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;

class ExpenseCategoryController extends Controller
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
        foreach (['expense-categories', 'expense_categories'] as $name) {
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

    protected function denyAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $categories = ExpenseCategory::where('is_active', true)->orderBy('name')->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $categories->map(fn ($row) => $this->formatRow($row)),
            ]);
        }

        return view('backend.expense_category.index', [
            'lims_expense_category_all' => $categories,
        ]);
    }

    public function generateCode(Request $request)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $code = Keygen::numeric(8)->generate();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['code' => (string) $code]);
        }

        return $code;
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $validated = $request->validate([
            'code' => [
                'required',
                'max:255',
                Rule::unique('expense_categories')->where(fn ($query) => $query->where('is_active', 1)),
            ],
            'name' => 'required|max:255',
        ]);

        $data = $validated;
        $data['is_active'] = true;
        ExpenseCategory::create($data);

        $message = __('db.Data inserted successfully');
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 201);
        }

        return redirect('expense_categories')->with('message', $message);
    }

    public function edit(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $category = ExpenseCategory::where('is_active', true)->find($id);
        if (!$category) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Expense category not found')], 404);
            }

            return redirect()->back()->with('not_permitted', __('db.Expense category not found'));
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['data' => $this->formatRow($category)]);
        }

        return $category;
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $categoryId = (int) ($request->input('expense_category_id') ?: $id);
        $category = ExpenseCategory::where('is_active', true)->find($categoryId);
        if (!$category) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Expense category not found')], 404);
            }

            return redirect()->back()->with('not_permitted', __('db.Expense category not found'));
        }

        $validated = $request->validate([
            'code' => [
                'required',
                'max:255',
                Rule::unique('expense_categories')->ignore($categoryId)->where(fn ($query) => $query->where('is_active', 1)),
            ],
            'name' => 'required|max:255',
        ]);

        $category->update($validated);

        $message = __('db.Data updated successfully');
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message]);
        }

        return redirect('expense_categories')->with('message', $message);
    }

    public function import(Request $request)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $upload = $request->file('file');
        if (!$upload) {
            $message = __('db.Please upload a CSV file');
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => $message], 422);
            }

            return redirect()->back()->with('not_permitted', $message);
        }

        $ext = pathinfo($upload->getClientOriginalName(), PATHINFO_EXTENSION);
        if ($ext != 'csv') {
            $message = __('db.Please upload a CSV file');
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => $message], 422);
            }

            return redirect()->back()->with('not_permitted', $message);
        }

        $filePath = $upload->getRealPath();
        $file = fopen($filePath, 'r');
        $header = fgetcsv($file);
        $escapedHeader = [];
        foreach ($header as $value) {
            $lheader = strtolower($value);
            $escapedItem = preg_replace('/[^a-z]/', '', $lheader);
            array_push($escapedHeader, $escapedItem);
        }

        while ($columns = fgetcsv($file)) {
            if ($columns[0] == '') {
                continue;
            }
            $data = array_combine($escapedHeader, $columns);
            $expenseCategory = ExpenseCategory::firstOrNew(['code' => $data['code'], 'is_active' => true]);
            $expenseCategory->code = $data['code'];
            $expenseCategory->name = $data['name'];
            $expenseCategory->is_active = true;
            $expenseCategory->save();
        }

        $message = __('db.Expense Category imported successfully');
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message]);
        }

        return redirect('expense_categories')->with('message', $message);
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $expenseCategoryId = $request->input('expense_categoryIdArray', []);
        foreach ($expenseCategoryId as $id) {
            $category = ExpenseCategory::find($id);
            if ($category) {
                $category->is_active = false;
                $category->save();
            }
        }

        $message = 'Expense Category deleted successfully!';
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message]);
        }

        return $message;
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $category = ExpenseCategory::find($id);
        if (!$category) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Expense category not found')], 404);
            }

            return redirect()->back()->with('not_permitted', __('db.Expense category not found'));
        }

        $category->is_active = false;
        $category->save();

        $message = __('db.Data deleted successfully');
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message]);
        }

        return redirect('expense_categories')->with('not_permitted', $message);
    }

    public function expenseCategoriesAll(Request $request)
    {
        $limsExpenseCategoryList = DB::table('expense_categories')->where('is_active', true)->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $limsExpenseCategoryList->map(fn ($row) => [
                    'id' => $row->id,
                    'name' => $row->name,
                    'code' => $row->code,
                    'label' => "{$row->name} ({$row->code})",
                ]),
            ]);
        }

        $html = '';
        foreach ($limsExpenseCategoryList as $expenseCategory) {
            $html .= '<option value="'.$expenseCategory->id.'">'.$expenseCategory->name . ' (' . $expenseCategory->code. ')'.'</option>';
        }

        return response()->json($html);
    }

    private function formatRow(ExpenseCategory $category): array
    {
        return [
            'id' => $category->id,
            'code' => $category->code,
            'name' => $category->name,
        ];
    }
}
