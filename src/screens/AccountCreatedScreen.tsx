import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

export default function AccountCreatedScreen({ navigation }: any) {
  const { theme } = useTheme();
  const scaleAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Animate the success icon
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    navigation.replace('Home');
  };

  const handleExploreFeatures = () => {
    // Navigate to onboarding or feature tour
    navigation.replace('Home');
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.successContainer}>
          <Animated.View 
            style={[
              styles.successIconContainer,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </View>
            <View style={styles.successRing} />
          </Animated.View>

          <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
            <Text style={styles.title}>Account Created!</Text>
            <Text style={styles.subtitle}>
              Welcome to Yu! Your digital twin is ready to assist you with everything you need.
            </Text>
          </Animated.View>

          <Animated.View style={[styles.featuresContainer, { opacity: fadeAnim }]}>
            <Text style={styles.featuresTitle}>What you can do with Yu:</Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: theme.blue + '20' }]}>
                  <Ionicons name="mic" size={20} color={theme.blue} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Voice Conversations</Text>
                  <Text style={styles.featureDescription}>Talk naturally with your AI assistant</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: theme.green + '20' }]}>
                  <Ionicons name="camera" size={20} color={theme.green} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Visual Recognition</Text>
                  <Text style={styles.featureDescription}>Analyze and understand images</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: theme.orange + '20' }]}>
                  <Ionicons name="globe" size={20} color={theme.orange} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Language Translation</Text>
                  <Text style={styles.featureDescription}>Break down language barriers</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: theme.purple + '20' }]}>
                  <Ionicons name="phone-portrait" size={20} color={theme.purple} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Device Control</Text>
                  <Text style={styles.featureDescription}>Master your connected devices</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>

        <Animated.View style={[styles.buttonsContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleExploreFeatures}
          >
            <Text style={styles.secondaryButtonText}>Explore Features</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color={theme.purple} />
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Pro tip:</Text> Long press the Yu orb for quick access to settings
            </Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  successIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.green,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  successRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: theme.green + '40',
    zIndex: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    ...typography.h1,
    color: theme.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 20,
  },
  featuresTitle: {
    ...typography.body,
    color: theme.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 16,
    gap: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...typography.bodySmall,
    color: theme.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    ...typography.caption,
    color: theme.textSecondary,
  },
  buttonsContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.purple,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingVertical: 16,
  },
  secondaryButtonText: {
    ...typography.body,
    color: theme.text,
    fontWeight: '500',
  },
  footer: {
    paddingBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.purple + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.purple + '20',
    padding: 16,
    gap: 12,
  },
  tipText: {
    ...typography.bodySmall,
    color: theme.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  tipBold: {
    color: theme.text,
    fontWeight: '600',
  },
});