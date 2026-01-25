import { storage } from "@/lib/storage";
import { apiRequest } from "@/lib/api-config";

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{
    submissionId: string;
    registrationId: string;
    error: string;
  }>;
}

export interface SyncProgress {
  total: number;
  processed: number;
  synced: number;
  failed: number;
  currentSubmission?: string;
}

export class SyncService {
  private isSyncing = false;
  private progressCallbacks: Array<(progress: SyncProgress) => void> = [];

  // Subscribe to sync progress
  onProgress(callback: (progress: SyncProgress) => void): () => void {
    this.progressCallbacks.push(callback);
    return () => {
      this.progressCallbacks = this.progressCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyProgress(progress: SyncProgress) {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error("Error in progress callback:", error);
      }
    });
  }

  // Sync all pending submissions
  async syncPendingSubmissions(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: [{ submissionId: "", registrationId: "", error: "Sync already in progress" }],
      };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: false,
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Get all pending submissions
      const pendingSubmissions = await storage.getPendingSubmissions();
      
      if (pendingSubmissions.length === 0) {
        result.success = true;
        this.isSyncing = false;
        return result;
      }

      const progress: SyncProgress = {
        total: pendingSubmissions.length,
        processed: 0,
        synced: 0,
        failed: 0,
      };

      this.notifyProgress(progress);

      // Sync each submission individually for better error handling
      for (const submission of pendingSubmissions) {
        try {
          progress.currentSubmission = submission.registration_id;
          this.notifyProgress(progress);

          // Prepare data for API (exclude local fields)
          const apiData = this.prepareApiData(submission);

          // Send to server
          const response = await apiRequest("/submissions", {
            method: "POST",
            body: apiData,
          });

          if (response.success && response.data) {
            // Move from pending to synced
            const success = await storage.moveSubmissionToSynced(
              submission.id,
              response.data
            );

            if (success) {
              result.synced++;
              progress.synced++;
            } else {
              result.failed++;
              progress.failed++;
              result.errors.push({
                submissionId: submission.id,
                registrationId: submission.registration_id,
                error: "Failed to move to synced storage",
              });
            }
          } else {
            // Mark as failed
            const errorMessage = response.error || "Server rejected submission";
            const success = await storage.moveSubmissionToFailed(
              submission.id,
              errorMessage,
              'pending'
            );

            if (success) {
              result.failed++;
              progress.failed++;
              result.errors.push({
                submissionId: submission.id,
                registrationId: submission.registration_id,
                error: errorMessage,
              });
            }
          }
        } catch (error: any) {
          console.error("Error syncing submission:", submission.registration_id, error);
          
          const success = await storage.moveSubmissionToFailed(
            submission.id,
            error.message || "Network error",
            'pending'
          );

          if (success) {
            result.failed++;
            progress.failed++;
            result.errors.push({
              submissionId: submission.id,
              registrationId: submission.registration_id,
              error: error.message || "Network error",
            });
          }
        }

        progress.processed++;
        this.notifyProgress(progress);
      }

      // Update last sync time if any were successful
      if (result.synced > 0) {
        await storage.setLastSync(new Date().toISOString());
      }

      result.success = result.synced > 0 || result.failed === 0;
      
      // Cleanup old failed submissions
      await storage.cleanupOldSubmissions();

    } catch (error: any) {
      console.error("Fatal sync error:", error);
      result.errors.push({
        submissionId: "",
        registrationId: "",
        error: `Fatal: ${error.message}`,
      });
    } finally {
      this.isSyncing = false;
      this.notifyProgress({
        total: 0,
        processed: 0,
        synced: 0,
        failed: 0,
      });
    }

    return result;
  }

  // Batch sync (more efficient for large numbers)
  async syncBatchSubmissions(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      const pendingSubmissions = await storage.getPendingSubmissions();
      
      if (pendingSubmissions.length === 0) {
        result.success = true;
        return result;
      }

      // Prepare batch data
      const batchData = pendingSubmissions.map(sub => this.prepareApiData(sub));

      // Send batch to server
      const response = await apiRequest("/submissions/sync", {
        method: "POST",
        body: { submissions: batchData },
      });

      if (response.success && response.data) {
        const { synced_count = 0, failed_count = 0, data: syncedData = [], errors = [] } = response.data;

        // Process successful submissions
        for (let i = 0; i < syncedData.length; i++) {
          const serverData = syncedData[i];
          const originalSubmission = pendingSubmissions[i];
          
          if (originalSubmission) {
            const success = await storage.moveSubmissionToSynced(
              originalSubmission.id,
              serverData
            );
            
            if (success) {
              result.synced++;
            } else {
              result.failed++;
              result.errors.push({
                submissionId: originalSubmission.id,
                registrationId: originalSubmission.registration_id,
                error: "Failed to update local storage",
              });
            }
          }
        }

        // Process errors
        for (const error of errors) {
          const originalSubmission = pendingSubmissions[error.index];
          if (originalSubmission) {
            const success = await storage.moveSubmissionToFailed(
              originalSubmission.id,
              error.error || "Batch sync error",
              'pending'
            );
            
            if (success) {
              result.failed++;
              result.errors.push({
                submissionId: originalSubmission.id,
                registrationId: originalSubmission.registration_id,
                error: error.error,
              });
            }
          }
        }

        // Handle any remaining (should match failed_count)
        const remaining = pendingSubmissions.length - result.synced - result.failed;
        for (let i = 0; i < remaining; i++) {
          const originalSubmission = pendingSubmissions[result.synced + result.failed + i];
          if (originalSubmission) {
            const success = await storage.moveSubmissionToFailed(
              originalSubmission.id,
              "Unknown batch sync error",
              'pending'
            );
            
            if (success) {
              result.failed++;
              result.errors.push({
                submissionId: originalSubmission.id,
                registrationId: originalSubmission.registration_id,
                error: "Unknown error in batch sync",
              });
            }
          }
        }

        if (result.synced > 0) {
          await storage.setLastSync(new Date().toISOString());
        }

        result.success = result.synced > 0;
      } else {
        // Batch failed entirely
        result.failed = pendingSubmissions.length;
        result.errors.push({
          submissionId: "",
          registrationId: "",
          error: response.error || "Batch sync failed",
        });
      }
    } catch (error: any) {
      console.error("Batch sync error:", error);
      result.errors.push({
        submissionId: "",
        registrationId: "",
        error: `Batch: ${error.message}`,
      });
    }

    return result;
  }

  // Retry failed submissions
  async retryFailedSubmissions(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      const failedSubmissions = await storage.getFailedSubmissions();
      
      if (failedSubmissions.length === 0) {
        result.success = true;
        return result;
      }

      // Move all failed back to pending for retry
      for (const submission of failedSubmissions) {
        try {
          // Remove from failed
          const failed = await storage.getFailedSubmissions();
          const updatedFailed = failed.filter(s => s.id !== submission.id);
          await storage.setFailedSubmissions(updatedFailed);

          // Add to pending with cleared error
          const pendingSubmission: any = {
            ...submission,
            submission_status: 'pending' as const,
            sync_error: undefined,
            updated_at: new Date().toISOString(),
          };
          
          delete pendingSubmission.id; // Will get new ID
          
          await storage.addPendingSubmission(pendingSubmission);
        } catch (error: any) {
          console.error("Error moving failed submission:", submission.registration_id, error);
          result.errors.push({
            submissionId: submission.id,
            registrationId: submission.registration_id,
            error: `Failed to retry: ${error.message}`,
          });
        }
      }

      // Now sync the newly pending submissions
      const syncResult = await this.syncPendingSubmissions();
      
      result.synced = syncResult.synced;
      result.failed = syncResult.failed;
      result.errors = [...result.errors, ...syncResult.errors];
      result.success = syncResult.success;

    } catch (error: any) {
      console.error("Retry failed submissions error:", error);
      result.errors.push({
        submissionId: "",
        registrationId: "",
        error: `Retry failed: ${error.message}`,
      });
    }

    return result;
  }

  // Check sync status
  async getSyncStatus(): Promise<{
    pending: number;
    synced: number;
    failed: number;
    lastSync: string | null;
    isSyncing: boolean;
  }> {
    const stats = await storage.getStats();
    const lastSync = await storage.getLastSync();
    
    return {
      pending: stats.pending,
      synced: stats.synced,
      failed: stats.failed,
      lastSync,
      isSyncing: this.isSyncing,
    };
  }

  // Auto-sync when conditions are met
  async autoSync(force: boolean = false): Promise<void> {
    if (this.isSyncing && !force) {
      return;
    }

    try {
      const stats = await storage.getStats();
      
      // Only auto-sync if we have pending submissions
      if (stats.pending > 0) {
        console.log(`Auto-syncing ${stats.pending} pending submissions...`);
        await this.syncPendingSubmissions();
      }
    } catch (error) {
      console.error("Auto-sync error:", error);
    }
  }

  // Prepare submission data for API
  private prepareApiData(submission: any): any {
    // Remove local-only fields
    const { 
      id, 
      submission_status, 
      sync_error, 
      created_at, 
      updated_at,
      ...apiData 
    } = submission;

    return apiData;
  }

  // Force stop sync
  stopSync(): void {
    // Note: This won't stop in-progress fetch requests
    this.isSyncing = false;
  }
}

// Singleton instance
export const syncService = new SyncService();