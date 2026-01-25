<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'success' => true,
        'message' => 'Livestock Data API v1.0',
        'version' => '1.0.0',
    ]);
});

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login'])->name('login');

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
            Route::put('/profile', [AuthController::class, 'updateProfile']);
            Route::post('/change-password', [AuthController::class, 'changePassword']);
        });
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::prefix('submissions')->group(function () {
            Route::get('/', [SubmissionController::class, 'index']);
            Route::post('/', [SubmissionController::class, 'store']);
            Route::get('/stats', [SubmissionController::class, 'stats']);
            Route::post('/sync', [SubmissionController::class, 'syncBatch']);
            Route::get('/{submission}', [SubmissionController::class, 'show']);
            Route::put('/{submission}', [SubmissionController::class, 'update']);
            Route::delete('/{submission}', [SubmissionController::class, 'destroy']);
        });

        Route::middleware('admin')->prefix('users')->group(function () {
            Route::get('/', [UserController::class, 'index']);
            Route::post('/', [UserController::class, 'store']);
            Route::get('/stats', [UserController::class, 'stats']);
            Route::get('/{user}', [UserController::class, 'show']);
            Route::put('/{user}', [UserController::class, 'update']);
            Route::delete('/{user}', [UserController::class, 'delete']);
        });
    });
});
