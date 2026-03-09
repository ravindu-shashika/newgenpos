<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\GeneralSetting;
use App\Models\MobileToken;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    // public function login(Request $request)
    // {
    //     $input = $request->all();

    //     $this->validate($request, [
    //         'name' => 'required',
    //         'password' => 'required',
    //     ]);

    //     try {
    //         $fieldType = filter_var($input['name'], FILTER_VALIDATE_EMAIL) ? 'email' : 'name';

    //         if (auth()->attempt([$fieldType => $input['name'], 'password' => $input['password']])) {
    //             // Generate an API token for the user
    //             $user = auth()->user();
    //             $token = $user->createToken('API Token')->plainTextToken;

    //             return response()->json([
    //                 'success' => true,
    //                 'message' => 'Login successful.',
    //                 'token' => $token,
    //                 'user' => $user,
    //             ], 200);
    //         }
    //         else {
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Username And password is wrong.',
    //             ], 401);
    //         }
    //     } catch (\Exception $e) {
    //         // Handle unexpected errors
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'An error occurred during login.',
    //             'error' => $e->getMessage(),
    //         ], 500);
    //     }
    // }
public function login(LoginRequest $request)
{
   

    // $this->validate($request, [
    //     'name' => 'required',
    //     'password' => 'required',
    // ]);

    try {
         $input = $request->validated();
        $fieldType = filter_var($input['name'], FILTER_VALIDATE_EMAIL) ? 'email' : 'name';

        // Check if the username/email exists
        $user = \App\Models\User::where($fieldType, $input['name'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'Username is incorrect',
                'errors' => ['name'=>['Username is incorrect']],
            ], 401);
        }

      
        if (!auth()->attempt([$fieldType => $input['name'], 'password' => $input['password']])) {
            return response()->json([
               'message' => 'Password is incorrect',
               'errors' => ['password'=>['Password is incorrect']],
            ], 401);
        }

        // Generate an API token for the user
        $user = auth()->user();
        $token = $user->createToken('API Token')->plainTextToken;
        $data['token'] = $token;
        $data['user'] = new UserResource($user);
        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'token' => $token,
            'data' => $data,
        ], 200);

    } catch (\Exception $e) {
        // Handle unexpected errors
        return response()->json([
            'success' => false,
            'message' => 'An error occurred during login.',
            'error' => $e->getMessage(),
        ], 500);
    }
}

    public function checkLicense(Request $request)
    {
        $request->validate([
            'install_url' => 'required|url',
            'app_key' => 'required|string',
        ]);
        
        // return $request->all();
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
            return response()->json([
                'success' => false,
                'message' => 'Invalid domain.'
                ], 200);
        }
        
        $generalSetting = GeneralSetting::first();
        
        $appKey = $generalSetting->app_key;
        
        // Check app key logic (replace this with actual check)
        if ($request->app_key !== $appKey) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid App key.'
                ], 200);
        }
    
        // Generate a token (if your GeneralSetting table has one token for app)
        $token = Str::random(60);
    
        // $generalSetting = GeneralSetting::first();
        // $generalSetting->token = Hash::make($token);
        // $generalSetting->save();
        MobileToken::create([
            'name'        => $request->name ?? null,  // optional — if you’re collecting device name
            'ip'          => $request->ip ?? null,
            'location'    => $request->location ?? null,
            'token'       => Hash::make($token),
            'is_active'   => true,
            'last_active' => now(),
        ]);
        // return response()->json([
        //     'token' => $token
        // ]);
        
        return response()->json([
            'success' => true,
            'message' => 'success',
            'data' => (object) ['token' => $token],
        ], 200);
    }


//     public function checkLicense(Request $request)
//     {
//         $request->validate([
//             'install_url' => 'required|url',
//             'license_key' => 'required|string',
//         ]);
    
//         $installDomain = parse_url($request->install_url, PHP_URL_HOST);
//         $allowedDomain = parse_url(env('APP_URL'), PHP_URL_HOST);
    
//         $allowedMainDomain = implode('.', array_slice(explode('.', $allowedDomain), -2));
//         $installMainDomain = implode('.', array_slice(explode('.', $installDomain), -2));
    
//         if ($installMainDomain !== $allowedMainDomain) {
//             return response()->json(['message' => 'Invalid domain.'], 403);
//         }
    
//         if ($request->license_key !== 'EXPECTED_KEY') {
//             return response()->json(['message' => 'Invalid license key.'], 401);
//         }
    
//         // Optional: deactivate old tokens for this URL
//         MobileToken::where('install_url', $request->install_url)->update(['is_active' => false]);
    
//         // Create new token
//         $token = Str::random(60);
    
//         MobileToken::create([
//             'name'        => $request->name ?? null,  // optional — if you’re collecting device name
//             'ip'          => $request->ip ?? null,
//             'location'    => $request->location ?? null,
//             'token'       => $token,
//             'is_active'   => true,
//             'last_active' => now(),
//         ]);
        
    
//         return response()->json([
//             'token' => $token
//         ]);
// }

}
