import { TokenManager, TokenManagerConfig } from '../TokenManager';
import { AuthTokens } from '../../../types/auth';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('react-native-keychain');
jest.mock('@react-native-async-storage/async-storage');

const mockKeychain = Keychain as jest.Mocked<typeof Keychain>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('TokenManager', () => {
  let tokenManager: TokenManager;
  let mockApiClient: any;
  
  const config: TokenManagerConfig = {
    keychainService: 'test-service',
    fallbackToAsyncStorage: true,
    tokenRefreshThreshold: 5,
  };

  const mockTokens: AuthTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    tokenType: 'Bearer',
  };

  beforeEach(() => {
    tokenManager = new TokenManager(config);
    
    mockApiClient = {
      post: jest.fn(),
    };
    
    tokenManager.setApiClient(mockApiClient);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('setTokens and getAccessToken', () => {
    it('should store and retrieve tokens using Keychain', async () => {
      // Mock successful Keychain operations
      mockKeychain.setInternetCredentials.mockResolvedValue({
        service: config.keychainService,
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      });
      
      mockKeychain.getInternetCredentials.mockResolvedValue({
        username: 'yu_tokens',
        password: JSON.stringify({
          yu_access_token: mockTokens.accessToken,
          yu_refresh_token: mockTokens.refreshToken,
          yu_token_expiry: mockTokens.expiresAt.toISOString(),
          yu_token_type: mockTokens.tokenType,
        }),
        service: config.keychainService,
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      });

      await tokenManager.setTokens(mockTokens);
      const accessToken = await tokenManager.getAccessToken();

      expect(mockKeychain.setInternetCredentials).toHaveBeenCalled();
      expect(accessToken).toBe(mockTokens.accessToken);
    });

    it('should fallback to AsyncStorage when Keychain fails', async () => {
      // Mock Keychain failure
      mockKeychain.setInternetCredentials.mockRejectedValue(new Error('Keychain not available'));
      mockKeychain.getInternetCredentials.mockRejectedValue(new Error('Keychain not available'));
      
      // Mock AsyncStorage success
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      mockAsyncStorage.getItem.mockResolvedValue(mockTokens.accessToken);

      await tokenManager.setTokens(mockTokens);
      const accessToken = await tokenManager.getAccessToken();

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('yu_access_token', mockTokens.accessToken);
      expect(accessToken).toBe(mockTokens.accessToken);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh token successfully', async () => {
      const newAccessToken = 'new-access-token';
      const newExpiresAt = new Date(Date.now() + 3600000);
      
      // Mock existing refresh token
      mockKeychain.getInternetCredentials.mockResolvedValue({
        username: 'yu_tokens',
        password: JSON.stringify({
          yu_refresh_token: mockTokens.refreshToken,
        }),
        service: config.keychainService,
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      });

      // Mock API response
      mockApiClient.post.mockResolvedValue({
        data: {
          accessToken: newAccessToken,
          expiresAt: newExpiresAt,
        },
      });

      // Mock token storage
      mockKeychain.setInternetCredentials.mockResolvedValue({
        service: config.keychainService,
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      });

      const result = await tokenManager.refreshAccessToken();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: mockTokens.refreshToken,
      });
      expect(result).toBe(newAccessToken);
    });

    it('should clear tokens when refresh fails', async () => {
      // Mock existing refresh token
      mockKeychain.getInternetCredentials.mockResolvedValue({
        username: 'yu_tokens',
        password: JSON.stringify({
          yu_refresh_token: mockTokens.refreshToken,
        }),
        service: config.keychainService,
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      });

      // Mock API failure
      mockApiClient.post.mockRejectedValue(new Error('Refresh failed'));

      // Mock token clearing
      mockKeychain.resetInternetCredentials.mockResolvedValue(undefined);

      await expect(tokenManager.refreshAccessToken()).rejects.toThrow('Token refresh failed');
      expect(mockKeychain.resetInternetCredentials).toHaveBeenCalledWith({ service: config.keychainService });
    });
  });

  describe('clearTokens', () => {
    it('should clear all tokens from Keychain', async () => {
      mockKeychain.resetInternetCredentials.mockResolvedValue(undefined);

      await tokenManager.clearTokens();

      expect(mockKeychain.resetInternetCredentials).toHaveBeenCalledWith({ service: config.keychainService });
    });

    it('should clear tokens from AsyncStorage when Keychain fails', async () => {
      mockKeychain.resetInternetCredentials.mockRejectedValue(new Error('Keychain not available'));
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      await tokenManager.clearTokens();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('yu_access_token');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('yu_refresh_token');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('yu_token_expiry');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('yu_token_type');
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', async () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      
      mockKeychain.getInternetCredentials.mockResolvedValue({
        username: 'yu_tokens',
        password: JSON.stringify({
          yu_token_expiry: futureDate.toISOString(),
        }),
        service: config.keychainService,
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      });

      const isExpired = await tokenManager.isTokenExpired();
      expect(isExpired).toBe(false);
    });

    it('should return true for expired token', async () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      
      mockKeychain.getInternetCredentials.mockResolvedValue({
        username: 'yu_tokens',
        password: JSON.stringify({
          yu_token_expiry: pastDate.toISOString(),
        }),
        service: config.keychainService,
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      });

      const isExpired = await tokenManager.isTokenExpired();
      expect(isExpired).toBe(true);
    });
  });

  describe('hasValidTokens', () => {
    it('should return true when both tokens exist', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValue({
        username: 'yu_tokens',
        password: JSON.stringify({
          yu_access_token: mockTokens.accessToken,
          yu_refresh_token: mockTokens.refreshToken,
        }),
        service: config.keychainService,
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      });

      const hasTokens = await tokenManager.hasValidTokens();
      expect(hasTokens).toBe(true);
    });

    it('should return false when tokens are missing', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValue({
        username: 'yu_tokens',
        password: JSON.stringify({}),
        service: config.keychainService,
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      });

      const hasTokens = await tokenManager.hasValidTokens();
      expect(hasTokens).toBe(false);
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage information', async () => {
      mockKeychain.getSupportedBiometryType.mockResolvedValue(Keychain.BIOMETRY_TYPE.FACE_ID);
      mockKeychain.getInternetCredentials.mockResolvedValue({
        username: 'yu_tokens',
        password: JSON.stringify({
          yu_access_token: mockTokens.accessToken,
          yu_refresh_token: mockTokens.refreshToken,
          yu_token_expiry: mockTokens.expiresAt.toISOString(),
        }),
        service: config.keychainService,
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      });

      const info = await tokenManager.getStorageInfo();

      expect(info.keychainAvailable).toBe(true);
      expect(info.hasTokens).toBe(true);
      expect(info.tokenExpiry).toEqual(mockTokens.expiresAt);
      expect(info.usingFallback).toBe(false);
    });
  });
});