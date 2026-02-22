
import React from 'react';

// --- BRANDED TYPES (Nominal Typing) ---
// Prevents accidental assignment of string IDs to wrong types
export type Brand<K, T> = K & { __brand: T };
export type UserId = Brand<string, 'UserId'>;
export type ProjectId = Brand<string, 'ProjectId'>;
export type FileId = Brand<string, 'FileId'>;

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  ESSENTIAL = 'ESSENTIAL',
  PRO = 'PRO',
  TEAM = 'TEAM',
  ELITE = 'ELITE'
}

export enum BillingType {
  PREPAID = 'PREPAID',
  POSTPAID = 'POSTPAID'
}

// --- BULK UPLOAD TYPES ---
export interface CandidateFileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string; // Path inside Supabase Storage
}

export interface WebhookPayload {
  batchId: string;
  projectId: string;
  userId: string;
  totalInBatch: number;
  candidates: CandidateFileMetadata[];
}

export interface FailedFile {
  file: File;
  reason: 
    | 'SIZE_LIMIT' 
    | 'INVALID_FORMAT' 
    | 'CORRUPTION' 
    | 'STORAGE_UPLOAD_FAILED' 
    | 'WEBHOOK_FAILED'
    | 'DUPLICATE_FILE'
    | 'PASSWORD_PROTECTED'
    | 'TOO_MANY_PAGES'
    | 'EMPTY_FILE';
  errorMessage?: string;
}

// --- DISCRIMINATED UNIONS FOR STATE ---
export type AsyncState<T> =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: T | null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: T | null; error: string };

export interface AIPreferences {
  strictness: 'LOW' | 'MEDIUM' | 'HIGH';
  tone: 'PROFESSIONAL' | 'CASUAL' | 'DIRECT';
  emailPersona: 'EMPATHETIC' | 'DIRECT' | 'ENTHUSIASTIC';
  antiGhosting: boolean;
  rejectionContext: boolean;
}

export interface UIPreferences {
  theme: 'DARK' | 'LIGHT';
  ambientGlow: 'slate' | 'blue' | 'cyan' | 'emerald' | 'violet' | 'rose' | 'amber';
  accentColor: 'slate' | 'blue' | 'cyan' | 'emerald' | 'violet' | 'rose' | 'amber';
  reducedMotion: boolean;
  glassIntensity: 'LOW' | 'MEDIUM' | 'HIGH';
  density: 'COMFORTABLE' | 'COMPACT';
}

export type ProjectBillingMode = 'OWNER_WALLET' | 'PROJECT_INVESTMENT';

export enum OutreachStrategy {
  OWNER_IDENTITY = 'OWNER_IDENTITY', // All mails sent via Owner's selected email
  INDIVIDUAL_IDENTITY = 'INDIVIDUAL_IDENTITY' // Mails sent via User's own selected email
}

export interface UserPreferences {
  defaultInvitationPermission: EmployeeAddPermission;
  defaultQuickDemoteTarget: DemoteTarget;
  defaultAnalystAccessOnlyForCompleted: boolean;
  defaultAdminCanChangeStatus: boolean;
  defaultAdminCanManageQuotas: boolean;
  // New Settings
  defaultAnalystCanViewActivity: boolean;
  defaultAnalystCanUseGhosting: boolean;
  defaultScoutCanUseGhosting: boolean;

  defaultOutreachStrategy: OutreachStrategy; // New: Default for new projects
  defaultOwnerOutreachEmailId?: string; // New: Specific email ID to use when strategy is OWNER_IDENTITY

  defaultScanQuota: number | 'UNLIMITED';
  defaultBillingMode: ProjectBillingMode;
  defaultInvestmentBudget: number;
  autoArchiveProjects: boolean;
  compactMode: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    digestFrequency: 'DAILY' | 'WEEKLY' | 'NEVER';
  };
  aiConfig?: AIPreferences;
  uiConfig?: UIPreferences;
}

export interface EmailIntegration {
  id: string;
  provider: 'GMAIL' | 'OUTLOOK' | 'OFFICE365' | 'IMAP';
  emailAddress: string;
  isConnected: boolean;
  addedAt: string;
}

export interface User {
  id: UserId;
  email: string;
  displayName: string;
  avatarUrl?: string;
  jobTitle?: string;
  company?: string;
  industry?: string;
  role: Role;
  subscriptionPlan: SubscriptionPlan;
  scansBalance: number;
  purchasedScans: number;
  billingType: BillingType;
  overageCap: number | 'UNLIMITED';
  preferences?: UserPreferences;
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: string;
  bannedBy?: string;
  banExpiresAt?: string | null;
  country?: string;
  city?: string;
  coordinates?: { lat: number; lng: number };
  lastActive?: string;
  signupDate?: string;
  hasCompletedOnboarding?: boolean;

  // Updated: List of integrations
  emailIntegrations: EmailIntegration[];
  
  // Auth Identity Info
  identities?: {
    id: string;
    provider: string;
    created_at: string;
    last_sign_in_at: string;
    identity_data?: any;
  }[];
  newEmail?: string; // If a change is pending

  // Dual Identity & Owner Override
  primaryEmail?: string | null;
  workEmail?: string | null;
  workMails?: string[];
  orgNames?: string[];
  isOwner?: boolean;
  nylasConnected?: boolean;
}

export enum ProjectRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE'
}

export type ProjectPermission = 'SCAN' | 'ANALYZE';

export enum EmployeeAddPermission {
  ALL = 'ALL',
  OWN_CONNECTIONS = 'OWN_CONNECTIONS',
  OWNER_CONNECTIONS = 'OWNER_CONNECTIONS'
}

