// Profile Types and Models

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  profileImage?: string;
  bio?: string;
  location?: string;
  timezone: string;
  language: string;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  chat: ChatPreferences;
  voice: UserVoicePreferences;
  translation: TranslationPreferences;
  vision: VisionPreferences;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  chatNotifications: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
}

export interface PrivacyPreferences {
  dataCollection: boolean;
  analytics: boolean;
  crashReporting: boolean;
  personalizedAds: boolean;
  shareUsageData: boolean;
  publicProfile: boolean;
}

export interface ChatPreferences {
  defaultPersonality: string;
  enableTypingIndicators: boolean;
  enableReadReceipts: boolean;
  autoSaveConversations: boolean;
  maxConversationHistory: number;
  enableSuggestions: boolean;
}

export interface UserVoicePreferences {
  defaultVoice: string;
  defaultSpeed: number;
  defaultLanguage: string;
  autoDetectLanguage: boolean;
  enableVoiceCommands: boolean;
  noiseReduction: boolean;
}

export interface TranslationPreferences {
  primaryLanguage: string;
  secondaryLanguages: string[];
  autoDetect: boolean;
  preferredProvider: string;
  enableOfflineTranslation: boolean;
  saveTranslationHistory: boolean;
}

export interface VisionPreferences {
  defaultAnalysisType: string;
  enableAutoAnalysis: boolean;
  saveAnalysisHistory: boolean;
  imageQuality: 'low' | 'medium' | 'high';
  enableOCR: boolean;
}

export interface UserStatistics {
  totalConversations: number;
  totalMessages: number;
  totalTranslations: number;
  totalVoiceInteractions: number;
  totalImageAnalyses: number;
  averageSessionDuration: number;
  mostUsedFeature: string;
  joinDate: Date;
  lastActiveDate: Date;
  usageByFeature: FeatureUsage[];
  usageByMonth: MonthlyUsage[];
}

export interface FeatureUsage {
  feature: string;
  count: number;
  percentage: number;
  lastUsed: Date;
}

export interface MonthlyUsage {
  month: string;
  year: number;
  totalSessions: number;
  totalDuration: number;
  featuresUsed: string[];
}

export interface UpdateProfileRequest {
  fullName?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  language?: string;
  profileImage?: File;
}

export interface UpdatePreferencesRequest {
  preferences: Partial<UserPreferences>;
}

export interface ExportDataRequest {
  format: 'json' | 'csv' | 'pdf';
  includeConversations?: boolean;
  includeTranslations?: boolean;
  includeVoiceData?: boolean;
  includeImageData?: boolean;
  dateRange?: DateRange;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ExportDataResponse {
  downloadUrl: string;
  filename: string;
  format: string;
  size: number;
  expiresAt: Date;
  generatedAt: Date;
}

export interface DeleteAccountRequest {
  password: string;
  reason?: string;
  feedback?: string;
}

export interface DeleteAccountResponse {
  success: boolean;
  message: string;
  deletionDate: Date;
}

export interface SubscriptionInfo {
  tier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  features: SubscriptionFeature[];
  usage: SubscriptionUsage;
}

export interface SubscriptionFeature {
  name: string;
  enabled: boolean;
  limit?: number;
  description: string;
}

export interface SubscriptionUsage {
  conversations: UsageMetric;
  translations: UsageMetric;
  voiceMinutes: UsageMetric;
  imageAnalyses: UsageMetric;
  storage: UsageMetric;
}

export interface UsageMetric {
  used: number;
  limit: number;
  percentage: number;
  resetDate?: Date;
}