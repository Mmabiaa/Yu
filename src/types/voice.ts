// Voice Types and Models

export interface VoiceSettings {
  defaultVoice: string;
  defaultSpeed: number;
  defaultFormat: string;
  defaultLanguage: string;
  autoDetectLanguage: boolean;
  voicePreferences: VoicePreferences;
}

export interface VoicePreferences {
  preferredGender?: 'male' | 'female';
  useCase?: 'assistant' | 'narrator' | 'casual';
  emotionalTone?: 'neutral' | 'friendly' | 'professional';
}

export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
  description: string;
  isDefault: boolean;
  isCustom: boolean;
  sampleUrl?: string;
}

export interface TranscriptionRequest {
  audioFile: File;
  language?: string;
  model?: string;
  enablePunctuation?: boolean;
  enableDiarization?: boolean;
}

export interface TranscriptionResponse {
  text: string;
  language: string;
  confidence: number;
  duration: number;
  segments?: TranscriptionSegment[];
  processingTime: number;
}

export interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: string;
}

export interface SynthesisRequest {
  text: string;
  voice?: string;
  speed?: number;
  format?: 'mp3' | 'wav' | 'ogg';
  language?: string;
  emotionalTone?: string;
}

export interface SynthesisResponse {
  audioUrl: string;
  duration: number;
  format: string;
  size: number;
  expiresAt: Date;
}

export interface LiveTranscriptionConfig {
  language?: string;
  enableRealTime?: boolean;
  chunkSize?: number;
  model?: string;
}

export interface TranscriptionResult {
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: Date;
  alternatives?: TranscriptionAlternative[];
}

export interface TranscriptionAlternative {
  text: string;
  confidence: number;
}

export interface AudioRecordingConfig {
  format: 'mp3' | 'wav' | 'aac';
  quality: 'low' | 'medium' | 'high';
  maxDuration?: number;
  enableNoiseReduction?: boolean;
}

export interface AudioPlaybackConfig {
  autoPlay?: boolean;
  loop?: boolean;
  volume?: number;
  playbackRate?: number;
}

export interface VoiceAnalytics {
  totalTranscriptions: number;
  totalSynthesis: number;
  averageConfidence: number;
  mostUsedVoice: string;
  totalAudioDuration: number;
}

export interface CustomVoiceRequest {
  name: string;
  description: string;
  audioSamples: File[];
  targetLanguage: string;
}

export interface CustomVoiceResponse {
  voiceId: string;
  status: 'processing' | 'ready' | 'failed';
  estimatedCompletion?: Date;
  message: string;
}