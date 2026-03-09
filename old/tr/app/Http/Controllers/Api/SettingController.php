<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\MailRequest;
use App\Http\Requests\HrmSettingRequest;
use App\Http\Resources\HrmResource;
use App\Models\Customer;
use App\Models\CustomerGroup;
use App\Models\Warehouse;
use App\Models\Biller;
use App\Models\Account;
use App\Models\Currency;
use App\Models\ExternalService;
use App\Models\PosSetting;
use App\Models\MailSetting;
use App\Models\GeneralSetting;
use App\Models\HrmSetting;
use App\Models\RewardPointSetting;
use App\Models\SmsTemplate;
use App\Services\SmsService;
use Illuminate\Support\Str;
use Session;
use DB;
use ZipArchive;
use Twilio\Rest\Client;
use Clickatell\Rest;
use Clickatell\ClickatellException;
use Spatie\Permission\Models\Role;
use Auth;

class SettingController extends Controller
{
    use \App\Traits\CacheForget;
    use \App\Traits\TenantInfo;
    private $_smsService;
    
     public function generalSettingStore(Request $request)
    {
        $this->validate($request, [
            'site_logo' => 'image|mimes:jpg,jpeg,png,gif|max:100000',
        ]);

        $data = $request->except('site_logo');
        // return $data;
        //writting timezone info in .env file
        $path = app()->environmentFilePath();
        $searchArray = array('APP_TIMEZONE='.env('APP_TIMEZONE'));
        $replaceArray = array('APP_TIMEZONE='.$data['timezone']);

        file_put_contents($path, str_replace($searchArray, $replaceArray, file_get_contents($path)));

        if(isset($data['is_rtl']))
            $data['is_rtl'] = true;
        else
            $data['is_rtl'] = false;

        $general_setting = GeneralSetting::latest()->first();
        $general_setting->id = 1;
        $general_setting->site_title = $data['site_title'];
        $general_setting->is_rtl = $data['is_rtl'];
        if(isset($data['is_zatca'])) {
            $general_setting->is_zatca = true;
        }
        else
            $general_setting->is_zatca = false;
        $general_setting->company_name = $data['company_name'];
        $general_setting->vat_registration_number = $data['vat_registration_number'];
        $general_setting->currency = $data['currency'];
        $general_setting->currency_position = $data['currency_position'];
        $general_setting->decimal = $data['decimal'];
        $general_setting->staff_access = $data['staff_access'];
        $general_setting->without_stock = $data['without_stock'];
        $general_setting->is_packing_slip = $data['is_packing_slip'];
        $general_setting->date_format = $data['date_format'];
        $general_setting->developed_by = $data['developed_by'];
        $general_setting->invoice_format = $data['invoice_format'];
        $general_setting->state = $data['state'];
        $general_setting->expiry_type = $data['expiry_type'];
        $general_setting->expiry_value = $data['expiry_value'];
        $logo = $request->site_logo;
        if ($logo) {
            $this->fileDelete('logo/', $general_setting->site_logo);

            $ext = pathinfo($logo->getClientOriginalName(), PATHINFO_EXTENSION);
            $logoName = date("Ymdhis") . '.' . $ext;
            $logo->move(public_path('logo'), $logoName);
            $general_setting->site_logo = $logoName;
        }
        $general_setting->save();
        cache()->forget('general_setting');

        return response()->json([
            'success' => true,
            'message' => 'Data updated successfully.',
        ], 200);
    }
    
    public function posSettingStore(Request $request)
    {
        $data = $request->all();

        // Check if 'options' is set and validate its uniqueness
        if (isset($data['options'])) {
            // Remove duplicates from the input array
            $uniqueOptions = array_unique($data['options']);

            if (count($uniqueOptions) !== count($data['options'])) {
                return redirect()->back()->with('not_permitted', 'Payment options must be unique.');
            }

            $options = implode(',', $uniqueOptions);
        } else {
            $options = '"none"';
        }

        $pos_setting = PosSetting::firstOrNew(['id' => 1]);
        $pos_setting->id = 1;
        $pos_setting->customer_id = $data['customer_id'];
        $pos_setting->warehouse_id = $data['warehouse_id'];
        $pos_setting->biller_id = $data['biller_id'];
        $pos_setting->product_number = $data['product_number'];
        $pos_setting->payment_options = $options;
        $pos_setting->invoice_option = $data['invoice_size'];
        $pos_setting->thermal_invoice_size = $data['thermal_invoice_size'];

        if(!isset($data['keybord_active']))
            $pos_setting->keybord_active = false;
        else
            $pos_setting->keybord_active = true;
        if(!isset($data['is_table']))
            $pos_setting->is_table = false;
        else
            $pos_setting->is_table = true;
        if(!isset($data['send_sms']))
            $pos_setting->send_sms = false;
        else
            $pos_setting->send_sms = true;
        $pos_setting->save();
        cache()->forget('pos_setting');
        return response()->json([
            'success' => true,
            'message' => 'Pos settings updated successfully.',
        ], 200);
    }
    
