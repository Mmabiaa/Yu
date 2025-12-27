import { AudioManager } from '../AudioManager';

// Mock expo-av and expo-file-system
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Recording: jest.fn().mockImplementation(() => ({
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      startAsync: jest.fn().mockResolvedValue(undefined),
      stopAndUnloadAsync: jest.fn().mockResolvedValue(undefined),
      getURI: jest.fn().mockReturnValue('mock://audio.mp3'),
      getStatusAsync: jest.fn().mockResolvedValue({
        isRecording: true,
        durationMillis: 5000,
      }),
    })),
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn().mockResolvedValue(undefined),
          pauseAsync: jest.fn().mockResolvedValue(undefined),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
          getStatusAsync: jest.fn().mockResolvedValue({
            isLoaded: true,
            durationMillis: 5000,
            positionMillis: 1000,
          }),
          setOnPlaybackStatusUpdate: jest.fn(),
        },
      }),
    },
    AndroidOutputFormat: {
      MPEG_4: 'mpeg4',
      DEFAULT: 'default',
      AAC_ADTS: 'aac_adts',
    },
    AndroidAudioEncoder: {
      AAC: 'aac',
      DEFAULT: 'default',
    },
    IOSOutputFormat: {
      MPEG4AAC: 'mpeg4aac',
      LINEARPCM: 'linearpcm',
    },
    IOSAudioQuality: {
      MIN: 'min',
      MEDIUM: 'medium',
      MAX: 'max',
    },
  },
}));

jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn().mockResolvedValue({
    exists: true,
    size: 1024,
    modificationTime: Date.now(),
  }),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  moveAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  readDirectoryAsync: jest.fn().mockResolvedValue(['audio1.mp3', 'audio2.wav']),
  getFreeDiskStorageAsync: jest.fn().mockResolvedValue(1000000),
  documentDirectory: 'mock://documents/',
}));

describe('AudioManager', () => {
  let audioManager: AudioManager;

  beforeEach(() => {
    audioManager = new AudioManager();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await audioManager.cleanup();
  });

  describe('Recording', () => {
    it('should start recording successfully', async () => {
      await audioManager.startRecording({ format: 'mp3', quality: 'medium' });
      expect(audioManager.isCurrentlyRecording).toBe(true);
    });

    it('should stop recording and return URI', async () => {
      await audioManager.startRecording({ format: 'mp3', quality: 'medium' });
      const uri = await audioManager.stopRecording();
      
      expect(uri).toBe('mock://audio.mp3');
      expect(audioManager.isCurrentlyRecording).toBe(false);
    });

    it('should get recording duration', async () => {
      await audioManager.startRecording({ format: 'mp3', quality: 'medium' });
      const duration = await audioManager.getRecordingDuration();
      
      expect(duration).toBe(5000);
    });
  });

  describe('Playback', () => {
    it('should play audio successfully', async () => {
      await audioManager.playAudio('mock://audio.mp3');
      expect(audioManager.isCurrentlyPlaying).toBe(true);
    });

    it('should stop playback', async () => {
      await audioManager.playAudio('mock://audio.mp3');
      await audioManager.stopPlayback();
      expect(audioManager.isCurrentlyPlaying).toBe(false);
    });

    it('should get playback position', async () => {
      await audioManager.playAudio('mock://audio.mp3');
      const position = await audioManager.getPlaybackPosition();
      
      expect(position).toBe(1000);
    });
  });

  describe('File Operations', () => {
    it('should get audio file info', async () => {
      const info = await audioManager.getAudioFileInfo('mock://audio.mp3');
      
      expect(info).toEqual({
        duration: 5000,
        size: 1024,
        format: 'mp3',
      });
    });

    it('should convert audio format', async () => {
      const convertedUri = await audioManager.convertAudioFormat('mock://audio.wav', 'mp3');
      expect(convertedUri).toContain('converted_');
    });

    it('should compress audio', async () => {
      const compressedUri = await audioManager.compressAudio('mock://audio.mp3', 'high');
      expect(compressedUri).toContain('compressed_');
    });

    it('should delete audio file', async () => {
      const result = await audioManager.deleteAudioFile('mock://audio.mp3');
      expect(result).toBe(true);
    });

    it('should copy audio file', async () => {
      const newUri = await audioManager.copyAudioFile('mock://source.mp3', 'mock://dest.mp3');
      expect(newUri).toBe('mock://dest.mp3');
    });

    it('should get available storage space', async () => {
      const space = await audioManager.getAvailableSpace();
      expect(space).toBe(1000000);
    });

    it('should clean up old files', async () => {
      const deletedCount = await audioManager.cleanupOldFiles(7);
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Configuration', () => {
    it('should generate correct recording options for different formats', async () => {
      // Test MP3 format
      await audioManager.startRecording({ format: 'mp3', quality: 'high' });
      expect(audioManager.isCurrentlyRecording).toBe(true);
      
      await audioManager.stopRecording();
      
      // Test WAV format
      await audioManager.startRecording({ format: 'wav', quality: 'low' });
      expect(audioManager.isCurrentlyRecording).toBe(true);
      
      await audioManager.stopRecording();
      
      // Test AAC format
      await audioManager.startRecording({ format: 'aac', quality: 'medium' });
      expect(audioManager.isCurrentlyRecording).toBe(true);
    });
  });
});