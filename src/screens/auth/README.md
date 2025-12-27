# Authentication Screens

This directory contains all authentication-related screens for the Yu app.

## Screens

### LoginScreen
- Email and password login
- Social login options (Google, Apple)
- Navigation to signup and password reset
- Consistent with app's dark theme and purple accent

### SignupScreen
- Full name, email, password, and confirm password fields
- Terms and conditions checkbox
- Social signup options
- Form validation with error states
- Navigation to OTP confirmation

### PasswordResetScreen
- Email input for password reset
- Success state with instructions
- Resend functionality
- Help information

### OTPConfirmationScreen
- 6-digit OTP input with auto-focus
- Timer for resend functionality
- Support for both signup and password reset flows
- Visual feedback for filled inputs

### AccountCreatedScreen
- Success animation
- Feature highlights
- Call-to-action buttons
- Onboarding tips

## Navigation Flow

```
Login ←→ Signup → OTPConfirmation → AccountCreated → Home
  ↓
PasswordReset → OTPConfirmation → Login
```

## Design Features

- Consistent with existing app theme (dark background, purple accents)
- Responsive design with KeyboardAvoidingView
- Proper form validation and loading states
- Accessibility-friendly with proper labels
- Smooth animations and transitions
- Error handling and user feedback

## Usage

The screens are already integrated into the main navigation stack in `App.tsx`. To start with authentication, set `initialRouteName="Login"` in the Stack.Navigator.

## Customization

All screens use the theme context, so they automatically adapt to theme changes. Colors, typography, and spacing follow the existing design system defined in:

- `src/theme/colors.ts`
- `src/theme/typography.ts`
- `src/context/ThemeContext.tsx`