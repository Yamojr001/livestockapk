<?php

namespace App\Http\Controllers;

use App\Models\LivestockSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SubmissionController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = LivestockSubmission::query();

            if ($request->user()->isAgent()) {
                $query->where('agent_id', $request->user()->id);
            }

            if ($request->has('lga')) {
                $query->where('lga', $request->lga);
            }

            if ($request->has('ward')) {
                $query->where('ward', $request->ward);
            }

            if ($request->has('association')) {
                $query->where('association', $request->association);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('farmer_name', 'like', "%{$search}%")
                      ->orWhere('contact_number', 'like', "%{$search}%")
                      ->orWhere('registration_id', 'like', "%{$search}%")
                      ->orWhere('farmer_id', 'like', "%{$search}%")
                      ->orWhere('nin', 'like', "%{$search}%");
                });
            }

            // Filter by submission status
            if ($request->has('status')) {
                $query->where('submission_status', $request->status);
            }

            $submissions = $query->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 50));

            Log::info('Fetched submissions', [
                'count' => $submissions->total(),
                'agent_id' => $request->user()->id ?? null,
            ]);

            return response()->json([
                'success' => true,
                'data' => $submissions,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching submissions', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch submissions: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            Log::info('Starting submission creation', [
                'user_id' => $request->user()->id,
                'user_name' => $request->user()->full_name,
            ]);

            $validated = $request->validate([
                'farmer_id' => 'nullable|string|max:50',
                'farmer_name' => 'required|string|max:255',
                'gender' => 'nullable|string|in:Male,Female,Other',
                'age' => 'nullable|integer|min:1|max:150',
                'contact_number' => 'required|string|max:20',
                'nin' => 'nullable|string|max:20',
                'bvn' => 'nullable|string|max:20',
                'vin' => 'nullable|string|max:50',
                'literacy_status' => 'nullable|string|max:50',
                'bank' => 'nullable|string|max:100',
                'account_number' => 'nullable|string|max:20',
                'lga' => 'required|string|max:100',
                'ward' => 'required|string|max:100',
                'association' => 'required|string|max:255',
                'number_of_animals' => 'required|integer|min:1',
                'membership_status' => 'nullable|string|max:100',
                'executive_position' => 'nullable|string|max:100',
                'geo_location' => 'nullable|string|max:255',
                'farmer_image' => 'nullable|string',
                'has_disease' => 'nullable|string|max:10',
                'disease_name' => 'nullable|string|max:255',
                'disease_description' => 'nullable|string',
                'comments' => 'nullable|string',
                'agent_serial_number' => 'nullable|integer',
                'submission_status' => 'nullable|string|in:pending,synced,failed',
                'created_by' => 'nullable|string|max:255',
            ]);

            // Generate registration ID
            $validated['registration_id'] = LivestockSubmission::generateRegistrationId();
            $validated['agent_id'] = $request->user()->id;
            $validated['agent_name'] = $request->user()->full_name;
            
            // Set default status if not provided
            if (!isset($validated['submission_status'])) {
                $validated['submission_status'] = 'synced';
            }
            
            // Set created_by if not provided
            if (!isset($validated['created_by'])) {
                $validated['created_by'] = $request->user()->email;
            }

            Log::info('Creating submission with validated data', [
                'registration_id' => $validated['registration_id'],
                'farmer_name' => $validated['farmer_name'],
                'lga' => $validated['lga'],
                'ward' => $validated['ward'],
            ]);

            $submission = LivestockSubmission::create($validated);

            Log::info('Submission created successfully', [
                'id' => $submission->id,
                'registration_id' => $submission->registration_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Submission created successfully',
                'data' => $submission,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed for submission', [
                'errors' => $e->errors(),
                'input' => $request->all(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to create submission', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'input' => $request->except(['farmer_image']), // Exclude base64 image from logs
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to create submission: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(LivestockSubmission $submission)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $submission,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching submission', [
                'id' => $submission->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch submission',
            ], 500);
        }
    }

    public function update(Request $request, LivestockSubmission $submission)
    {
        try {
            $validated = $request->validate([
                'farmer_id' => 'nullable|string|max:50',
                'farmer_name' => 'sometimes|string|max:255',
                'gender' => 'nullable|string|in:Male,Female,Other',
                'age' => 'nullable|integer|min:1|max:150',
                'contact_number' => 'sometimes|string|max:20',
                'nin' => 'nullable|string|max:20',
                'bvn' => 'nullable|string|max:20',
                'vin' => 'nullable|string|max:50',
                'literacy_status' => 'nullable|string|max:50',
                'bank' => 'nullable|string|max:100',
                'account_number' => 'nullable|string|max:20',
                'lga' => 'sometimes|string|max:100',
                'ward' => 'sometimes|string|max:100',
                'association' => 'sometimes|string|max:255',
                'number_of_animals' => 'sometimes|integer|min:1',
                'membership_status' => 'nullable|string|max:100',
                'executive_position' => 'nullable|string|max:100',
                'geo_location' => 'nullable|string|max:255',
                'farmer_image' => 'nullable|string',
                'has_disease' => 'nullable|string|max:10',
                'disease_name' => 'nullable|string|max:255',
                'disease_description' => 'nullable|string',
                'comments' => 'nullable|string',
                'agent_serial_number' => 'nullable|integer',
                'submission_status' => 'nullable|string|in:pending,synced,failed',
            ]);

            $submission->update($validated);

            Log::info('Submission updated', [
                'id' => $submission->id,
                'updated_fields' => array_keys($validated),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Submission updated successfully',
                'data' => $submission->fresh(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update submission', [
                'id' => $submission->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to update submission',
            ], 500);
        }
    }

    public function destroy(LivestockSubmission $submission)
    {
        try {
            $submission->delete();

            Log::info('Submission deleted', ['id' => $submission->id]);

            return response()->json([
                'success' => true,
                'message' => 'Submission deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete submission', [
                'id' => $submission->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to delete submission',
            ], 500);
        }
    }

    public function syncBatch(Request $request)
    {
        try {
            $validated = $request->validate([
                'submissions' => 'required|array|min:1',
                'submissions.*.farmer_id' => 'nullable|string|max:50',
                'submissions.*.farmer_name' => 'required|string|max:255',
                'submissions.*.contact_number' => 'required|string|max:20',
                'submissions.*.lga' => 'required|string|max:100',
                'submissions.*.ward' => 'required|string|max:100',
                'submissions.*.association' => 'required|string|max:255',
                'submissions.*.number_of_animals' => 'required|integer|min:1',
                'submissions.*.gender' => 'nullable|string|in:Male,Female,Other',
                'submissions.*.age' => 'nullable|integer|min:1|max:150',
                'submissions.*.agent_serial_number' => 'nullable|integer',
            ]);

            $created = [];
            $errors = [];

            foreach ($validated['submissions'] as $index => $data) {
                try {
                    $data['registration_id'] = LivestockSubmission::generateRegistrationId();
                    $data['agent_id'] = $request->user()->id;
                    $data['agent_name'] = $request->user()->full_name;
                    $data['submission_status'] = 'synced';
                    $data['created_by'] = $request->user()->email;
                    
                    $submission = LivestockSubmission::create($data);
                    $created[] = $submission;
                } catch (\Exception $e) {
                    $errors[] = [
                        'index' => $index,
                        'error' => $e->getMessage(),
                        'data' => $data,
                    ];
                    Log::error('Failed to create batch submission', [
                        'index' => $index,
                        'error' => $e->getMessage(),
                        'data' => $data,
                    ]);
                }
            }

            $request->user()->update(['last_sync' => now()]);

            Log::info('Batch sync completed', [
                'total' => count($validated['submissions']),
                'successful' => count($created),
                'failed' => count($errors),
                'agent_id' => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'synced_count' => count($created),
                'failed_count' => count($errors),
                'data' => $created,
                'errors' => $errors,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Batch sync failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Batch sync failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function stats(Request $request)
    {
        try {
            $query = LivestockSubmission::query();

            if ($request->user()->isAgent()) {
                $query->where('agent_id', $request->user()->id);
            }

            $totalSubmissions = $query->count();
            $totalAnimals = $query->sum('number_of_animals');
            $pendingCount = $query->where('submission_status', 'pending')->count();
            $syncedCount = $query->where('submission_status', 'synced')->count();

            $byLGA = LivestockSubmission::selectRaw('lga, COUNT(*) as count, SUM(number_of_animals) as animals')
                ->when($request->user()->isAgent(), function ($q) use ($request) {
                    return $q->where('agent_id', $request->user()->id);
                })
                ->groupBy('lga')
                ->orderByDesc('count')
                ->limit(10)
                ->get();

            $byAssociation = LivestockSubmission::selectRaw('association, COUNT(*) as count')
                ->when($request->user()->isAgent(), function ($q) use ($request) {
                    return $q->where('agent_id', $request->user()->id);
                })
                ->groupBy('association')
                ->orderByDesc('count')
                ->limit(6)
                ->get();

            $recentSubmissions = $query->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(['id', 'farmer_name', 'lga', 'ward', 'created_at', 'submission_status']);

            return response()->json([
                'success' => true,
                'data' => [
                    'total_submissions' => $totalSubmissions,
                    'total_animals' => $totalAnimals,
                    'pending_sync' => $pendingCount,
                    'synced_online' => $syncedCount,
                    'by_lga' => $byLGA,
                    'by_association' => $byAssociation,
                    'recent_submissions' => $recentSubmissions,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching stats', [
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch statistics',
            ], 500);
        }
    }

    // New method: Get pending submissions for an agent
    public function getPending(Request $request)
    {
        try {
            $submissions = LivestockSubmission::where('agent_id', $request->user()->id)
                ->where('submission_status', 'pending')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $submissions,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching pending submissions', [
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch pending submissions',
            ], 500);
        }
    }
}