<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        try {
            $request->validate([
                'username' => 'required|string',
                'password' => 'required|string',
            ]);

            // Attempt login with credentials
            $credentials = $request->only('username', 'password');

            if (Auth::attempt($credentials)) {
                $user = Auth::user();
                $user->load('role');

                // Generate token on successful authentication
                $token = $user->createToken('authToken')->plainTextToken;

                return response()->json([
                    'status' => 200,
                    'token' => $token,
                    'user' => $user,
                ], 200);
            }

            // Generic error for security
            return response()->json([
                'status' => 401,
                'message' => 'Invalid username or password',
            ], 200);

        } catch (\Exception $e) {
            // Log the actual error for the developer
            \Log::error('Login error: ' . $e->getMessage());
            
            return response()->json([
                'status' => 500,
                'message' => 'An internal error occurred. Please try again later.',
                'error' => [$e->getMessage()] // Flattened array for the client's map()
            ], 200);
        }
    }


    public function logout(Request $request)
    {

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return response()->json(['message' => 'Logged out'], 200);
    }
}
