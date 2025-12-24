import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StatusBar from '../components/StatusBar';
import AudioVisualization from '../components/AudioVisualization';
import { colors, typography } from '../theme';

export default function ListeningScreen({ navigation }: any) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getDate = () => {
    const date = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.date}>{getDate()}</Text>
          <Text style={styles.greeting}>{getGreeting()}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.visualizationContainer}>
          <AudioVisualization />
        </View>
        <Text style={styles.listeningText}>Listening...</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all &gt;</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContainer}
          >
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: colors.green }]}
              onPress={() => navigation.navigate('Translate')}
            >
              <Ionicons name="globe-outline" size={32} color={colors.text} />
              <Text style={styles.quickActionTitle}>Yu- Translate</Text>
              <Text style={styles.quickActionSubtitle}>Break barriers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: colors.red }]}
            >
              <Ionicons name="phone-portrait-outline" size={32} color={colors.text} />
              <Text style={styles.quickActionTitle}>Yu-Control</Text>
              <Text style={styles.quickActionSubtitle}>Master devices</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={16} color={colors.purple} style={{ marginRight: 4 }} />
            <Text style={styles.sectionTitle}>Yu Insights</Text>
          </View>

          <View style={styles.insightCard}>
            <Ionicons name="brain-outline" size={24} color={colors.purple} />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Memory</Text>
              <Text style={styles.insightSubtitle}>Ready to learn your preferences</Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <Ionicons name="star-outline" size={24} color={colors.purple} />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Status</Text>
              <Text style={styles.insightSubtitle}>All systems operational</Text>
            </View>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  date: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  greeting: {
    ...typography.h1,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  visualizationContainer: {
    marginVertical: 20,
  },
  listeningText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  seeAll: {
    ...typography.bodySmall,
    color: colors.purple,
    marginLeft: 'auto',
  },
  quickActionsContainer: {
    gap: 12,
    paddingRight: 20,
  },
  quickActionCard: {
    width: 140,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  quickActionSubtitle: {
    ...typography.caption,
    color: colors.text,
    opacity: 0.8,
    textAlign: 'center',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});

