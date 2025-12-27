import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioManager } from '../services/voice/AudioManager';
import { AudioVisualizer } from './AudioVisualizer';
import { AudioRecordingConfig } from '../types/voice';

interface AudioRecorderProps {
  onRecordingComplete?: (audioUri: string, duration: number) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onError?: (error: Error) => void;
  maxDuration?: number; // in milliseconds
  config?: AudioRecordingConfig;
  showVisualizer?: boolean;
  disabled?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  onError,
  maxDuration = 300000, // 5 minutes default
  config = { format: 'mp3', quality: 'medium' },
  showVisualizer = true,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const audioManagerRef = useRef<AudioManager | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    audioManagerRef.current = new AudioManager();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isRecording && !isPaused) {
      startDurationTimer();
    } else {
      stopDurationTimer();
    }

    return () => stopDurationTimer();
  }, [isRecording, isPaused]);

  const cleanup = async () => {
    stopDurationTimer();
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
    }
    
    if (audioManagerRef.current) {
      await audioManagerRef.current.cleanup();
    }
  };

  const startDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    durationIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 100);
    }, 100);

    // Set max duration timeout
    if (maxDuration > 0) {
      maxDurationTimeoutRef.current = setTimeout(() => {
        handleStopRecording();
      }, maxDuration);
    }
  };

  const stopDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }
  };

  const handleStartRecording = async () => {
    if (!audioManagerRef.current || disabled) return;

    try {
      await audioManagerRef.current.startRecording(config);
      setIsRecording(true);
      setRecordingDuration(0);
      setIsPaused(false);
      
      if (onRecordingStart) {
        onRecordingStart();
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      
      if (onError) {
        onError(error as Error);
      } else {
        Alert.alert(
          'Recording Error',
          'Failed to start recording. Please check microphone permissions.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleStopRecording = async () => {
    if (!audioManagerRef.current || !isRecording) return;

    try {
      const audioUri = await audioManagerRef.current.stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      stopDurationTimer();
      
      if (onRecordingStop) {
        onRecordingStop();
      }

      if (audioUri && onRecordingComplete) {
        onRecordingComplete(audioUri, recordingDuration);
      }
      
      setRecordingDuration(0);
    } catch (error) {
      console.error('Error stopping recording:', error);
      
      if (onError) {
        onError(error as Error);
      } else {
        Alert.alert(
          'Recording Error',
          'Failed to stop recording.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getRecordButtonColor = (): string => {
    if (disabled) return '#CCCCCC';
    if (isRecording) return '#FF3B30';
    return '#007AFF';
  };

  const getRecordButtonIcon = (): keyof typeof Ionicons.glyphMap => {
    if (isRecording) return 'stop';
    return 'mic';
  };

  return (
    <View style={styles.container}>
      {showVisualizer && (
        <View style={styles.visualizerContainer}>
          <AudioVisualizer
            isRecording={isRecording && !isPaused}
            height={60}
            barCount={25}
            barColor={getRecordButtonColor()}
          />
        </View>
      )}
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            { backgroundColor: getRecordButtonColor() },
            disabled && styles.disabledButton,
          ]}
          onPress={handleToggleRecording}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons
            name={getRecordButtonIcon()}
            size={32}
            color="white"
          />
        </TouchableOpacity>
        
        <View style={styles.durationContainer}>
          <Text style={styles.durationText}>
            {formatDuration(recordingDuration)}
          </Text>
          {maxDuration > 0 && (
            <Text style={styles.maxDurationText}>
              / {formatDuration(maxDuration)}
            </Text>
          )}
        </View>
      </View>
      
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  visualizerContainer: {
    width: '100%',
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    overflow: 'hidden',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  durationText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  maxDurationText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
});

export default AudioRecorder;