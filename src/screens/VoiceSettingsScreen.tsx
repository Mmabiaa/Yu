import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getVoiceIntegration } from '../services/voice/VoiceIntegration';
import { AudioPlayer } from '../components/AudioPlayer';
import { VoiceSettings, Voice, VoicePreferences } from '../types/voice';
import { typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

export default function VoiceSettingsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);
  
  const voiceIntegration = getVoiceIntegration();

  useEffect(() => {
    loadVoiceSettings();
  }, []);

  const loadVoiceSettings = async () => {
    try {
      setIsLoading(true);
      await voiceIntegration.initialize();
      
      const [voiceSettings, voices] = await Promise.all([
        voiceIntegration.getVoiceSettings(),
        voiceIntegration.getAvailableVoices()
      ]);
      
      setSettings(voiceSettings);
      setAvailableVoices(voices);
    } catch (error) {
      console.error('Error loading voice settings:', error);
      Alert.alert('Error', 'Failed to load voice settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<VoiceSettings>) => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const updatedSettings = await voiceIntegration.updateVoiceSettings(newSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating voice settings:', error);
      Alert.alert('Error', 'Failed to update voice settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<VoicePreferences>) => {
    if (!settings) return;

    const updatedSettings = {
      voicePreferences: { ...settings.voicePreferences, ...newPreferences }
    };
    
    await updateSettings(updatedSettings);
  };

  const testVoice = async (voiceId: string) => {
    try {
      setTestingVoice(voiceId);
      const testText = "Hello! This is how I sound. Do you like this voice?";
      await voiceIntegration.synthesizeAndPlay(testText, voiceId);
    } catch (error) {
      console.error('Error testing voice:', error);
      Alert.alert('Error', 'Failed to test voice');
    } finally {
      setTestingVoice(null);
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all voice settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              // Reset to default settings
              const defaultSettings: Partial<VoiceSettings> = {
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
              
              await updateSettings(defaultSettings);
            } catch (error) {
              console.error('Error resetting settings:', error);
              Alert.alert('Error', 'Failed to reset settings');
            }
          }
        }
      ]
    );
  };

  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Voice & Sound</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.purple} />
          <Text style={styles.loadingText}>Loading voice settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Voice & Sound</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={theme.textSecondary} />
          <Text style={styles.errorText}>Failed to load voice settings</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadVoiceSettings}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Voice & Sound</Text>
        <TouchableOpacity onPress={resetToDefaults} disabled={isSaving}>
          <Ionicons name="refresh" size={24} color={isSaving ? theme.textSecondary : theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Voice Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Selection</Text>
          <Text style={styles.sectionSubtitle}>Choose your preferred voice</Text>
          
          {availableVoices.map((voice) => (
            <TouchableOpacity
              key={voice.id}
              style={[
                styles.voiceItem,
                settings.defaultVoice === voice.id && styles.voiceItemSelected
              ]}
              onPress={() => updateSettings({ defaultVoice: voice.id })}
            >
              <View style={styles.voiceInfo}>
                <Text style={styles.voiceName}>{voice.name}</Text>
                <Text style={styles.voiceDescription}>
                  {voice.language} • {voice.gender} • {voice.description}
                </Text>
              </View>
              
              <View style={styles.voiceActions}>
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={() => testVoice(voice.id)}
                  disabled={testingVoice === voice.id}
                >
                  {testingVoice === voice.id ? (
                    <ActivityIndicator size="small" color={theme.purple} />
                  ) : (
                    <Ionicons name="play" size={16} color={theme.purple} />
                  )}
                </TouchableOpacity>
                
                {settings.defaultVoice === voice.id && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.purple} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Speech Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Speech Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Speech Speed</Text>
              <Text style={styles.settingSubtitle}>
                Current: {settings.defaultSpeed}x
              </Text>
            </View>
            <View style={styles.speedButtons}>
              {[0.5, 0.75, 1.0, 1.25, 1.5].map((speed) => (
                <TouchableOpacity
                  key={speed}
                  style={[
                    styles.speedButton,
                    settings.defaultSpeed === speed && styles.speedButtonSelected
                  ]}
                  onPress={() => updateSettings({ defaultSpeed: speed })}
                >
                  <Text
                    style={[
                      styles.speedButtonText,
                      settings.defaultSpeed === speed && styles.speedButtonTextSelected
                    ]}
                  >
                    {speed}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto-detect Language</Text>
              <Text style={styles.settingSubtitle}>
                Automatically detect input language
              </Text>
            </View>
            <Switch
              value={settings.autoDetectLanguage}
              onValueChange={(value) => updateSettings({ autoDetectLanguage: value })}
              trackColor={{ false: theme.cardBorder, true: theme.purple + '40' }}
              thumbColor={settings.autoDetectLanguage ? theme.purple : theme.textSecondary}
            />
          </View>
        </View>

        {/* Voice Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Preferred Gender</Text>
              <Text style={styles.settingSubtitle}>
                Current: {settings.voicePreferences.preferredGender || 'Any'}
              </Text>
            </View>
            <View style={styles.genderButtons}>
              {[
                { key: undefined, label: 'Any' },
                { key: 'male', label: 'Male' },
                { key: 'female', label: 'Female' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key || 'any'}
                  style={[
                    styles.genderButton,
                    settings.voicePreferences.preferredGender === option.key && styles.genderButtonSelected
                  ]}
                  onPress={() => updatePreferences({ preferredGender: option.key as 'male' | 'female' | undefined })}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      settings.voicePreferences.preferredGender === option.key && styles.genderButtonTextSelected
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Use Case</Text>
              <Text style={styles.settingSubtitle}>
                Current: {settings.voicePreferences.useCase || 'Assistant'}
              </Text>
            </View>
            <View style={styles.useCaseButtons}>
              {[
                { key: 'assistant', label: 'Assistant' },
                { key: 'narrator', label: 'Narrator' },
                { key: 'casual', label: 'Casual' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.useCaseButton,
                    settings.voicePreferences.useCase === option.key && styles.useCaseButtonSelected
                  ]}
                  onPress={() => updatePreferences({ useCase: option.key as any })}
                >
                  <Text
                    style={[
                      styles.useCaseButtonText,
                      settings.voicePreferences.useCase === option.key && styles.useCaseButtonTextSelected
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Test Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Voice</Text>
          <Text style={styles.sectionSubtitle}>
            Test your current voice settings
          </Text>
          
          <TouchableOpacity
            style={styles.testVoiceButton}
            onPress={() => testVoice(settings.defaultVoice)}
            disabled={testingVoice !== null}
          >
            {testingVoice ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="play" size={20} color="white" />
            )}
            <Text style={styles.testVoiceButtonText}>
              {testingVoice ? 'Testing...' : 'Test Current Voice'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {isSaving && (
        <View style={styles.savingOverlay}>
          <View style={styles.savingContainer}>
            <ActivityIndicator size="large" color={theme.purple} />
            <Text style={styles.savingText}>Saving settings...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
  },
  title: {
    ...typography.h2,
    color: theme.text,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: theme.textSecondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    ...typography.body,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: theme.purple,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.body,
    color: 'white',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
  },
  sectionTitle: {
    ...typography.h3,
    color: theme.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: theme.textSecondary,
    marginBottom: 16,
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  voiceItemSelected: {
    borderColor: theme.purple,
    backgroundColor: theme.purple + '10',
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    ...typography.body,
    color: theme.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  voiceDescription: {
    ...typography.bodySmall,
    color: theme.textSecondary,
  },
  voiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.purple + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    ...typography.body,
    color: theme.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingSubtitle: {
    ...typography.bodySmall,
    color: theme.textSecondary,
  },
  speedButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  speedButtonSelected: {
    backgroundColor: theme.purple,
    borderColor: theme.purple,
  },
  speedButtonText: {
    ...typography.bodySmall,
    color: theme.text,
    fontWeight: '600',
  },
  speedButtonTextSelected: {
    color: 'white',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  genderButtonSelected: {
    backgroundColor: theme.purple,
    borderColor: theme.purple,
  },
  genderButtonText: {
    ...typography.bodySmall,
    color: theme.text,
    fontWeight: '600',
  },
  genderButtonTextSelected: {
    color: 'white',
  },
  useCaseButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  useCaseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  useCaseButtonSelected: {
    backgroundColor: theme.purple,
    borderColor: theme.purple,
  },
  useCaseButtonText: {
    ...typography.bodySmall,
    color: theme.text,
    fontWeight: '600',
  },
  useCaseButtonTextSelected: {
    color: 'white',
  },
  testVoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.purple,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  testVoiceButtonText: {
    ...typography.body,
    color: 'white',
    fontWeight: '600',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingContainer: {
    backgroundColor: theme.cardBackground,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  savingText: {
    ...typography.body,
    color: theme.text,
    marginTop: 12,
  },
});