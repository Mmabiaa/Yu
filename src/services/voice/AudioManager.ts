import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { AudioRecordingConfig, AudioPlaybackConfig } from '../../types/voice';

// Type augmentation for FileSystem to handle documentDirectory
declare module 'expo-file-system' {
  export const documentDirectory: string | null;
}

/**
 * AudioManager handles native audio recording and playback operations
 */
export class AudioManager {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private isRecording: boolean = false;
  private isPlaying: boolean = false;

  constructor() {
    this.setupAudio();
  }

  /**
   * Setup audio permissions and configuration
   */
  private async setupAudio(): Promise<void> {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  }

  /**
   * Start audio recording
   */
  async startRecording(config: AudioRecordingConfig = {
    format: 'mp3',
    quality: 'medium'
  }): Promise<void> {
    try {
      if (this.isRecording) {
        console.warn('Recording already in progress');
        return;
      }

      // Stop any existing recording
      if (this.recording) {
        await this.stopRecording();
      }

      // Create new recording
      this.recording = new Audio.Recording();
      
      const recordingOptions = this.getRecordingOptions(config);
      await this.recording.prepareToRecordAsync(recordingOptions);
      await this.recording.startAsync();
      
      this.isRecording = true;
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Stop audio recording and return the file
   */
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording || !this.isRecording) {
        console.warn('No active recording to stop');
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      this.isRecording = false;
      this.recording = null;
      
      console.log('Recording stopped, file saved to:', uri);
      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  /**
   * Play audio from URL or local file
   */
  async playAudio(
    source: string,
    config: AudioPlaybackConfig = {}
  ): Promise<void> {
    try {
      // Stop any existing playback
      if (this.sound) {
        await this.stopPlayback();
      }

      // Create new sound instance
      const { sound } = await Audio.Sound.createAsync(
        { uri: source },
        {
          shouldPlay: config.autoPlay ?? true,
          isLooping: config.loop ?? false,
          volume: config.volume ?? 1.0,
          rate: config.playbackRate ?? 1.0,
        }
      );

      this.sound = sound;
      this.isPlaying = true;

      // Set up playback status listener
      this.sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          this.isPlaying = false;
        }
      });

      console.log('Audio playback started');
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  }

