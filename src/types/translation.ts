// Translation Types and Models

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  isSupported: boolean;
  isRTL: boolean;
}

export interface LanguagePair {
  from: string;
  to: string;
  isSupported: boolean;
  quality: 'high' | 'medium' | 'low';
}

export interface LanguagePreferences {
  primaryLanguage: string;
  secondaryLanguages: string[];
  autoDetect: boolean;
  preferredProvider: string;
  enableOfflineTranslation: boolean;
}

export interface TranslationRequest {
  text: string;
  fromLanguage?: string;
  toLanguage: string;
  context?: string;
  domain?: 'general' | 'technical' | 'medical' | 'legal' | 'casual';
}

export interface TranslationResponse {
  originalText: string;
  translatedText: string;
  fromLanguage: string;
  toLanguage: string;
  confidence: number;
  provider: string;
  alternatives?: TranslationAlternative[];
  processingTime: number;
}

export interface TranslationAlternative {
  text: string;
  confidence: number;
  context?: string;
}

export interface BatchTranslationRequest {
  texts: string[];
  fromLanguage?: string;
  toLanguage: string;
  preserveFormatting?: boolean;
}

export interface BatchTranslationResponse {
  translations: TranslationResponse[];
  totalProcessingTime: number;
  successCount: number;
  failureCount: number;
}

export interface LanguageDetectionRequest {
  text: string;
  candidates?: string[];
}

export interface LanguageDetectionResponse {
  detectedLanguage: string;
  confidence: number;
  alternatives?: LanguageDetectionAlternative[];
}

export interface LanguageDetectionAlternative {
  language: string;
  confidence: number;
}

export interface TranslationHistory {
  translations: TranslationHistoryItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface TranslationHistoryItem {
  id: string;
  originalText: string;
  translatedText: string;
  fromLanguage: string;
  toLanguage: string;
  timestamp: Date;
  isFavorite: boolean;
  tags?: string[];
}

export interface VoiceTranslationRequest {
  audioFile: File;
  fromLanguage?: string;
  toLanguage: string;
  outputFormat?: 'text' | 'audio' | 'both';
  voice?: string;
}

export interface VoiceTranslationResponse {
  originalText: string;
  translatedText: string;
  fromLanguage: string;
  toLanguage: string;
  audioUrl?: string;
  confidence: number;
}

export interface TranslationQuality {
  score: number;
  factors: QualityFactor[];
  suggestions?: string[];
}

export interface QualityFactor {
  name: string;
  score: number;
  description: string;
}

export interface TranslationMemory {
  id: string;
  sourceText: string;
  targetText: string;
  fromLanguage: string;
  toLanguage: string;
  domain: string;
  quality: number;
  createdAt: Date;
}

export interface TerminologyEntry {
  id: string;
  term: string;
  translation: string;
  fromLanguage: string;
  toLanguage: string;
  domain: string;
  definition?: string;
  context?: string;
}