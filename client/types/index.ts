// ================================
// ENUM TYPES
// ================================

export type UserRole = "admin" | "agent" | "viewer" | "super_admin";
export type UserStatus = "active" | "inactive" | "suspended" | "pending";
export type SubmissionStatus = "synced" | "pending" | "failed";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type NotificationType = "info" | "success" | "warning" | "error" | "system";
export type NotificationTarget = "all" | "admin" | "agent" | "lga" | "ward" | "association" | "individual";
export type ResourceType = "feed" | "vaccine" | "medicine" | "equipment" | "financial" | "training" | "other";
export type DiseaseStatus = "none" | "suspected" | "confirmed" | "treated" | "recovered";
export type LiteracyStatus = "literate" | "semi_literate" | "illiterate";
export type MembershipStatus = "active" | "inactive" | "suspended" | "honorary" | "executive";
export type Gender = "male" | "female" | "other";
export type BankAccountType = "savings" | "current" | "domiciliary";

// ================================
// USER TYPES
// ================================

export interface User {
  // Core Identification
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  user_role: UserRole;
  status: UserStatus;
  
  // Agent Specific Fields
  agent_serial_number?: number;
  agent_ward_number?: string;
  assigned_lga?: string;
  assigned_ward?: string;
  assigned_association?: string;
  
  // Profile
  user_image?: string;
  nin?: string; // National Identification Number
  bvn?: string; // Bank Verification Number
  address?: string;
  date_of_birth?: string;
  
  // Account & Security
  last_login?: string;
  last_sync?: string;
  email_verified: boolean;
  phone_verified: boolean;
  two_factor_enabled: boolean;
  login_attempts?: number;
  lockout_until?: string;
  
  // Metadata
  created_by?: string;
  created_date: string;
  updated_at?: string;
  deleted_at?: string;
  
  // Permissions (for role-based access)
  permissions?: string[];
  
  // Stats (computed fields)
  submissions_count?: number;
  total_animals_registered?: number;
  last_submission_date?: string;
}

export interface AgentProfile {
  user_id: string;
  agent_code: string;
  lga: string;
  ward: string;
  association?: string;
  supervisor_id?: string;
  supervisor_name?: string;
  territory_description?: string;
  vehicle_number?: string;
  id_card_number?: string;
  issue_date?: string;
  expiry_date?: string;
  is_field_agent: boolean;
  coverage_area?: string[];
  performance_rating?: number;
  total_farmers_registered: number;
  total_animals_registered: number;
  monthly_target: number;
  monthly_achievement: number;
}

export interface UserSession {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string;
  platform: "ios" | "android" | "web";
  app_version: string;
  ip_address?: string;
  location?: string;
  last_active: string;
  expires_at: string;
  is_current: boolean;
  created_at: string;
}

// ================================
// LIVESTOCK SUBMISSION TYPES
// ================================

export interface LivestockSubmission {
  // Identification
  id: string;
  registration_id: string;
  farmer_id: string;
  
  // Farmer Personal Information
  farmer_name: string;
  gender?: Gender;
  age?: number;
  contact_number: string;
  alternative_contact?: string;
  email?: string;
  nin?: string; // National ID
  bvn?: string; // Bank Verification Number
  vin?: string; // Voter ID Number
  
  // Farmer Demographics
  literacy_status?: LiteracyStatus;
  years_of_experience?: number;
  household_size?: number;
  dependents?: number;
  
  // Financial Information
  bank?: string;
  account_number?: string;
  account_type?: BankAccountType;
  account_name?: string;
  monthly_income_range?: string;
  has_loan?: boolean;
  loan_amount?: number;
  loan_source?: string;
  
  // Location Information
  lga: string;
  ward: string;
  village?: string;
  settlement?: string;
  address?: string;
  geo_location?: string; // GPS coordinates
  latitude?: number;
  longitude?: number;
  altitude?: number;
  accuracy?: number;
  
