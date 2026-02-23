<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {

                if (!Schema::hasColumn('users', 'age')) {
                    $table->integer('age')->nullable()->after('phone_number');
                }

                if (!Schema::hasColumn('users', 'gender')) {
                    $table->string('gender')->nullable()->after('age');
                }
            });

            DB::statement(
                "ALTER TABLE users 
                 MODIFY COLUMN user_role 
                 ENUM('admin', 'agent', 'ministry') 
                 DEFAULT 'agent'"
            );
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {

                if (Schema::hasColumn('users', 'age')) {
                    $table->dropColumn('age');
                }

                if (Schema::hasColumn('users', 'gender')) {
                    $table->dropColumn('gender');
                }
            });

            DB::statement(
                "ALTER TABLE users 
                 MODIFY COLUMN user_role 
                 ENUM('admin', 'agent') 
                 DEFAULT 'agent'"
            );
        }
    }
};
