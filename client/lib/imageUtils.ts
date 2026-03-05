export function extractImageUri(image: any): string | null {
    if (!image) return null;
    if (typeof image === 'string') return image;
    if (image.uri && typeof image.uri === 'string') return image.uri;
    return null;
}

/**
 * Get proper image source for React Native Image component
 * Returns full URL from farmer_image_url or null if no image
 */
export function getFarmerImageUrl(farmer: any): string | null {
    // First check if farmer_image_url exists (full URL from backend)
    if (farmer?.farmer_image_url && typeof farmer.farmer_image_url === 'string') {
        return farmer.farmer_image_url;
    }
    
    // Fallback: check farmer_image field
    if (farmer?.farmer_image && typeof farmer.farmer_image === 'string') {
        // If it's already a full URL, use it
        if (farmer.farmer_image.startsWith('http://') || farmer.farmer_image.startsWith('https://')) {
            return farmer.farmer_image;
        }
        
        // If it's a storage path, construct URL
        // This should not happen with the new backend, but keep for backwards compatibility
        if (farmer.farmer_image.startsWith('storage/')) {
            // Use localhost for local development
            // In production, this should use the actual API URL
            return `livestock.northdemy.com/${farmer.farmer_image}`;
        }
    }
    
    return null;
}

/**
 * Check if farmer has a valid image
 */
export function hasFarmerImage(farmer: any): boolean {
    const url = getFarmerImageUrl(farmer);
    return url !== null && url.length > 0;
}

/**
 * Get image source object for React Native Image component
 * Returns proper source with placeholder fallback
 */
export function getFarmerImageSource(farmer: any): any {
    const url = getFarmerImageUrl(farmer);
    
    if (url) {
        return { uri: url };
    }
    
    // Return require for placeholder - component should handle this
    return null;
}
