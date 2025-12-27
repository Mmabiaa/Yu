import { VoiceService } from './VoiceService';
import { VoiceServiceFactory } from './VoiceServiceFactory';
import { AudioManager } from './AudioManager';
import { VoiceSettingsManager } from './VoiceSettingsManager';
import { ServiceManager } from '../ServiceManager';
import {
    VoiceSettings,
    Voice,
    TranscriptionResponse,
    SynthesisResponse,
    AudioRecordingConfig,
    AudioPlaybackConfig
} from '../../types/voice';

/**
 * VoiceIntegration provides a high-level interface for voice functionality
 * across the application, managing both local audio operations and backend API calls
 */
export class VoiceIntegration {
    private static instance: VoiceIntegration | null = null;

    private voiceService: VoiceService;
    private audioManager: AudioManager;
    private isInitialized: boolean = false;

    private constructor() {
        const serviceManager = ServiceManager.getInstance();
        this.voiceService = serviceManager.getVoiceService();
        this.audioManager = new AudioManager();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): VoiceIntegration {
        if (!VoiceIntegration.instance) {
            VoiceIntegration.instance = new VoiceIntegration();
        }
        return VoiceIntegration.instance;
    }

    /**
     * Reset instance (useful for testing)
     */
    public static reset(): void {
        VoiceIntegration.instance = null;
    }

    /**
     * Initialize voice integration
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            // Initialize audio manager (setupAudio is called in constructor)
            this.isInitialized = true;
            console.log('VoiceIntegration initialized successfully');
        } catch (error) {
            console.error('Failed to initialize VoiceIntegration:', error);
            throw error;
        }
    }

    /**
     * Record audio and transcribe to text
     */
    public async recordAndTranscribe(
        config?: AudioRecordingConfig,
        maxDuration?: number
    ): Promise<{ text: string; audioUri: string; duration: number }> {
        try {
            // Start recording
            await this.audioManager.startRecording(config);

            // Wait for recording to complete (this would be handled by UI in practice)
            // For now, we'll simulate a recording duration
            await new Promise(resolve => setTimeout(resolve, maxDuration || 3000));

            // Stop recording
            const audioUri = await this.audioManager.stopRecording();
            if (!audioUri) {
                throw new Error('Failed to record audio');
            }

            // Get audio info
            const audioInfo = await this.audioManager.getAudioFileInfo(audioUri);

            // Convert to File object for API call
            const audioFile = await this.uriToFile(audioUri);

            // Transcribe audio
            const transcription = await this.voiceService.transcribeAudio(audioFile);

            return {
                text: transcription.text,
                audioUri,
                duration: audioInfo.duration
            };
        } catch (error) {
            console.error('Error in recordAndTranscribe:', error);
            throw error;
        }
    }

    /**
     * Synthesize text to speech and play
     */
    public async synthesizeAndPlay(
        text: string,
        voice?: string,
        speed?: number,
        config?: AudioPlaybackConfig
    ): Promise<void> {
        try {
            // Get voice settings if not provided
            if (!voice || !speed) {
                const settings = await this.getVoiceSettings();
                voice = voice || settings.defaultVoice;
                speed = speed || settings.defaultSpeed;
            }

            // Synthesize speech
            const synthesis = await this.voiceService.synthesizeSpeech(text, voice, speed);

            // Play audio
            await this.audioManager.playAudio(synthesis.audioUrl, config);
        } catch (error) {
            console.error('Error in synthesizeAndPlay:', error);
            throw error;
        }
    }

    /**
     * Get available voices
     */
    public async getAvailableVoices(language?: string): Promise<Voice[]> {
        try {
            return await this.voiceService.getAvailableVoices(language);
        } catch (error) {
            console.error('Error getting available voices:', error);
            return [];
        }
    }

    /**
     * Get voice settings (combines local and remote settings)
     */
    public async getVoiceSettings(): Promise<VoiceSettings> {
        try {
            // Try to get settings from backend first
            const remoteSettings = await this.voiceService.getVoiceSettings();

            // Update local settings with remote settings
            await VoiceSettingsManager.saveSettings(remoteSettings);

            return remoteSettings;
        } catch (error) {
            console.warn('Failed to get remote voice settings, using local:', error);

            // Fallback to local settings
            return await VoiceSettingsManager.loadSettings();
        }
    }

