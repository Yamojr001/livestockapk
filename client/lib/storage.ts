import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";
import type {
  User,
  LivestockSubmission,
  SupportTicket,
  Notification,
} from "@/types";

// Storage keys for organized data management
const STORAGE_KEYS = {
  // Auth & User
  USER: "@livestock_user",
  USERS: "@livestock_users",
  AUTH_TOKEN: "@livestock_auth_token",
  
  // Submissions
  SUBMISSIONS: "@livestock_submissions",
  PENDING_SUBMISSIONS: "@livestock_pending_submissions",
  SYNCED_SUBMISSIONS: "@livestock_synced_submissions",
  FAILED_SUBMISSIONS: "@livestock_failed_submissions",
  
  // Other data
  TICKETS: "@livestock_tickets",
  NOTIFICATIONS: "@livestock_notifications",
  
  // Sync & Metadata
  LAST_SYNC: "@livestock_last_sync",
  APP_SETTINGS: "@livestock_app_settings",
  FARMER_ID_COUNTER: "@livestock_farmer_id_counter_",
};

// Define enhanced submission interface
export interface EnhancedLivestockSubmission extends Omit<LivestockSubmission, 'id'> {
  id: string;
  submission_status: 'pending' | 'synced' | 'failed';
  registration_id: string;
  created_at: string;
  updated_at: string;
  sync_error?: string;
  agent_id?: string | null;
  agent_name?: string | null;
  created_by?: string;
}

