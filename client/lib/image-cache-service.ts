import * as FileSystem from "expo-file-system";

export interface CachedImage {
  uri: string;
  imagePath: string;
  cachedAt: string;
  expiresAt: string;
}

const CACHE_DIR = `${FileSystem.documentDirectory || ''}livestock_image_cache/`;
const CACHE_INDEX_KEY = "@livestock_image_cache_index";
const CACHE_DURATION_DAYS = 30; // Cache images for 30 days

export const imageCacheService = {
  async initCache(): Promise<void> {
    try {
      // Create cache directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
        console.log("Image cache directory created");
      }
    } catch (error) {
      console.error("Failed to initialize image cache:", error);
    }
  },

  async cacheImageFromUrl(imageUrl: string, imageName?: string): Promise<CachedImage | null> {
    try {
      // Don't cache local files or data URIs
      if (!imageUrl.startsWith("http")) {
        return null;
      }

      await this.initCache();

      const fileName = imageName || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const fileUri = `${CACHE_DIR}${fileName}`;

      // Check if already cached
      const cacheIndex = await this.getCacheIndex();
      const cached = cacheIndex.find(c => c.uri === imageUrl);
      if (cached && cached.imagePath) {
        const fileInfo = await FileSystem.getInfoAsync(cached.imagePath);
        if (fileInfo.exists) {
          // Update expiration
          cached.expiresAt = new Date(
            Date.now() + CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000
          ).toISOString();
          await this.saveCacheIndex(cacheIndex);
          return cached;
        }
      }

      // Download and cache the image
      console.log("Downloading image:", imageUrl);
      await FileSystem.downloadAsync(imageUrl, fileUri);

      const cacheEntry: CachedImage = {
        uri: imageUrl,
        imagePath: fileUri,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000
        ).toISOString(),
      };

      // Add to cache index
      cacheIndex.push(cacheEntry);
      await this.saveCacheIndex(cacheIndex);

      console.log("Image cached successfully:", fileUri);
      return cacheEntry;
    } catch (error) {
      console.error("Failed to cache image from URL:", error);
      return null;
    }
  },

  async cacheImageFromBase64(
    base64Data: string,
    imageId: string
  ): Promise<CachedImage | null> {
    try {
      await this.initCache();

      const fileName = `${imageId}_${Date.now()}.jpg`;
      const fileUri = `${CACHE_DIR}${fileName}`;

      // Remove data URI prefix if present
      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

      // Write file
      await FileSystem.writeAsStringAsync(fileUri, cleanBase64, {
        encoding: 'base64' as any,
      });

      const cacheEntry: CachedImage = {
        uri: `base64_${imageId}`,
        imagePath: fileUri,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000
        ).toISOString(),
      };

      // Add to cache index
      const cacheIndex = await this.getCacheIndex();
      const existingIndex = cacheIndex.findIndex(c => c.uri === cacheEntry.uri);
      if (existingIndex >= 0) {
        cacheIndex[existingIndex] = cacheEntry;
      } else {
        cacheIndex.push(cacheEntry);
      }
      await this.saveCacheIndex(cacheIndex);

      console.log("Base64 image cached successfully:", fileUri);
      return cacheEntry;
    } catch (error) {
      console.error("Failed to cache image from base64:", error);
      return null;
    }
  },

  async getCachedImage(imageUrl: string): Promise<string | null> {
    try {
      const cacheIndex = await this.getCacheIndex();
      const cached = cacheIndex.find(c => c.uri === imageUrl);

      if (cached && cached.imagePath) {
        // Check if file exists and not expired
        const fileInfo = await FileSystem.getInfoAsync(cached.imagePath);
        if (fileInfo.exists) {
          const expiresAt = new Date(cached.expiresAt);
          if (expiresAt > new Date()) {
            return cached.imagePath;
          } else {
            // Remove expired cache
            await FileSystem.deleteAsync(cached.imagePath, { idempotent: true });
            const newIndex = cacheIndex.filter(c => c.uri !== imageUrl);
            await this.saveCacheIndex(newIndex);
          }
        } else {
          // File doesn't exist, remove from index
          const newIndex = cacheIndex.filter(c => c.uri !== imageUrl);
          await this.saveCacheIndex(newIndex);
        }
      }

      return null;
    } catch (error) {
      console.error("Failed to get cached image:", error);
      return null;
    }
  },

  async getCacheIndex(): Promise<CachedImage[]> {
    try {
      const data = await FileSystem.readAsStringAsync(
        `${CACHE_DIR}.cache_index.json`,
        { encoding: 'utf8' as any }
      );
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  async saveCacheIndex(index: CachedImage[]): Promise<void> {
    try {
      await FileSystem.writeAsStringAsync(
        `${CACHE_DIR}.cache_index.json`,
        JSON.stringify(index),
        { encoding: 'utf8' as any }
      );
    } catch (error) {
      console.error("Failed to save cache index:", error);
    }
  },

  async clearExpiredCache(): Promise<void> {
    try {
      const cacheIndex = await this.getCacheIndex();
      const now = new Date();
      const validCache: CachedImage[] = [];

      for (const entry of cacheIndex) {
        const expiresAt = new Date(entry.expiresAt);
        if (expiresAt > now) {
          validCache.push(entry);
        } else {
          // Delete expired file
          try {
            await FileSystem.deleteAsync(entry.imagePath, { idempotent: true });
          } catch (error) {
            console.error("Failed to delete expired cache file:", error);
          }
        }
      }

      await this.saveCacheIndex(validCache);
      console.log("Expired cache cleared");
    } catch (error) {
      console.error("Failed to clear expired cache:", error);
    }
  },

  async clearAllCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      console.log("All image cache cleared");
    } catch (error) {
      console.error("Failed to clear all cache:", error);
    }
  },

  async getCacheSize(): Promise<number> {
    try {
      const cacheIndex = await this.getCacheIndex();
      let totalSize = 0;

      for (const entry of cacheIndex) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(entry.imagePath);
          if (fileInfo.exists && fileInfo.size) {
            totalSize += fileInfo.size;
          }
        } catch {
          // Skip files that can't be accessed
        }
      }

      return totalSize;
    } catch (error) {
      console.error("Failed to get cache size:", error);
      return 0;
    }
  },

  async getImageForDisplay(imageUrl: string | null | undefined): Promise<string | null> {
    if (!imageUrl) return null;

    // Local files, data URIs, and file URIs can be used directly
    if (
      imageUrl.startsWith("file://") ||
      imageUrl.startsWith("data:") ||
      imageUrl.startsWith("blob:")
    ) {
      return imageUrl;
    }

    // For remote URLs, try to get cached version first
    if (imageUrl.startsWith("http")) {
      const cached = await this.getCachedImage(imageUrl);
      if (cached) {
        return cached;
      }
      // If not cached, return original URL (will be downloaded on demand)
      return imageUrl;
    }

    return null;
  },
};
