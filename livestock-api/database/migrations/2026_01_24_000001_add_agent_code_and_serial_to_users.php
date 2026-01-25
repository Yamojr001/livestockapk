<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'agent_serial_number')) {
                $table->integer('agent_serial_number')->nullable()->after('assigned_ward');
            }

            if (!Schema::hasColumn('users', 'agent_code')) {
                $table->string('agent_code', 64)->nullable()->after('agent_serial_number');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'agent_code')) {
                $table->dropColumn('agent_code');
            }

            if (Schema::hasColumn('users', 'agent_serial_number')) {
                $table->dropColumn('agent_serial_number');
            }
        });
    }
};