    public function mailSettingStore(MailRequest $request)
    {
        $data = $request->all();
        $mail_setting = MailSetting::latest()->first();
        if(!$mail_setting)
            $mail_setting = new MailSetting;
        $mail_setting->driver = $data['driver'];
        $mail_setting->host = $data['host'];
        $mail_setting->port = $data['port'];
        $mail_setting->from_address = $data['from_address'];
        $mail_setting->from_name = $data['from_name'];
        $mail_setting->username = $data['username'];
        $mail_setting->password = trim($data['password']);
        $mail_setting->encryption = $data['encryption'];
        $mail_setting->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Data updated successfully.',
            'data' => $mail_setting,
        ], 200);
    }
    
    public function gatewayUpdate(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role->hasPermissionTo('payment_gateway_setting')) {
            return redirect('/dashboard')
                ->with('not_permitted', 'Sorry! You are not allowed to access this module');
        }

        if (!env('USER_VERIFIED')) {
            Session::flash('message', 'This feature is disabled for demo!');
            Session::flash('type', 'error');
            return redirect()->back();
        }

        // Fetch all payment gateways from the database
        $gateways = DB::table('external_services')->where('type', 'payment')->get();

        // Define all possible modules (e.g., "salepro", "ecommerce")
        $allModules = ['pos', 'ecommerce'];

        // Get inputs
        $pgs = $request->input('pg_name', []); // Payment gateway names
        $actives = $request->input('active', []); // Active status for each gateway
        $moduleStatuses = $request->input('module_status', []); // Module status (multi-select)

        foreach ($pgs as $index => $pg) {
            $gateway = $gateways->where('name', $pg)->first();

            if (!$gateway) {
                continue; // Skip if gateway not found
            }

            // Update the `details` field
            $lines = explode(';', $gateway->details);
            $keys = explode(',', $lines[0]);
            $vals = [];
            foreach ($keys as $key) {
                $para = $pg . '_' . str_replace(' ', '_', $key);
                $val = $request->$para ?? ''; // Default to empty string if null
                array_push($vals, $val);
            }
            $lines[1] = implode(',', $vals);
            $details = $lines[0] . ';' . $lines[1];

            // Update `module_status` field
            $selectedModules = $moduleStatuses[$index] ?? []; // Selected modules for this gateway
            $selectedModules = is_array($selectedModules) ? $selectedModules : [$selectedModules];

            // Create a status array with all modules
            $moduleStatusArray = [];
            foreach ($allModules as $module) {
                $moduleStatusArray[$module] = in_array($module, $selectedModules);
            }

            $moduleStatusJson = json_encode($moduleStatusArray);

            // Update the gateway in the database
            DB::table('external_services')
                ->where('name', $pg)
                ->update([
                    'details' => $details,
                    'module_status' => $moduleStatusJson,
                    'active' => $actives[$index] ?? 1, // Default to active if not set
                ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data updated successfully.',
        ], 200);
    }
    
    public function hrmSetting()
    {
        $lims_hrm_setting_data = HrmSetting::latest()->first();
        
        return new HrmResource($lims_hrm_setting_data);
    }

    public function hrmSettingStore(Request $request)
    {
        $data = $request->all();
        $lims_hrm_setting_data = HrmSetting::firstOrNew(['id' => 1]);
        $lims_hrm_setting_data->checkin = $data['checkin'];
        $lims_hrm_setting_data->checkout = $data['checkout'];
        $lims_hrm_setting_data->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Data created successfully.',
        ], 201);

    }
    
    public function backup()
    {
        if(!env('USER_VERIFIED'))
            return redirect()->back()->with('not_permitted', 'This feature is disable for demo!');

        // Database configuration
        $host = env('DB_HOST');
        $username = env('DB_USERNAME');
        $password = env('DB_PASSWORD');
        if(!config('database.connections.saleprosaas_landlord'))
            $database_name = env('DB_DATABASE');
        else
            $database_name = env('DB_PREFIX').$this->getTenantId();

        // Get connection object and set the charset
        $conn = mysqli_connect($host, $username, $password, $database_name);
        $conn->set_charset("utf8");


        // Get All Table Names From the Database
        $tables = array();
        $sql = "SHOW TABLES";
        $result = mysqli_query($conn, $sql);

        while ($row = mysqli_fetch_row($result)) {
            $tables[] = $row[0];
        }

        $sqlScript = "";
        foreach ($tables as $table) {

            // Prepare SQLscript for creating table structure
            $query = "SHOW CREATE TABLE $table";
            $result = mysqli_query($conn, $query);
            $row = mysqli_fetch_row($result);

            $sqlScript .= "\n\n" . $row[1] . ";\n\n";


            $query = "SELECT * FROM $table";
            $result = mysqli_query($conn, $query);

            $columnCount = mysqli_num_fields($result);

            // Prepare SQLscript for dumping data for each table
            for ($i = 0; $i < $columnCount; $i ++) {
                while ($row = mysqli_fetch_row($result)) {
                    $sqlScript .= "INSERT INTO $table VALUES(";
                    for ($j = 0; $j < $columnCount; $j ++) {
                        $row[$j] = $row[$j];

                        if (isset($row[$j])) {
                            $sqlScript .= '"' . $row[$j] . '"';
                        } else {
                            $sqlScript .= '""';
                        }
                        if ($j < ($columnCount - 1)) {
                            $sqlScript .= ',';
                        }
                    }
                    $sqlScript .= ");\n";
                }
            }

            $sqlScript .= "\n";
        }

        if(!empty($sqlScript))
        {
            // Save the SQL script to a backup file
            $backup_file_name = public_path().'/'.$database_name . '_backup_' . time() . '.sql';
            //return $backup_file_name;
            $fileHandler = fopen($backup_file_name, 'w+');
            $number_of_lines = fwrite($fileHandler, $sqlScript);
            fclose($fileHandler);

            $zip = new ZipArchive();
            $zipFileName = $database_name . '_backup_' . time() . '.zip';
            $zip->open(public_path() . '/' . $zipFileName, ZipArchive::CREATE);
            $zip->addFile($backup_file_name, $database_name . '_backup_' . time() . '.sql');
            $zip->close();

            // Download the SQL backup file to the browser
            /*header('Content-Description: File Transfer');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename=' . basename($backup_file_name));
            header('Content-Transfer-Encoding: binary');
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . filesize($backup_file_name));
            ob_clean();
            flush();
            readfile($backup_file_name);
            exec('rm ' . $backup_file_name); */
        }
        return response()->json([
            'success' => true,
            'message' => 'Data backup successfull.',
        ], 200);
    }
    
     
    public function checkLicense(Request $request)
    {
        $request->validate([
            'install_url' => 'required|url',
            'license_key' => 'required|string',
        ]);
        
      
        // Get the domain part from install_url
        $installDomain = parse_url($request->install_url, PHP_URL_HOST);
        
        // Get the allowed main domain from APP_URL
        $allowedDomain = parse_url(env('APP_URL'), PHP_URL_HOST);
        
        // Extract main domain part (like xyz.com)
        $allowedMainDomain = implode('.', array_slice(explode('.', $allowedDomain), -2));
        
        // Extract main domain from install URL
        $installMainDomain = implode('.', array_slice(explode('.', $installDomain), -2));
        // Check if install domain matches allowed domain
        if ($installMainDomain !== $allowedMainDomain) {
            return response()->json(['message' => 'Invalid domain.'], 403);
        }
    
        // Check license key logic (replace this with actual check)
        // if ($request->license_key !== 'EXPECTED_KEY') {
        //     return response()->json(['message' => 'Invalid license key.'], 401);
        // }
    
        // Generate a token (if your GeneralSetting table has one token for app)
        $token = Str::random(60);
    
        $generalSetting = GeneralSetting::first();
        $generalSetting->app_key = $token;
        $generalSetting->save();
    
        return response()->json([
            'token' => $token
        ]);
}
}