  // Association Details
  association: string;
  membership_id?: string;
  membership_status?: MembershipStatus;
  membership_date?: string;
  executive_position?: string;
  committee_member?: boolean;
  
  // Livestock Information
  number_of_animals: number;
  livestock_type?: string[]; // e.g., ["cattle", "sheep", "goats"]
  breed?: string[];
  average_age?: number;
  purpose?: string[]; // e.g., ["milk", "meat", "breeding", "draft"]
  
  // Health Information
  has_disease?: boolean;
  disease_name?: string;
  disease_description?: string;
  disease_status?: DiseaseStatus;
  symptoms?: string[];
  treatment_received?: boolean;
  treatment_details?: string;
  vaccination_status?: boolean;
  last_vaccination_date?: string;
  veterinary_contact?: string;
  
  // Feed & Nutrition
  primary_feed_source?: string;
  secondary_feed_source?: string;
  feed_quantity_daily?: number;
  water_source?: string;
  supplement_usage?: boolean;
  supplement_type?: string;
  
  // Housing & Management
  housing_type?: string;
  housing_condition?: string;
  waste_management?: string;
  biosecurity_measures?: string[];
  
  // Production Data
  milk_production_daily?: number;
  meat_production_yearly?: number;
  breeding_rate?: number;
  mortality_rate?: number;
  
  // Market Information
  market_access?: string;
  market_distance?: number;
  selling_channel?: string[];
  average_price?: number;
  challenges?: string[];
  
  // Images
  farmer_image?: string; // Image URI or URL
  farm_image?: string;
  livestock_image?: string[];
  document_images?: string[]; // ID cards, etc.
  
  // Agent Information
  agent_id: string;
  agent_name: string;
  agent_serial_number?: number;
  agent_lga?: string;
  agent_ward?: string;
  
  // Submission Metadata
  submission_status: SubmissionStatus;
  submission_method?: "mobile" | "web" | "sync";
  created_by: string;
  created_date: string;
  updated_at?: string;
  synced_at?: string;
  sync_error?: string;
  sync_attempts?: number;
  
  // Verification
  verified: boolean;
  verified_by?: string;
  verified_date?: string;
  verification_notes?: string;
  
  // Comments & Notes
  comments?: string;
  recommendations?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  
  // Audit Fields
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
  version?: number;
}

export interface LivestockSubmissionSummary {
  id: string;
  registration_id: string;
  farmer_name: string;
  contact_number: string;
  lga: string;
  ward: string;
  association: string;
  number_of_animals: number;
  submission_status: SubmissionStatus;
  created_date: string;
  agent_name: string;
}

// ================================
// SUPPORT TICKET TYPES
// ================================

export interface SupportTicket {
  // Core Information
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  
  // Categorization
  category: string;
  subcategory?: string;
  priority: TicketPriority;
  status: TicketStatus;
  
  // Related Entities
  agent_id: string;
  agent_name: string;
  agent_lga?: string;
  agent_ward?: string;
  submission_id?: string;
  farmer_id?: string;
  farmer_name?: string;
  
  // Assignment & Resolution
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_date?: string;
  resolved_by?: string;
  resolved_date?: string;
  resolution_notes?: string;
  satisfaction_rating?: number;
  
  // Attachments
  attachments?: string[];
  images?: string[];
  
  // Metadata
  created_by: string;
  created_date: string;
  updated_at?: string;
  last_activity?: string;
  due_date?: string;
  escalation_level?: number;
  
  // Communication
  communication_method?: "app" | "phone" | "email" | "in_person";
  contact_preference?: string;
  
  // Audit
  is_deleted?: boolean;
  deleted_at?: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  comment: string;
  is_internal: boolean;
  attachments?: string[];
  created_date: string;
  updated_at?: string;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_by: string;
  uploaded_date: string;
}

// ================================
// NOTIFICATION TYPES
// ================================

export interface Notification {
  // Core Information
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  
  // Targeting
  target_type: NotificationTarget;
  target_lga?: string;
  target_ward?: string;
  target_association?: string;
  target_agent_id?: string;
  target_role?: UserRole;
  
