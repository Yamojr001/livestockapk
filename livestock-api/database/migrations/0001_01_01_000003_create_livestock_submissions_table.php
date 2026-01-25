<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('livestock_submissions', function (Blueprint $table) {
            $table->id();
            $table->string('registration_id')->unique();
            $table->string('farmer_id', 50)->nullable();
            $table->string('farmer_name');
            $table->string('gender')->nullable();
            $table->integer('age')->nullable();
            $table->string('contact_number');
            $table->string('nin')->nullable();
            $table->string('bvn')->nullable();
            $table->string('vin')->nullable();
            $table->string('literacy_status')->nullable();
            $table->string('bank')->nullable();
            $table->string('account_number')->nullable();
            $table->string('lga');
            $table->string('ward');
            $table->string('association');
            $table->integer('number_of_animals');
            $table->string('membership_status')->nullable();
            $table->string('executive_position')->nullable();
            $table->string('geo_location')->nullable();
            $table->longText('farmer_image')->nullable();
            $table->string('has_disease')->nullable();
            $table->string('disease_name')->nullable();
            $table->text('disease_description')->nullable();
            $table->text('comments')->nullable();
            $table->foreignId('agent_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('agent_name')->nullable();
            $table->integer('agent_serial_number')->nullable();
            $table->string('submission_status')->default('pending')->index(); // Added: pending, synced, failed
            $table->string('created_by')->nullable(); // Added
            $table->timestamps();

            $table->index('lga');
            $table->index('ward');
            $table->index('association');
            $table->index('agent_id');
            $table->index('has_disease');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('livestock_submissions');
    }
};