// Export all types and interfaces

// Core API types
export * from './api';

// Feature-specific types
export * from './auth';
export * from './chat';
export * from './voice';
export * from './translation';
export * from './vision';
export * from './profile';

// Re-export commonly used types for convenience
export type {
    ApiResponse,
    ApiError,
    RequestOptions,
    ValidationResult,
    PaginatedResponse,
} from './api';

export type {
    User,
    AuthTokens,
    LoginRequest,
    LoginResponse,
} from './auth';

export type {
    Conversation,
    Message,
    ChatRequest,
    ChatResponse,
} from './chat';

export type {
    TranscriptionResponse,
    SynthesisResponse,
    Voice,
    VoiceSettings,
    VoicePreferences,
} from './voice';

export type {
    TranslationResponse,
    Language,
    LanguagePreferences,
} from './translation';

export type {
    VisionAnalysisResponse,
    DetectedObject,
    OCRResponse,
    VQAResponse,
} from './vision';

export type {
    UserProfile,
    UserPreferences,
    UserStatistics,
    UserVoicePreferences,
} from './profile';