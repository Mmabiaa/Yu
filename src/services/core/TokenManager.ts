import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthTokens, RefreshTokenRequest, RefreshTokenResponse } from '../../types/auth';
import { ApiError } from '../../types/api';

export interface TokenManagerConfig {
    keychainService: string;
    fallbackToAsyncStorage: boolean;
    tokenRefreshThreshold: number; // minutes before expiry to refresh
}

export class TokenManager {
    private config: TokenManagerConfig;
    private apiClient?: any; // Will be injected to avoid circular dependency

    // Storage keys
    private static readonly ACCESS_TOKEN_KEY = 'yu_access_token';
    private static readonly REFRESH_TOKEN_KEY = 'yu_refresh_token';
    private static readonly TOKEN_EXPIRY_KEY = 'yu_token_expiry';
    private static readonly TOKEN_TYPE_KEY = 'yu_token_type';

    constructor(config: TokenManagerConfig) {
        this.config = config;
    }

    /**
     * Set API client for token refresh operations
     */
    public setApiClient(apiClient: any): void {
        this.apiClient = apiClient;
    }

    /**
     * Get access token from secure storage
     */
    public async getAccessToken(): Promise<string | null> {
        try {
            const token = await this.getSecureValue(TokenManager.ACCESS_TOKEN_KEY);

            if (!token) {
                return null;
            }

            // Check if token is expired or needs refresh
            const expiryTime = await this.getTokenExpiry();
            if (expiryTime && this.shouldRefreshToken(expiryTime)) {
                try {
                    const newToken = await this.refreshAccessToken();
                    return newToken;
                } catch (error) {
                    console.warn('Token refresh failed, returning existing token:', error);
                    return token;
                }
            }

            return token;
        } catch (error) {
            console.error('Failed to get access token:', error);
            return null;
        }
    }

    /**
     * Get refresh token from secure storage
     */
    public async getRefreshToken(): Promise<string | null> {
        try {
            return await this.getSecureValue(TokenManager.REFRESH_TOKEN_KEY);
        } catch (error) {
            console.error('Failed to get refresh token:', error);
            return null;
        }
    }

    /**
     * Store authentication tokens securely
     */
    public async setTokens(tokens: AuthTokens): Promise<void> {
        try {
            await Promise.all([
                this.setSecureValue(TokenManager.ACCESS_TOKEN_KEY, tokens.accessToken),
                this.setSecureValue(TokenManager.REFRESH_TOKEN_KEY, tokens.refreshToken),
                this.setSecureValue(TokenManager.TOKEN_EXPIRY_KEY, tokens.expiresAt.toISOString()),
                this.setSecureValue(TokenManager.TOKEN_TYPE_KEY, tokens.tokenType || 'Bearer'),
            ]);
        } catch (error) {
            console.error('Failed to store tokens:', error);
            throw new Error('Failed to store authentication tokens securely');
        }
    }

