import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

  const handleTranslate = () => {
    // Mock translation
    if (inputText.trim()) {
      const translation = mockTranslations[inputText] || `[${inputText} translated to ${toLang.name}]`;
      setOutputText(translation);
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
          <TouchableOpacity 
            style={[styles.languageButton, fromLang.code === 'en' && styles.languageButtonSelected]}
            onPress={() => setShowFromDropdown(true)}
          >
            <Text style={styles.flag}>{fromLang.flag}</Text>
            <Text style={styles.languageText}>{fromLang.name}</Text>
            {fromLang.code === 'en' && (
              <Ionicons name="checkmark" size={16} color={colors.text} style={{ marginLeft: 8 }} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
            <Ionicons name="swap-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.languageButton, toLang.code === 'es' && styles.languageButtonSelected]}
            onPress={() => setShowToDropdown(true)}
          >
            <Text style={styles.flag}>{toLang.flag}</Text>
            <Text style={styles.languageText}>{toLang.name}</Text>
            {toLang.code === 'es' && (
              <Ionicons name="checkmark" size={16} color={colors.text} style={{ marginLeft: 8 }} />
            )}
          </TouchableOpacity>
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
            <View style={styles.inputIcons}>
              <TouchableOpacity style={styles.micButton}>
                <Ionicons name="mic-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.translateButton} onPress={handleTranslate}>
          <Text style={styles.translateButtonText}>Translate</Text>
        </TouchableOpacity>

        {outputText ? (
          <View style={styles.outputSection}>
            <View style={styles.inputHeader}>
              <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.inputHeaderText}>{toLang.name}</Text>
            </View>
            <View style={styles.outputContainer}>
              <Text style={styles.outputText}>{outputText}</Text>
              <View style={styles.outputIcons}>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="volume-high-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="copy-outline" size={20} color={colors.textSecondary} />
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

      {/* From Language Dropdown */}
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
          <View style={styles.dropdown}>
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

      {/* To Language Dropdown */}
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
          <View style={styles.dropdown}>
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
  languageButtonSelected: {
    backgroundColor: colors.purple,
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    minHeight: 80,
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  micButton: {
    padding: 4,
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
  outputContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  outputText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  outputIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
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
    padding: 8,
    minWidth: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  dropdownItemSelected: {
    backgroundColor: colors.purple,
  },
  dropdownText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
});
