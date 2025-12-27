import { AuthIntegration } from '../AuthIntegration';

// Mock the ServiceManager module completely
jest.mock('../../ServiceManager', () => ({
  ServiceManager: {
    getInstance: jest.fn(() => ({
      setAuthErrorCallback: jest.fn(),
      isAuthenticated: jest.fn(),
      logout: jest.fn(),
    })),
  },
}));

describe('AuthIntegration', () => {
  let authIntegration: AuthIntegration;

  beforeEach(() => {
    authIntegration = new AuthIntegration();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create AuthIntegration instance', () => {
      expect(authIntegration).toBeInstanceOf(AuthIntegration);
    });

    it('should have getServiceManager method', () => {
      expect(typeof authIntegration.getServiceManager).toBe('function');
    });

    it('should have setNavigationCallback method', () => {
      expect(typeof authIntegration.setNavigationCallback).toBe('function');
    });

    it('should have checkAuthenticationStatus method', () => {
      expect(typeof authIntegration.checkAuthenticationStatus).toBe('function');
    });

    it('should have logout method', () => {
      expect(typeof authIntegration.logout).toBe('function');
    });
  });
});