  // Action & Navigation
  action_url?: string;
  action_label?: string;
  deep_link?: string;
  metadata?: Record<string, any>;
  
  // Status & Delivery
  is_read: boolean;
  is_archived: boolean;
  read_date?: string;
  archived_date?: string;
  delivered: boolean;
  delivery_date?: string;
  
  // Scheduling
  send_immediately: boolean;
  scheduled_for?: string;
  expires_at?: string;
  
  // Metadata
  created_by: string;
  created_date: string;
  updated_at?: string;
  
  // Priority
  priority: "low" | "normal" | "high";
  
  // Acknowledgement
  requires_acknowledgement: boolean;
  acknowledged_by?: string;
  acknowledged_date?: string;
}

export interface NotificationPreference {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  in_app_notifications: boolean;
  notification_categories: {
    submissions: boolean;
    tickets: boolean;
    distributions: boolean;
    system: boolean;
    marketing: boolean;
  };
  quiet_hours?: {
    enabled: boolean;
    start_time: string;
    end_time: string;
  };
}

// ================================
// DISTRIBUTION TYPES
// ================================

export interface Distribution {
  // Core Information
  id: string;
  distribution_code: string;
  beneficiary_id: string;
  registration_id: string;
  
  // Beneficiary Information
  beneficiary_name: string;
  beneficiary_phone?: string;
  beneficiary_nin?: string;
  beneficiary_bvn?: string;
  
  // Location
  lga: string;
  ward: string;
  village?: string;
  distribution_center?: string;
  
  // Resource Details
  resource_type: ResourceType;
  resource_name: string;
  resource_description?: string;
  quantity: number;
  unit_of_measure: string;
  unit_value: number;
  total_value: number;
  batch_number?: string;
  expiry_date?: string;
  
  // Allocation Details
  allocation_date: string;
  allocated_by: string;
  allocated_by_name: string;
  allocation_notes?: string;
  allocation_method: "manual" | "automated" | "emergency";
  
  // Collection Details
  collected: boolean;
  collected_date?: string;
  collected_by_agent?: string;
  collected_by_name?: string;
  collection_verification?: string; // OTP, signature, etc.
  collection_location?: string;
  collection_notes?: string;
  
  // Distribution Program
  program_id?: string;
  program_name?: string;
  program_type?: "regular" | "emergency" | "pilot";
  funding_source?: string;
  
  // Verification
  verified: boolean;
  verified_by?: string;
  verified_date?: string;
  verification_method?: "biometric" | "qr_code" | "signature" | "photo";
  
  // Follow-up
  follow_up_required: boolean;
  follow_up_date?: string;
  follow_up_completed?: boolean;
  follow_up_notes?: string;
  
  // Metadata
  created_date: string;
  updated_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
}

export interface DistributionProgram {
  id: string;
  name: string;
  description?: string;
  type: "regular" | "emergency" | "pilot" | "seasonal";
  start_date: string;
  end_date?: string;
  status: "planning" | "active" | "paused" | "completed" | "cancelled";
  budget?: number;
  funding_source?: string;
  target_lgas?: string[];
  target_wards?: string[];
  target_associations?: string[];
  eligibility_criteria?: Record<string, any>;
  resources: DistributionResource[];
  created_by: string;
  created_date: string;
  updated_at?: string;
}

export interface DistributionResource {
  id: string;
  program_id: string;
  resource_type: ResourceType;
  name: string;
  description?: string;
  total_quantity: number;
  allocated_quantity: number;
  remaining_quantity: number;
  unit_of_measure: string;
  unit_value: number;
  storage_location?: string;
  batch_number?: string;
  expiry_date?: string;
  supplier?: string;
  delivery_date?: string;
}

// ================================
// LOCATION & ASSOCIATION TYPES
// ================================

