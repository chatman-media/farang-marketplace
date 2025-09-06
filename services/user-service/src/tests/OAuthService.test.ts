import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  OAuthService,
  GoogleOAuthProvider,
  TelegramOAuthProvider,
} from '../services/OAuthService';
import { AuthProvider, UserRole } from '@marketplace/shared-types';

// Mock dependencies
vi.mock('../services/UserService');
vi.mock('../services/AuthService');

describe('OAuthService', () => {
  let oauthService: OAuthService;
  let mockUserService: any;
  let mockAuthService: any;

  beforeEach(() => {
    // Reset environment variables
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_BOT_USERNAME;

    mockUserService = {
      getUserByEmail: vi.fn(),
      createUser: vi.fn(),
      validateUserCredentials: vi.fn(),
      getUserById: vi.fn(),
      updateUser: vi.fn(),
    };
    mockAuthService = {
      generateAccessToken: vi.fn(),
      generateRefreshToken: vi.fn(),
    };

    oauthService = new OAuthService(mockUserService, mockAuthService);
  });

  describe('generateState', () => {
    it('should generate a random state string', () => {
      const state1 = oauthService.generateState();
      const state2 = oauthService.generateState();

      expect(state1).toBeDefined();
      expect(state2).toBeDefined();
      expect(state1).not.toBe(state2);
      expect(state1).toHaveLength(64); // 32 bytes = 64 hex chars
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should throw error for unconfigured provider', async () => {
      await expect(
        oauthService.getAuthorizationUrl(AuthProvider.GOOGLE, 'test-state')
      ).rejects.toThrow('Provider google is not configured or supported');
    });

    it('should throw error for Telegram provider', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_BOT_USERNAME = 'test-bot';

      const newOAuthService = new OAuthService(
        mockUserService,
        mockAuthService
      );

      await expect(
        newOAuthService.getAuthorizationUrl(AuthProvider.TELEGRAM, 'test-state')
      ).rejects.toThrow('Telegram uses Login Widget, not authorization URL');
    });
  });

  describe('authenticateWithProvider', () => {
    beforeEach(() => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.BACKEND_URL = 'http://localhost:3001';
    });

    it('should throw error for unconfigured provider', async () => {
      const request = {
        provider: AuthProvider.APPLE,
        code: 'test-code',
        state: 'test-state',
      };

      await expect(
        oauthService.authenticateWithProvider(request)
      ).rejects.toThrow('Provider apple is not configured or supported');
    });

    it('should create new user when no existing user found', async () => {
      const mockSocialProfile = {
        provider: AuthProvider.GOOGLE,
        providerId: '123456789',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        username: 'test@example.com',
        connectedAt: new Date().toISOString(),
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.USER,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          avatar: 'https://example.com/avatar.jpg',
        },
        socialProfiles: [mockSocialProfile],
        primaryAuthProvider: AuthProvider.GOOGLE,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockUserEntity = {
        id: 'user-123',
        email: 'test@example.com',
        toPublicUser: () => mockUser,
      };

      // Mock the provider's getUserProfile method
      const mockProvider = {
        getUserProfile: vi.fn().mockResolvedValue(mockSocialProfile),
      };

      // Replace the provider in the service
      (oauthService as any).providers.set(AuthProvider.GOOGLE, mockProvider);

      // Mock service methods
      mockUserService.getUserByEmail.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockUser);
      mockUserService.validateUserCredentials.mockResolvedValue(
        mockUserEntity as any
      );
      mockAuthService.generateAccessToken.mockReturnValue('access-token');
      mockAuthService.generateRefreshToken.mockReturnValue('refresh-token');

      const request = {
        provider: AuthProvider.GOOGLE,
        code: 'test-code',
        state: 'test-state',
      };

      const result = await oauthService.authenticateWithProvider(request);

      expect(result).toEqual({
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(mockUserService.createUser).toHaveBeenCalled();
    });
  });

  describe('linkSocialAccount', () => {
    it('should throw error for unconfigured provider', async () => {
      const request = {
        provider: AuthProvider.APPLE,
        code: 'test-code',
        state: 'test-state',
      };

      await expect(
        oauthService.linkSocialAccount('user-123', request)
      ).rejects.toThrow('Provider apple is not configured or supported');
    });

    it('should throw error if social account already linked to another user', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

      const newOAuthService = new OAuthService(
        mockUserService,
        mockAuthService
      );

      const mockSocialProfile = {
        provider: AuthProvider.GOOGLE,
        providerId: '123456789',
        email: 'test@example.com',
        name: 'Test User',
        connectedAt: new Date().toISOString(),
      };

      const existingUser = {
        id: 'other-user-123',
        email: 'other@example.com',
      };

      const mockProvider = {
        getUserProfile: vi.fn().mockResolvedValue(mockSocialProfile),
      };

      (newOAuthService as any).providers.set(AuthProvider.GOOGLE, mockProvider);
      (newOAuthService as any).findUserBySocialProfile = vi
        .fn()
        .mockResolvedValue(existingUser);

      const request = {
        provider: AuthProvider.GOOGLE,
        code: 'test-code',
        state: 'test-state',
      };

      await expect(
        newOAuthService.linkSocialAccount('user-123', request)
      ).rejects.toThrow(
        'This social account is already linked to another user'
      );
    });
  });

  describe('unlinkSocialAccount', () => {
    it('should throw error if user not found', async () => {
      mockUserService.getUserById.mockResolvedValue(null);

      const request = {
        provider: AuthProvider.GOOGLE,
      };

      await expect(
        oauthService.unlinkSocialAccount('user-123', request)
      ).rejects.toThrow('User not found');
    });

    it('should throw error if trying to unlink the only authentication method', async () => {
      const mockUser = {
        id: 'user-123',
        email: null, // No email means no password
        socialProfiles: [
          {
            provider: AuthProvider.GOOGLE,
            providerId: '123456789',
            connectedAt: new Date().toISOString(),
          },
        ],
      };

      mockUserService.getUserById.mockResolvedValue(mockUser as any);

      const request = {
        provider: AuthProvider.GOOGLE,
      };

      await expect(
        oauthService.unlinkSocialAccount('user-123', request)
      ).rejects.toThrow(
        'Cannot unlink the only authentication method. Please set a password first.'
      );
    });
  });
});