    /**
     * Update voice settings (syncs to both local and remote)
     */
    public async updateVoiceSettings(settings: Partial<VoiceSettings>): Promise<VoiceSettings> {
        try {
            // Update remote settings first
            const updatedSettings = await this.voiceService.updateVoiceSettings(settings);

            // Update local settings
            await VoiceSettingsManager.saveSettings(updatedSettings);

            return updatedSettings;
        } catch (error) {
            console.warn('Failed to update remote voice settings, updating local only:', error);

            // Fallback to local update only
            const currentSettings = await VoiceSettingsManager.loadSettings();
            const mergedSettings = { ...currentSettings, ...settings };
            await VoiceSettingsManager.saveSettings(mergedSettings);

            return mergedSettings;
        }
    }

    /**
     * Start live transcription
     */
    public async startLiveTranscription(
        onResult: (result: { text: string; isFinal: boolean }) => void,
        language?: string
    ): Promise<void> {
        try {
            // Set up transcription callback
            this.voiceService.onTranscriptionResult((result) => {
                onResult({
                    text: result.text,
                    isFinal: result.isFinal
                });
            });

            // Start WebSocket connection
            await this.voiceService.startLiveTranscription({
                language,
                enableRealTime: true
            });

            // Start audio recording for streaming
            await this.audioManager.startRecording({
                format: 'wav', // Better for streaming
                quality: 'medium'
            });

        } catch (error) {
            console.error('Error starting live transcription:', error);
            throw error;
        }
    }

    /**
     * Stop live transcription
     */
    public async stopLiveTranscription(): Promise<string | null> {
        try {
            // Stop recording
            const audioUri = await this.audioManager.stopRecording();

            // Stop WebSocket connection
            this.voiceService.stopLiveTranscription();

            return audioUri;
        } catch (error) {
            console.error('Error stopping live transcription:', error);
            return null;
        }
    }

    /**
     * Check if currently recording
     */
    public isRecording(): boolean {
        return this.audioManager.isCurrentlyRecording;
    }

    /**
     * Check if currently playing
     */
    public isPlaying(): boolean {
        return this.audioManager.isCurrentlyPlaying;
    }

    /**
     * Stop current playback
     */
    public async stopPlayback(): Promise<void> {
        try {
            await this.audioManager.stopPlayback();
        } catch (error) {
            console.error('Error stopping playback:', error);
        }
    }

    /**
     * Get recommended voice based on preferences
     */
    public async getRecommendedVoice(language?: string): Promise<Voice | null> {
        try {
            const [voices, settings] = await Promise.all([
                this.getAvailableVoices(language),
                this.getVoiceSettings()
            ]);

            return VoiceSettingsManager.getRecommendedVoice(
                voices,
                settings.voicePreferences,
                language
            );
        } catch (error) {
            console.error('Error getting recommended voice:', error);
            return null;
        }
    }

    /**
     * Cleanup resources
     */
    public async cleanup(): Promise<void> {
        try {
            await this.audioManager.cleanup();
            this.voiceService.stopLiveTranscription();
            this.isInitialized = false;
        } catch (error) {
            console.error('Error during VoiceIntegration cleanup:', error);
        }
    }

    /**
     * Convert URI to File object (helper method)
     */
    private async uriToFile(uri: string): Promise<File> {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const filename = uri.split('/').pop() || 'audio.mp3';
            return new File([blob], filename, { type: blob.type });
        } catch (error) {
            console.error('Error converting URI to File:', error);
            throw error;
        }
    }
}

/**
 * Convenience function to get VoiceIntegration instance
 */
export const getVoiceIntegration = (): VoiceIntegration => {
    return VoiceIntegration.getInstance();
};

/**
 * Convenience function to reset VoiceIntegration instance
 */
export const resetVoiceIntegration = (): void => {
    VoiceIntegration.reset();
};