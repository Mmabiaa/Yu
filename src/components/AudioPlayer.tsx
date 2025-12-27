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
import { AudioPlaybackConfig } from '../types/voice';

interface AudioPlayerProps {
  audioUri: string;
  onPlaybackStart?: () => void;
  onPlaybackComplete?: () => void;
  onPlaybackPause?: () => void;
  onPlaybackResume?: () => void;
  onError?: (error: Error) => void;
  config?: AudioPlaybackConfig;
  showVisualizer?: boolean;
  showControls?: boolean;
  autoPlay?: boolean;
  disabled?: boolean;
  showWaveform?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUri,
  onPlaybackStart,
  onPlaybackComplete,
  onPlaybackPause,
  onPlaybackResume,
  onError,
  config = { autoPlay: false, volume: 1.0 },
  showVisualizer = true,
  showControls = true,
  autoPlay = false,
  disabled = false,
  showWaveform = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioManagerRef = useRef<AudioManager | null>(null);
  const positionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    audioManagerRef.current = new AudioManager();
    
    if (autoPlay && audioUri) {
      handlePlay();
    }
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (audioUri) {
      loadAudioInfo();
    }
  }, [audioUri]);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      startPositionTimer();
    } else {
      stopPositionTimer();
    }

    return () => stopPositionTimer();
  }, [isPlaying, isPaused]);

  const cleanup = async () => {
    stopPositionTimer();
    
    if (audioManagerRef.current) {
      await audioManagerRef.current.cleanup();
    }
  };

  const loadAudioInfo = async () => {
    if (!audioManagerRef.current || !audioUri) return;

    try {
      const info = await audioManagerRef.current.getAudioFileInfo(audioUri);
      setDuration(info.duration);
    } catch (error) {
      console.error('Error loading audio info:', error);
    }
  };

  const startPositionTimer = () => {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
    }

    positionIntervalRef.current = setInterval(async () => {
      if (audioManagerRef.current) {
        try {
          const position = await audioManagerRef.current.getPlaybackPosition();
          setCurrentPosition(position);
          
          // Check if playback completed
          if (position >= duration && duration > 0) {
            handlePlaybackComplete();
          }
        } catch (error) {
          console.error('Error getting playback position:', error);
        }
      }
    }, 100);
  };

  const stopPositionTimer = () => {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
      positionIntervalRef.current = null;
    }
  };

  const handlePlay = async () => {
    if (!audioManagerRef.current || !audioUri || disabled) return;

    try {
      setIsLoading(true);
      
      if (isPaused) {
        await audioManagerRef.current.resumePlayback();
        setIsPaused(false);
        
        if (onPlaybackResume) {
          onPlaybackResume();
        }
      } else {
        await audioManagerRef.current.playAudio(audioUri, config);
        setCurrentPosition(0);
        
        if (onPlaybackStart) {
          onPlaybackStart();
        }
      }
      
      setIsPlaying(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsLoading(false);
      
      if (onError) {
        onError(error as Error);
      } else {
        Alert.alert(
          'Playback Error',
          'Failed to play audio file.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handlePause = async () => {
    if (!audioManagerRef.current || !isPlaying) return;

    try {
      await audioManagerRef.current.pausePlayback();
      setIsPaused(true);
      
      if (onPlaybackPause) {
        onPlaybackPause();
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
      
      if (onError) {
        onError(error as Error);
      }
    }
  };

  const handleStop = async () => {
    if (!audioManagerRef.current) return;

    try {
      await audioManagerRef.current.stopPlayback();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentPosition(0);
      stopPositionTimer();
    } catch (error) {
      console.error('Error stopping audio:', error);
      
      if (onError) {
        onError(error as Error);
      }
    }
  };

  const handlePlaybackComplete = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentPosition(0);
    stopPositionTimer();
    
    if (onPlaybackComplete) {
      onPlaybackComplete();
    }
  };

  const handleTogglePlayback = () => {
    if (isPlaying && !isPaused) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPlayButtonIcon = (): keyof typeof Ionicons.glyphMap => {
    if (isLoading) return 'hourglass';
    if (isPlaying && !isPaused) return 'pause';
    return 'play';
  };

  const getPlayButtonColor = (): string => {
    if (disabled) return '#CCCCCC';
    return '#007AFF';
  };

  const getProgressPercentage = (): number => {
    if (duration === 0) return 0;
    return (currentPosition / duration) * 100;
  };

  return (
    <View style={styles.container}>
      {showVisualizer && (
        <View style={styles.visualizerContainer}>
          <AudioVisualizer
            isPlaying={isPlaying && !isPaused}
            audioUri={audioUri}
            height={60}
            barCount={25}
            barColor={getPlayButtonColor()}
            showWaveform={showWaveform}
            sensitivity={0.8}
          />
        </View>
      )}
      
      {showControls && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[
              styles.playButton,
              { backgroundColor: getPlayButtonColor() },
              disabled && styles.disabledButton,
            ]}
            onPress={handleTogglePlayback}
            disabled={disabled || isLoading}
            activeOpacity={0.7}
          >
            <Ionicons
              name={getPlayButtonIcon()}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.stopButton, disabled && styles.disabledButton]}
            onPress={handleStop}
            disabled={disabled || !isPlaying}
            activeOpacity={0.7}
          >
            <Ionicons
              name="stop"
              size={20}
              color={disabled || !isPlaying ? '#CCCCCC' : '#666'}
            />
          </TouchableOpacity>
          
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {formatTime(currentPosition)}
            </Text>
            <Text style={styles.separatorText}> / </Text>
            <Text style={styles.timeText}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>
      )}
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${getProgressPercentage()}%`,
                backgroundColor: getPlayButtonColor(),
              },
            ]}
          />
        </View>
      </View>
      
      {isPlaying && !isPaused && (
        <View style={styles.playingIndicator}>
          <View style={styles.playingDot} />
          <Text style={styles.playingText}>Playing...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  visualizerContainer: {
    width: '100%',
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    overflow: 'hidden',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    marginRight: 15,
  },
  disabledButton: {
    opacity: 0.5,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  separatorText: {
    fontSize: 16,
    color: '#666',
  },
  progressContainer: {
    width: '100%',
    marginTop: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  playingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginRight: 8,
  },
  playingText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default AudioPlayer;