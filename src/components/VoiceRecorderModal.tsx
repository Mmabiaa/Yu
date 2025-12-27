import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioRecorder } from './AudioRecorder';
import { AudioPlayer } from './AudioPlayer';
import { AudioManager } from '../services/voice/AudioManager';
import { AudioRecordingConfig } from '../types/voice';

interface VoiceRecorderModalProps {
  visible: boolean;
  onClose: () => void;
  onRecordingComplete: (audioUri: string, duration: number) => void;
  title?: string;
  maxDuration?: number;
  config?: AudioRecordingConfig;
  allowPlayback?: boolean;
  enableCompression?: boolean;
  compressionQuality?: 'low' | 'medium' | 'high';
  autoConvertFormat?: 'mp3' | 'wav' | 'aac' | null;
  showAdvancedOptions?: boolean;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  visible,
  onClose,
  onRecordingComplete,
  title = 'Voice Recording',
  maxDuration = 300000, // 5 minutes
  config = { format: 'mp3', quality: 'medium' },
  allowPlayback = true,
  enableCompression = false,
  compressionQuality = 'medium',
  autoConvertFormat = null,
  showAdvancedOptions = false,
}) => {
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(config);
  const [currentCompression, setCurrentCompression] = useState(enableCompression);
  const [currentCompressionQuality, setCurrentCompressionQuality] = useState(compressionQuality);
  const [currentFormat, setCurrentFormat] = useState(autoConvertFormat);
  
  const audioManagerRef = useRef<AudioManager | null>(null);

  useEffect(() => {
    if (!visible) {
      // Reset state when modal closes
      setRecordedAudioUri(null);
      setRecordingDuration(0);
      setIsRecording(false);
    }
  }, [visible]);

  const handleRecordingComplete = async (audioUri: string, duration: number) => {
    setRecordedAudioUri(audioUri);
    setRecordingDuration(duration);
    setIsRecording(false);
    
    // Get file info for display
    if (!audioManagerRef.current) {
      audioManagerRef.current = new AudioManager();
    }
    
    try {
      const fileInfo = await audioManagerRef.current.getAudioFileInfo(audioUri);
      console.log(`Recording complete: ${fileInfo.format}, ${fileInfo.size} bytes, ${fileInfo.duration}ms`);
    } catch (error) {
      console.error('Error getting file info:', error);
    }
  };

  const handleRecordingStart = () => {
    setIsRecording(true);
    setRecordedAudioUri(null);
  };

  const handleRecordingStop = () => {
    setIsRecording(false);
  };

  const handleUseRecording = () => {
    if (recordedAudioUri) {
      onRecordingComplete(recordedAudioUri, recordingDuration);
      onClose();
    }
  };

  const handleDiscardRecording = async () => {
    Alert.alert(
      'Discard Recording',
      'Are you sure you want to discard this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            // Delete the audio file
            if (recordedAudioUri && audioManagerRef.current) {
              try {
                await audioManagerRef.current.deleteAudioFile(recordedAudioUri);
                console.log('Recording file deleted');
              } catch (error) {
                console.error('Error deleting recording file:', error);
              }
            }
            setRecordedAudioUri(null);
            setRecordingDuration(0);
          },
        },
      ]
    );
  };

  const handleClose = () => {
    if (isRecording) {
      Alert.alert(
        'Recording in Progress',
        'Stop recording before closing?',
        [
          { text: 'Continue Recording', style: 'cancel' },
          {
            text: 'Stop & Close',
            style: 'destructive',
            onPress: onClose,
          },
        ]
      );
    } else {
      onClose();
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleCompressionQuality = () => {
    const qualities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const currentIndex = qualities.indexOf(currentCompressionQuality);
    const nextIndex = (currentIndex + 1) % qualities.length;
    setCurrentCompressionQuality(qualities[nextIndex]);
  };

  const toggleFormat = () => {
    const formats: ('mp3' | 'wav' | 'aac' | null)[] = [null, 'mp3', 'wav', 'aac'];
    const currentIndex = formats.indexOf(currentFormat);
    const nextIndex = (currentIndex + 1) % formats.length;
    setCurrentFormat(formats[nextIndex]);
  };

  const toggleRecordingQuality = () => {
    const qualities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const currentIndex = qualities.indexOf(currentConfig.quality);
    const nextIndex = (currentIndex + 1) % qualities.length;
    setCurrentConfig({ ...currentConfig, quality: qualities[nextIndex] });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <Text style={styles.title}>{title}</Text>
          
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {!recordedAudioUri ? (
            <View style={styles.recordingSection}>
              <Text style={styles.instructionText}>
                Tap the microphone to start recording
              </Text>
              
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                onRecordingStart={handleRecordingStart}
                onRecordingStop={handleRecordingStop}
                maxDuration={maxDuration}
                config={currentConfig}
                showVisualizer={true}
                enableCompression={currentCompression}
                compressionQuality={currentCompressionQuality}
                autoConvertFormat={currentFormat}
              />
              
              {showAdvancedOptions && (
                <View style={styles.optionsContainer}>
                  <Text style={styles.optionsTitle}>Recording Options</Text>
                  
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={toggleRecordingQuality}
                  >
                    <Text style={styles.optionText}>
                      Quality: {currentConfig.quality.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => setCurrentCompression(!currentCompression)}
                  >
                    <Text style={styles.optionText}>
                      Compression: {currentCompression ? 'ON' : 'OFF'}
                    </Text>
                  </TouchableOpacity>
                  
                  {currentCompression && (
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={toggleCompressionQuality}
                    >
                      <Text style={styles.optionText}>
                        Compression Quality: {currentCompressionQuality.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={toggleFormat}
                  >
                    <Text style={styles.optionText}>
                      Convert to: {currentFormat ? currentFormat.toUpperCase() : 'ORIGINAL'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <Text style={styles.maxDurationText}>
                Maximum duration: {formatDuration(maxDuration)}
              </Text>
            </View>
          ) : (
            <View style={styles.playbackSection}>
              <Text style={styles.successText}>
                Recording completed!
              </Text>
              
              <Text style={styles.durationText}>
                Duration: {formatDuration(recordingDuration)}
              </Text>
              
              {allowPlayback && (
                <View style={styles.playerContainer}>
                  <AudioPlayer
                    audioUri={recordedAudioUri}
                    showVisualizer={true}
                    showControls={true}
                    showWaveform={true}
                  />
                </View>
              )}
              
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.discardButton]}
                  onPress={handleDiscardRecording}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  <Text style={styles.discardButtonText}>Discard</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.useButton]}
                  onPress={handleUseRecording}
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.useButtonText}>Use Recording</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Make sure you're in a quiet environment for best results
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 34, // Same width as close button for centering
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  recordingSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  maxDurationText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  playbackSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34C759',
    textAlign: 'center',
    marginBottom: 10,
  },
  durationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  playerContainer: {
    width: '100%',
    marginBottom: 40,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  discardButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  discardButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
    marginLeft: 5,
  },
  useButton: {
    backgroundColor: '#007AFF',
  },
  useButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 5,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  optionsContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default VoiceRecorderModal;