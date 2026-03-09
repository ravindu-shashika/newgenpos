<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Http\Requests\RegistrationRequest;
use App\Models\User;
use App\Models\Customer;
use App\Models\Roles;
use App\Models\CustomerGroup;
use App\Models\Biller;
use App\Models\Warehouse;
use Illuminate\Validation\Rule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\QueryException; // Import QueryException
use Exception;




class RegisterController extends Controller
{
    public function getRegistrationFormData()
    {
        $lims_role_list = Roles::where('is_active', true)->get();
        foreach($lims_role_list as $key=>$lims_role__item) {
            if($lims_role__item['id'] == 1 || $lims_role__item['id'] == 2) {
                $lims_role_list[$key]['warehouse_required'] = 0;
                $lims_role_list[$key]['biller_required'] = 0;
                $lims_role_list[$key]['customer_details_required'] = 0;
            }
            elseif($lims_role__item['id'] == 5) {
                $lims_role_list[$key]['warehouse_required'] = 0;
                $lims_role_list[$key]['biller_required'] = 0;
                $lims_role_list[$key]['customer_details_required'] = 1;
            }
            else {
                $lims_role_list[$key]['warehouse_required'] = 1;
                $lims_role_list[$key]['biller_required'] = 1;
                $lims_role_list[$key]['customer_details_required'] = 0;
            }
        }

        $lims_customer_group_list = CustomerGroup::where('is_active', true)->get();
        $lims_biller_list = Biller::where('is_active', true)->get();
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        $numberOfUserAccount = User::where('is_active', true)->count();
        return response()->json([
                'roles' => $lims_role_list,
                'customer_groups' => $lims_customer_group_list,
                'billers' => $lims_biller_list,
                'warehouses' => $lims_warehouse_list,
                'number_of_user_accounts' => $numberOfUserAccount,
        ], 200);
    }
    
    public function register(RegistrationRequest $request)
    {
        try {
            // $validator = Validator::make($request->all(), [
            //     'name' => 'required|string|max:255|unique:users',
            //     'email' => [
            //         'email',
            //         'max:255',
            //             Rule::unique('users')->where(function ($query) {
            //             return $query->where('is_deleted', false);
            //         }),
            //     ],
            //     'password' => 'required|string|confirmed',
            // ]);


            // if ($validator->fails()) {
            //     return response()->json(['errors' => $validator->errors()], 422);
            // }

            // Begin creating a new user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone_number,
                'company_name' => $request->company_name,
                'role_id' => $request->role_id,
                'biller_id' => $request->biller_id,
                'warehouse_id' => $request->warehouse_id,
                'is_active' => true,
                'is_deleted' => false,
                'password' => Hash::make($request->password),
            ]);

            // If the role is customer, create a customer entry
            if ($request->role_id == 5) {
                $data = $request->all();
                $data['name'] = $data['customer_name'];
                $data['user_id'] = $user->id;
                $data['is_active'] = true;
                Customer::create($data);
            }

            // Generate a Sanctum token for the user
            $token = $user->createToken('auth_token')->plainTextToken;
            $data['token'] = $token;
            $data['user'] = new UserResource($user);
            // Return the response with the user and token
            return response()->json([
                'success' => true,
                'message' => 'User registered successfully',
                'token' => $token,
                'data' => $data,
            ], 200);

        } catch (QueryException $e) {
            // Handle database-related errors (QueryException)
            return response()->json([
                'message' => 'Database error: ' . $e->getMessage(),
            ], 500);

        } catch (Exception $e) {
            // Handle any other errors (general Exception)
            return response()->json([
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }
}
