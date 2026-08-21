// ─── User & Auth ─────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'client' | 'tech' | 'lead_tech';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

// ─── Property ─────────────────────────────────────────────────────────────────
export type PropertyType = 'condo' | 'townhome' | 'single_family' | 'cabin' | 'apartment' | 'other';

export interface Property {
  id: string;
  clientId: string;
  nickname: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  maxOccupancy: number;
  strPlatforms: string[];
  avgNightlyRate?: number;
  avgTurnoverWindowHours?: number;
  isActive: boolean;
  sopComplete: boolean;
  createdAt: Date;
}

export interface PropertyAccess {
  propertyId: string;
  keyMethod: 'lockbox' | 'smart_lock' | 'keypad' | 'physical_key' | 'other';
  entryCode?: string;
  garageCode?: string;
  gateCode?: string;
  parkingInstructions?: string;
  specialAccessNotes?: string;
  wifiNetwork?: string;
  wifiPassword?: string;
}

// ─── Job ──────────────────────────────────────────────────────────────────────
export type JobType = 'turnover' | 'move_in_out' | 'inspection' | 'deep_clean' | 'light_repair' | 'exterior' | 'junk_removal' | 'custom';
export type JobStatus = 'scheduled' | 'active' | 'in_progress' | 'completed' | 'flagged' | 'cancelled';

export interface Job {
  id: string;
  propertyId: string;
  property?: Property;
  jobType: JobType;
  status: JobStatus;
  scheduledDate: string; // ISO date string
  checkinDeadline?: Date;
  assignedTechId?: string;
  assignedTech?: User;
  leadTechId?: string;
  clockedInAt?: Date;
  clockedOutAt?: Date;
  completedAt?: Date;
  completionNotifiedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Checklist ────────────────────────────────────────────────────────────────
export type ChecklistStatus = 'pending' | 'pass' | 'fail' | 'na';

export interface ChecklistItem {
  id: string;
  jobId: string;
  roomType: string;
  roomLabel: string;
  taskText: string;
  status: ChecklistStatus;
  completedBy?: string;
  completedAt?: Date;
  failNote?: string;
  sortOrder: number;
}

// ─── Photos ───────────────────────────────────────────────────────────────────
export type PhotoType = 'before' | 'after' | 'damage' | 'flag' | 'milestone';

export interface JobPhoto {
  id: string;
  jobId: string;
  checklistItemId?: string;
  photoType: PhotoType;
  roomLabel?: string;
  storageUrl: string;
  takenAt: Date;
  uploadedBy: string;
  caption?: string;
  createdAt: Date;
}

// ─── Flags ────────────────────────────────────────────────────────────────────
export type FlagType = 'damage' | 'missing_item' | 'maintenance' | 'rule_violation' | 'safety' | 'other';
export type FlagSeverity = 'routine' | 'needs_attention' | 'urgent';
export type FlagStatus = 'open' | 'acknowledged' | 'resolved';

export interface JobFlag {
  id: string;
  jobId: string;
  flaggedBy: string;
  roomLabel?: string;
  flagType: FlagType;
  severity: FlagSeverity;
  description: string;
  photoUrls?: string[];
  status: FlagStatus;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  flaggedAt: Date;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export type NotificationType =
  | 'job_started'
  | 'task_completed'
  | 'photo_uploaded'
  | 'flag_raised'
  | 'job_completed'
  | 'low_stock'
  | 'urgent_flag';

export interface Notification {
  id: string;
  userId: string;
  jobId?: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

// ─── SOP ──────────────────────────────────────────────────────────────────────
export interface SopTask {
  id: string;
  propertyId: string;
  roomType: string;
  roomLabel: string;
  taskText: string;
  isStandard: boolean;
  sortOrder: number;
  isActive: boolean;
}

// ─── Onboarding Code ──────────────────────────────────────────────────────────
export interface OnboardingCode {
  id: string;
  code: string;
  clientEmail: string;
  clientName: string;
  createdBy: string;
  usedAt?: Date;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
export interface SelectOption {
  value: string;
  label: string;
}