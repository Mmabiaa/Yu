import React, { useState, useEffect } from 'react';
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
import { AudioRecordingConfig } from '../types/voice';

interface VoiceRecorderModalProps {
  visible: boolean;
  onClose: () => void;
  onRecordingComplete: (audioUri: string, duration: number) => void;
  title?: string;
  maxDuration?: number;
  config?: AudioRecordingConfig;
  allowPlayback?: boolean;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  visible,
  onClose,
  onRecordingComplete,
  title = 'Voice Recording',
  maxDuration = 300000, // 5 minutes
  config = { format: 'mp3', quality: 'medium' },
  allowPlayback = true,
}) => {
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (!visible) {
      // Reset state when modal closes
      setRecordedAudioUri(null);
      setRecordingDuration(0);
      setIsRecording(false);
    }
  }, [visible]);

  const handleRecordingComplete = (audioUri: string, duration: number) => {
    setRecordedAudioUri(audioUri);
    setRecordingDuration(duration);
    setIsRecording(false);
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

  const handleDiscardRecording = () => {
    Alert.alert(
      'Discard Recording',
      'Are you sure you want to discard this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
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
                config={config}
                showVisualizer={true}
              />
              
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
});

export default VoiceRecorderModal;