export interface LGA {
  code: string;
  name: string;
  state: string;
  total_wards: number;
  total_associations: number;
  total_farmers: number;
  total_animals: number;
  created_date: string;
}

export interface Ward {
  code: string;
  name: string;
  lga_code: string;
  lga_name: string;
  villages: string[];
  total_associations: number;
  total_farmers: number;
  total_animals: number;
  created_date: string;
}

export interface Association {
  id: string;
  name: string;
  code?: string;
  type: "livestock" | "agriculture" | "cooperative" | "union";
  lga: string;
  ward: string;
  village?: string;
  registration_number?: string;
  registration_date?: string;
  chairman_name?: string;
  chairman_phone?: string;
  secretary_name?: string;
  secretary_phone?: string;
  total_members: number;
  total_animals: number;
  meeting_frequency?: string;
  last_meeting_date?: string;
  status: "active" | "inactive" | "suspended";
  created_date: string;
  updated_at?: string;
}

// ================================
// REPORT & ANALYTICS TYPES
// ================================

export interface DashboardStats {
  // Overview
  total_submissions: number;
  total_animals: number;
  total_farmers: number;
  total_agents: number;
  
  // Status Breakdown
  pending_sync: number;
  synced_online: number;
  failed_sync: number;
  
  // Time-based
  submissions_today: number;
  submissions_this_week: number;
  submissions_this_month: number;
  animals_today: number;
  animals_this_week: number;
  animals_this_month: number;
  
  // Agent Performance
  active_agents_today: number;
  top_performing_agents: Array<{
    agent_id: string;
    agent_name: string;
    submissions: number;
    animals: number;
  }>;
  
  // Location Breakdown
  by_lga: Array<{
    lga: string;
    submissions: number;
    animals: number;
    farmers: number;
  }>;
  
  by_ward: Array<{
    ward: string;
    lga: string;
    submissions: number;
    animals: number;
  }>;
  
  by_association: Array<{
    association: string;
    submissions: number;
    animals: number;
  }>;
  
  // Recent Activity
  recent_submissions: Array<{
    id: string;
    farmer_name: string;
    lga: string;
    ward: string;
    created_at: string;
    submission_status: SubmissionStatus;
    number_of_animals: number;
  }>;
  
  // System Health
  sync_success_rate: number;
  average_sync_time: number;
  storage_usage: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface Report {
  id: string;
  title: string;
  type: "submissions" | "distributions" | "performance" | "financial" | "custom";
  format: "pdf" | "excel" | "csv" | "json";
  filters: Record<string, any>;
  generated_by: string;
  generated_date: string;
  file_url?: string;
  file_size?: number;
  status: "pending" | "generating" | "completed" | "failed";
  download_count: number;
  expires_at?: string;
}

// ================================
// SYSTEM & SETTINGS TYPES
// ================================

export interface AppSettings {
  // Sync Settings
  auto_sync: boolean;
  sync_interval: number; // minutes
  sync_on_wifi_only: boolean;
  sync_on_charging: boolean;
  
  // Data Settings
  keep_data_days: number;
  max_image_size: number; // KB
  image_quality: number; // 0-100
  
  // Notification Settings
  enable_notifications: boolean;
  notification_sound: boolean;
  notification_vibration: boolean;
  
  // Privacy Settings
  collect_location: boolean;
  collect_analytics: boolean;
  backup_to_cloud: boolean;
  
  // Display Settings
  theme: "light" | "dark" | "auto";
  font_size: "small" | "medium" | "large";
  language: "en" | "ha" | "yo" | "ig"; // English, Hausa, Yoruba, Igbo
  
  // Security
  require_pin: boolean;
  auto_lock_minutes: number;
  
