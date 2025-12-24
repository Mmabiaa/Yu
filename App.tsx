import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import YuVisionScreen from './src/screens/YuVisionScreen';
import ChatScreen from './src/screens/ChatScreen';
import TranslateScreen from './src/screens/TranslateScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#000000' },
          }}
        >
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
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          <Stack.Screen name="YuVision" component={YuVisionScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Translate" component={TranslateScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