  /**
   * Stop audio playback
   */
  async stopPlayback(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
        this.isPlaying = false;
        console.log('Audio playback stopped');
      }
    } catch (error) {
      console.error('Error stopping playback:', error);
      throw error;
    }
  }

  /**
   * Pause audio playback
   */
  async pausePlayback(): Promise<void> {
    try {
      if (this.sound && this.isPlaying) {
        await this.sound.pauseAsync();
        console.log('Audio playback paused');
      }
    } catch (error) {
      console.error('Error pausing playback:', error);
      throw error;
    }
  }

  /**
   * Resume audio playback
   */
  async resumePlayback(): Promise<void> {
    try {
      if (this.sound && !this.isPlaying) {
        await this.sound.playAsync();
        this.isPlaying = true;
        console.log('Audio playback resumed');
      }
    } catch (error) {
      console.error('Error resuming playback:', error);
      throw error;
    }
  }

  /**
   * Get recording duration
   */
  async getRecordingDuration(): Promise<number> {
    if (!this.recording) {
      return 0;
    }

    try {
      const status = await this.recording.getStatusAsync();
      return status.isRecording ? status.durationMillis || 0 : 0;
    } catch (error) {
      console.error('Error getting recording duration:', error);
      return 0;
    }
  }

  /**
   * Get playback position
   */
  async getPlaybackPosition(): Promise<number> {
    if (!this.sound) {
      return 0;
    }

    try {
      const status = await this.sound.getStatusAsync();
      return status.isLoaded ? status.positionMillis || 0 : 0;
    } catch (error) {
      console.error('Error getting playback position:', error);
      return 0;
    }
  }

  /**
   * Convert audio file to different format (if needed)
   */
  async convertAudioFormat(
    inputUri: string,
    outputFormat: 'mp3' | 'wav' | 'aac'
  ): Promise<string> {
    try {
      const inputInfo = await FileSystem.getInfoAsync(inputUri);
      if (!inputInfo.exists) {
        throw new Error('Input audio file does not exist');
      }

      // Get file extension from input
      const inputExtension = inputUri.split('.').pop()?.toLowerCase();
      
      // If already in target format, return original
      if (inputExtension === outputFormat) {
        console.log(`Audio already in ${outputFormat} format`);
        return inputUri;
      }

      // Generate output file path
      const outputUri = `${FileSystem.documentDirectory!}converted_${Date.now()}.${outputFormat}`;
      
      // For React Native/Expo, we'll use a simple approach:
      // Re-record the audio in the desired format by playing and recording simultaneously
      // This is a workaround since native format conversion requires platform-specific modules
      
      console.log(`Converting audio from ${inputExtension} to ${outputFormat}`);
      
      // Create a new recording with the target format
      const convertedRecording = new Audio.Recording();
      const recordingOptions = this.getRecordingOptions({ 
        format: outputFormat, 
        quality: 'medium' 
      });
      
      // Load the original audio
      const { sound: originalSound } = await Audio.Sound.createAsync(
        { uri: inputUri },
        { shouldPlay: false }
      );
      
      try {
        // Start recording in new format
        await convertedRecording.prepareToRecordAsync(recordingOptions);
        await convertedRecording.startAsync();
        
        // Play original audio (this will be captured by the recording)
        await originalSound.playAsync();
        
        // Wait for playback to complete
        const status = await originalSound.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          await new Promise(resolve => setTimeout(resolve, (status.durationMillis || 0) + 500));
        }
        
        // Stop recording
        await convertedRecording.stopAndUnloadAsync();
        const convertedUri = convertedRecording.getURI();
        
        // Clean up
        await originalSound.unloadAsync();
        
        if (convertedUri) {
          // Move to desired location
          await FileSystem.moveAsync({
            from: convertedUri,
            to: outputUri
          });
          
          console.log(`Audio converted successfully to ${outputUri}`);
          return outputUri;
        } else {
          throw new Error('Conversion failed - no output file generated');
        }
        
      } catch (conversionError) {
        // Clean up on error
        await originalSound.unloadAsync();
        await convertedRecording.stopAndUnloadAsync().catch(() => {});
        throw conversionError;
      }
      
    } catch (error) {
      console.error('Error converting audio format:', error);
      // Fallback: return original file
      console.log('Conversion failed, returning original file');
      return inputUri;
    }
  }

  /**
   * Compress audio file
   */
  async compressAudio(inputUri: string, quality: 'low' | 'medium' | 'high'): Promise<string> {
    try {
      const inputInfo = await FileSystem.getInfoAsync(inputUri);
      if (!inputInfo.exists) {
        throw new Error('Input audio file does not exist');
      }

      // Generate output file path
      const outputUri = `${FileSystem.documentDirectory!}compressed_${Date.now()}.mp3`;
      
      console.log(`Compressing audio with ${quality} quality`);
      
      // Create a new recording with compression settings
      const compressedRecording = new Audio.Recording();
      const recordingOptions = this.getRecordingOptions({ 
        format: 'mp3', 
        quality: quality 
      });
      
      // Load the original audio
      const { sound: originalSound } = await Audio.Sound.createAsync(
        { uri: inputUri },
        { shouldPlay: false }
      );
      
      try {
        // Start recording with compression settings
        await compressedRecording.prepareToRecordAsync(recordingOptions);
        await compressedRecording.startAsync();
        
        // Play original audio
        await originalSound.playAsync();
        
        // Wait for playback to complete
        const status = await originalSound.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          await new Promise(resolve => setTimeout(resolve, (status.durationMillis || 0) + 500));
        }
        
        // Stop recording
        await compressedRecording.stopAndUnloadAsync();
        const compressedUri = compressedRecording.getURI();
        
        // Clean up
        await originalSound.unloadAsync();
        
        if (compressedUri) {
          // Move to desired location
          await FileSystem.moveAsync({
            from: compressedUri,
            to: outputUri
          });
          
          // Get file sizes for comparison
          const originalSize = (inputInfo as any).size || 0;
          const compressedInfo = await FileSystem.getInfoAsync(outputUri);
          const compressedSize = (compressedInfo as any).size || 0;
          
          const compressionRatio = originalSize > 0 ? (compressedSize / originalSize) * 100 : 100;
          
          console.log(`Audio compressed successfully. Size: ${originalSize} -> ${compressedSize} bytes (${compressionRatio.toFixed(1)}%)`);
          return outputUri;
        } else {
          throw new Error('Compression failed - no output file generated');
        }
        
      } catch (compressionError) {
        // Clean up on error
        await originalSound.unloadAsync();
        await compressedRecording.stopAndUnloadAsync().catch(() => {});
        throw compressionError;
      }
      
    } catch (error) {
      console.error('Error compressing audio:', error);
      // Fallback: return original file
      console.log('Compression failed, returning original file');
      return inputUri;
    }
  }

  /**
   * Get audio file info
   */
  async getAudioFileInfo(uri: string): Promise<{
    duration: number;
    size: number;
    format: string;
  }> {
    try {
      // Get file system info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }
      
      // Create a temporary sound to get duration
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();

      return {
        duration: status.isLoaded ? status.durationMillis || 0 : 0,
        size: (fileInfo as any).size || 0,
        format: uri.split('.').pop() || 'unknown'
      };
    } catch (error) {
      console.error('Error getting audio file info:', error);
      return { duration: 0, size: 0, format: 'unknown' };
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.isRecording && this.recording) {
        await this.stopRecording();
      }
      if (this.isPlaying && this.sound) {
        await this.stopPlayback();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Delete audio file from file system
   */
  async deleteAudioFile(uri: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
        console.log(`Audio file deleted: ${uri}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting audio file:', error);
      return false;
    }
  }

  /**
   * Copy audio file to a new location
   */
  async copyAudioFile(sourceUri: string, destinationUri: string): Promise<string> {
    try {
      await FileSystem.copyAsync({
        from: sourceUri,
        to: destinationUri
      });
      console.log(`Audio file copied from ${sourceUri} to ${destinationUri}`);
      return destinationUri;
    } catch (error) {
      console.error('Error copying audio file:', error);
      throw error;
    }
  }

  /**
   * Get available storage space
   */
  async getAvailableSpace(): Promise<number> {
    try {
      const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();
      return freeDiskStorage;
    } catch (error) {
      console.error('Error getting available space:', error);
      return 0;
    }
  }

  /**
   * Clean up old audio files (older than specified days)
   */
  async cleanupOldFiles(olderThanDays: number = 7): Promise<number> {
    try {
      const documentDir = FileSystem.documentDirectory;
      if (!documentDir) return 0;

      const files = await FileSystem.readDirectoryAsync(documentDir);
      const audioFiles = files.filter(file => 
        file.endsWith('.mp3') || 
        file.endsWith('.wav') || 
        file.endsWith('.aac') ||
        file.includes('recorded_') ||
        file.includes('converted_') ||
        file.includes('compressed_')
      );

      let deletedCount = 0;
      const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

      for (const file of audioFiles) {
        const filePath = `${documentDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (fileInfo.exists && (fileInfo as any).modificationTime && (fileInfo as any).modificationTime < cutoffTime) {
          await FileSystem.deleteAsync(filePath);
          deletedCount++;
        }
      }

      console.log(`Cleaned up ${deletedCount} old audio files`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old files:', error);
      return 0;
    }
  }

  /**
   * Get recording options based on config
   */
  private getRecordingOptions(config: AudioRecordingConfig): Audio.RecordingOptions {
    const baseOptions: Audio.RecordingOptions = {
      android: {
        extension: `.${config.format}`,
        outputFormat: this.getAndroidOutputFormat(config.format),
        audioEncoder: this.getAndroidAudioEncoder(config.format),
        sampleRate: this.getSampleRate(config.quality),
        numberOfChannels: 1,
        bitRate: this.getBitRate(config.quality),
      },
      ios: {
        extension: `.${config.format}`,
        outputFormat: this.getIOSOutputFormat(config.format),
        audioQuality: this.getIOSAudioQuality(config.quality),
        sampleRate: this.getSampleRate(config.quality),
        numberOfChannels: 1,
        bitRate: this.getBitRate(config.quality),
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: this.getWebMimeType(config.format),
        bitsPerSecond: this.getBitRate(config.quality),
      }
    };

    return baseOptions;
  }

  private getAndroidOutputFormat(format: string): Audio.AndroidOutputFormat {
    switch (format) {
      case 'mp3': return Audio.AndroidOutputFormat.MPEG_4;
      case 'wav': return Audio.AndroidOutputFormat.DEFAULT;
      case 'aac': return Audio.AndroidOutputFormat.AAC_ADTS;
      default: return Audio.AndroidOutputFormat.MPEG_4;
    }
  }

  private getAndroidAudioEncoder(format: string): Audio.AndroidAudioEncoder {
    switch (format) {
      case 'mp3': return Audio.AndroidAudioEncoder.AAC;
      case 'wav': return Audio.AndroidAudioEncoder.DEFAULT;
      case 'aac': return Audio.AndroidAudioEncoder.AAC;
      default: return Audio.AndroidAudioEncoder.AAC;
    }
  }

  private getIOSOutputFormat(format: string): Audio.IOSOutputFormat {
    switch (format) {
      case 'mp3': return Audio.IOSOutputFormat.MPEG4AAC;
      case 'wav': return Audio.IOSOutputFormat.LINEARPCM;
      case 'aac': return Audio.IOSOutputFormat.MPEG4AAC;
      default: return Audio.IOSOutputFormat.MPEG4AAC;
    }
  }

  private getIOSAudioQuality(quality: string): Audio.IOSAudioQuality {
    switch (quality) {
      case 'low': return Audio.IOSAudioQuality.MIN;
      case 'medium': return Audio.IOSAudioQuality.MEDIUM;
      case 'high': return Audio.IOSAudioQuality.MAX;
      default: return Audio.IOSAudioQuality.MEDIUM;
    }
  }

  private getWebMimeType(format: string): string {
    switch (format) {
      case 'mp3': return 'audio/mpeg';
      case 'wav': return 'audio/wav';
      case 'aac': return 'audio/aac';
      default: return 'audio/mpeg';
    }
  }

  private getSampleRate(quality: string): number {
    switch (quality) {
      case 'low': return 16000;
      case 'medium': return 22050;
      case 'high': return 44100;
      default: return 22050;
    }
  }

  private getBitRate(quality: string): number {
    switch (quality) {
      case 'low': return 64000;
      case 'medium': return 128000;
      case 'high': return 256000;
      default: return 128000;
    }
  }

  // Getters for current state
  get isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  get isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}