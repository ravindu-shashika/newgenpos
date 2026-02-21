<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Income;
use App\Models\Account;
use App\Models\Warehouse;
use App\Models\IncomeCategory;
use App\Models\CashRegister;
use App\Traits\StaffAccess;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Helpers\DateHelper;
use Auth;
use DB;

class IncomeController extends Controller
{
    use StaffAccess;

    public function index(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('incomes-index')){
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
            return view('backend.income.index', compact('lims_account_list', 'lims_warehouse_list', 'all_permission', 'starting_date', 'ending_date', 'warehouse_id'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function incomeData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $warehouse_id = $request->input('warehouse_id');
        $q = Income::whereDate('created_at', '>=' ,$request->input('starting_date'))
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
        $order = 'incomes.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        if(empty($request->input('search.value'))) {
            $q = Income::with('warehouse', 'incomeCategory')
                ->whereDate('created_at', '>=' ,$request->input('starting_date'))
                ->whereDate('created_at', '<=' ,$request->input('ending_date'))
                ->offset($start)
                ->limit($limit)
                ->orderBy($order, $dir);
            //check staff access
            $this->staffAccessCheck($q);
            if($warehouse_id)
                $q = $q->where('warehouse_id', $warehouse_id);
            $incomes = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = Income::whereDate('incomes.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))))
                ->offset($start)
                ->limit($limit)
                ->orderBy($order,$dir);
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $incomes =  $q->select('incomes.*')
                                ->with('warehouse', 'incomeCategory')
                                ->where('incomes.user_id', Auth::id())
                                ->orwhere([
                                    ['reference_no', 'LIKE', "%{$search}%"],
                                    ['user_id', Auth::id()]
                                ])
                                ->get();
                $totalFiltered = $q->where('incomes.user_id', Auth::id())->count();
            }
            elseif(Auth::user()->role_id > 2 && config('staff_access') == 'warehouse') {
                $incomes =  $q->select('incomes.*')
                                ->with('warehouse', 'incomeCategory')
                                ->where('incomes.user_id', Auth::id())
                                ->orwhere([
                                    ['reference_no', 'LIKE', "%{$search}%"],
                                    ['warehouse_id', Auth::user()->warehouse_id]
                                ])
                                ->get();
                $totalFiltered = $q->where('incomes.user_id', Auth::id())->count();
            }
            else {
                $incomes =  $q->select('incomes.*')
                                ->with('warehouse', 'incomeCategory')
                                ->orwhere('reference_no', 'LIKE', "%{$search}%")
                                ->get();

                $totalFiltered = $q->orwhere('incomes.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($incomes))
        {
            foreach ($incomes as $key=>$income)
            {
                $nestedData['id'] = $income->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($income->created_at->toDateString()));
                $nestedData['reference_no'] = $income->reference_no;
                $nestedData['warehouse'] = $income->warehouse->name;
                $nestedData['incomeCategory'] = $income->incomeCategory->name;
                $nestedData['amount'] = number_format($income->amount, config('decimal'));
                $nestedData['note'] = $income->note;
                $nestedData['options'] = '<div class="btn-group">
                            <button type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">'.__("db.action").'
                              <span class="caret"></span>
                              <span class="sr-only">Toggle Dropdown</span>
                            </button>
                            <ul class="dropdown-menu edit-options dropdown-menu-right dropdown-default" user="menu">';
                if(in_array("incomes-edit", $request['all_permission'])) {
                    $nestedData['options'] .= '<li>
                        <button type="button" data-id="'.$income->id.'" class="open-Editincome_categoryDialog btn btn-link" data-toggle="modal" data-target="#editModal"><i class="dripicons-document-edit"></i>'.__('db.edit').'</button>
                        </li>';
                }
                if(in_array("incomes-delete", $request['all_permission']))
                    $nestedData['options'] .= \Form::open(["route" => ["incomes.destroy", $income->id], "method" => "DELETE"] ).'
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
        $data = $request->all();
        if (isset($data['created_at'])) {
            $data['created_at'] = normalize_to_sql_datetime($data['created_at']);
        } else {
            $data['created_at'] = date('Y-m-d H:i:s');
        }
        $data['reference_no'] = 'ir-' . date("Ymd") . '-'. date("his");
        $data['user_id'] = Auth::id();
        $cash_register_data = CashRegister::where([
            ['user_id', $data['user_id']],
            ['warehouse_id', $data['warehouse_id']],
            ['status', true]
        ])->first();
        if($cash_register_data)
            $data['cash_register_id'] = $cash_register_data->id;
        Income::create($data);
        return redirect('incomes')->with('message', __('db.Data inserted successfully'));
    }

    public function show(string $id)
    {
        //
    }

    public function edit($id)
    {
        $role = Role::firstOrCreate(['id' => Auth::user()->role_id]);
        if ($role->hasPermissionTo('incomes-edit')) {
            $lims_income_data = Income::find($id);
            $lims_income_data->date = date('d-m-Y', strtotime($lims_income_data->created_at->toDateString()));
            return $lims_income_data;
        }
       else
           return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function update(Request $request, $id)
    {
        $data = $request->all();
        $lims_income_data = Income::find($data['income_id']);
        if (isset($data['created_at'])) {
            $data['created_at'] = normalize_to_sql_datetime($data['created_at']);
        } else {
            $data['created_at'] = date('Y-m-d H:i:s');
        }
        $lims_income_data->update($data);
        return redirect('incomes')->with('message', __('db.Data updated successfully'));
    }

    public function deleteBySelection(Request $request)
    {
        $income_id = $request['incomeIdArray'];
        foreach ($income_id as $id) {
            $lims_income_data = Income::find($id);
            $lims_income_data->delete();
        }
        return 'income deleted successfully!';
    }

    public function destroy(string $id)
    {
        $lims_income_data = Income::find($id);
        $lims_income_data->delete();
        return redirect('incomes')->with('not_permitted', __('db.Data deleted successfully'));
    }

    /**
     * API: Form data for React (income categories, warehouses, accounts).
     */
    public function formDataApi()
    {
        $income_categories = IncomeCategory::where('is_active', true)->get(['id', 'name', 'code']);
        if (Auth::user()->role_id > 2) {
            $warehouses = Warehouse::where('is_active', true)->where('id', Auth::user()->warehouse_id)->get(['id', 'name']);
        } else {
            $warehouses = Warehouse::where('is_active', true)->get(['id', 'name']);
        }
        $accounts = Account::where('is_active', true)->get(['id', 'name', 'account_no', 'is_default']);
        return response()->json([
            'status' => 200,
            'data' => [
                'income_categories' => $income_categories,
                'warehouses' => $warehouses,
                'accounts' => $accounts,
            ],
        ]);
    }

    /**
     * API: Income list for React (filter by date range and warehouse).
     */
    public function listApi(Request $request)
    {
        $starting_date = $request->input('starting_date', date('Y-m-01', strtotime('-1 year', strtotime(date('Y-m-d')))));
        $ending_date = $request->input('ending_date', date('Y-m-d'));
        $warehouse_id = (int) $request->input('warehouse_id', 0);

        $q = Income::with('warehouse', 'incomeCategory')
            ->whereDate('created_at', '>=', $starting_date)
            ->whereDate('created_at', '<=', $ending_date);
        $this->staffAccessCheck($q);
        if ($warehouse_id > 0) {
            $q->where('warehouse_id', $warehouse_id);
        }
        $incomes = $q->orderBy('created_at', 'desc')->get();

        $data = [];
        $total_amount = 0;
        foreach ($incomes as $income) {
            $total_amount += $income->amount;
            $data[] = [
                'id' => $income->id,
                'date' => $income->created_at->format('Y-m-d'),
                'reference_no' => $income->reference_no,
                'warehouse' => $income->warehouse ? $income->warehouse->name : '',
                'warehouse_id' => $income->warehouse_id,
                'income_category' => $income->incomeCategory ? $income->incomeCategory->name : '',
                'income_category_id' => $income->income_category_id,
                'amount' => (float) $income->amount,
                'note' => $income->note ?? '',
            ];
        }
        return response()->json([
            'status' => 200,
            'data' => $data,
            'total_amount' => round($total_amount, (int) (config('decimal') ?? 2)),
        ]);
    }

    /**
     * API: Get one income for edit (React).
     */
    public function getApi($id)
    {
        $income = Income::with('warehouse', 'incomeCategory')->find($id);
        if (!$income) {
            return response()->json(['status' => 404, 'message' => 'Income not found'], 404);
        }
        $data = [
            'id' => $income->id,
            'reference_no' => $income->reference_no,
            'date' => $income->created_at->format('d-m-Y'),
            'created_at' => $income->created_at->format('Y-m-d'),
            'warehouse_id' => $income->warehouse_id,
            'income_category_id' => $income->income_category_id,
            'account_id' => $income->account_id,
            'amount' => (float) $income->amount,
            'note' => $income->note ?? '',
        ];
        return response()->json(['status' => 200, 'data' => $data]);
    }

    /**
     * API: Store income (React).
     */
    public function storeApi(Request $request)
    {
        $request->validate([
            'income_category_id' => 'required|exists:income_categories,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'amount' => 'required|numeric|min:0',
        ]);
        $data = $request->only(['income_category_id', 'warehouse_id', 'account_id', 'amount', 'note']);
        if ($request->has('created_at') && $request->created_at) {
            $data['created_at'] = normalize_to_sql_datetime($request->created_at);
        } else {
            $data['created_at'] = date('Y-m-d H:i:s');
        }
        $data['reference_no'] = 'ir-' . date('Ymd') . '-' . date('his');
        $data['user_id'] = Auth::id();
        $cash_register_data = CashRegister::where([
            ['user_id', $data['user_id']],
            ['warehouse_id', $data['warehouse_id']],
            ['status', true],
        ])->first();
        if ($cash_register_data) {
            $data['cash_register_id'] = $cash_register_data->id;
        }
        Income::create($data);
        return response()->json(['status' => 200, 'message' => __('db.Data inserted successfully')]);
    }

    /**
     * API: Update income (React).
     */
    public function updateApi(Request $request, $id)
    {
        $income = Income::find($id);
        if (!$income) {
            return response()->json(['status' => 404, 'message' => 'Income not found'], 404);
        }
        $request->validate([
            'income_category_id' => 'required|exists:income_categories,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'amount' => 'required|numeric|min:0',
        ]);
        $data = $request->only(['income_category_id', 'warehouse_id', 'account_id', 'amount', 'note']);
        if ($request->has('created_at') && $request->created_at) {
            $data['created_at'] = normalize_to_sql_datetime($request->created_at);
        }
        $income->update($data);
        return response()->json(['status' => 200, 'message' => __('db.Data updated successfully')]);
    }

    /**
     * API: Delete income (React).
     */
    public function destroyApi($id)
    {
        $income = Income::find($id);
        if (!$income) {
            return response()->json(['status' => 404, 'message' => 'Income not found'], 404);
        }
        $income->delete();
        return response()->json(['status' => 200, 'message' => __('db.Data deleted successfully')]);
    }
}