describe('GoogleOAuthProvider', () => {
  let provider: GoogleOAuthProvider;
  const config = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3001/auth/google/callback',
  };

  beforeEach(() => {
    provider = new GoogleOAuthProvider(config);
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL', () => {
      const state = 'test-state';
      const url = provider.getAuthorizationUrl(state);

      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain(`client_id=${config.clientId}`);
      expect(url).toContain(
        `redirect_uri=${encodeURIComponent(config.redirectUri)}`
      );
      expect(url).toContain(`state=${state}`);
      expect(url).toContain('scope=profile+email');
    });
  });

  describe('getUserProfile', () => {
    it('should throw error if no authorization code provided', async () => {
      const request = {
        provider: AuthProvider.GOOGLE,
        state: 'test-state',
      };

      await expect(provider.getUserProfile(request as any)).rejects.toThrow(
        'Authorization code is required for Google OAuth'
      );
    });
  });
});

describe('TelegramOAuthProvider', () => {
  let provider: TelegramOAuthProvider;
  const config = {
    botToken: 'test-bot-token',
    botUsername: 'test-bot',
  };

  beforeEach(() => {
    provider = new TelegramOAuthProvider(config);
  });

  describe('getAuthorizationUrl', () => {
    it('should throw error as Telegram uses Widget', () => {
      expect(() => {
        provider.getAuthorizationUrl('test-state');
      }).toThrow('Telegram uses Login Widget, not authorization URL');
    });
  });

  describe('getUserProfile', () => {
    it('should throw error if no Telegram data provided', async () => {
      const request = {
        provider: AuthProvider.TELEGRAM,
        state: 'test-state',
      };

      await expect(provider.getUserProfile(request as any)).rejects.toThrow(
        'Telegram data is required'
      );
    });

    it('should throw error if Telegram auth data is invalid', async () => {
      const request = {
        provider: AuthProvider.TELEGRAM,
        telegramData: {
          id: 123456789,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          hash: 'invalid-hash',
        },
      };

      await expect(provider.getUserProfile(request as any)).rejects.toThrow(
        'Invalid Telegram authentication data'
      );
    });
  });
});
