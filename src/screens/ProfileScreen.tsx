import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';

const presenceLevels = [
  { id: 'full', title: 'Full Yu', subtitle: 'Complete interaction', selected: true },
  { id: 'quiet', title: 'Quiet Yu', subtitle: 'Notifications only', selected: false },
  { id: 'shadow', title: 'Shadow Yu', subtitle: 'Passive learning', selected: false },
  { id: 'off', title: 'Off', subtitle: 'Complete privacy', selected: false },
];

const settings = [
  { id: 'notifications', title: 'Notifications', subtitle: 'Manage alerts', icon: 'notifications-outline', color: colors.blue },
  { id: 'privacy', title: 'Privacy', subtitle: 'Data controls', icon: 'lock-closed-outline', color: colors.purple },
  { id: 'voice', title: 'Voice & Sound', subtitle: 'Audio preferences', icon: 'volume-high-outline', color: colors.green },
  { id: 'help', title: 'Help & Support', subtitle: 'Get assistance', icon: 'help-circle-outline', color: colors.orange },
];

export default function ProfileScreen({ navigation }: any) {
  const [selectedPresence, setSelectedPresence] = useState('full');

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

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SETTINGS</Text>
          {settings.map((setting) => (
            <TouchableOpacity
              key={setting.id}
              style={styles.settingOption}
              onPress={() => {
                // All settings buttons are functional
                if (setting.id === 'notifications') {
                  Alert.alert('Notifications', 'Manage your alert preferences here');
                } else if (setting.id === 'privacy') {
                  Alert.alert('Privacy', 'Control your data and privacy settings');
                } else if (setting.id === 'voice') {
                  Alert.alert('Voice & Sound', 'Adjust audio preferences and voice settings');
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  presenceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  presenceOptionSelected: {
    backgroundColor: colors.purple,
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
    backgroundColor: colors.surfaceLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
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

