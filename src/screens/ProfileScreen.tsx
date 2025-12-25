import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../theme';
import { useTheme } from '../context/ThemeContext';
import YuOrb from '../components/YuOrb';

const personalities = [
  { id: 'assistant', title: 'Assistant', subtitle: 'Helpful and formal' },
  { id: 'friend', title: 'Friend', subtitle: 'Casual and empathetic' },
  { id: 'expert', title: 'Expert', subtitle: 'Efficient and technical' },
  { id: 'minimalist', title: 'Minimalist', subtitle: 'Quiet and unobtrusive' },
];

const presenceLevels = [
  { id: 'full', title: 'Full Yu', subtitle: 'Complete interaction' },
  { id: 'quiet', title: 'Quiet Yu', subtitle: 'Notifications only' },
  { id: 'shadow', title: 'Shadow Yu', subtitle: 'Passive learning' },
  { id: 'off', title: 'Off', subtitle: 'Complete privacy' },
];

export default function ProfileScreen({ navigation }: any) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [selectedPersonality, setSelectedPersonality] = useState('friend');
  const [selectedPresence, setSelectedPresence] = useState('full');
  const [userName, setUserName] = useState('');

  const settings = [
    { id: 'theme', title: 'Theme', subtitle: isDark ? 'Dark mode' : 'Light mode', icon: 'color-palette-outline', color: theme.purple },
    { id: 'notifications', title: 'Notifications', subtitle: 'Manage alerts', icon: 'notifications-outline', color: '#60A5FA' },
    { id: 'privacy', title: 'Privacy', subtitle: 'Data controls', icon: 'lock-closed-outline', color: theme.purple },
    { id: 'voice', title: 'Voice & Sound', subtitle: 'Audio preferences', icon: 'volume-high-outline', color: theme.green },
    { id: 'help', title: 'Help & Support', subtitle: 'Get assistance', icon: 'help-circle-outline', color: theme.orange },
  ];

  const handleSaveName = () => {
    if (userName.trim()) {
      Alert.alert('Success', `Name saved as: ${userName}`);
    } else {
      Alert.alert('Error', 'Please enter your name');
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Yu Orb */}
        <YuOrb />

        {/* Set your name section */}
        <View style={styles.nameSection}>
          <Text style={styles.nameHeading}>Set your name</Text>
          <Text style={styles.nameSubtitle}>Yu is ready to assist</Text>
        </View>

        {/* Your Name Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR NAME</Text>
          <View style={styles.nameInput}>
            <Ionicons name="person-outline" size={20} color={theme.textSecondary} style={styles.nameInputIcon} />
            <TextInput
              style={styles.nameInputText}
              placeholder="Enter your name"
              placeholderTextColor={theme.textSecondary}
              value={userName}
              onChangeText={setUserName}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveName}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Yu Personality Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YU PERSONALITY</Text>
          <View style={styles.personalityGrid}>
            {personalities.map((personality) => (
              <TouchableOpacity
                key={personality.id}
                style={[
                  styles.personalityOption,
                  selectedPersonality === personality.id && styles.personalityOptionSelected,
                ]}
                onPress={() => setSelectedPersonality(personality.id)}
              >
                {selectedPersonality === personality.id && (
                  <View style={styles.checkmarkContainer}>
                    <Ionicons name="checkmark" size={16} color={theme.text} />
                  </View>
                )}
                <Text style={[
                  styles.personalityTitle,
                  selectedPersonality === personality.id && styles.personalityTitleSelected
                ]}>
                  {personality.title}
                </Text>
                <Text style={[
                  styles.personalitySubtitle,
                  selectedPersonality === personality.id && styles.personalitySubtitleSelected
                ]}>
                  {personality.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Presence Level Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PRESENCE LEVEL</Text>
          {presenceLevels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.presenceOption,
                selectedPresence === level.id && styles.presenceOptionSelected,
              ]}
              onPress={() => setSelectedPresence(level.id)}
            >
              <View style={styles.presenceContent}>
                <Text style={styles.presenceTitle}>{level.title}</Text>
                <Text style={styles.presenceSubtitle}>{level.subtitle}</Text>
              </View>
              {selectedPresence === level.id && (
                <Ionicons name="checkmark" size={20} color={theme.text} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SETTINGS</Text>
          {settings.map((setting) => (
            <TouchableOpacity
              key={setting.id}
              style={styles.settingOption}
              onPress={() => {
                if (setting.id === 'theme') {
                  // Theme toggle is handled by the switch
                  return;
                } else if (setting.id === 'notifications') {
                  Alert.alert('Notifications', 'Manage your alert preferences here');
                } else if (setting.id === 'privacy') {
                  Alert.alert('Privacy', 'Control your data and privacy settings');
                } else if (setting.id === 'voice') {
                  navigation.navigate('Chat');
                } else if (setting.id === 'help') {
                  Alert.alert('Help & Support', 'Get assistance and access support resources');
                }
              }}
              activeOpacity={setting.id === 'theme' ? 1 : 0.7}
            >
              <View style={[styles.settingIconContainer, { borderColor: setting.color }]}>
                <Ionicons name={setting.icon as any} size={20} color={setting.color} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{setting.title}</Text>
                <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
              </View>
              {setting.id === 'theme' ? (
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#D1D5DB', true: theme.purple }}
                  thumbColor={isDark ? '#FFFFFF' : '#FFFFFF'}
                />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Yu v1.0.0</Text>
          <Text style={styles.footerTagline}>You, enhanced</Text>
        </View>
      </ScrollView>
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
  },
  headerTitle: {
    ...typography.h2,
    color: theme.text,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  nameHeading: {
    ...typography.h1,
    color: theme.text,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  nameSubtitle: {
    ...typography.body,
    color: theme.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionLabel: {
    ...typography.label,
    color: theme.textSecondary,
    marginBottom: 12,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  nameInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  nameInputIcon: {
    marginRight: 12,
  },
  nameInputText: {
    flex: 1,
    ...typography.body,
    color: theme.text,
  },
  saveButton: {
    backgroundColor: theme.purple,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  personalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  personalityOption: {
    width: '47%',
    backgroundColor: theme.cardBackground,
    padding: 16,
    borderRadius: 12,
    position: 'relative',
    minHeight: 100,
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  personalityOptionSelected: {
    backgroundColor: theme.selectedCardBackground,
    borderColor: theme.selectedCardBorder,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personalityTitle: {
    ...typography.body,
    color: theme.text,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 4,
  },
  personalityTitleSelected: {
    color: theme.text,
  },
  personalitySubtitle: {
    ...typography.bodySmall,
    color: theme.textSecondary,
    fontSize: 12,
  },
  personalitySubtitleSelected: {
    color: theme.textSecondary,
  },
  presenceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  presenceOptionSelected: {
    backgroundColor: theme.selectedCardBackground,
    borderColor: theme.selectedCardBorder,
  },
  presenceContent: {
    flex: 1,
  },
  presenceTitle: {
    ...typography.body,
    color: theme.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  presenceSubtitle: {
    ...typography.bodySmall,
    color: theme.textSecondary,
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
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
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  footerText: {
    ...typography.bodySmall,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  footerTagline: {
    ...typography.bodySmall,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
});