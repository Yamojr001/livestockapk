<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'phone_number' => 'nullable|string|max:20',
            'user_image' => 'nullable|string',
            'age' => 'nullable|integer',
            'gender' => 'nullable|string|max:20',
        ]);

        // Handle base64 image if present
        $userImagePath = null;
        if ($request->has('user_image') && str_starts_with($request->user_image, 'data:image')) {
            try {
                $imageData = $request->user_image;
                $format = strpos($imageData, 'data:image/png') !== false ? 'png' : 'jpg';
                $image = str_replace(['data:image/png;base64,', 'data:image/jpeg;base64,', ' '], ['', '', '+'], $imageData);
                $imageName = 'user_' . time() . '_' . uniqid() . '.' . $format;
                \Illuminate\Support\Facades\Storage::disk('public')->put('users/' . $imageName, base64_decode($image));
                $userImagePath = 'users/' . $imageName;
            } catch (\Exception $e) {
                // Fallback to null
            }
        }

        $user = User::create([
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone_number' => $validated['phone_number'] ?? null,
            'user_image' => $userImagePath,
            'age' => $validated['age'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'user_role' => 'agent',
            'status' => 'active',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid credentials',
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'error' => 'Account is inactive. Please contact admin.',
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        
        // Revoke the current access token
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }
        
        // Optionally revoke all tokens for this user
        // $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $request->user(),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'phone_number' => 'nullable|string|max:20',
            'user_image' => 'nullable|string',
        ]);

        if ($request->has('user_image') && str_starts_with($request->user_image, 'data:image')) {
            try {
                $imageData = $request->user_image;
                $format = strpos($imageData, 'data:image/png') !== false ? 'png' : 'jpg';
                $image = str_replace(['data:image/png;base64,', 'data:image/jpeg;base64,', ' '], ['', '', '+'], $imageData);
                $imageName = 'user_' . time() . '_' . uniqid() . '.' . $format;
                \Illuminate\Support\Facades\Storage::disk('public')->put('users/' . $imageName, base64_decode($image));
                $validated['user_image'] = 'users/' . $imageName;
            } catch (\Exception $e) {
                // Skip if fails
            }
        }

        $request->user()->update($validated);

        return response()->json([
            'success' => true,
            'data' => $request->user()->fresh(),
        ]);
    }

    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'error' => 'Current password is incorrect',
            ], 400);
        }

        $user->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully',
        ]);
    }
}
