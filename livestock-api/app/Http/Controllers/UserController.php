<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('user_role', $request->role);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $rules = [
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'phone_number' => 'nullable|string|max:20',
            'user_role' => 'required|in:admin,agent',
            'status' => 'required|in:active,inactive',
            'user_image' => 'nullable|string',
        ];

        if ($request->user_role === 'agent') {
            $rules['assigned_lga'] = 'nullable|string|max:255';
            $rules['assigned_ward'] = 'nullable|string|max:255';
            $rules['agent_serial_number'] = 'nullable|integer|min:1';
            $rules['agent_ward_number'] = 'nullable|string|max:255';
        }

        $validated = $request->validate($rules);

        $validated['password'] = Hash::make($validated['password']);

        // If creating an agent, auto-assign a per-LGA serial if not provided
        $agentCode = null;
        if ($request->user_role === 'agent') {
            $assignedLga = $validated['assigned_lga'] ?? null;

            // Determine next serial number within the LGA
            $maxSerial = 0;
            if ($assignedLga) {
                $maxSerial = User::where('assigned_lga', $assignedLga)->max('agent_serial_number') ?? 0;
            } else {
                $maxSerial = User::max('agent_serial_number') ?? 0;
            }

            $nextSerial = (isset($validated['agent_serial_number']) && intval($validated['agent_serial_number']) > 0)
                ? intval($validated['agent_serial_number'])
                : ($maxSerial + 1);

            $validated['agent_serial_number'] = $nextSerial;

            // Generate an agent code: JSM-<LGA3>-<8hex>-<zero-padded-serial>
            $prefix = 'JSM';
            $lgaCode = $assignedLga ? strtoupper(substr(preg_replace('/[^A-Z]/i', '', $assignedLga), 0, 3)) : 'XXX';
            $rand8 = strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
            $serialPadded = str_pad($nextSerial, 3, '0', STR_PAD_LEFT);
            $agentCode = sprintf('%s-%s-%s-%s', $prefix, $lgaCode, $rand8, $serialPadded);

            // Persist the generated agent code so it is available on the user record
            if ($agentCode) {
                $validated['agent_code'] = $agentCode;
            }
        }

        if ($request->user_role === 'admin') {
            $validated['assigned_lga'] = null;
            $validated['assigned_ward'] = null;
        }

        $user = User::create($validated);

        $userArray = $user->toArray();
        if ($agentCode) {
            // Return generated agent_code in response without requiring DB migration
            $userArray['agent_code'] = $agentCode;
        }

        return response()->json([
            'success' => true,
            'data' => $userArray,
        ], 201);
    }

    public function show(User $user)
    {
        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $rules = [
            'full_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'phone_number' => 'nullable|string|max:20',
            'user_role' => 'sometimes|in:admin,agent',
            'status' => 'sometimes|in:active,inactive',
            'user_image' => 'nullable|string',
        ];

        $newRole = $request->user_role ?? $user->user_role;
        
        if ($newRole === 'agent') {
            $rules['assigned_lga'] = 'nullable|string|max:255';
            $rules['assigned_ward'] = 'nullable|string|max:255';
            $rules['agent_serial_number'] = 'nullable|integer|min:1';
            $rules['agent_ward_number'] = 'nullable|string|max:255';
        }

        $validated = $request->validate($rules);

        if ($newRole === 'admin') {
            $validated['assigned_lga'] = null;
            $validated['assigned_ward'] = null;
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'data' => $user->fresh(),
        ]);
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'error' => 'Cannot delete your own account',
            ], 400);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ]);
    }

    public function stats()
    {
        $totalUsers = User::count();
        $activeUsers = User::where('status', 'active')->count();
        $adminCount = User::where('user_role', 'admin')->count();
        $agentCount = User::where('user_role', 'agent')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'admin_count' => $adminCount,
                'agent_count' => $agentCount,
            ],
        ]);
    }
}
