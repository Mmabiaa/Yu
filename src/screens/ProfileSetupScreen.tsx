import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import StatusBar from '../components/StatusBar';
import { colors, typography } from '../theme';

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
];

export default function ProfileSetupScreen({ navigation }: any) {
  const [selectedPersonality, setSelectedPersonality] = useState('friend');
  const [selectedPresence, setSelectedPresence] = useState('full');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar />
      
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
        <View style={styles.orbContainer}>
          <View style={styles.orb}>
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6', '#10B981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.orbGradient}
            />
            <View style={styles.orbInner}>
              <View style={styles.orbEye} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Set your name</Text>
          <Text style={styles.sectionSubtitle}>Yu is ready to assist</Text>
          
          <View style={styles.nameSection}>
            <Text style={styles.nameLabel}>YOUR NAME</Text>
            <TouchableOpacity style={styles.nameInput}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.nameInputText}>Tap to set your name</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YU PERSONALITY</Text>
          <View style={styles.personalityGrid}>
            {personalities.map((personality) => (
              <TouchableOpacity
                key={personality.id}
                style={[
                  styles.personalityCard,
                  selectedPersonality === personality.id && styles.personalityCardSelected,
                ]}
                onPress={() => setSelectedPersonality(personality.id)}
              >
                {selectedPersonality === personality.id && (
                  <View style={styles.checkmarkContainer}>
                    <Ionicons name="checkmark" size={16} color={colors.text} />
                  </View>
                )}
                <Text style={styles.personalityTitle}>{personality.title}</Text>
                <Text style={styles.personalitySubtitle}>{personality.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
  orbContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  orb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.blueLight,
  },
  orbGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  orbInner: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbEye: {
    width: 20,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A0A0A0',
    marginLeft: -10,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  nameSection: {
    marginTop: 8,
  },
  nameLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  nameInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  nameInputText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  personalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  personalityCard: {
    width: '47%',
    backgroundColor: colors.surfaceLight,
    padding: 16,
    borderRadius: 12,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personalityCardSelected: {
    backgroundColor: colors.purple,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
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
    textAlign: 'center',
  },
  personalitySubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
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
});

