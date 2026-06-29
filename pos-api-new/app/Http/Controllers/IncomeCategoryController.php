<?php

namespace App\Http\Controllers;

use App\Models\IncomeCategory;
use App\Models\Role;
use App\Traits\SpaResponse;
use Auth;
use DB;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Keygen;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;

class IncomeCategoryController extends Controller
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
        foreach (['income-categories', 'income_categories'] as $name) {
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

        $categories = IncomeCategory::where('is_active', true)->orderBy('name')->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $categories->map(fn ($row) => $this->formatRow($row)),
            ]);
        }

        return view('backend.income_category.index', [
            'lims_income_category_all' => $categories,
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
                Rule::unique('income_categories')->where(fn ($query) => $query->where('is_active', 1)),
            ],
            'name' => 'required|max:255',
        ]);

        $data = $validated;
        $data['is_active'] = true;
        IncomeCategory::create($data);

        $message = __('db.Data inserted successfully');
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 201);
        }

        return redirect('income_categories')->with('message', $message);
    }

    public function edit(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $category = IncomeCategory::where('is_active', true)->find($id);
        if (!$category) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Income category not found')], 404);
            }

            return redirect()->back()->with('not_permitted', __('db.Income category not found'));
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

        $categoryId = (int) ($request->input('income_category_id') ?: $id);
        $category = IncomeCategory::where('is_active', true)->find($categoryId);
        if (!$category) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Income category not found')], 404);
            }

            return redirect()->back()->with('not_permitted', __('db.Income category not found'));
        }

        $validated = $request->validate([
            'code' => [
                'required',
                'max:255',
                Rule::unique('income_categories')->ignore($categoryId)->where(fn ($query) => $query->where('is_active', 1)),
            ],
            'name' => 'required|max:255',
        ]);

        $category->update($validated);

        $message = __('db.Data updated successfully');
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message]);
        }

        return redirect('income_categories')->with('message', $message);
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $incomeCategoryId = $request->input('income_categoryIdArray', []);
        foreach ($incomeCategoryId as $id) {
            $category = IncomeCategory::find($id);
            if ($category) {
                $category->is_active = false;
                $category->save();
            }
        }

        $message = 'Income Category deleted successfully!';
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

        $category = IncomeCategory::find($id);
        if (!$category) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Income category not found')], 404);
            }

            return redirect()->back()->with('not_permitted', __('db.Income category not found'));
        }

        $category->is_active = false;
        $category->save();

        $message = __('db.Data deleted successfully');
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message]);
        }

        return redirect('income_categories')->with('not_permitted', $message);
    }

    public function incomeCategoriesAll(Request $request)
    {
        $limsIncomeCategoryList = DB::table('income_categories')->where('is_active', true)->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $limsIncomeCategoryList->map(fn ($row) => [
                    'id' => $row->id,
                    'name' => $row->name,
                    'code' => $row->code,
                    'label' => "{$row->name} ({$row->code})",
                ]),
            ]);
        }

        $html = '';
        foreach ($limsIncomeCategoryList as $incomeCategory) {
            $html .= '<option value="'.$incomeCategory->id.'">'.$incomeCategory->name . ' (' . $incomeCategory->code. ')'.'</option>';
        }

        return response()->json($html);
    }

    private function formatRow(IncomeCategory $category): array
    {
        return [
            'id' => $category->id,
            'code' => $category->code,
            'name' => $category->name,
        ];
    }
}
