import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getVoiceIntegration } from '../services/voice/VoiceIntegration';
import YuOrb from '../components/YuOrb';
import { AudioVisualizer } from '../components/AudioVisualizer';
import { typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [isListening, setIsListening] = useState(false);
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const voiceIntegration = getVoiceIntegration();
  
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
    { id: 'vision', title: 'Yu-Vision', subtitle: 'See & understand', color: theme.purple, icon: 'camera-outline' },
    { id: 'voice', title: 'Yu-Voice', subtitle: 'Talk naturally', color: '#06B6D4', icon: 'mic-outline' },
    { id: 'translate', title: 'Yu- Translate', subtitle: 'Break barriers', color: theme.green, icon: 'globe-outline' },
    { id: 'control', title: 'Yu-Control', subtitle: 'Master devices', color: theme.red, icon: 'phone-portrait-outline' },
  ];

  // Initialize voice integration
  useEffect(() => {
    const initializeVoice = async () => {
      try {
        await voiceIntegration.initialize();
      } catch (error) {
        console.error('Failed to initialize voice integration:', error);
      }
    };

    initializeVoice();

    return () => {
      // Cleanup on unmount
      voiceIntegration.cleanup();
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      handleVoiceRecording();
    }
  }, [isListening]);

  const handleVoiceRecording = async () => {
    try {
      setIsProcessing(true);
      
      // Record and transcribe audio
      const result = await voiceIntegration.recordAndTranscribe(
        { format: 'mp3', quality: 'medium' },
        3000 // 3 seconds max
      );

      setIsListening(false);
      
      if (result.text.trim()) {
        // Use transcribed text as response for now
        // In a real implementation, this would be sent to a chat service
        const responseText = `I heard: "${result.text}". How can I help you with that?`;
        setResponse(responseText);
        
        // Speak the response
        await voiceIntegration.synthesizeAndPlay(responseText);
      } else {
        setResponse("I didn't catch that. Could you try again?");
      }
    } catch (error) {
      console.error('Voice recording error:', error);
      setIsListening(false);
      setResponse("Sorry, I had trouble hearing you. Please try again.");
      
      Alert.alert(
        'Voice Error',
        'There was an issue with voice recording. Please check your microphone permissions.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOrbTap = () => {
    if (isListening || isProcessing) {
      return; // Prevent multiple taps
    }
    
    // Clear previous response and start listening
    setResponse('');
    setIsListening(true);
  };

  const handleOrbLongPress = () => {
    navigation.navigate('Profile');
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.date}>{getDate()}</Text>
          <Text style={styles.greeting}>{getGreeting()}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="settings-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Only show orb when NOT listening */}
        {!isListening && (
          <YuOrb 
            onTap={handleOrbTap}
            onDoubleTap={() => navigation.navigate('YuVision')}
            onHold={handleOrbLongPress}
            listening={isListening}
          />
        )}
        
        {isListening ? (
          <>
            <View style={styles.visualizationContainer}>
              <AudioVisualizer 
                isRecording={true}
                height={80}
                barCount={25}
                barColor={theme.purple}
              />
            </View>
            <Text style={styles.listeningText}>
              {isProcessing ? 'Processing...' : 'Listening...'}
            </Text>
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
                <Ionicons name={action.icon as any} size={32} color="#FFFFFF" />
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={16} color={theme.purple} style={{ marginRight: 4 }} />
            <Text style={styles.sectionTitle}>Yu Insights</Text>
          </View>

          <View style={styles.insightCard}>
            <Ionicons name="bulb-outline" size={24} color={theme.purple} />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Memory</Text>
              <Text style={styles.insightSubtitle}>Ready to learn your preferences</Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <Ionicons name="star-outline" size={24} color={theme.purple} />
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

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    color: theme.textSecondary,
    marginBottom: 4,
  },
  greeting: {
    ...typography.h1,
    color: theme.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  tapInstruction: {
    ...typography.body,
    color: theme.textSecondary,
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
    color: theme.text,
  },
  seeAll: {
    ...typography.bodySmall,
    color: theme.purple,
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
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  quickActionSubtitle: {
    ...typography.caption,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...typography.body,
    color: theme.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightSubtitle: {
    ...typography.bodySmall,
    color: theme.textSecondary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  footerText: {
    ...typography.label,
    color: theme.purple,
    marginBottom: 8,
  },
  footerSubtext: {
    ...typography.bodySmall,
    color: theme.text,
  },
  visualizationContainer: {
    marginTop: 60,
    marginBottom: 20,
  },
  listeningText: {
    ...typography.bodySmall,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  responseContainer: {
    backgroundColor: theme.cardBackground,
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  responseText: {
    ...typography.body,
    color: theme.text,
    lineHeight: 24,
  },
});