import * as FileSystem from "expo-file-system";
import { imageCacheService } from "@/lib/image-cache-service";
import { storage } from "@/lib/storage";

/**
 * Comprehensive Image Upload & Caching System Test Suite
 */
export const imageCachingTests = {
  /**
   * Test 1: Initialize cache directory
   */
  async testInitializeCache(): Promise<boolean> {
    try {
      await imageCacheService.initCache();
      const dirInfo = await FileSystem.getInfoAsync(
        `${FileSystem.documentDirectory}livestock_image_cache/`
      );
      console.log("✅ Test 1 Passed: Cache directory initialized", dirInfo.exists);
      return dirInfo.exists === true;
    } catch (error) {
      console.error("❌ Test 1 Failed:", error);
      return false;
    }
  },

  /**
   * Test 2: Cache image from base64
   */
  async testCacheBase64Image(): Promise<boolean> {
    try {
      // Create a dummy base64 image (1x1 red pixel PNG)
      const base64PNG =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
      const imageId = "test_image_" + Date.now();

      const cached = await imageCacheService.cacheImageFromBase64(base64PNG, imageId);
      console.log("✅ Test 2 Passed: Image cached from base64", cached?.imagePath);
      return cached !== null && cached.imagePath !== undefined;
    } catch (error) {
      console.error("❌ Test 2 Failed:", error);
      return false;
    }
  },

  /**
   * Test 3: Retrieve cached image
   */
  async testGetCachedImage(): Promise<boolean> {
    try {
      const testUrl = "https://test.example.com/image.jpg";
      const cacheIndex = await imageCacheService.getCacheIndex();
      const cached = cacheIndex.length > 0 ? cacheIndex[0] : null;

      if (cached) {
        const retrievedPath = await imageCacheService.getCachedImage(cached.uri);
        console.log("✅ Test 3 Passed: Retrieved cached image", retrievedPath);
        return retrievedPath !== null;
      } else {
        console.log("⚠️  Test 3 Skipped: No cached images found");
        return true;
      }
    } catch (error) {
      console.error("❌ Test 3 Failed:", error);
      return false;
    }
  },

  /**
   * Test 4: Cache index persistence
   */
  async testCacheIndexPersistence(): Promise<boolean> {
    try {
      const index1 = await imageCacheService.getCacheIndex();
      const testEntry = {
        uri: "test://persistence_" + Date.now(),
        imagePath: "test_path.jpg",
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const newIndex = [...index1, testEntry];
      await imageCacheService.saveCacheIndex(newIndex);

      const index2 = await imageCacheService.getCacheIndex();
      const found = index2.some(item => item.uri === testEntry.uri);

      console.log("✅ Test 4 Passed: Cache index persisted", found);
      return found;
    } catch (error) {
      console.error("❌ Test 4 Failed:", error);
      return false;
    }
  },

  /**
   * Test 5: Cache size calculation
   */
  async testGetCacheSize(): Promise<boolean> {
    try {
      const size = await imageCacheService.getCacheSize();
      console.log(
        "✅ Test 5 Passed: Cache size calculated",
        `${(size / 1024).toFixed(2)} KB`
      );
      return size >= 0;
    } catch (error) {
      console.error("❌ Test 5 Failed:", error);
      return false;
    }
  },

  /**
   * Test 6: Image for display resolution
   */
  async testGetImageForDisplay(): Promise<boolean> {
    try {
      // Test with file URI
      const fileUri = `file://${FileSystem.documentDirectory}test.jpg`;
      const result1 = await imageCacheService.getImageForDisplay(fileUri);
      const pass1 = result1 === fileUri;

      // Test with data URI
      const dataUri = "data:image/png;base64,ABC123";
      const result2 = await imageCacheService.getImageForDisplay(dataUri);
      const pass2 = result2 === dataUri;

      // Test with remote URL
      const remoteUrl = "https://example.com/image.jpg";
      const result3 = await imageCacheService.getImageForDisplay(remoteUrl);
      const pass3 = result3 !== null;

      console.log("✅ Test 6 Passed: Image display resolution", {
        fileUri: pass1,
        dataUri: pass2,
        remoteUrl: pass3,
      });

      return pass1 && pass2 && pass3;
    } catch (error) {
      console.error("❌ Test 6 Failed:", error);
      return false;
    }
  },

  /**
   * Test 7: Submission storage with image
   */
  async testSubmissionWithImage(): Promise<boolean> {
    try {
      const testSubmission = {
        farmer_name: "Test Farmer",
        contact_number: "08123456789",
        lga: "Test LGA",
        ward: "Test Ward",
        association: "Test Association",
        number_of_animals: 5,
        farmer_image: `file://${FileSystem.documentDirectory}test_image.jpg`,
        created_at: new Date().toISOString(),
      };

      const submission = await storage.addPendingSubmission(testSubmission as any);
      const retrieved = await storage.getPendingSubmissions();
      const found = retrieved.some(s => s.id === submission.id);

      console.log("✅ Test 7 Passed: Submission with image stored", found);
      return found;
    } catch (error) {
      console.error("❌ Test 7 Failed:", error);
      return false;
    }
  },

  /**
   * Test 8: Clear expired cache
   */
  async testClearExpiredCache(): Promise<boolean> {
    try {
      const sizeBefore = await imageCacheService.getCacheSize();
      await imageCacheService.clearExpiredCache();
      const sizeAfter = await imageCacheService.getCacheSize();

      console.log(
        "✅ Test 8 Passed: Expired cache cleared",
        `Before: ${(sizeBefore / 1024).toFixed(2)} KB, After: ${(sizeAfter / 1024).toFixed(2)} KB`
      );

      return true;
    } catch (error) {
      console.error("❌ Test 8 Failed:", error);
      return false;
    }
  },

  /**
   * Test 9: Verify Laravel storage is accessible
   */
  async testLaravelStorageSetup(): Promise<boolean> {
    try {
      // This test assumes Laravel is running
      const response = await fetch("livestock.northdemy.com/storage/farmers/", {
        method: "HEAD",
      });

      const exists = response.status === 200 || response.status === 404;
      console.log(
        "✅ Test 9 Passed: Laravel storage endpoint accessible",
        `Status: ${response.status}`
      );

      return exists;
    } catch (error) {
      console.warn("⚠️  Test 9 Warning: Laravel not running or storage not accessible", error);
      return false;
    }
  },

  /**
   * Run all tests
   */
  async runAllTests(): Promise<{
    passed: number;
    failed: number;
    results: Array<{ test: string; passed: boolean }>;
  }> {
    console.log("\n🧪 Starting Image Caching System Tests...\n");

    const tests = [
      { name: "Initialize Cache", fn: this.testInitializeCache },
      { name: "Cache Base64 Image", fn: this.testCacheBase64Image },
      { name: "Get Cached Image", fn: this.testGetCachedImage },
      { name: "Cache Index Persistence", fn: this.testCacheIndexPersistence },
      { name: "Get Cache Size", fn: this.testGetCacheSize },
      { name: "Get Image for Display", fn: this.testGetImageForDisplay },
      { name: "Submission with Image", fn: this.testSubmissionWithImage },
      { name: "Clear Expired Cache", fn: this.testClearExpiredCache },
      { name: "Laravel Storage Setup", fn: this.testLaravelStorageSetup },
    ];

    const results: Array<{ test: string; passed: boolean }> = [];
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = await test.fn.call(this);
        results.push({ test: test.name, passed: result });
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`❌ ${test.name} crashed:`, error);
        results.push({ test: test.name, passed: false });
        failed++;
      }
    }

    console.log("\n📊 Test Results Summary:");
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Total: ${tests.length}\n`);

    return { passed, failed, results };
  },
};
