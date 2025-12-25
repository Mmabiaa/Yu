import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
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

const settings = [
  { id: 'notifications', title: 'Notifications', subtitle: 'Manage alerts', icon: 'notifications-outline', color: '#60A5FA' },
  { id: 'privacy', title: 'Privacy', subtitle: 'Data controls', icon: 'lock-closed-outline', color: colors.purple },
  { id: 'voice', title: 'Voice & Sound', subtitle: 'Audio preferences', icon: 'volume-high-outline', color: colors.green },
  { id: 'help', title: 'Help & Support', subtitle: 'Get assistance', icon: 'help-circle-outline', color: colors.orange },
];

export default function ProfileScreen({ navigation }: any) {
  const [selectedPersonality, setSelectedPersonality] = useState('friend');
  const [selectedPresence, setSelectedPresence] = useState('full');
  const [userName, setUserName] = useState('');

  const handleSaveName = () => {
    if (userName.trim()) {
      Alert.alert('Success', `Name saved as: ${userName}`);
    } else {
      Alert.alert('Error', 'Please enter your name');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
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
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.nameInputIcon} />
            <TextInput
              style={styles.nameInputText}
              placeholder="Enter your name"
              placeholderTextColor={colors.textSecondary}
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
                    <Ionicons name="checkmark" size={16} color={colors.text} />
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
                <Ionicons name="checkmark" size={20} color={colors.text} />
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
                if (setting.id === 'notifications') {
                  Alert.alert('Notifications', 'Manage your alert preferences here');
                } else if (setting.id === 'privacy') {
                  Alert.alert('Privacy', 'Control your data and privacy settings');
                } else if (setting.id === 'voice') {
                  navigation.navigate('Chat');
                } else if (setting.id === 'help') {
                  Alert.alert('Help & Support', 'Get assistance and access support resources');
                }
              }}
            >
              <View style={[styles.settingIconContainer, { borderColor: setting.color }]}>
                <Ionicons name={setting.icon as any} size={20} color={setting.color} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{setting.title}</Text>
                <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
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
  headerTitle: {
    ...typography.h2,
    color: colors.text,
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
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  nameSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: 12,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  nameInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C2E',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  nameInputIcon: {
    marginRight: 12,
  },
  nameInputText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  saveButtonText: {
    color: colors.text,
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
    backgroundColor: '#1C1C2E',
    padding: 16,
    borderRadius: 12,
    position: 'relative',
    minHeight: 100,
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  personalityOptionSelected: {
    backgroundColor: '#2D1B69',
    borderColor: '#8B5CF6',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personalityTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 4,
  },
  personalityTitleSelected: {
    color: colors.text,
  },
  personalitySubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontSize: 12,
  },
  personalitySubtitleSelected: {
    color: colors.textSecondary,
  },
  presenceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C2E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  presenceOptionSelected: {
    backgroundColor: '#2D1B69',
    borderColor: '#8B5CF6',
  },
  presenceContent: {
    flex: 1,
  },
  presenceTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  presenceSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C2E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2A2A3E',
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
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  footerTagline: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});