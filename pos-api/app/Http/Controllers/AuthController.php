<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // Find the user by username
        $user = User::where('username', $request->username)->with('role')->first();

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }
        $machineIp = getHostByName(getHostName());
        // Attempt login with credentials
        $credentials = $request->only('username', 'password');
      
        if (Auth::attempt($credentials)) {
  
            // Generate token on successful authentication
            $token = $user->createToken('authToken')->plainTextToken;

            $response = [
                'token' => $token,
                'user' => $user,
                'status' => 200,
            ];
            return response()->json($response, 200);
        }

        return response()->json([
            'message' => 'Invalid credentials',
            'status' => 401,
        ], 401);
    }


    public function logout(Request $request)
    {
      
        Auth::guard('web')->logout();       

        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return response()->json(['message' => 'Logged out'], 200);
    }
}
