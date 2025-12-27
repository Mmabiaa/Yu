import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface OTPConfirmationScreenProps {
  navigation: any;
  route: {
    params: {
      email: string;
      type: 'signup' | 'password_reset';
    };
  };
}

export default function OTPConfirmationScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { email, type } = route.params || { email: '', type: 'signup' };
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;

    setIsLoading(true);
    
    // Simulate OTP verification
    setTimeout(() => {
      setIsLoading(false);
      if (type === 'signup') {
        // Navigate to account created screen
        navigation.navigate('AccountCreated');
      } else {
        // Navigate to password reset success or new password screen
        navigation.navigate('Login');
      }
    }, 2000);
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setCanResend(false);
    setTimer(60);
    setOtp(['', '', '', '', '', '']);
    
    // Simulate resending OTP
    setTimeout(() => {
      setIsResending(false);
    }, 2000);
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            
            <View style={styles.iconContainer}>
              <View style={styles.otpIcon}>
                <Ionicons name="shield-checkmark" size={32} color={theme.purple} />
              </View>
            </View>
            
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  autoFocus={index === 0}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, (!isOtpComplete || isLoading) && styles.verifyButtonDisabled]}
              onPress={handleVerify}
              disabled={!isOtpComplete || isLoading}
            >
              {isLoading ? (
                <Text style={styles.verifyButtonText}>Verifying...</Text>
              ) : (
                <Text style={styles.verifyButtonText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              {canResend ? (
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={isResending}
                >
                  <Text style={styles.resendText}>
                    {isResending ? 'Sending...' : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.timerText}>
                  Resend code in {timer}s
                </Text>
              )}
            </View>

            <View style={styles.helpCard}>
              <Ionicons name="information-circle-outline" size={24} color={theme.blue} />
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>Didn't receive the code?</Text>
                <Text style={styles.helpText}>
                  • Check your spam or junk folder{'\n'}
                  • Make sure {email} is correct{'\n'}
                  • Wait a few minutes for delivery
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => navigation.navigate(type === 'signup' ? 'Signup' : 'PasswordReset')}
            >
              <Text style={styles.footerText}>
                Wrong email? <Text style={styles.footerLink}>Change it</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  otpIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.cardBackground,
    borderWidth: 2,
    borderColor: theme.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  emailText: {
    color: theme.text,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    gap: 32,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  otpInput: {
    flex: 1,
    height: 56,
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.cardBorder,
    ...typography.h3,
    color: theme.text,
    fontWeight: '600',
  },
  otpInputFilled: {
    borderColor: theme.purple,
    backgroundColor: theme.purple + '10',
  },
  verifyButton: {
    backgroundColor: theme.purple,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    ...typography.body,
    color: theme.purple,
    fontWeight: '600',
  },
  timerText: {
    ...typography.body,
    color: theme.textSecondary,
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    ...typography.bodySmall,
    color: theme.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    ...typography.bodySmall,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 20,
  },
  footerText: {
    ...typography.body,
    color: theme.textSecondary,
  },
  footerLink: {
    color: theme.purple,
    fontWeight: '600',
  },
});