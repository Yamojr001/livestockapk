<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;

class ImageUploadTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test user
        $this->user = User::create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'full_name' => 'Test User',
            'phone_number' => '08012345678',
            'user_role' => 'agent',
            'status' => 'active',
            'assigned_lga' => 'Test LGA',
            'assigned_ward' => 'Test Ward',
        ]);
    }

    /**
     * Test: Image Upload as Base64
     */
    public function test_base64_image_upload()
    {
        // Create a 1x1 red pixel PNG in base64
        $base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

        $response = $this->actingAs($this->user)->postJson('/api/v1/submissions', [
            'farmer_name' => 'Test Farmer',
            'contact_number' => '08123456789',
            'lga' => 'Test LGA',
            'ward' => 'Test Ward',
            'association' => 'Test Association',
            'number_of_animals' => 5,
            'farmer_image' => $base64Image,
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'farmer_name',
                'farmer_image',
                'registration_id',
            ],
        ]);

        // Verify image was saved to storage
        $data = $response->json('data');
        $this->assertNotNull($data['farmer_image']);
        $this->assertTrue(str_contains($data['farmer_image'], 'farmers/farmer_'));
        $this->assertTrue(str_contains($data['farmer_image'], '.jpg'));

        // Verify file exists in storage
        $storagePath = storage_path('app/public/' . $data['farmer_image']);
        $this->assertFileExists($storagePath);
    }

    /**
     * Test: Submission without Image
     */
    public function test_submission_without_image()
    {
        $response = $this->actingAs($this->user)->postJson('/api/v1/submissions', [
            'farmer_name' => 'Test Farmer',
            'contact_number' => '08123456789',
            'lga' => 'Test LGA',
            'ward' => 'Test Ward',
            'association' => 'Test Association',
            'number_of_animals' => 5,
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'farmer_name',
                'registration_id',
            ],
        ]);

        $data = $response->json('data');
        $this->assertNull($data['farmer_image']);
    }

    /**
     * Test: Invalid Base64 Image
     */
    public function test_invalid_base64_image()
    {
        $response = $this->actingAs($this->user)->postJson('/api/v1/submissions', [
            'farmer_name' => 'Test Farmer',
            'contact_number' => '08123456789',
            'lga' => 'Test LGA',
            'ward' => 'Test Ward',
            'association' => 'Test Association',
            'number_of_animals' => 5,
            'farmer_image' => 'data:image/png;base64,INVALID_BASE64!!!',
        ]);

        // Should still create submission even if image upload fails
        $response->assertStatus(201);
    }

    /**
     * Test: Multiple Submissions with Images
     */
    public function test_multiple_submissions_with_images()
    {
        $base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

        for ($i = 0; $i < 3; $i++) {
            $response = $this->actingAs($this->user)->postJson('/api/v1/submissions', [
                'farmer_name' => 'Test Farmer ' . ($i + 1),
                'contact_number' => '0812345678' . $i,
                'lga' => 'Test LGA',
                'ward' => 'Test Ward',
                'association' => 'Test Association',
                'number_of_animals' => $i + 1,
                'farmer_image' => $base64Image,
            ]);

            $response->assertStatus(201);
        }

        // Verify all submissions were created with images
        $submissions = \App\Models\LivestockSubmission::all();
        $this->assertEquals(3, $submissions->count());

        // Check that each has an image
        foreach ($submissions as $submission) {
            $this->assertNotNull($submission->farmer_image);
            $storagePath = storage_path('app/public/' . $submission->farmer_image);
            $this->assertFileExists($storagePath);
        }
    }

    /**
     * Test: Image Storage Directory Structure
     */
    public function test_image_storage_directory_exists()
    {
        $farmersDir = storage_path('app/public/farmers');
        $this->assertTrue(is_dir($farmersDir), 'Farmers directory should exist');

        // Check permissions
        $perms = fileperms($farmersDir);
        $this->assertTrue(is_writable($farmersDir), 'Farmers directory should be writable');
    }

    /**
     * Test: Image Retrieval from Storage
     */
    public function test_image_retrieval_from_storage()
    {
        $base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

        $response = $this->actingAs($this->user)->postJson('/api/v1/submissions', [
            'farmer_name' => 'Test Farmer',
            'contact_number' => '08123456789',
            'lga' => 'Test LGA',
            'ward' => 'Test Ward',
            'association' => 'Test Association',
            'number_of_animals' => 5,
            'farmer_image' => $base64Image,
        ]);

        $submission = $response->json('data');
        $imagePath = $submission['farmer_image'];

        // Now retrieve the submission
        $getResponse = $this->actingAs($this->user)->getJson('/api/v1/submissions/' . $submission['id']);
        $getResponse->assertStatus(200);

        $retrieved = $getResponse->json('data');
        $this->assertEquals($imagePath, $retrieved['farmer_image']);
    }
}
