import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StatusBar from '../components/StatusBar';
import { colors, typography } from '../theme';

const quickPhrases = [
  'Hello', 'Thank you', 'Goodbye', 'Yes',
  'No', 'Please', 'Sorry', 'Help',
];

export default function TranslateScreen({ navigation }: any) {
  const [fromLang, setFromLang] = useState('English');
  const [toLang, setToLang] = useState('Spanish');
  const [inputText, setInputText] = useState('');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar time="1:57" battery="54%" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="language-outline" size={20} color={colors.text} />
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
          <TouchableOpacity style={styles.languageButton}>
            <Text style={styles.flag}>🇺🇸</Text>
            <Text style={styles.languageText}>{fromLang}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.swapButton}>
            <Ionicons name="swap-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.languageButton}>
            <Text style={styles.flag}>🇪🇸</Text>
            <Text style={styles.languageText}>{toLang}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.inputHeaderText}>{fromLang}</Text>
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
            <TouchableOpacity style={styles.micButton}>
              <Ionicons name="mic-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.translateButton}>
          <Text style={styles.translateButtonText}>Translate</Text>
        </TouchableOpacity>

        <View style={styles.quickPhrasesSection}>
          <Text style={styles.quickPhrasesTitle}>Quick Phrases</Text>
          <View style={styles.quickPhrasesGrid}>
            {quickPhrases.map((phrase, index) => (
              <TouchableOpacity
                key={index}
                style={styles.phraseButton}
                onPress={() => setInputText(phrase)}
              >
                <Text style={styles.phraseText}>{phrase}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
    gap: 12,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    minHeight: 80,
  },
  micButton: {
    padding: 4,
  },
  translateButton: {
    backgroundColor: colors.surfaceLight,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  translateButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
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
});

