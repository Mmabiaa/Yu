import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

const BAR_COUNT = 40;
const BAR_WIDTH = 3;
const BAR_SPACING = 2;

export default function AudioVisualization() {
  const animations = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.1))
  ).current;

  useEffect(() => {
    const animateBars = () => {
      const animationsArray = animations.map((anim, index) => {
        const delay = index * 20;
        const duration = 300 + Math.random() * 200;
        const toValue = 0.1 + Math.random() * 0.9;

        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue,
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.1,
              duration,
              useNativeDriver: true,
            }),
          ])
        );
      });

      Animated.parallel(animationsArray).start();
    };

    animateBars();
  }, []);

  return (
    <View style={styles.container}>
      {animations.map((anim, index) => {
        const height = 20 + Math.random() * 60;
        return (
          <Animated.View
            key={index}
            style={[
              styles.barContainer,
              {
                transform: [
                  {
                    scaleY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.1, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.purple, colors.blueLight, colors.green]}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={[styles.bar, { height }]}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    paddingHorizontal: 20,
    gap: BAR_SPACING,
  },
  barContainer: {
    width: BAR_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
    minHeight: 4,
  },
});

