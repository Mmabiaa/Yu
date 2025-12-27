import React, { useState } from 'react';
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

export default function SignupScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.email.trim() &&
      formData.password.trim() &&
      formData.confirmPassword.trim() &&
      formData.password === formData.confirmPassword &&
      acceptTerms
    );
  };

  const handleSignup = async () => {
    if (!isFormValid()) {
      return;
    }

    setIsLoading(true);
    
    // Simulate signup process
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to OTP confirmation
      navigation.navigate('OTPConfirmation', { 
        email: formData.email,
        type: 'signup'
      });
    }, 2000);
  };

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
            
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Ionicons name="star" size={32} color={theme.purple} />
              </View>
              <Text style={styles.logoText}>Yu</Text>
            </View>
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.subtitleText}>Join Yu and unlock your digital twin</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color={theme.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={[
                styles.inputContainer,
                formData.confirmPassword && formData.password !== formData.confirmPassword && styles.inputError
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color={theme.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <Text style={styles.errorText}>Passwords don't match</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAcceptTerms(!acceptTerms)}
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signupButton, (!isFormValid() || isLoading) && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? (
                <Text style={styles.signupButtonText}>Creating Account...</Text>
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={20} color={theme.text} />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-apple" size={20} color={theme.text} />
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text 
                style={styles.footerLink}
                onPress={() => navigation.navigate('Login')}
              >
                Sign in
              </Text>
            </Text>
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
    paddingBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.cardBackground,
    borderWidth: 2,
    borderColor: theme.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    ...typography.h1,
    color: theme.text,
    fontWeight: '700',
  },
  welcomeText: {
    ...typography.h2,
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    ...typography.body,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    ...typography.bodySmall,
    color: theme.text,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  inputError: {
    borderColor: theme.red,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: theme.text,
    paddingVertical: 4,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    ...typography.caption,
    color: theme.red,
    marginTop: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: theme.purple,
    borderColor: theme.purple,
  },
  termsText: {
    ...typography.bodySmall,
    color: theme.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: theme.purple,
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: theme.purple,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    ...typography.bodySmall,
    color: theme.textSecondary,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingVertical: 16,
    gap: 12,
  },
  socialButtonText: {
    ...typography.body,
    color: theme.text,
    fontWeight: '500',
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