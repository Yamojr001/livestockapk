// You can create a separate utils.ts file for these

// Type for API error response
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

// Type for pagination params
export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// Type for filter params
export interface FilterParams {
  search?: string;
  lga?: string;
  ward?: string;
  association?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  agent_id?: string;
}

// Type for upload response
export interface UploadResponse {
  url: string;
  path: string;
  filename: string;
  size: number;
  mime_type: string;
}

// Type for location coordinates
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp?: number;
}

// Type for offline sync queue item
export interface SyncQueueItem {
  id: string;
  type: "create" | "update" | "delete";
  endpoint: string;
  data: any;
  attempts: number;
  max_attempts: number;
  last_attempt?: string;
  error?: string;
  created_at: string;
}

// Type for cache item
export interface CacheItem<T> {
  data: T;
  expires_at: string;
  created_at: string;
  version: number;
}