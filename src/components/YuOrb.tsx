import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous subtle pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.outerGlow,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={styles.outerGlowRing} />
      </Animated.View>

      {/* Main orb */}
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
          style={styles.touchable}
        >
          {/* Gradient ring */}
          <LinearGradient
            colors={['#60A5FA', '#06B6D4', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientRing}
          >
            {/* Inner dark circle */}
            <View style={styles.innerCircle}>
              {/* Eye/reflection element */}
              <View style={styles.eyeElement} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
    height: 280,
  },
  outerGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlowRing: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  orbContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  innerCircle: {
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeElement: {
    width: 40,
    height: 16,
    borderRadius: 20,
    backgroundColor: '#4A5568',
    marginTop: -8,
    marginLeft: -20,
    opacity: 0.8,
  },
});