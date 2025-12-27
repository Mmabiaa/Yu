import AsyncStorage from '@react-native-async-storage/async-storage';
import { VoiceSettings, VoicePreferences, Voice } from '../../types/voice';

/**
 * VoiceSettingsManager handles local voice settings and preferences
 */
export class VoiceSettingsManager {
  private static readonly SETTINGS_KEY = 'voice_settings';
  private static readonly PREFERENCES_KEY = 'voice_preferences';
  private static readonly SELECTED_VOICE_KEY = 'selected_voice';

  /**
   * Get default voice settings
   */
  static getDefaultSettings(): VoiceSettings {
    return {
      defaultVoice: 'en-US-neural-female-1',
      defaultSpeed: 1.0,
      defaultFormat: 'mp3',
      defaultLanguage: 'en-US',
      autoDetectLanguage: true,
      voicePreferences: {
        preferredGender: 'female',
        useCase: 'assistant',
        emotionalTone: 'friendly'
      }
    };
  }

  /**
   * Load voice settings from local storage
   */
  static async loadSettings(): Promise<VoiceSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(this.SETTINGS_KEY);
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        // Merge with defaults to ensure all properties exist
        return { ...this.getDefaultSettings(), ...settings };
      }
      return this.getDefaultSettings();
    } catch (error) {
      console.error('Error loading voice settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Save voice settings to local storage
   */
  static async saveSettings(settings: VoiceSettings): Promise<void> {
    try {
      const settingsJson = JSON.stringify(settings);
      await AsyncStorage.setItem(this.SETTINGS_KEY, settingsJson);
    } catch (error) {
      console.error('Error saving voice settings:', error);
      throw error;
    }
  }

  /**
   * Update specific voice setting
   */
  static async updateSetting<K extends keyof VoiceSettings>(
    key: K,
    value: VoiceSettings[K]
  ): Promise<VoiceSettings> {
    try {
      const currentSettings = await this.loadSettings();
      const updatedSettings = { ...currentSettings, [key]: value };
      await this.saveSettings(updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Error updating voice setting:', error);
      throw error;
    }
  }

  /**
   * Update voice preferences
   */
  static async updatePreferences(preferences: Partial<VoicePreferences>): Promise<VoiceSettings> {
    try {
      const currentSettings = await this.loadSettings();
      const updatedPreferences = { ...currentSettings.voicePreferences, ...preferences };
      const updatedSettings = { ...currentSettings, voicePreferences: updatedPreferences };
      await this.saveSettings(updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Error updating voice preferences:', error);
      throw error;
    }
  }

  /**
   * Get selected voice for a specific language
   */
  static async getSelectedVoice(language?: string): Promise<string | null> {
    try {
      const key = language ? `${this.SELECTED_VOICE_KEY}_${language}` : this.SELECTED_VOICE_KEY;
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting selected voice:', error);
      return null;
    }
  }

  /**
   * Set selected voice for a specific language
   */
  static async setSelectedVoice(voiceId: string, language?: string): Promise<void> {
    try {
      const key = language ? `${this.SELECTED_VOICE_KEY}_${language}` : this.SELECTED_VOICE_KEY;
      await AsyncStorage.setItem(key, voiceId);
    } catch (error) {
      console.error('Error setting selected voice:', error);
      throw error;
    }
  }

  /**
   * Get voice recommendation based on preferences
   */
  static getRecommendedVoice(
    availableVoices: Voice[],
    preferences: VoicePreferences,
    language?: string
  ): Voice | null {
    if (availableVoices.length === 0) {
      return null;
    }

    // Filter by language if specified
    let filteredVoices = language 
      ? availableVoices.filter(voice => voice.language === language)
      : availableVoices;

    if (filteredVoices.length === 0) {
      filteredVoices = availableVoices;
    }

    // Filter by gender preference
    if (preferences.preferredGender) {
      const genderFiltered = filteredVoices.filter(
        voice => voice.gender === preferences.preferredGender
      );
      if (genderFiltered.length > 0) {
        filteredVoices = genderFiltered;
      }
    }

    // Prefer default voices
    const defaultVoices = filteredVoices.filter(voice => voice.isDefault);
    if (defaultVoices.length > 0) {
      return defaultVoices[0];
    }

    // Return first available voice
    return filteredVoices[0];
  }

  /**
   * Validate voice settings
   */
  static validateSettings(settings: Partial<VoiceSettings>): string[] {
    const errors: string[] = [];

    if (settings.defaultSpeed !== undefined) {
      if (settings.defaultSpeed < 0.5 || settings.defaultSpeed > 2.0) {
        errors.push('Default speed must be between 0.5 and 2.0');
      }
    }

    if (settings.defaultFormat !== undefined) {
      const validFormats = ['mp3', 'wav', 'ogg'];
      if (!validFormats.includes(settings.defaultFormat)) {
        errors.push('Default format must be one of: mp3, wav, ogg');
      }
    }

    if (settings.voicePreferences?.preferredGender !== undefined) {
      const validGenders = ['male', 'female'];
      if (!validGenders.includes(settings.voicePreferences.preferredGender)) {
        errors.push('Preferred gender must be male or female');
      }
    }

    if (settings.voicePreferences?.useCase !== undefined) {
      const validUseCases = ['assistant', 'narrator', 'casual'];
      if (!validUseCases.includes(settings.voicePreferences.useCase)) {
        errors.push('Use case must be one of: assistant, narrator, casual');
      }
    }

    if (settings.voicePreferences?.emotionalTone !== undefined) {
      const validTones = ['neutral', 'friendly', 'professional'];
      if (!validTones.includes(settings.voicePreferences.emotionalTone)) {
        errors.push('Emotional tone must be one of: neutral, friendly, professional');
      }
    }

    return errors;
  }

  /**
   * Reset settings to defaults
   */
  static async resetSettings(): Promise<VoiceSettings> {
    try {
      const defaultSettings = this.getDefaultSettings();
      await this.saveSettings(defaultSettings);
      
      // Clear selected voices
      const keys = await AsyncStorage.getAllKeys();
      const voiceKeys = keys.filter(key => key.startsWith(this.SELECTED_VOICE_KEY));
      await AsyncStorage.multiRemove(voiceKeys);
      
      return defaultSettings;
    } catch (error) {
      console.error('Error resetting voice settings:', error);
      throw error;
    }
  }

  /**
   * Export settings for backup
   */
  static async exportSettings(): Promise<{
    settings: VoiceSettings;
    selectedVoices: Record<string, string>;
  }> {
    try {
      const settings = await this.loadSettings();
      
      // Get all selected voices
      const keys = await AsyncStorage.getAllKeys();
      const voiceKeys = keys.filter(key => key.startsWith(this.SELECTED_VOICE_KEY));
      const selectedVoices: Record<string, string> = {};
      
      for (const key of voiceKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          selectedVoices[key] = value;
        }
      }

      return { settings, selectedVoices };
    } catch (error) {
      console.error('Error exporting voice settings:', error);
      throw error;
    }
  }

  /**
   * Import settings from backup
   */
  static async importSettings(data: {
    settings: VoiceSettings;
    selectedVoices: Record<string, string>;
  }): Promise<void> {
    try {
      // Validate settings before importing
      const errors = this.validateSettings(data.settings);
      if (errors.length > 0) {
        throw new Error(`Invalid settings: ${errors.join(', ')}`);
      }

      // Save settings
      await this.saveSettings(data.settings);

      // Save selected voices
      for (const [key, value] of Object.entries(data.selectedVoices)) {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error importing voice settings:', error);
      throw error;
    }
  }
}