import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import YuVisionScreen from './src/screens/YuVisionScreen';
import ChatScreen from './src/screens/ChatScreen';
import TranslateScreen from './src/screens/TranslateScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import PasswordResetScreen from './src/screens/PasswordResetScreen';
import OTPConfirmationScreen from './src/screens/OTPConfirmationScreen';
import AccountCreatedScreen from './src/screens/AccountCreatedScreen';
import { ThemeProvider } from './src/context/ThemeContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: '#000000' },
            }}
          >
            {/* Authentication Screens */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
            <Stack.Screen name="OTPConfirmation" component={OTPConfirmationScreen} />
            <Stack.Screen name="AccountCreated" component={AccountCreatedScreen} />

            {/* Main App Screens */}
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                presentation: 'modal',
                cardStyleInterpolator: ({ current, layouts }) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateY: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-layouts.screen.height, 0],
                          }),
                        },
                      ],
                    },
                  };
                },
              }}
            />
            <Stack.Screen name="YuVision" component={YuVisionScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Translate" component={TranslateScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

