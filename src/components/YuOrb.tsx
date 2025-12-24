import React, { useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

const { width, height } = Dimensions.get('window');

interface YuOrbProps {
  onTap?: () => void;
  onHold?: () => void;
  onDoubleTap?: () => void;
  listening?: boolean;
}

export default function YuOrb({ 
  onTap, 
  onHold, 
  onDoubleTap,
  listening = false 
}: YuOrbProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (listening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [listening]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.glowContainer,
          {
            transform: [{ scale: glowAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glow}
        />
      </Animated.View>
      
      <Animated.View
        style={[
          styles.orbContainer,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onTap}
          onLongPress={onHold}
          style={styles.orb}
        >
          <View style={styles.orbInner}>
            <View style={styles.orbEye} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  glowContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  glow: {
    flex: 1,
    borderRadius: 100,
    opacity: 0.3,
  },
  orbContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.blueLight,
  },
  orb: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2A2A2A',
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
});

