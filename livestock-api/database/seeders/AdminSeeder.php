<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@jigawa.gov.ng'],
            [
                'full_name' => 'System Administrator',
                'password' => Hash::make('admin123'),
                'phone_number' => '08012345678',
                'user_role' => 'admin',
                'status' => 'active',
            ]
        );

        $this->command->info('Admin user created: admin@jigawa.gov.ng / admin123');
    }
}
