import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { speak } from '../utils/speech';
import * as Clipboard from 'expo-clipboard';
import AudioVisualization from '../components/AudioVisualization';
import { colors, typography } from '../theme';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
];

const quickPhrases = [
  'Hello', 'Thank you', 'Goodbye', 'Yes',
  'No', 'Please', 'Sorry', 'Help',
];

const mockTranslations: { [key: string]: string } = {
  'Hello': 'Hola',
  'Thank you': 'Gracias',
  'Goodbye': 'Adiós',
  'Yes': 'Sí',
  'No': 'No',
  'Please': 'Por favor',
  'Sorry': 'Lo siento',
  'Help': 'Ayuda',
};

export default function TranslateScreen({ navigation }: any) {
  const [fromLang, setFromLang] = useState(languages[0]);
  const [toLang, setToLang] = useState(languages[1]);
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const fromButtonRef = useRef<View | null>(null);
  const toButtonRef = useRef<View | null>(null);
  const [fromButtonLayout, setFromButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [toButtonLayout, setToButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleTranslate = () => {
    // Mock translation
    if (inputText.trim()) {
      const translation = mockTranslations[inputText] || `[${inputText} translated to ${toLang.name}]`;
      setOutputText(translation);
    }
  };

  const handleRecordAudio = () => {
    if (isRecording) {
      // Stop recording and process speech-to-text
      setIsRecording(false);
      setIsListening(false);
      // Mock: simulate speech-to-text result
      const mockTranscription = 'Hello';
      setInputText(mockTranscription);
      // Auto-translate after getting the text
      setTimeout(() => {
        handleTranslate();
      }, 100);
    } else {
      // Start recording
      setIsRecording(true);
      setIsListening(true);
      // Mock recording - stop after 3 seconds and process speech-to-text
      setTimeout(() => {
        setIsRecording(false);
        setIsListening(false);
        const mockTranscription = 'Hello';
        setInputText(mockTranscription);
        // Auto-translate after getting the text
        setTimeout(() => {
          handleTranslate();
        }, 100);
      }, 3000);
    }
  };

  const handleSpeakInput = () => {
    if (inputText) {
      const langMap: { [key: string]: string } = {
        'es': 'es',
        'fr': 'fr',
        'de': 'de',
        'en': 'en',
      };
      speak(inputText, {
        language: langMap[fromLang.code] || 'en',
        pitch: 1.0,
        rate: 0.9,
      });
    }
  };

  const handleSpeakOutput = () => {
    if (outputText) {
      const langMap: { [key: string]: string } = {
        'es': 'es',
        'fr': 'fr',
        'de': 'de',
        'en': 'en',
      };
      speak(outputText, {
        language: langMap[toLang.code] || 'en',
        pitch: 1.0,
        rate: 0.9,
      });
    }
  };

  const handleCopy = async () => {
    if (outputText) {
      await Clipboard.setStringAsync(outputText);
      Alert.alert('Copied', 'Text copied to clipboard');
    }
  };

  const handleQuickPhrase = (phrase: string) => {
    setInputText(phrase);
    const translation = mockTranslations[phrase] || `[${phrase} translated to ${toLang.name}]`;
    setOutputText(translation);
  };

  const swapLanguages = () => {
    const temp = fromLang;
    setFromLang(toLang);
    setToLang(temp);
    const tempText = inputText;
    setInputText(outputText);
    setOutputText(tempText);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="language-outline" size={20} color={colors.green} />
          <Text style={styles.headerTitle}>Yu Translate</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.languageSelector}>
          <View style={styles.languageButtonWrapper} ref={fromButtonRef}>
            <TouchableOpacity 
              style={styles.languageButton}
              onPress={() => {
                fromButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
                  setFromButtonLayout({ x: pageX, y: pageY + height, width, height });
                  setShowFromDropdown(true);
                  setShowToDropdown(false);
                });
              }}
            >
              <Text style={styles.flag}>{fromLang.flag}</Text>
              <Text style={styles.languageText}>{fromLang.name}</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
            <Ionicons name="swap-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.languageButtonWrapper} ref={toButtonRef}>
            <TouchableOpacity 
              style={styles.languageButton}
              onPress={() => {
                toButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
                  setToButtonLayout({ x: pageX, y: pageY + height, width, height });
                  setShowToDropdown(true);
                  setShowFromDropdown(false);
                });
              }}
            >
              <Text style={styles.flag}>{toLang.flag}</Text>
              <Text style={styles.languageText}>{toLang.name}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.inputHeaderText}>{fromLang.name}</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter text to translate..."
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <View style={styles.inputIconsRow}>
              <TouchableOpacity 
                style={[styles.micButton, isRecording && styles.micButtonRecording]}
                onPress={handleRecordAudio}
              >
                <Ionicons 
                  name={isRecording ? "mic" : "mic-outline"} 
                  size={24} 
                  color={isRecording ? colors.green : colors.textSecondary} 
                />
              </TouchableOpacity>
              {inputText ? (
                <TouchableOpacity 
                  style={styles.speakerButton}
                  onPress={handleSpeakInput}
                >
                  <Ionicons 
                    name="volume-high-outline" 
                    size={24} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {isListening && (
          <View style={styles.listeningSection}>
            <AudioVisualization isActive={true} />
            <Text style={styles.listeningText}>Listening...</Text>
          </View>
        )}

        <TouchableOpacity style={styles.translateButton} onPress={handleTranslate}>
          <Text style={styles.translateButtonText}>Translate</Text>
        </TouchableOpacity>

        {outputText ? (
          <View style={styles.outputSection}>
            <View style={styles.outputHeader}>
              <Ionicons name="globe-outline" size={16} color={colors.green} />
              <Text style={styles.outputHeaderText}>{toLang.name}</Text>
            </View>
            <View style={styles.outputContainer}>
              <Text style={styles.outputText}>{outputText}</Text>
              <View style={styles.outputIcons}>
                <TouchableOpacity style={styles.iconButton} onPress={handleSpeakOutput}>
                  <Ionicons name="volume-high-outline" size={24} color={colors.green} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={handleCopy}>
                  <Ionicons name="copy-outline" size={24} color={colors.green} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.quickPhrasesSection}>
          <Text style={styles.quickPhrasesTitle}>Quick Phrases</Text>
          <View style={styles.quickPhrasesGrid}>
            {quickPhrases.map((phrase, index) => (
              <TouchableOpacity
                key={index}
                style={styles.phraseButton}
                onPress={() => handleQuickPhrase(phrase)}
              >
                <Text style={styles.phraseText}>{phrase}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* From Language Dropdown Modal */}
      <Modal
        visible={showFromDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFromDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFromDropdown(false)}
        >
          <View style={[styles.dropdown, {
            position: 'absolute',
            top: fromButtonLayout.y,
            left: fromButtonLayout.x,
            width: fromButtonLayout.width,
          }]}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.dropdownItem,
                  fromLang.code === lang.code && styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  setFromLang(lang);
                  setShowFromDropdown(false);
                }}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text style={styles.dropdownText}>{lang.name}</Text>
                {fromLang.code === lang.code && (
                  <Ionicons name="checkmark" size={16} color={colors.text} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* To Language Dropdown Modal */}
      <Modal
        visible={showToDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowToDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowToDropdown(false)}
        >
          <View style={[styles.dropdown, {
            position: 'absolute',
            top: toButtonLayout.y,
            left: toButtonLayout.x,
            width: toButtonLayout.width,
          }]}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.dropdownItem,
                  toLang.code === lang.code && styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  setToLang(lang);
                  setShowToDropdown(false);
                }}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text style={styles.dropdownText}>{lang.name}</Text>
                {toLang.code === lang.code && (
                  <Ionicons name="checkmark" size={16} color={colors.text} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  languageButtonWrapper: {
    flex: 1,
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  flag: {
    fontSize: 24,
  },
  languageText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  swapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  inputHeaderText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  inputContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
  },
  input: {
    ...typography.body,
    color: colors.text,
    minHeight: 80,
    fontSize: 18,
    marginBottom: 8,
  },
  inputIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  micButton: {
    padding: 8,
    borderRadius: 24,
  },
  micButtonRecording: {
    backgroundColor: colors.green + '30',
  },
  speakerButton: {
    padding: 8,
  },
  listeningSection: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  listeningText: {
    ...typography.body,
    color: colors.green,
    fontWeight: '600',
  },
  translateButton: {
    backgroundColor: colors.green,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  translateButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  outputSection: {
    marginBottom: 24,
  },
  outputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  outputHeaderText: {
    ...typography.bodySmall,
    color: colors.green,
  },
  outputContainer: {
    backgroundColor: 'rgba(21, 87, 36, 0.3)',
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  outputText: {
    ...typography.body,
    color: colors.text,
    fontSize: 18,
    marginBottom: 12,
  },
  outputIcons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 24,
  },
  quickPhrasesSection: {
    gap: 12,
  },
  quickPhrasesTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  quickPhrasesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  phraseButton: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  phraseText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  dropdownItemSelected: {
    backgroundColor: colors.purple,
  },
  dropdownText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});