import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
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
  showWaveform?: boolean;
  sensitivity?: number;
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
  showWaveform = true,
  sensitivity = 1.0,
}) => {
  const [bars, setBars] = useState<Animated.Value[]>([]);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Initialize animated values for bars
  useEffect(() => {
    const initialBars = Array.from({ length: barCount }, () => new Animated.Value(0.1));
    setBars(initialBars);
    
    // Initialize waveform data
    const initialWaveform = Array.from({ length: barCount }, () => 0.1);
    setWaveformData(initialWaveform);
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
      if (showWaveform) {
        startWaveformPlayback();
      } else {
        startPlaybackAnimation();
      }
    } else {
      stopAnimation();
    }

    return () => {
      stopAnimation();
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [isPlaying, audioUri, bars, showWaveform]);

  const generateRealisticWaveform = (duration: number): number[] => {
    const sampleCount = barCount;
    const waveform: number[] = [];
    
    for (let i = 0; i < sampleCount; i++) {
      const progress = i / sampleCount;
      
      // Create a more realistic waveform pattern
      let amplitude = 0.1;
      
      // Add multiple frequency components for realistic audio
      amplitude += Math.sin(progress * Math.PI * 4) * 0.3; // Low frequency
      amplitude += Math.sin(progress * Math.PI * 12) * 0.2; // Mid frequency
      amplitude += Math.sin(progress * Math.PI * 24) * 0.1; // High frequency
      
      // Add some randomness for natural variation
      amplitude += (Math.random() - 0.5) * 0.2;
      
      // Apply envelope (fade in/out at edges)
      const envelope = Math.sin(progress * Math.PI);
      amplitude *= envelope;
      
      // Normalize and clamp
      amplitude = Math.max(0.1, Math.min(1.0, (amplitude + 1) / 2));
      
      waveform.push(amplitude);
    }
    
    return waveform;
  };

  const startRecordingAnimation = () => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    let pulseDirection = 1;
    let baseIntensity = 0.3;

    animationRef.current = setInterval(() => {
      // Create a pulsing effect that simulates real-time audio input
      baseIntensity += pulseDirection * 0.1;
      if (baseIntensity >= 0.8) pulseDirection = -1;
      if (baseIntensity <= 0.2) pulseDirection = 1;

      const animations = bars.map((bar, index) => {
        // Create a wave pattern across bars
        const waveOffset = Math.sin((Date.now() / 200) + (index * 0.3)) * 0.3;
        const randomVariation = (Math.random() - 0.5) * 0.4 * sensitivity;
        const centerDistance = Math.abs(index - barCount / 2) / (barCount / 2);
        const centerBoost = (1 - centerDistance) * 0.3;
        
        const height = Math.max(0.1, Math.min(1.0, 
          baseIntensity + waveOffset + randomVariation + centerBoost
        ));
        
        return Animated.timing(bar, {
          toValue: height,
          duration: animationSpeed,
          useNativeDriver: false,
        });
      });

      Animated.parallel(animations).start();
    }, animationSpeed);
  };

  const startWaveformPlayback = async () => {
    if (!audioUri) return;

    try {
      // Generate or load waveform data
      const waveform = generateRealisticWaveform(3000); // Assume 3 second duration
      setWaveformData(waveform);

      // Load the audio file for timing
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false }
      );
      soundRef.current = sound;

      const status = await sound.getStatusAsync();
      if (!status.isLoaded) return;

      const duration = status.durationMillis || 3000;
      const updateInterval = Math.max(50, animationSpeed / 2);
      const progressStep = updateInterval / duration;

      if (animationRef.current) {
        clearInterval(animationRef.current);
      }

      let progress = 0;
      animationRef.current = setInterval(() => {
        if (progress >= 1) {
          stopAnimation();
          return;
        }

        // Animate bars based on waveform data and current progress
        const animations = bars.map((bar, index) => {
          const waveformIndex = Math.floor((index / barCount) * waveform.length);
          const baseHeight = waveform[waveformIndex] || 0.1;
          
          // Create a moving window effect
          const windowCenter = progress * barCount;
          const distance = Math.abs(index - windowCenter);
          const windowSize = barCount * 0.2; // 20% of total bars
          
          let height = baseHeight;
          if (distance <= windowSize) {
            // Inside the active window - full amplitude
            const windowProgress = 1 - (distance / windowSize);
            height = baseHeight * (0.3 + 0.7 * windowProgress);
          } else {
            // Outside window - reduced amplitude
            height = baseHeight * 0.2;
          }
          
          return Animated.timing(bar, {
            toValue: Math.max(0.1, Math.min(1.0, height)),
            duration: updateInterval,
            useNativeDriver: false,
          });
        });

        Animated.parallel(animations).start();
        progress += progressStep;
      }, updateInterval);

    } catch (error) {
      console.error('Error starting waveform playback:', error);
      startPlaybackAnimation(); // Fallback to simple animation
    }
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

        // Simulate waveform based on time position with more realistic patterns
        const progress = currentTime / duration;
        const animations = bars.map((bar, index) => {
          const barProgress = (index / barCount);
          const distance = Math.abs(progress - barProgress);
          
          // Create multiple wave components for more realistic visualization
          let height = 0.1;
          
          // Primary wave
          height += Math.sin((progress - barProgress) * Math.PI * 8) * 0.4;
          
          // Secondary harmonics
          height += Math.sin((progress - barProgress) * Math.PI * 16) * 0.2;
          height += Math.sin((progress - barProgress) * Math.PI * 32) * 0.1;
          
          // Add time-based modulation
          height += Math.sin(currentTime / 100) * 0.1;
          
          // Apply distance-based attenuation
          const attenuation = Math.exp(-distance * 3);
          height *= attenuation;
          
          // Add some randomness for natural feel
          height += (Math.random() - 0.5) * 0.1 * sensitivity;
          
          // Normalize
          height = Math.max(0.1, Math.min(1.0, (height + 1) / 2));
          
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