export type DemoteTarget = 'VISITOR' | 'SCOUT' | 'ANALYST' | 'PARTNER';

export interface ProjectMember {
  userId: UserId;
  role: ProjectRole;
  permissions: ProjectPermission[];
  scansUsed: number;
  scanQuota: number | 'UNLIMITED';
  joinedAt: string;
  preferredOutreachEmailId?: string; // The email ID this user wants to use for this project
  user?: User;
}

export interface ProjectSettings {
  employeeAddPermission: EmployeeAddPermission;
  quickDemoteTarget: DemoteTarget;
  analystAccessOnlyForCompleted: boolean;
  adminCanChangeStatus: boolean;
  adminCanManageQuotas: boolean;
  // New Settings
  analystCanViewActivity: boolean;
  analystCanUseGhosting: boolean;
  scoutCanUseGhosting: boolean;

  // Updated Outreach Config
  outreachStrategy: OutreachStrategy;
  ownerOutreachEmailId?: string; // If OWNER_IDENTITY, which email ID to use?

  defaultScanQuota: number | 'UNLIMITED';
  adminScanQuota?: number | 'UNLIMITED';
  scoutScanQuota?: number | 'UNLIMITED';
  partnerScanQuota?: number | 'UNLIMITED';
  billingMode: ProjectBillingMode;
}

export interface Project {
  id: ProjectId;
  title: string;
  description: string;
  ownerId: UserId;
  createdAt: string;
  fileCount: number;
  memberCount: number;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  members: ProjectMember[];
  settings: ProjectSettings;
  investmentBalance: number;
  totalInvested?: number;
}

export interface ProjectFile {
  id: FileId;
  projectId: ProjectId;
  name: string;
  size: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SCANNING' | 'new' | 'screened' | 'interview' | 'rejected' | 'hired';
  uploadedAt: string;
  score?: number;
  candidateName?: string;
  uploadedByUserId?: UserId;
  failureReasons?: string[];
  isFavorite?: boolean;

  // --- MARKERS ---
  lastContactedAt?: string; // Legacy/Compat

  // Public Marker: Email Sent
  emailSentAt?: string;
  emailSentBy?: string;

  // Public Marker: Draft
  emailDraft?: string;

  // Private Markers
  viewedBy?: string[]; // Array of UserIds who have clicked/viewed
  exportedBy?: string[]; // Array of UserIds who have exported this file

  // --- AI ENHANCED DATA ---
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills?: string[];
  rank?: number;

  // --- ELITE DATA FIELDS ---
  currentPosition?: string;
  yearsOfExperience?: number;
  matchScore?: number;
  scoreJustification?: string;
  executiveSummary?: string;
  keySkills?: string[];
  missingSkills?: string[];
  redFlags?: string[];
  softSkillsAnalysis?: string;
  interviewQuestions?: { 
    id: string; 
    question: string; 
    context?: string; 
    type: 'AI' | 'MANUAL';
    createdBy?: string;
    createdAt: string;
  }[];
  careerTrajectory?: string;
  socialLinks?: { linkedin?: string; github?: string; portfolio?: string };
  originalResumeName?: string;
}

// --- WORKER MESSAGES ---
export type WorkerMessage =
  | { type: 'FILTER_FILES'; payload: { files: ProjectFile[]; query: string; minScore?: number } }
  | { type: 'CALCULATE_ANALYTICS'; payload: { projects: Project[]; files: ProjectFile[] } };

export type WorkerResponse =
  | { type: 'FILTER_FILES_RESULT'; payload: ProjectFile[] }
  | { type: 'ANALYTICS_RESULT'; payload: any };

// --- NEW ADDITIONS ---

export interface ConnectionItem {
  id: string;
  otherUser: User;
  status: 'CONNECTED' | 'PENDING' | 'SENT' | 'RECEIVED';
  date: string;
}

export type ChannelType = 'GENERAL' | 'ADMIN';

export interface ProjectMessage {
  id: string;
  projectId: ProjectId;
  channel: ChannelType;
  senderId: UserId;
  content: string;
  timestamp: string;
  isEncrypted: boolean;
}

export interface PricingPlan {
  id: SubscriptionPlan;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  monthlyScans: number;
  maxProjects: number | 'UNLIMITED';
  maxMembers: number | 'UNLIMITED';
  colorTheme: 'slate' | 'blue' | 'purple' | 'amber' | 'emerald';
  allowOverage: boolean;
  recommended?: boolean;
}

export interface ScanPackageConfig {
  id: string;
  name: string;
  scans: number;
  price: number;
  features: string[];
  colorTheme: 'blue' | 'purple' | 'amber';
  isPopular?: boolean;
}

// --- ANALYTICS TYPES ---

export interface DashboardKPI {
  totalCandidates: number;
  candidateTrend: string;
  analyzedCount: number;
  qualifiedRate: number;
  qualifiedTrend: string;
  activeProjects: number;
  avgTimeProcessing: string;
  failedUploadsCount: number;
}

export interface TeamStats {
  admins: number;
  partners: number;
  scouts: number;
  analysts: number;
}

export interface TimelineDataPoint {
  date: string;
  applications: number;
  avgQuality: number;
}

export interface ErrorDataPoint {
  name: string;
  value: number;
  fill: string;
}

export interface ProjectPerformanceRow {
  id: ProjectId;
  name: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  candidates: number;
  qualified: number;
  avgScore: number;
}

export interface DashboardAnalytics {
  kpi: DashboardKPI;
  teamStats: TeamStats;
  timelineData: TimelineDataPoint[];
  errorData: ErrorDataPoint[];
  projectPerformance: ProjectPerformanceRow[];
}
