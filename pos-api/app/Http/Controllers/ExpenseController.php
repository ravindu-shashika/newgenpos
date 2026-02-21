<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Expense;
use App\Models\Account;
use App\Models\Warehouse;
use App\Models\ExpenseCategory;
use App\Models\Employee;
use App\Models\CashRegister;
use App\Traits\StaffAccess;
use App\Traits\TenantInfo;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Validator;
use App\Helpers\DateHelper;
use DateTime;
use Auth;
use DB;

class ExpenseController extends Controller
{
    use StaffAccess;
    use TenantInfo;

    public function index(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('expenses-index')){
            $permissions = Role::findByName($role->name)->permissions;
            foreach ($permissions as $permission)
                $all_permission[] = $permission->name;
            if(empty($all_permission))
                $all_permission[] = 'dummy text';

            if($request->starting_date) {
                $starting_date = $request->starting_date;
                $ending_date = $request->ending_date;
            }
            else {
                $starting_date = date('Y-m-01', strtotime('-1 year', strtotime(date('Y-m-d'))));
                $ending_date = date("Y-m-d");
            }

            if($request->input('warehouse_id'))
                $warehouse_id = $request->input('warehouse_id');
            else
                $warehouse_id = 0;

            $lims_warehouse_list = Warehouse::select('name', 'id')->where('is_active', true)->get();
            $lims_account_list = Account::where('is_active', true)->get();
            return view('backend.expense.index', compact('lims_account_list', 'lims_warehouse_list', 'all_permission', 'starting_date', 'ending_date', 'warehouse_id'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function expenseData(Request $request)
    {
        // dd($request->all());
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $warehouse_id = auth()->user()->warehouse_id ??$request->input('warehouse_id');
        $q = Expense::whereDate('created_at', '>=' ,$request->input('starting_date'))
                     ->whereDate('created_at', '<=' ,$request->input('ending_date'));
        //check staff access
        $this->staffAccessCheck($q);
        if($warehouse_id)
            $q = $q->where('warehouse_id', $warehouse_id);

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'expenses.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        if(empty($request->input('search.value'))) {
            $q = Expense::with('warehouse', 'expenseCategory')
                ->whereDate('created_at', '>=' ,$request->input('starting_date'))
                ->whereDate('created_at', '<=' ,$request->input('ending_date'))
                ->offset($start)
                ->limit($limit)
                ->orderBy($order, $dir);
            //check staff access
            $this->staffAccessCheck($q);
            if($warehouse_id)
                $q = $q->where('warehouse_id', $warehouse_id);
            $expenses = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = Expense::with(['warehouse', 'expenseCategory'])
                ->whereDate('expenses.created_at', '=', date('Y-m-d', strtotime(str_replace('/', '-', $search))))
                ->orWhereHas('expenseCategory', function($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%");
                })
                ->offset($start)
                ->limit($limit)
                ->orderBy($order, $dir);
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $expenses =  $q->select('expenses.*')
                                ->where('expenses.user_id', Auth::id())
                                ->orwhere([
                                    ['reference_no', 'LIKE', "%{$search}%"],
                                    ['user_id', Auth::id()]
                                ])
                                ->get();
                $totalFiltered = $q->where('expenses.user_id', Auth::id())->count();
            }
            elseif(Auth::user()->role_id > 2 && config('staff_access') == 'warehouse') {
                $expenses =  $q->select('expenses.*')
                                ->where('expenses.user_id', Auth::id())
                                ->orwhere([
                                    ['reference_no', 'LIKE', "%{$search}%"],
                                    ['warehouse_id', Auth::user()->warehouse_id]
                                ])
                                ->get();
                $totalFiltered = $q->where('expenses.user_id', Auth::id())->count();
            }
            else {
                $expenses =  $q->select('expenses.*')
                                ->with('warehouse', 'expenseCategory')
                                ->orwhere('reference_no', 'LIKE', "%{$search}%")
                                ->get();

                $totalFiltered = $q->orwhere('expenses.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($expenses))
        {
            foreach ($expenses as $key=>$expense)
            {
                $nestedData['id'] = $expense->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($expense->created_at->toDateString()));
                $nestedData['reference_no'] = $expense->reference_no;
                $nestedData['warehouse'] = $expense->warehouse->name;
                $nestedData['expenseCategory'] = $expense->expense_category_id ==0 ? 'Employee Expense' :  $expense->expenseCategory->name;
                $nestedData['amount'] = number_format($expense->amount, config('decimal'));
                $nestedData['note'] = $expense->note;
                $nestedData['options'] = '<div class="btn-group">
                            <button type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">'.__("db.action").'
                              <span class="caret"></span>
                              <span class="sr-only">Toggle Dropdown</span>
                            </button>
                            <ul class="dropdown-menu edit-options dropdown-menu-right dropdown-default" user="menu">';
                if (in_array("expenses-edit", $request['all_permission'])) {
                    if($expense->document){
                        $nestedData['options'] .= '<li>
                            <a href="'.url('documents/expense/'.$expense->document).'" target="_blank" class="btn btn-link">
                                <i class="dripicons-document"></i> '.__('db.View Document').'
                            </a>
                        </li>';
                    }

                    $nestedData['options'] .= '<li>
                        <button type="button" data-id="'.$expense->id.'" class="open-Editexpense_categoryDialog btn btn-link" data-toggle="modal" data-target="#editModal">
                            <i class="dripicons-document-edit"></i>'.__('db.edit').'
                        </button>
                    </li>';
                }


                if(in_array("expenses-delete", $request['all_permission']))
                    $nestedData['options'] .= \Form::open(["route" => ["expenses.destroy", $expense->id], "method" => "DELETE"] ).'
                            <li>
                              <button type="submit" class="btn btn-link" onclick="return confirmDelete()"><i class="dripicons-trash"></i> '.__("db.delete").'</button>
                            </li>'.\Form::close().'
                        </ul>
                    </div>';


                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        $data = $request->except('document');
        $data = $request->all();
        $document = $request->document;
        if ($document) {
            $v = Validator::make(
                [
                    'extension' => strtolower($request->document->getClientOriginalExtension()),
                ],
                [
                    'extension' => 'in:jpg,jpeg,png,gif,pdf,csv,docx,xlsx,txt',
                ]
            );
            if ($v->fails())
                return redirect()->back()->withErrors($v->errors());

            if (!file_exists(public_path("documents/expense")) && !is_dir(public_path("documents/expense"))) {
                mkdir(public_path("documents/expense"), 0755, true);
            }

            $ext = pathinfo($document->getClientOriginalName(), PATHINFO_EXTENSION);
            $documentName = date("Ymdhis");
            if(!config('database.connections.saleprosaas_landlord')) {
                $documentName = $documentName . '.' . $ext;
                $document->move(public_path('documents/expense'), $documentName);
            }
            else {
                $documentName = $this->getTenantId() . '_' . $documentName . '.' . $ext;
                $document->move(public_path('documents/expense'), $documentName);
            }
            $data['document'] = $documentName;
        }
        if (isset($data['created_at'])) {
            $data['created_at'] = normalize_to_sql_datetime($data['created_at']);
        } else {
            $data['created_at'] = date('Y-m-d H:i:s');
        }
        $data['reference_no'] = 'er-' . date("Ymd") . '-'. date("his");
        $data['user_id'] = Auth::id();
        $data['employee_id'] = $request->employee_id ?? null;
        $data['type'] = $request->type ?? null;

        // record pos page expense in cash register
        if(isset($data['cash_register'])){
            $data['cash_register_id'] = $data['cash_register'];
        }

        Expense::create($data);
        return redirect('expenses')->with('message', __('db.Data inserted successfully'));
    }

    public function show($id)
    {
        //
    }

    public function edit($id)
    {
        $role = Role::firstOrCreate(['id' => Auth::user()->role_id]);
        if ($role->hasPermissionTo('expenses-edit')) {
            $lims_expense_data = Expense::find($id);
            $lims_expense_data->date = date('d-m-Y', strtotime($lims_expense_data->created_at->toDateString()));
            return $lims_expense_data;
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function update(Request $request, $id)
    {
        $data = $request->except('document');
        $data = $request->all();
        $lims_expense_data = Expense::find($data['expense_id']);
        $document = $request->document;
        if ($document) {
            $v = Validator::make(
                [
                    'extension' => strtolower($request->document->getClientOriginalExtension()),
                ],
                [
                    'extension' => 'in:jpg,jpeg,png,gif,pdf,csv,docx,xlsx,txt',
                ]
            );
            if ($v->fails())
                return redirect()->back()->withErrors($v->errors());

            if (!file_exists(public_path("documents/expense")) && !is_dir(public_path("documents/expense"))) {
                mkdir(public_path("documents/expense"), 0755, true);
            }

            if (!file_exists(public_path("documents/expense/$lims_expense_data->document"))) {

                $this->fileDelete(public_path('documents/expense/'), $lims_expense_data->document);
            }

            $ext = pathinfo($document->getClientOriginalName(), PATHINFO_EXTENSION);
            $documentName = date("Ymdhis");
            if(!config('database.connections.saleprosaas_landlord')) {
                $documentName = $documentName . '.' . $ext;
                $document->move(public_path('documents/expense'), $documentName);
            }
            else {
                $documentName = $this->getTenantId() . '_' . $documentName . '.' . $ext;
                $document->move(public_path('documents/expense'), $documentName);
            }
            $data['document'] = $documentName;
        }
        if (isset($data['created_at'])) {
            $data['created_at'] = normalize_to_sql_datetime($data['created_at']);
        } else {
            $data['created_at'] = date('Y-m-d H:i:s');
        }
        $lims_expense_data->update($data);
        return redirect('expenses')->with('message', __('db.Data updated successfully'));
    }

    public function deleteBySelection(Request $request)
    {
        $expense_id = $request['expenseIdArray'];
        foreach ($expense_id as $id) {
            $lims_expense_data = Expense::find($id);
            $lims_expense_data->delete();
        }
        return 'Expense deleted successfully!';
    }

    public function destroy($id)
    {
        $lims_expense_data = Expense::find($id);
        $lims_expense_data->delete();
        return redirect('expenses')->with('not_permitted', __('db.Data deleted successfully'));
    }

    /**
     * API: Form data for React (expense categories, warehouses, accounts, employees).
     */
    public function formDataApi()
    {
        $expense_categories = ExpenseCategory::where('is_active', true)->get(['id', 'name', 'code']);
        if (Auth::user()->role_id > 2) {
            $warehouses = Warehouse::where('is_active', true)->where('id', Auth::user()->warehouse_id)->get(['id', 'name']);
        } else {
            $warehouses = Warehouse::where('is_active', true)->get(['id', 'name']);
        }
        $accounts = Account::where('is_active', true)->get(['id', 'name', 'account_no', 'is_default']);
        $employees = Employee::where('is_active', 1)->get(['id', 'name']);
        return response()->json([
            'status' => 200,
            'data' => [
                'expense_categories' => $expense_categories,
                'warehouses' => $warehouses,
                'accounts' => $accounts,
                'employees' => $employees,
            ],
        ]);
    }

    /**
     * API: Expense list for React (filter by date range and warehouse).
     */
    public function listApi(Request $request)
    {
        $starting_date = $request->input('starting_date', date('Y-m-01', strtotime('-1 year', strtotime(date('Y-m-d')))));
        $ending_date = $request->input('ending_date', date('Y-m-d'));
        $warehouse_id = (int) $request->input('warehouse_id', 0);

        $q = Expense::with('warehouse', 'expenseCategory')
            ->whereDate('created_at', '>=', $starting_date)
            ->whereDate('created_at', '<=', $ending_date);
        $this->staffAccessCheck($q);
        if ($warehouse_id > 0) {
            $q->where('warehouse_id', $warehouse_id);
        }
        $expenses = $q->orderBy('created_at', 'desc')->get();

        $data = [];
        $total_amount = 0;
        foreach ($expenses as $expense) {
            $total_amount += $expense->amount;
            $categoryName = $expense->expense_category_id == 0 ? 'Employee Expense' : ($expense->expenseCategory ? $expense->expenseCategory->name : '');
            $data[] = [
                'id' => $expense->id,
                'date' => $expense->created_at->format('Y-m-d'),
                'reference_no' => $expense->reference_no,
                'warehouse' => $expense->warehouse ? $expense->warehouse->name : '',
                'warehouse_id' => $expense->warehouse_id,
                'expense_category' => $categoryName,
                'expense_category_id' => $expense->expense_category_id,
                'amount' => (float) $expense->amount,
                'note' => $expense->note ?? '',
            ];
        }
        return response()->json([
            'status' => 200,
            'data' => $data,
            'total_amount' => round($total_amount, (int) (config('decimal') ?? 2)),
        ]);
    }

    /**
     * API: Get one expense for edit (React).
     */
    public function getApi($id)
    {
        $expense = Expense::with('warehouse', 'expenseCategory')->find($id);
        if (!$expense) {
            return response()->json(['status' => 404, 'message' => 'Expense not found'], 404);
        }
        $data = [
            'id' => $expense->id,
            'reference_no' => $expense->reference_no,
            'date' => $expense->created_at->format('d-m-Y'),
            'created_at' => $expense->created_at->format('Y-m-d'),
            'warehouse_id' => $expense->warehouse_id,
            'expense_category_id' => $expense->expense_category_id,
            'account_id' => $expense->account_id,
            'amount' => (float) $expense->amount,
            'note' => $expense->note ?? '',
            'employee_id' => $expense->employee_id,
            'type' => $expense->type ?? 'expense',
        ];
        return response()->json(['status' => 200, 'data' => $data]);
    }

    /**
     * API: Store expense (React). Document upload not supported in JSON API.
     */
    public function storeApi(Request $request)
    {
        $request->validate([
            'expense_category_id' => 'required|integer|min:0',
            'warehouse_id' => 'required|exists:warehouses,id',
            'amount' => 'required|numeric|min:0',
        ]);
        if ($request->expense_category_id > 0) {
            $request->validate(['expense_category_id' => 'exists:expense_categories,id']);
        }
        $data = $request->only(['expense_category_id', 'warehouse_id', 'account_id', 'amount', 'note']);
        if ($request->expense_category_id == 0) {
            $data['employee_id'] = $request->employee_id ? (int) $request->employee_id : null;
            $data['type'] = in_array($request->type, ['expense', 'advance']) ? $request->type : 'expense';
        }
        if ($request->has('created_at') && $request->created_at) {
            $data['created_at'] = normalize_to_sql_datetime($request->created_at);
        } else {
            $data['created_at'] = date('Y-m-d H:i:s');
        }
        $data['reference_no'] = 'er-' . date('Ymd') . '-' . date('his');
        $data['user_id'] = Auth::id();
        Expense::create($data);
        return response()->json(['status' => 200, 'message' => __('db.Data inserted successfully')]);
    }

    /**
     * API: Update expense (React).
     */
    public function updateApi(Request $request, $id)
    {
        $expense = Expense::find($id);
        if (!$expense) {
            return response()->json(['status' => 404, 'message' => 'Expense not found'], 404);
        }
        $request->validate([
            'expense_category_id' => 'required|integer|min:0',
            'warehouse_id' => 'required|exists:warehouses,id',
            'amount' => 'required|numeric|min:0',
        ]);
        if ($request->expense_category_id > 0) {
            $request->validate(['expense_category_id' => 'exists:expense_categories,id']);
        }
        $data = $request->only(['expense_category_id', 'warehouse_id', 'account_id', 'amount', 'note']);
        if ($request->expense_category_id == 0) {
            $data['employee_id'] = $request->employee_id ? (int) $request->employee_id : null;
            $data['type'] = in_array($request->type, ['expense', 'advance']) ? $request->type : 'expense';
        } else {
            $data['employee_id'] = null;
            $data['type'] = null;
        }
        if ($request->has('created_at') && $request->created_at) {
            $data['created_at'] = normalize_to_sql_datetime($request->created_at);
        }
        $expense->update($data);
        return response()->json(['status' => 200, 'message' => __('db.Data updated successfully')]);
    }

    /**
     * API: Delete expense (React).
     */
    public function destroyApi($id)
    {
        $expense = Expense::find($id);
        if (!$expense) {
            return response()->json(['status' => 404, 'message' => 'Expense not found'], 404);
        }
        $expense->delete();
        return response()->json(['status' => 200, 'message' => __('db.Data deleted successfully')]);
    }
}
