<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\GeneralSetting;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        try {
            $request->validate([
                'password' => 'required|string',
            ]);

            $login = $request->input('username') ?? $request->input('name');
            if (!$login) {
                return response()->json([
                    'status' => 422,
                    'message' => 'Username is required.',
                    'error' => ['Username is required.'],
                ], 200);
            }

            $credentials = ['password' => $request->password];
            if (filter_var($login, FILTER_VALIDATE_EMAIL)) {
                $credentials['email'] = $login;
            } elseif (User::where('username', $login)->exists()) {
                $credentials['username'] = $login;
            } else {
                $credentials['name'] = $login;
            }

            if (!Auth::attempt($credentials)) {
                return response()->json([
                    'status' => 401,
                    'message' => 'Invalid username or password',
                ], 200);
            }

            $user = Auth::user();
            if (!$user->is_active) {
                Auth::logout();

                return response()->json([
                    'status' => 401,
                    'message' => 'This account is inactive.',
                ], 200);
            }

            $user->load('role');

            $token = $user->createToken('authToken')->plainTextToken;

            return response()->json([
                'status' => 200,
                'message' => 'Login successful',
                'token' => $token,
                'user' => $user,
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Login error: ' . $e->getMessage());

            return response()->json([
                'status' => 500,
                'message' => 'An internal error occurred. Please try again later.',
                'error' => [$e->getMessage()],
            ], 200);
        }
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user && method_exists($user, 'currentAccessToken') && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Logged out'], 200);
    }

    public function generalsettings(Request $request)
    {
        try {
            $general_setting = GeneralSetting::latest()->first();
            return response()->json([
                'status' => 200,
                'general_setting' => $general_setting,
            ], 200);
        }
        catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'An internal error occurred. Please try again later.',
                'error' => [$e->getMessage()]
            ], 200);
        }
    }
}
