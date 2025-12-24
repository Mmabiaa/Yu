import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { speak } from '../utils/speech';
import YuOrb from '../components/YuOrb';
import AudioVisualization from '../components/AudioVisualization';
import { colors, typography } from '../theme';

const { width } = Dimensions.get('window');

const mockResponses: { [key: string]: string } = {
  'hello': "Hey there! I'm Yu, your digital twin. How can I help you today?",
  'hi': "Hey there! I'm Yu, your digital twin. How can I help you today?",
  'hey': "Hey there! I'm Yu, your digital twin. How can I help you today?",
  'default': "Hey there! I'm Yu, your digital twin. How can I help you today?",
};

export default function HomeScreen({ navigation }: any) {
  const [isListening, setIsListening] = useState(false);
  const [response, setResponse] = useState('');
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

  const quickActions = [
    { id: 'vision', title: 'Yu-Vision', subtitle: 'See & understand', color: colors.purple, icon: 'camera-outline' },
    { id: 'voice', title: 'Yu-Voice', subtitle: 'Talk naturally', color: '#06B6D4', icon: 'mic-outline' },
    { id: 'translate', title: 'Yu- Translate', subtitle: 'Break barriers', color: colors.green, icon: 'globe-outline' },
    { id: 'control', title: 'Yu-Control', subtitle: 'Master devices', color: colors.red, icon: 'phone-portrait-outline' },
  ];

  useEffect(() => {
    if (isListening) {
      // Auto-stop listening after 3 seconds
      const timer = setTimeout(() => {
        setIsListening(false);
        // Mock response
        const userInput = 'hello'; // In real app, this would be from speech recognition
        const mockResponse = mockResponses[userInput.toLowerCase()] || mockResponses['default'];
        setResponse(mockResponse);
        
        // Speak the response
        speak(mockResponse, {
          language: 'en',
          pitch: 1.0,
          rate: 0.9,
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isListening]);

  const handleOrbTap = () => {
    // Clear previous response and start listening
    setResponse('');
    setIsListening(true);
  };

  const handleOrbLongPress = () => {
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        <YuOrb 
          onTap={handleOrbTap}
          onDoubleTap={() => navigation.navigate('YuVision')}
          onHold={handleOrbLongPress}
          listening={isListening}
        />
        {isListening ? (
          <>
            <View style={styles.visualizationContainer}>
              <AudioVisualization isActive={true} />
            </View>
            <Text style={styles.listeningText}>Listening...</Text>
          </>
        ) : response ? (
          <View style={styles.responseContainer}>
            <Text style={styles.responseText}>{response}</Text>
          </View>
        ) : (
          <Text style={styles.tapInstruction}>Tap to start</Text>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContainer}
          >
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickActionCard, { backgroundColor: action.color }]}
                onPress={() => {
                  if (action.id === 'vision') {
                    navigation.navigate('YuVision');
                  } else if (action.id === 'voice') {
                    handleOrbTap();
                  } else if (action.id === 'translate') {
                    navigation.navigate('Translate');
                  } else if (action.id === 'control') {
                    navigation.navigate('Chat');
                  }
                }}
              >
                <Ionicons name={action.icon as any} size={32} color={colors.text} />
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>PRO TIP</Text>
          <Text style={styles.footerSubtext}>
            Long press the orb to quickly access your profile and customize Yu's
          </Text>
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
    paddingTop: 12,
    paddingBottom: 20,
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
  tapInstruction: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
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
    marginRight: 12,
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
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  footerText: {
    ...typography.label,
    color: colors.purple,
    marginBottom: 8,
  },
  footerSubtext: {
    ...typography.bodySmall,
    color: colors.text,
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
  responseContainer: {
    backgroundColor: colors.surfaceLight,
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  responseText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
});