    /**
     * Refresh access token using refresh token
     */
    public async refreshAccessToken(): Promise<string> {
        if (!this.apiClient) {
            throw new Error('API client not configured for token refresh');
        }

        const refreshToken = await this.getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const request: RefreshTokenRequest = { refreshToken };
            const response = await this.apiClient.post('/auth/refresh', request);

            if (!response.data) {
                throw new Error('Invalid refresh response');
            }

            // Update stored access token and expiry
            await Promise.all([
                this.setSecureValue(TokenManager.ACCESS_TOKEN_KEY, response.data.accessToken),
                this.setSecureValue(TokenManager.TOKEN_EXPIRY_KEY, response.data.expiresAt.toISOString()),
            ]);

            return response.data.accessToken;
        } catch (error) {
            console.error('Token refresh failed:', error);

            // Clear tokens if refresh fails
            await this.clearTokens();

            throw new Error('Token refresh failed. Please log in again.');
        }
    }

    /**
     * Clear all stored tokens
     */
    public async clearTokens(): Promise<void> {
        try {
            await Promise.all([
                this.removeSecureValue(TokenManager.ACCESS_TOKEN_KEY),
                this.removeSecureValue(TokenManager.REFRESH_TOKEN_KEY),
                this.removeSecureValue(TokenManager.TOKEN_EXPIRY_KEY),
                this.removeSecureValue(TokenManager.TOKEN_TYPE_KEY),
            ]);
        } catch (error) {
            console.error('Failed to clear tokens:', error);
            throw new Error('Failed to clear authentication tokens');
        }
    }

    /**
     * Check if token is expired
     */
    public async isTokenExpired(): Promise<boolean> {
        try {
            const expiryTime = await this.getTokenExpiry();
            if (!expiryTime) {
                return true;
            }

            return new Date() >= expiryTime;
        } catch (error) {
            console.error('Failed to check token expiry:', error);
            return true;
        }
    }

    /**
     * Check if tokens exist
     */
    public async hasValidTokens(): Promise<boolean> {
        try {
            const accessToken = await this.getSecureValue(TokenManager.ACCESS_TOKEN_KEY);
            const refreshToken = await this.getSecureValue(TokenManager.REFRESH_TOKEN_KEY);

            return !!(accessToken && refreshToken);
        } catch (error) {
            console.error('Failed to check token validity:', error);
            return false;
        }
    }

    /**
     * Get token type (usually 'Bearer')
     */
    public async getTokenType(): Promise<string> {
        try {
            const tokenType = await this.getSecureValue(TokenManager.TOKEN_TYPE_KEY);
            return tokenType || 'Bearer';
        } catch (error) {
            console.error('Failed to get token type:', error);
            return 'Bearer';
        }
    }

    /**
     * Get token expiry date
     */
    private async getTokenExpiry(): Promise<Date | null> {
        try {
            const expiryString = await this.getSecureValue(TokenManager.TOKEN_EXPIRY_KEY);
            return expiryString ? new Date(expiryString) : null;
        } catch (error) {
            console.error('Failed to get token expiry:', error);
            return null;
        }
    }

    /**
     * Check if token should be refreshed based on threshold
     */
    private shouldRefreshToken(expiryTime: Date): boolean {
        const now = new Date();
        const thresholdMs = this.config.tokenRefreshThreshold * 60 * 1000; // Convert minutes to milliseconds
        const refreshTime = new Date(expiryTime.getTime() - thresholdMs);

        return now >= refreshTime;
    }

    /**
     * Get value from secure storage with fallback
     */
    private async getSecureValue(key: string): Promise<string | null> {
        try {
            // Try Keychain first
            const credentials = await Keychain.getInternetCredentials(this.config.keychainService);
            if (credentials && credentials.password) {
                const storedData = JSON.parse(credentials.password);
                return storedData[key] || null;
            }
        } catch (error) {
            console.warn('Keychain access failed, trying fallback storage:', error);
        }

        // Fallback to AsyncStorage if enabled
        if (this.config.fallbackToAsyncStorage) {
            try {
                return await AsyncStorage.getItem(key);
            } catch (error) {
                console.error('AsyncStorage access failed:', error);
            }
        }

        return null;
    }

    /**
     * Set value in secure storage with fallback
     */
    private async setSecureValue(key: string, value: string): Promise<void> {
        try {
            // Try to get existing data from Keychain
            let existingData: Record<string, string> = {};

            try {
                const credentials = await Keychain.getInternetCredentials(this.config.keychainService);
                if (credentials && credentials.password) {
                    existingData = JSON.parse(credentials.password);
                }
            } catch (error) {
                // Ignore error, will create new data
            }

            // Update the data
            existingData[key] = value;

            // Store in Keychain
            await Keychain.setInternetCredentials(
                this.config.keychainService,
                'yu_tokens',
                JSON.stringify(existingData)
            );
        } catch (error) {
            console.warn('Keychain storage failed, trying fallback storage:', error);

            // Fallback to AsyncStorage if enabled
            if (this.config.fallbackToAsyncStorage) {
                try {
                    await AsyncStorage.setItem(key, value);
                } catch (fallbackError) {
                    console.error('AsyncStorage storage failed:', fallbackError);
                    throw new Error('Failed to store value in secure storage');
                }
            } else {
                throw new Error('Secure storage failed and fallback is disabled');
            }
        }
    }

    /**
     * Remove value from secure storage with fallback
     */
    private async removeSecureValue(key: string): Promise<void> {
        try {
            // Try to get existing data from Keychain
            let existingData: Record<string, string> = {};

            try {
                const credentials = await Keychain.getInternetCredentials(this.config.keychainService);
                if (credentials && credentials.password) {
                    existingData = JSON.parse(credentials.password);
                }
            } catch (error) {
                // Ignore error, data might not exist
            }

            // Remove the key
            delete existingData[key];

            // Update Keychain with remaining data
            if (Object.keys(existingData).length > 0) {
                await Keychain.setInternetCredentials(
                    this.config.keychainService,
                    'yu_tokens',
                    JSON.stringify(existingData)
                );
            } else {
                // Remove credentials entirely if no data left
                await Keychain.resetInternetCredentials({ service: this.config.keychainService });
            }
        } catch (error) {
            console.warn('Keychain removal failed, trying fallback storage:', error);

            // Fallback to AsyncStorage if enabled
            if (this.config.fallbackToAsyncStorage) {
                try {
                    await AsyncStorage.removeItem(key);
                } catch (fallbackError) {
                    console.error('AsyncStorage removal failed:', fallbackError);
                    throw new Error('Failed to remove value from secure storage');
                }
            } else {
                throw new Error('Secure storage removal failed and fallback is disabled');
            }
        }
    }

    /**
     * Check if Keychain is available on the device
     */
    public async isKeychainAvailable(): Promise<boolean> {
        try {
            await Keychain.getSupportedBiometryType();
            return true; // If we can check biometry, Keychain is available
        } catch (error) {
            return false;
        }
    }

    /**
     * Get storage info for debugging
     */
    public async getStorageInfo(): Promise<{
        keychainAvailable: boolean;
        hasTokens: boolean;
        tokenExpiry: Date | null;
        usingFallback: boolean;
    }> {
        const keychainAvailable = await this.isKeychainAvailable();
        const hasTokens = await this.hasValidTokens();
        const tokenExpiry = await this.getTokenExpiry();

        // Check if we're using fallback storage
        let usingFallback = false;
        try {
            await Keychain.getInternetCredentials(this.config.keychainService);
        } catch (error) {
            usingFallback = this.config.fallbackToAsyncStorage;
        }

        return {
            keychainAvailable,
            hasTokens,
            tokenExpiry,
            usingFallback,
        };
    }
}