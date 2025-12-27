import { BaseService } from '../core/BaseService';
import { ApiClient } from '../core/ApiClient';
import { CacheManager } from '../../types/cache';
import {
  VoiceSettings,
  Voice,
  TranscriptionRequest,
  TranscriptionResponse,
  SynthesisRequest,
  SynthesisResponse,
  LiveTranscriptionConfig,
  TranscriptionResult,
  AudioRecordingConfig,
  AudioPlaybackConfig,
  VoiceAnalytics,
  CustomVoiceRequest,
  CustomVoiceResponse
} from '../../types/voice';
import { ApiResponse } from '../../types/api';

/**
 * VoiceService handles all voice-related operations including transcription,
 * synthesis, voice settings management, and audio processing
 */
export class VoiceService extends BaseService {
  private wsConnection: WebSocket | null = null;
  private transcriptionCallback: ((result: TranscriptionResult) => void) | null = null;

  constructor(apiClient: ApiClient, cacheManager: CacheManager) {
    super(apiClient, cacheManager, 'voice');
  }

  /**
   * Transcribe audio file to text
   */
  async transcribeAudio(
    audioFile: File,
    language?: string
  ): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    if (language) {
      formData.append('language', language);
    }

    const response = await this.makeRequest<TranscriptionResponse>('/voice/transcribe', {
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  }

  /**
   * Synthesize text to speech
   */
  async synthesizeSpeech(
    text: string,
    voice?: string,
    speed?: number
  ): Promise<SynthesisResponse> {
    const request: SynthesisRequest = {
      text,
      voice,
      speed,
      format: 'mp3'
    };

    const response = await this.makeRequest<SynthesisResponse>('/voice/synthesize', {
      method: 'POST',
      data: request
    });

    return response.data;
  }

  /**
   * Get available voices for synthesis
   */
  async getAvailableVoices(language?: string): Promise<Voice[]> {
    const params = language ? { language } : undefined;
    
    const response = await this.makeRequest<Voice[]>('/voice/voices', {
      method: 'GET',
      params
    });

    return response.data;
  }

  /**
   * Get current voice settings
   */
  async getVoiceSettings(): Promise<VoiceSettings> {
    const response = await this.makeRequest<VoiceSettings>('/voice/settings', {
      method: 'GET'
    });

    return response.data;
  }

  /**
   * Update voice settings
   */
  async updateVoiceSettings(settings: Partial<VoiceSettings>): Promise<VoiceSettings> {
    const response = await this.makeRequest<VoiceSettings>('/voice/settings', {
      method: 'PUT',
      data: settings
    });

    // Invalidate settings cache
    await this.invalidateCache('/voice/settings');

    return response.data;
  }

  /**
   * Start live transcription with WebSocket
   */
  async startLiveTranscription(config: LiveTranscriptionConfig): Promise<WebSocket> {
    const wsUrl = this.buildWebSocketUrl('/voice/transcribe/live', config);
    
    this.wsConnection = new WebSocket(wsUrl);
    
    this.wsConnection.onopen = () => {
      console.log('Live transcription WebSocket connected');
    };

    this.wsConnection.onmessage = (event) => {
      try {
        const result: TranscriptionResult = JSON.parse(event.data);
        if (this.transcriptionCallback) {
          this.transcriptionCallback(result);
        }
      } catch (error) {
        console.error('Error parsing transcription result:', error);
      }
    };

    this.wsConnection.onerror = (error) => {
      console.error('Live transcription WebSocket error:', error);
    };

    this.wsConnection.onclose = () => {
      console.log('Live transcription WebSocket closed');
      this.wsConnection = null;
    };

    return this.wsConnection;
  }

  /**
   * Stop live transcription
   */
  stopLiveTranscription(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.transcriptionCallback = null;
  }

  /**
   * Set callback for transcription results
   */
  onTranscriptionResult(callback: (result: TranscriptionResult) => void): void {
    this.transcriptionCallback = callback;
  }

  /**
   * Send audio chunk for live transcription
   */
  sendAudioChunk(audioChunk: Blob): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(audioChunk);
    }
  }

  /**
   * Get voice analytics and usage statistics
   */
  async getVoiceAnalytics(): Promise<VoiceAnalytics> {
    const response = await this.makeRequest<VoiceAnalytics>('/voice/analytics', {
      method: 'GET'
    });

    return response.data;
  }

  /**
   * Create custom voice from audio samples
   */
  async createCustomVoice(request: CustomVoiceRequest): Promise<CustomVoiceResponse> {
    const formData = new FormData();
    formData.append('name', request.name);
    formData.append('description', request.description);
    formData.append('targetLanguage', request.targetLanguage);
    
    request.audioSamples.forEach((sample, index) => {
      formData.append(`audioSample_${index}`, sample);
    });

    const response = await this.makeRequest<CustomVoiceResponse>('/voice/custom', {
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  }

  /**
   * Get custom voice status
   */
  async getCustomVoiceStatus(voiceId: string): Promise<CustomVoiceResponse> {
    const response = await this.makeRequest<CustomVoiceResponse>(`/voice/custom/${voiceId}`, {
      method: 'GET'
    });

    return response.data;
  }

  /**
   * Delete custom voice
   */
  async deleteCustomVoice(voiceId: string): Promise<void> {
    await this.makeRequest<void>(`/voice/custom/${voiceId}`, {
      method: 'DELETE'
    });

    // Invalidate voices cache
    await this.invalidateCache('/voice/voices');
  }

  /**
   * Build WebSocket URL with query parameters
   */
  private buildWebSocketUrl(endpoint: string, config: LiveTranscriptionConfig): string {
    const baseUrl = this.apiClient.getBaseUrl().replace('http', 'ws');
    const url = new URL(endpoint, baseUrl);
    
    if (config.language) {
      url.searchParams.append('language', config.language);
    }
    if (config.enableRealTime !== undefined) {
      url.searchParams.append('enableRealTime', config.enableRealTime.toString());
    }
    if (config.chunkSize) {
      url.searchParams.append('chunkSize', config.chunkSize.toString());
    }
    if (config.model) {
      url.searchParams.append('model', config.model);
    }

    return url.toString();
  }

  /**
   * Override cache settings for voice service
   */
  protected shouldCache(endpoint: string): boolean {
    const cacheableEndpoints = [
      '/voice/voices',
      '/voice/settings',
      '/voice/analytics'
    ];
    
    return cacheableEndpoints.some(cacheable => endpoint.includes(cacheable));
  }

  /**
   * Override cache TTL for voice service
   */
  protected getCacheTTL(endpoint: string): number {
    if (endpoint.includes('/voice/voices')) {
      return 3600; // 1 hour - voices don't change often
    }
    if (endpoint.includes('/voice/settings')) {
      return 1800; // 30 minutes
    }
    if (endpoint.includes('/voice/analytics')) {
      return 300; // 5 minutes
    }
    
    return 300; // Default 5 minutes
  }
}