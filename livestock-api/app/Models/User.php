<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'full_name',
        'email',
        'password',
        'phone_number',
        'user_role',
        'status',
        'assigned_lga',
        'assigned_ward',
        'user_image',
        'last_sync',
        'agent_serial_number',
        'agent_ward_number',
        'agent_code',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_sync' => 'datetime',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->user_role === 'admin';
    }

    public function isAgent(): bool
    {
        return $this->user_role === 'agent';
    }

    public function submissions()
    {
        return $this->hasMany(LivestockSubmission::class, 'agent_id');
    }
}
