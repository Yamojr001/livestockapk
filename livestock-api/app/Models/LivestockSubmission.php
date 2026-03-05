<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class LivestockSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'registration_id',
        'farmer_id',
        'farmer_name',
        'gender',
        'age',
        'contact_number',
        'nin',
        'bvn',
        'vin',
        'literacy_status',
        'bank',
        'account_number',
        'lga',
        'ward',
        'association',
        'number_of_animals',
        'membership_status',
        'executive_position',
        'geo_location',
        'farmer_image',
        'has_disease',
        'disease_name',
        'disease_description',
        'comments',
        'agent_id',
        'agent_name',
        'agent_serial_number',
        'submission_status', // Added
        'created_by', // Added
    ];

    protected $casts = [
        'number_of_animals' => 'integer',
        'age' => 'integer',
        'agent_serial_number' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = ['farmer_image_url'];

    /**
     * Get the full URL for the farmer image
     * Converts storage/farmers/image.jpg to full URL
     * Returns null if no image exists
     */
    public function getFarmerImageUrlAttribute(): ?string
    {
        if (empty($this->farmer_image)) {
            return null;
        }

        // If already a full URL, return as is
        if (str_starts_with($this->farmer_image, 'http://') || str_starts_with($this->farmer_image, 'https://')) {
            return $this->farmer_image;
        }

        // Convert storage path to full URL
        return url($this->farmer_image);
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public static function generateRegistrationId(): string
    {
        $timestamp = time();
        $random = strtoupper(substr(uniqid(), -4));
        return 'JG-' . strtoupper(base_convert($timestamp, 10, 36)) . $random;
    }

    // Scope for pending submissions
    public function scopePending($query)
    {
        return $query->where('submission_status', 'pending');
    }

    // Scope for synced submissions
    public function scopeSynced($query)
    {
        return $query->where('submission_status', 'synced');
    }

    // Scope for failed submissions
    public function scopeFailed($query)
    {
        return $query->where('submission_status', 'failed');
    }

    // Scope for agent's submissions
    public function scopeForAgent($query, $agentId)
    {
        return $query->where('agent_id', $agentId);
    }
}