  // Version
  app_version: string;
  last_settings_update: string;
}

export interface SyncLog {
  id: string;
  sync_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  status: "started" | "in_progress" | "completed" | "failed";
  submissions_total: number;
  submissions_synced: number;
  submissions_failed: number;
  errors?: string[];
  device_info: {
    platform: string;
    version: string;
    battery_level?: number;
    network_type?: string;
  };
  created_date: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: string;
  resource_type: string;
  resource_id?: string;
  changes?: Record<string, any>;
  ip_address?: string;
  device_info?: string;
  location?: string;
  created_date: string;
}

// ================================
// API RESPONSE TYPES
// ================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

// ================================
// FORM & VALIDATION TYPES
// ================================

export interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "email" | "phone" | "select" | "multiselect" | "date" | "textarea" | "image" | "location" | "checkbox";
  required: boolean;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
  helpText?: string;
}

export interface FormError {
  field: string;
  message: string;
}

// ================================
// ENUM CONSTANTS
// ================================

export const USER_ROLES = {
  ADMIN: "admin" as UserRole,
  AGENT: "agent" as UserRole,
  VIEWER: "viewer" as UserRole,
  SUPER_ADMIN: "super_admin" as UserRole,
};

export const SUBMISSION_STATUSES = {
  SYNCED: "synced" as SubmissionStatus,
  PENDING: "pending" as SubmissionStatus,
  FAILED: "failed" as SubmissionStatus,
};

export const TICKET_STATUSES = {
  OPEN: "open" as TicketStatus,
  IN_PROGRESS: "in_progress" as TicketStatus,
  RESOLVED: "resolved" as TicketStatus,
  CLOSED: "closed" as TicketStatus,
};

export const TICKET_PRIORITIES = {
  LOW: "low" as TicketPriority,
  MEDIUM: "medium" as TicketPriority,
  HIGH: "high" as TicketPriority,
  URGENT: "urgent" as TicketPriority,
};

export const NOTIFICATION_TYPES = {
  INFO: "info" as NotificationType,
  SUCCESS: "success" as NotificationType,
  WARNING: "warning" as NotificationType,
  ERROR: "error" as NotificationType,
  SYSTEM: "system" as NotificationType,
};

export const RESOURCE_TYPES = {
  FEED: "feed" as ResourceType,
  VACCINE: "vaccine" as ResourceType,
  MEDICINE: "medicine" as ResourceType,
  EQUIPMENT: "equipment" as ResourceType,
  FINANCIAL: "financial" as ResourceType,
  TRAINING: "training" as ResourceType,
  OTHER: "other" as ResourceType,
};

// ================================
// HELPER TYPES
// ================================

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type Require<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type Nullable<T> = T | null;
export type Maybe<T> = T | undefined;

// ================================
// EVENT TYPES
// ================================

export interface SyncEvent {
  type: "sync_started" | "sync_progress" | "sync_completed" | "sync_failed";
  data: {
    total?: number;
    processed?: number;
    synced?: number;
    failed?: number;
    error?: string;
    currentSubmission?: string;
  };
  timestamp: string;
}

export interface NetworkEvent {
  type: "online" | "offline";
  timestamp: string;
}

export interface AuthEvent {
  type: "login" | "logout" | "token_expired" | "unauthorized";
  user?: User;
  timestamp: string;
}

// ================================
// EXPORT ALL TYPES
// ================================

export type {
  UserRole,
  UserStatus,
  SubmissionStatus,
  TicketStatus,
  TicketPriority,
  NotificationType,
  NotificationTarget,
  ResourceType,
  DiseaseStatus,
  LiteracyStatus,
  MembershipStatus,
  Gender,
  BankAccountType,
};

export type {
  User,
  AgentProfile,
  UserSession,
  LivestockSubmission,
  LivestockSubmissionSummary,
  SupportTicket,
  TicketComment,
  TicketAttachment,
  Notification,
  NotificationPreference,
  Distribution,
  DistributionProgram,
  DistributionResource,
  LGA,
  Ward,
  Association,
  DashboardStats,
  Report,
  AppSettings,
  SyncLog,
  AuditLog,
  ApiResponse,
  PaginatedResponse,
  FormField,
  FormError,
  SyncEvent,
  NetworkEvent,
  AuthEvent,
};