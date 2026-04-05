<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email', 'max:150'],
            'password' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $result = $this->authService->loginWithPassword($request->input('email'), $request->input('password'));
        if (!$result['ok']) {
            return response()->json(['message' => $result['message']], 401);
        }

        return response()->json([
            'token' => $result['token'],
            'user' => $result['user'],
        ]);
    }

    public function requestOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email', 'max:150'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $result = $this->authService->requestEmailOtp($request->input('email'));
        if (!$result['ok']) {
            return response()->json(['message' => $result['message']], 404);
        }

        return response()->json($result);
    }

    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email', 'max:150'],
            'otp' => ['required', 'string', 'min:4', 'max:10'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $result = $this->authService->verifyEmailOtp($request->input('email'), $request->input('otp'));
        if (!$result['ok']) {
            return response()->json(['message' => $result['message']], 401);
        }

        return response()->json([
            'token' => $result['token'],
            'user' => $result['user'],
        ]);
    }

    public function me()
    {
        return response()->json(['user' => Auth::user()]);
    }

    public function logout()
    {
        $user = Auth::user();
        if ($user) {
            $this->authService->logout($user);
        }
        return response()->json(['message' => 'Logged out']);
    }
}

