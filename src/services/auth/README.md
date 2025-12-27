# Authentication Integration

This module provides comprehensive authentication integration for the Yu Digital Assistant app, including JWT token management, automatic token refresh, and authentication error handling.

## Overview

The authentication integration consists of three main components:

1. **ApiClient** - Enhanced HTTP client with automatic JWT token handling
2. **ServiceManager** - Centralized service management with authentication error callbacks
3. **AuthIntegration** - High-level integration helper for navigation and app state management

## Features

### JWT Token Management
- Automatic addition of JWT tokens to request headers
- Token type support (Bearer, etc.)
- Secure token storage using React Native Keychain

### Automatic Token Refresh
- Automatic token refresh on 401 responses
- Retry failed requests with new tokens
- Prevents infinite retry loops
- Graceful fallback when refresh fails

### Authentication Error Handling
- Standardized error responses
- Automatic navigation to login on auth failures
- Callback system for custom error handling
- Support for different error types (401, 403, etc.)

## Usage

### Basic Setup

```typescript
import { getAuthIntegration } from '../services';

// Initialize authentication integration
const authIntegration = getAuthIntegration();

// Set navigation callback for auth errors
authIntegration.setNavigationCallback((route: string) => {
  // Navigate to the specified route (e.g., 'Login')
  navigation.navigate(route);
});
```

### Service Manager Usage

```typescript
import { ServiceManager } from '../services';

// Get service manager instance
const serviceManager = ServiceManager.getInstance();

// Initialize services
await serviceManager.initialize();

// Check authentication status
const isAuthenticated = await serviceManager.isAuthenticated();

// Logout user
await serviceManager.logout();
```

### API Client Usage

```typescript
import { ServiceManager } from '../services';

const serviceManager = ServiceManager.getInstance();
const apiClient = serviceManager.getApiClient();

// Make authenticated requests (token added automatically)
const response = await apiClient.get('/api/user/profile');

// Check authentication status
const isAuth = await apiClient.isAuthenticated();

// Get auth headers for manual requests
const headers = await apiClient.getAuthHeaders();
```

### Authentication Service Usage

```typescript
import { ServiceManager } from '../services';

const serviceManager = ServiceManager.getInstance();
const authService = serviceManager.getAuthService();

// Login user
const loginResponse = await authService.login({
  email: 'user@example.com',
  password: 'password123'
});

// Check if user is authenticated
const isAuthenticated = await authService.isAuthenticated();

// Get current user
const user = await authService.getCurrentUser();

// Logout
await authService.logout();
```

## Integration with React Navigation

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { getAuthIntegration } from '../services';

function App() {
  const authIntegration = getAuthIntegration();
  
  // Set up navigation callback
  React.useEffect(() => {
    authIntegration.setNavigationCallback((route: string) => {
      // Handle navigation based on route
      if (route === 'Login') {
        // Navigate to login screen
        navigationRef.current?.navigate('Auth', { screen: 'Login' });
      }
    });
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      {/* Your navigation structure */}
    </NavigationContainer>
  );
}
```

## Error Handling

The system automatically handles various authentication scenarios:

### 401 Unauthorized
- Attempts automatic token refresh
- Retries original request with new token
- Navigates to login if refresh fails

### 403 Forbidden
- Logs access forbidden error
- Can be customized with callback

### Network Errors
- Implements retry logic with exponential backoff
- Provides user-friendly error messages

### Token Expiration
- Proactive token refresh before expiration
- Configurable refresh threshold

## Configuration

Authentication behavior can be configured through the environment configuration:

```typescript
// src/config/environment.ts
export const config = {
  authConfig: {
    tokenRefreshThreshold: 5, // minutes before expiry to refresh
    maxLoginAttempts: 3,
    sessionTimeout: 30, // minutes
    enableBiometric: true,
  },
  // ... other config
};
```

## Security Features

- Secure token storage using React Native Keychain
- Fallback to AsyncStorage when Keychain unavailable
- Automatic token cleanup on logout
- Request signing and validation
- Certificate pinning support (configurable)

## Testing

The authentication integration includes comprehensive tests:

```bash
# Run authentication tests
npm test -- --testPathPattern="auth"

# Run specific test files
npm test -- --testPathPattern="AuthIntegration.test.ts"
npm test -- --testPathPattern="TokenManager.test.ts"
```

## Troubleshooting

### Common Issues

1. **Token refresh loops**: Check that the refresh endpoint doesn't require authentication
2. **Navigation not working**: Ensure navigation callback is set before making API calls
3. **Keychain errors**: Enable fallback to AsyncStorage in configuration
4. **Network timeouts**: Adjust timeout settings in API client configuration

### Debug Information

```typescript
// Get token manager storage info
const tokenManager = serviceManager.getTokenManager();
const storageInfo = await tokenManager.getStorageInfo();
console.log('Storage info:', storageInfo);

// Check API client configuration
const apiClient = serviceManager.getApiClient();
const config = apiClient.getConfig();
console.log('API config:', config);
```