export const storage = {
  // ====================
  // AUTH & USER MANAGEMENT
  // ====================
  
  async getUser(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  },

  async setUser(user: User | null): Promise<void> {
    try {
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  },

  async getUsers(): Promise<User[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async setUsers(users: User[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (error) {
      console.error("Error saving users:", error);
    }
  },

  async addUser(user: Omit<User, "id" | "created_date">): Promise<User> {
    const newUser: User = {
      ...user,
      id: uuidv4(),
      created_date: new Date().toISOString(),
    };

    const users = await this.getUsers();
    users.unshift(newUser);
    await this.setUsers(users);

    return newUser;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    try {
      const users = await this.getUsers();
      const index = users.findIndex((u) => u.id === id);
      if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        await this.setUsers(users);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating user:", error);
      return false;
    }
  },

  // ====================
  // SUBMISSIONS MANAGEMENT
  // ====================

  // Get all submissions (combined from all statuses)
  async getAllSubmissions(): Promise<EnhancedLivestockSubmission[]> {
    try {
      const [pending, synced, failed] = await Promise.all([
        this.getPendingSubmissions(),
        this.getSyncedSubmissions(),
        this.getFailedSubmissions(),
      ]);
      return [...pending, ...synced, ...failed];
    } catch (error) {
      console.error("Error getting all submissions:", error);
      return [];
    }
  },

  // Get submissions by status
  async getSubmissions(): Promise<EnhancedLivestockSubmission[]> {
    return this.getAllSubmissions();
  },

  async setSubmissions(submissions: EnhancedLivestockSubmission[]): Promise<void> {
    try {
      // Separate by status
      const pending = submissions.filter(s => s.submission_status === 'pending');
      const synced = submissions.filter(s => s.submission_status === 'synced');
      const failed = submissions.filter(s => s.submission_status === 'failed');

      await Promise.all([
        this.setPendingSubmissions(pending),
        this.setSyncedSubmissions(synced),
        this.setFailedSubmissions(failed),
      ]);
    } catch (error) {
      console.error("Error setting submissions:", error);
    }
  },

  // PENDING SUBMISSIONS
  async getPendingSubmissions(): Promise<EnhancedLivestockSubmission[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SUBMISSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async setPendingSubmissions(
    submissions: EnhancedLivestockSubmission[]
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_SUBMISSIONS,
        JSON.stringify(submissions)
      );
    } catch (error) {
      console.error("Error saving pending submissions:", error);
    }
  },

  async addPendingSubmission(
    submission: Omit<EnhancedLivestockSubmission, "id" | "created_at" | "updated_at" | "submission_status">
  ): Promise<EnhancedLivestockSubmission> {
    const newSubmission: EnhancedLivestockSubmission = {
      ...submission,
      id: uuidv4(),
      submission_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const pending = await this.getPendingSubmissions();
    const updatedPending = [newSubmission, ...pending].slice(0, 500); // Limit to 500
    await this.setPendingSubmissions(updatedPending);

    return newSubmission;
  },

  async removePendingSubmission(id: string): Promise<boolean> {
    try {
      const pending = await this.getPendingSubmissions();
      const updated = pending.filter(sub => sub.id !== id);
      await this.setPendingSubmissions(updated);
      return true;
    } catch (error) {
      console.error("Error removing pending submission:", error);
      return false;
    }
  },

  async clearPendingSubmissions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_SUBMISSIONS);
    } catch (error) {
      console.error("Error clearing pending submissions:", error);
    }
  },

  // SYNCED SUBMISSIONS
  async getSyncedSubmissions(): Promise<EnhancedLivestockSubmission[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNCED_SUBMISSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async setSyncedSubmissions(
    submissions: EnhancedLivestockSubmission[]
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SYNCED_SUBMISSIONS,
        JSON.stringify(submissions)
      );
    } catch (error) {
      console.error("Error saving synced submissions:", error);
    }
  },

  async addSyncedSubmission(
    submission: Omit<EnhancedLivestockSubmission, "id" | "created_at" | "updated_at" | "submission_status">
  ): Promise<EnhancedLivestockSubmission> {
    const newSubmission: EnhancedLivestockSubmission = {
      ...submission,
      id: uuidv4(),
      submission_status: "synced",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const synced = await this.getSyncedSubmissions();
    const updatedSynced = [newSubmission, ...synced].slice(0, 1000); // Limit to 1000
    await this.setSyncedSubmissions(updatedSynced);

    return newSubmission;
  },

  // FAILED SUBMISSIONS
  async getFailedSubmissions(): Promise<EnhancedLivestockSubmission[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FAILED_SUBMISSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async setFailedSubmissions(
    submissions: EnhancedLivestockSubmission[]
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.FAILED_SUBMISSIONS,
        JSON.stringify(submissions)
      );
    } catch (error) {
      console.error("Error saving failed submissions:", error);
    }
  },

  async addFailedSubmission(
    submission: Omit<EnhancedLivestockSubmission, "id" | "created_at" | "updated_at" | "submission_status">,
    error?: string
  ): Promise<EnhancedLivestockSubmission> {
    const newSubmission: EnhancedLivestockSubmission = {
      ...submission,
      id: uuidv4(),
      submission_status: "failed",
      sync_error: error,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const failed = await this.getFailedSubmissions();
    const updatedFailed = [newSubmission, ...failed].slice(0, 100); // Limit to 100
    await this.setFailedSubmissions(updatedFailed);

    return newSubmission;
  },

  // Universal submission adder (detects status)
  async addSubmission(
    submission: Omit<EnhancedLivestockSubmission, "id" | "created_at" | "updated_at">
  ): Promise<EnhancedLivestockSubmission> {
    if (submission.submission_status === 'synced') {
      return this.addSyncedSubmission(submission);
    } else if (submission.submission_status === 'failed') {
      return this.addFailedSubmission(submission);
    } else {
      return this.addPendingSubmission(submission);
    }
  },

  // Move submission between statuses
  async moveSubmissionToSynced(
    pendingId: string,
    serverData?: Partial<EnhancedLivestockSubmission>
  ): Promise<boolean> {
    try {
      const pending = await this.getPendingSubmissions();
      const submission = pending.find(s => s.id === pendingId);
      
      if (!submission) {
        console.warn("Submission not found in pending:", pendingId);
        return false;
      }

      // Remove from pending
      await this.removePendingSubmission(pendingId);

      // Add to synced with server data
      const syncedSubmission: EnhancedLivestockSubmission = {
        ...submission,
        ...serverData,
        submission_status: 'synced',
        updated_at: new Date().toISOString(),
        sync_error: undefined, // Clear any previous error
      };

      const synced = await this.getSyncedSubmissions();
      const updatedSynced = [syncedSubmission, ...synced];
      await this.setSyncedSubmissions(updatedSynced);

      return true;
    } catch (error) {
      console.error("Error moving submission to synced:", error);
      return false;
    }
  },

  async moveSubmissionToFailed(
    submissionId: string,
    error: string,
    fromStatus: 'pending' | 'synced' = 'pending'
  ): Promise<boolean> {
    try {
      let submission: EnhancedLivestockSubmission | undefined;
      
      if (fromStatus === 'pending') {
        const pending = await this.getPendingSubmissions();
        submission = pending.find(s => s.id === submissionId);
        if (submission) {
          await this.removePendingSubmission(submissionId);
        }
      } else {
        const synced = await this.getSyncedSubmissions();
        submission = synced.find(s => s.id === submissionId);
        if (submission) {
          const updatedSynced = synced.filter(s => s.id !== submissionId);
          await this.setSyncedSubmissions(updatedSynced);
        }
      }

      if (!submission) {
        console.warn("Submission not found:", submissionId);
        return false;
      }

      // Add to failed
      const failedSubmission: EnhancedLivestockSubmission = {
        ...submission,
        submission_status: 'failed',
        sync_error: error,
        updated_at: new Date().toISOString(),
      };

      const failed = await this.getFailedSubmissions();
      const updatedFailed = [failedSubmission, ...failed];
      await this.setFailedSubmissions(updatedFailed);

      return true;
    } catch (error) {
      console.error("Error moving submission to failed:", error);
      return false;
    }
  },

  // ====================
  // SYNC MANAGEMENT
  // ====================

  async getLastSync(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    } catch {
      return null;
    }
  },

  async setLastSync(date: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, date);
    } catch (error) {
      console.error("Error saving last sync:", error);
    }
  },

  // ====================
  // NOTIFICATIONS & TICKETS
  // ====================

  async getNotifications(): Promise<Notification[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async setNotifications(notifications: Notification[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.NOTIFICATIONS,
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error("Error saving notifications:", error);
    }
  },

  async addNotification(notification: Omit<Notification, "id" | "created_date">): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: uuidv4(),
      created_date: new Date().toISOString(),
    };

    const notifications = await this.getNotifications();
    notifications.unshift(newNotification);
    await this.setNotifications(notifications);

    return newNotification;
  },

  async markNotificationAsRead(id: string): Promise<boolean> {
    try {
      const notifications = await this.getNotifications();
      const index = notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        notifications[index] = { ...notifications[index], read: true, read_date: new Date().toISOString() };
        await this.setNotifications(notifications);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  },

  // ====================
  // FARMER ID COUNTER
  // ====================

  async getFarmerCounter(agentId: string, lga: string, ward: string): Promise<number> {
    try {
      const key = `${STORAGE_KEYS.FARMER_ID_COUNTER}${agentId}_${lga}_${ward}`;
      const data = await AsyncStorage.getItem(key);
      return data ? parseInt(data, 10) : 0;
    } catch (error) {
      console.error("Error getting farmer counter:", error);
      return 0;
    }
  },

  async incrementFarmerCounter(agentId: string, lga: string, ward: string): Promise<number> {
    try {
      const current = await this.getFarmerCounter(agentId, lga, ward);
      const newValue = current + 1;
      const key = `${STORAGE_KEYS.FARMER_ID_COUNTER}${agentId}_${lga}_${ward}`;
      await AsyncStorage.setItem(key, newValue.toString());
      return newValue;
    } catch (error) {
      console.error("Error incrementing farmer counter:", error);
      return 1;
    }
  },

  async resetFarmerCounter(agentId: string, lga: string, ward: string): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.FARMER_ID_COUNTER}${agentId}_${lga}_${ward}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error("Error resetting farmer counter:", error);
    }
  },

  // ====================
  // STATISTICS & UTILITIES
  // ====================

  async getStats(): Promise<{
    pending: number;
    synced: number;
    failed: number;
    total: number;
  }> {
    try {
      const [pending, synced, failed] = await Promise.all([
        this.getPendingSubmissions(),
        this.getSyncedSubmissions(),
        this.getFailedSubmissions(),
      ]);

      return {
        pending: pending.length,
        synced: synced.length,
        failed: failed.length,
        total: pending.length + synced.length + failed.length,
      };
    } catch (error) {
      console.error("Error getting stats:", error);
      return { pending: 0, synced: 0, failed: 0, total: 0 };
    }
  },

  async getSubmissionsByAgent(agentId: string): Promise<EnhancedLivestockSubmission[]> {
    try {
      const all = await this.getAllSubmissions();
      return all.filter(sub => sub.agent_id === agentId);
    } catch (error) {
      console.error("Error getting submissions by agent:", error);
      return [];
    }
  },

  async getSubmissionsByDateRange(startDate: Date, endDate: Date): Promise<EnhancedLivestockSubmission[]> {
    try {
      const all = await this.getAllSubmissions();
      return all.filter(sub => {
        const createdAt = new Date(sub.created_at);
        return createdAt >= startDate && createdAt <= endDate;
      });
    } catch (error) {
      console.error("Error getting submissions by date range:", error);
      return [];
    }
  },

  async searchSubmissions(query: string): Promise<EnhancedLivestockSubmission[]> {
    try {
      const all = await this.getAllSubmissions();
      const lowerQuery = query.toLowerCase();
      
      return all.filter(sub => 
        sub.farmer_name?.toLowerCase().includes(lowerQuery) ||
        sub.registration_id?.toLowerCase().includes(lowerQuery) ||
        sub.farmer_id?.toLowerCase().includes(lowerQuery) ||
        sub.contact_number?.includes(query) ||
        sub.lga?.toLowerCase().includes(lowerQuery) ||
        sub.ward?.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error("Error searching submissions:", error);
      return [];
    }
  },

  // ====================
  // CLEANUP & MAINTENANCE
  // ====================

  async cleanupOldSubmissions(maxAgeDays: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

      // Clean up pending (keep only recent)
      const pending = await this.getPendingSubmissions();
      const recentPending = pending.filter(sub => new Date(sub.created_at) >= cutoffDate);
      await this.setPendingSubmissions(recentPending);

      // Clean up failed (keep only recent)
      const failed = await this.getFailedSubmissions();
      const recentFailed = failed.filter(sub => new Date(sub.created_at) >= cutoffDate);
      await this.setFailedSubmissions(recentFailed);

      console.log(`Cleaned up ${pending.length - recentPending.length} old pending submissions`);
      console.log(`Cleaned up ${failed.length - recentFailed.length} old failed submissions`);
    } catch (error) {
      console.error("Error cleaning up old submissions:", error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      // Get all keys
      const allKeys = await AsyncStorage.getAllKeys();
      const livestockKeys = allKeys.filter(key => 
        key.startsWith('@livestock_')
      );
      
      await AsyncStorage.multiRemove(livestockKeys);
      console.log("Cleared all livestock data");
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  },

  async exportData(): Promise<string> {
    try {
      const allData = await AsyncStorage.getAllKeys();
      const livestockData: Record<string, any> = {};
      
      for (const key of allData) {
        if (key.startsWith('@livestock_')) {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            livestockData[key] = JSON.parse(value);
          }
        }
      }
      
      return JSON.stringify(livestockData, null, 2);
    } catch (error) {
      console.error("Error exporting data:", error);
      return "{}";
    }
  },

  async importData(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith('@livestock_')) {
          await AsyncStorage.setItem(key, JSON.stringify(value));
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      return false;
    }
  },

  // ====================
  // DEBUG & DIAGNOSTICS
  // ====================

  async getStorageInfo(): Promise<{
    totalKeys: number;
    livestockKeys: number;
    sizeEstimate: number;
    stats: {
      pending: number;
      synced: number;
      failed: number;
      users: number;
      notifications: number;
    };
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const livestockKeys = allKeys.filter(key => key.startsWith('@livestock_'));
      
      const stats = await this.getStats();
      const users = await this.getUsers();
      const notifications = await this.getNotifications();

      // Estimate size (rough)
      let totalSize = 0;
      for (const key of livestockKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }

      return {
        totalKeys: allKeys.length,
        livestockKeys: livestockKeys.length,
        sizeEstimate: totalSize,
        stats: {
          pending: stats.pending,
          synced: stats.synced,
          failed: stats.failed,
          users: users.length,
          notifications: notifications.length,
        },
      };
    } catch (error) {
      console.error("Error getting storage info:", error);
      return {
        totalKeys: 0,
        livestockKeys: 0,
        sizeEstimate: 0,
        stats: { pending: 0, synced: 0, failed: 0, users: 0, notifications: 0 },
      };
    }
  },
};