import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Audio } from 'expo-av';

interface AudioVisualizerProps {
  isRecording?: boolean;
  isPlaying?: boolean;
  audioUri?: string;
  height?: number;
  barCount?: number;
  barColor?: string;
  backgroundColor?: string;
  animationSpeed?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isRecording = false,
  isPlaying = false,
  audioUri,
  height = 60,
  barCount = 20,
  barColor = '#007AFF',
  backgroundColor = 'transparent',
  animationSpeed = 100,
}) => {
  const [bars, setBars] = useState<Animated.Value[]>([]);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Initialize animated values for bars
  useEffect(() => {
    const initialBars = Array.from({ length: barCount }, () => new Animated.Value(0.1));
    setBars(initialBars);
  }, [barCount]);

  // Handle recording animation
  useEffect(() => {
    if (isRecording && bars.length > 0) {
      startRecordingAnimation();
    } else {
      stopAnimation();
    }

    return () => stopAnimation();
  }, [isRecording, bars]);

  // Handle playback animation
  useEffect(() => {
    if (isPlaying && audioUri && bars.length > 0) {
      startPlaybackAnimation();
    } else {
      stopAnimation();
    }

    return () => {
      stopAnimation();
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [isPlaying, audioUri, bars]);

  const startRecordingAnimation = () => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    animationRef.current = setInterval(() => {
      // Simulate audio levels with random values
      const animations = bars.map((bar) => {
        const randomHeight = Math.random() * 0.8 + 0.2; // Between 0.2 and 1.0
        return Animated.timing(bar, {
          toValue: randomHeight,
          duration: animationSpeed,
          useNativeDriver: false,
        });
      });

      Animated.parallel(animations).start();
    }, animationSpeed);
  };

  const startPlaybackAnimation = async () => {
    if (!audioUri) return;

    try {
      // Load the audio file for playback visualization
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false }
      );
      soundRef.current = sound;

      // Get audio status for duration
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) return;

      const duration = status.durationMillis || 0;
      const updateInterval = duration / (barCount * 10); // Smooth animation

      if (animationRef.current) {
        clearInterval(animationRef.current);
      }

      let currentTime = 0;
      animationRef.current = setInterval(() => {
        if (currentTime >= duration) {
          stopAnimation();
          return;
        }

        // Simulate waveform based on time position
        const progress = currentTime / duration;
        const animations = bars.map((bar, index) => {
          const barProgress = (index / barCount);
          const distance = Math.abs(progress - barProgress);
          const height = Math.max(0.1, 1 - distance * 2); // Create wave effect
          
          return Animated.timing(bar, {
            toValue: height,
            duration: animationSpeed,
            useNativeDriver: false,
          });
        });

        Animated.parallel(animations).start();
        currentTime += updateInterval;
      }, animationSpeed);

    } catch (error) {
      console.error('Error starting playback animation:', error);
    }
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }

    // Reset all bars to minimum height
    if (bars.length > 0) {
      const resetAnimations = bars.map((bar) =>
        Animated.timing(bar, {
          toValue: 0.1,
          duration: 200,
          useNativeDriver: false,
        })
      );

      Animated.parallel(resetAnimations).start();
    }
  };

  const renderBars = () => {
    return bars.map((bar, index) => (
      <Animated.View
        key={index}
        style={[
          styles.bar,
          {
            height: bar.interpolate({
              inputRange: [0, 1],
              outputRange: [2, height],
            }),
            backgroundColor: barColor,
          },
        ]}
      />
    ));
  };

  return (
    <View style={[styles.container, { height, backgroundColor }]}>
      <View style={styles.barsContainer}>
        {renderBars()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
  },
  bar: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 1,
    minHeight: 2,
  },
});

export default AudioVisualizer;