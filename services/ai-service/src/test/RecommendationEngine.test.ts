import { describe, it, expect, beforeEach } from 'vitest';
import { RecommendationEngine } from '../services/RecommendationEngine';
import { AIProviderService } from '../services/AIProviderService';

describe('Recommendation Engine Tests', () => {
  let recommendationEngine: RecommendationEngine;
  let aiProviderService: AIProviderService;

  beforeEach(() => {
    aiProviderService = new AIProviderService();
    recommendationEngine = new RecommendationEngine(aiProviderService);
  });

  describe('Collaborative Filtering', () => {
    it('should generate collaborative filtering recommendations', async () => {
      const request = {
        userId: 'user_123',
        type: 'listings',
        context: {
          currentListingId: 'listing_456',
          searchQuery: 'smartphone',
          category: 'electronics',
          location: 'Bangkok',
          budget: 15000,
        },
        filters: {
          categories: ['electronics'],
          priceRange: { min: 10000, max: 20000 },
          location: 'Bangkok',
          rating: 4.0,
          availability: true,
        },
        limit: 10,
        diversityFactor: 0.3,
        algorithm: 'collaborative' as const,
      };

      const recommendations = await recommendationEngine.generateRecommendations(request);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations.items)).toBe(true);
      expect(recommendations.items.length).toBeGreaterThan(0);
      expect(recommendations.items.length).toBeLessThanOrEqual(10);
      expect(recommendations.algorithm).toBe('collaborative');
      expect(recommendations.confidence).toBeGreaterThan(0);
      expect(recommendations.diversityScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle user with no history', async () => {
      const request = {
        userId: 'new_user_999',
        type: 'listings',
        context: {
          currentListingId: '',
          searchQuery: 'laptop',
          category: 'electronics',
          location: 'Bangkok',
          budget: 25000,
        },
        filters: {
          categories: ['electronics'],
          priceRange: { min: 20000, max: 30000 },
          location: 'Bangkok',
          rating: 3.5,
          availability: true,
        },
        limit: 5,
        diversityFactor: 0.5,
        algorithm: 'collaborative' as const,
      };

      const recommendations = await recommendationEngine.generateRecommendations(request);

      expect(recommendations).toBeDefined();
      expect(recommendations.items.length).toBeGreaterThan(0);
      // Should fallback to content-based or trending
      expect(['collaborative', 'content-based', 'trending']).toContain(recommendations.algorithm);
    });
  });

  describe('Content-Based Filtering', () => {
    it('should generate content-based recommendations', async () => {
      const request = {
        userId: 'user_456',
        type: 'listings',
        context: {
          currentListingId: 'listing_789',
          searchQuery: 'gaming laptop',
          category: 'electronics',
          location: 'Chiang Mai',
          budget: 35000,
        },
        filters: {
          categories: ['electronics'],
          priceRange: { min: 30000, max: 40000 },
          location: 'Chiang Mai',
          rating: 4.5,
          availability: true,
        },
        limit: 8,
        diversityFactor: 0.2,
        algorithm: 'content-based' as const,
      };

      const recommendations = await recommendationEngine.generateRecommendations(request);

      expect(recommendations).toBeDefined();
      expect(recommendations.items.length).toBeGreaterThan(0);
      expect(recommendations.algorithm).toBe('content-based');
      expect(recommendations.confidence).toBeGreaterThan(0);
      
      // Content-based should have relevant items
      const hasRelevantItems = recommendations.items.some(item => 
        item.category === 'electronics' || 
        item.title.toLowerCase().includes('laptop') ||
        item.title.toLowerCase().includes('gaming')
      );
      expect(hasRelevantItems).toBe(true);
    });

    it('should respect price range filters', async () => {
      const request = {
        userId: 'user_789',
        type: 'listings',
        context: {
          currentListingId: 'listing_123',
          searchQuery: 'phone',
          category: 'electronics',
          location: 'Phuket',
          budget: 8000,
        },
        filters: {
          categories: ['electronics'],
          priceRange: { min: 5000, max: 10000 },
          location: 'Phuket',
          rating: 3.0,
          availability: true,
        },
        limit: 6,
        diversityFactor: 0.4,
        algorithm: 'content-based' as const,
      };

      const recommendations = await recommendationEngine.generateRecommendations(request);

      expect(recommendations).toBeDefined();
      
      // All items should be within price range
      const withinPriceRange = recommendations.items.every(item => 
        item.price >= 5000 && item.price <= 10000
      );
      expect(withinPriceRange).toBe(true);
    });
  });

  describe('AI-Enhanced Recommendations', () => {
    it('should generate AI-enhanced recommendations', async () => {
      const request = {
        userId: 'user_ai_test',
        type: 'listings',
        context: {
          currentListingId: 'listing_ai_test',
          searchQuery: 'luxury apartment Bangkok',
          category: 'real-estate',
          location: 'Bangkok',
          budget: 50000,
        },
        filters: {
          categories: ['real-estate'],
          priceRange: { min: 40000, max: 60000 },
          location: 'Bangkok',
          rating: 4.0,
          availability: true,
        },
        limit: 5,
        diversityFactor: 0.3,
        algorithm: 'ai-enhanced' as const,
      };

      const recommendations = await recommendationEngine.generateRecommendations(request);

      expect(recommendations).toBeDefined();
      expect(recommendations.items.length).toBeGreaterThan(0);
      expect(recommendations.algorithm).toBe('ai-enhanced');
      expect(recommendations.confidence).toBeGreaterThan(0.5); // AI should be more confident
    });

    it('should handle AI provider failures gracefully', async () => {
      // Mock AI provider to fail
      const originalGenerateResponse = aiProviderService.generateResponse;
      aiProviderService.generateResponse = async () => {
        throw new Error('AI provider unavailable');
      };

      const request = {
        userId: 'user_fallback_test',
        type: 'listings',
        context: {
          currentListingId: 'listing_fallback',
          searchQuery: 'camera',
          category: 'electronics',
          location: 'Bangkok',
          budget: 15000,
        },
        filters: {
          categories: ['electronics'],
          priceRange: { min: 10000, max: 20000 },
          location: 'Bangkok',
          rating: 3.5,
          availability: true,
        },
        limit: 5,
        diversityFactor: 0.3,
        algorithm: 'ai-enhanced' as const,
      };

      const recommendations = await recommendationEngine.generateRecommendations(request);

      expect(recommendations).toBeDefined();
      expect(recommendations.items.length).toBeGreaterThan(0);
      // Should fallback to traditional algorithms
      expect(['collaborative', 'content-based', 'trending']).toContain(recommendations.algorithm);

      // Restore original method
      aiProviderService.generateResponse = originalGenerateResponse;
    });
  });

  describe('Trending Recommendations', () => {
    it('should generate trending recommendations', async () => {
      const request = {
        userId: 'user_trending',
        type: 'listings',
        context: {
          currentListingId: '',
          searchQuery: '',
          category: 'fashion',
          location: 'Bangkok',
          budget: 2000,
        },
        filters: {
          categories: ['fashion'],
          priceRange: { min: 1000, max: 3000 },
          location: 'Bangkok',
          rating: 3.0,
          availability: true,
        },
        limit: 10,
        diversityFactor: 0.5,
        algorithm: 'trending' as const,
      };

      const recommendations = await recommendationEngine.generateRecommendations(request);

      expect(recommendations).toBeDefined();
      expect(recommendations.items.length).toBeGreaterThan(0);
      expect(recommendations.algorithm).toBe('trending');
      
      // Trending items should have high view counts or recent activity
      const hasTrendingMetrics = recommendations.items.some(item => 
        item.viewCount > 100 || item.bookingCount > 10
      );
      expect(hasTrendingMetrics).toBe(true);
    });
  });

  describe('User Profile Building', () => {
    it('should build user profile from behavior', async () => {
      const userId = 'profile_test_user';
      
      // Simulate user behavior
      await recommendationEngine.updateUserBehavior(userId, {
        action: 'view',
        entityType: 'listing',
        entityId: 'listing_electronics_1',
        metadata: { category: 'electronics', price: 15000 },
        timestamp: new Date(),
      });

      await recommendationEngine.updateUserBehavior(userId, {
        action: 'like',
        entityType: 'listing',
        entityId: 'listing_electronics_2',
        metadata: { category: 'electronics', price: 18000 },
        timestamp: new Date(),
      });

      const profile = await recommendationEngine.getUserProfile(userId);

      expect(profile).toBeDefined();
      expect(profile.preferences.categories).toContain('electronics');
      expect(profile.preferences.priceRange.min).toBeGreaterThan(0);
      expect(profile.preferences.priceRange.max).toBeGreaterThan(profile.preferences.priceRange.min);
      expect(profile.activityLevel).toBeGreaterThan(0);
    });

    it('should update user preferences over time', async () => {
      const userId = 'preference_update_user';
      
      // Initial behavior - electronics
      for (let i = 0; i < 5; i++) {
        await recommendationEngine.updateUserBehavior(userId, {
          action: 'view',
          entityType: 'listing',
          entityId: `listing_electronics_${i}`,
          metadata: { category: 'electronics', price: 15000 + i * 1000 },
          timestamp: new Date(),
        });
      }

      const initialProfile = await recommendationEngine.getUserProfile(userId);
      expect(initialProfile.preferences.categories).toContain('electronics');

      // New behavior - fashion
      for (let i = 0; i < 8; i++) {
        await recommendationEngine.updateUserBehavior(userId, {
          action: 'view',
          entityType: 'listing',
          entityId: `listing_fashion_${i}`,
          metadata: { category: 'fashion', price: 2000 + i * 500 },
          timestamp: new Date(),
        });
      }

      const updatedProfile = await recommendationEngine.getUserProfile(userId);
      expect(updatedProfile.preferences.categories).toContain('fashion');
      // Should still have electronics but fashion should be more prominent
      expect(updatedProfile.preferences.categories.indexOf('fashion')).toBeLessThan(
        updatedProfile.preferences.categories.indexOf('electronics')
      );
    });
  });

  describe('Diversity and Quality', () => {
    it('should apply diversity factor correctly', async () => {
      const baseRequest = {
        userId: 'diversity_test_user',
        type: 'listings',
        context: {
          currentListingId: 'listing_base',
          searchQuery: 'phone',
          category: 'electronics',
          location: 'Bangkok',
          budget: 15000,
        },
        filters: {
          categories: ['electronics'],
          priceRange: { min: 10000, max: 20000 },
          location: 'Bangkok',
          rating: 3.0,
          availability: true,
        },
        limit: 10,
        algorithm: 'content-based' as const,
      };

      // Low diversity
      const lowDiversityRequest = { ...baseRequest, diversityFactor: 0.1 };
      const lowDiversityRecs = await recommendationEngine.generateRecommendations(lowDiversityRequest);

      // High diversity
      const highDiversityRequest = { ...baseRequest, diversityFactor: 0.8 };
      const highDiversityRecs = await recommendationEngine.generateRecommendations(highDiversityRequest);

      expect(lowDiversityRecs.diversityScore).toBeLessThan(highDiversityRecs.diversityScore);
    });

    it('should filter out low-quality recommendations', async () => {
      const request = {
        userId: 'quality_test_user',
        type: 'listings',
        context: {
          currentListingId: 'listing_quality',
          searchQuery: 'high quality product',
          category: 'electronics',
          location: 'Bangkok',
          budget: 25000,
        },
        filters: {
          categories: ['electronics'],
          priceRange: { min: 20000, max: 30000 },
          location: 'Bangkok',
          rating: 4.5, // High rating requirement
          availability: true,
        },
        limit: 5,
        diversityFactor: 0.3,
        algorithm: 'content-based' as const,
      };

      const recommendations = await recommendationEngine.generateRecommendations(request);

      expect(recommendations).toBeDefined();
      
      // All recommendations should meet quality criteria
      const highQuality = recommendations.items.every(item => 
        item.rating >= 4.5 && item.score >= 0.5
      );
      expect(highQuality).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid user ID gracefully', async () => {
      const request = {
        userId: '', // Invalid user ID
        type: 'listings',
        context: {
          currentListingId: 'listing_test',
          searchQuery: 'test',
          category: 'electronics',
          location: 'Bangkok',
          budget: 15000,
        },
        filters: {
          categories: ['electronics'],
          priceRange: { min: 10000, max: 20000 },
          location: 'Bangkok',
          rating: 3.0,
          availability: true,
        },
        limit: 5,
        diversityFactor: 0.3,
        algorithm: 'collaborative' as const,
      };

      const recommendations = await recommendationEngine.generateRecommendations(request);

      expect(recommendations).toBeDefined();
      expect(recommendations.items.length).toBeGreaterThan(0);
      // Should fallback to trending or content-based
      expect(['trending', 'content-based']).toContain(recommendations.algorithm);
    });

    it('should handle empty filters gracefully', async () => {
      const request = {
        userId: 'empty_filters_user',
        type: 'listings',
        context: {
          currentListingId: '',
          searchQuery: '',
          category: '',
          location: '',
          budget: 0,
        },
        filters: {
          categories: [],
          priceRange: { min: 0, max: 999999 },
          location: '',
          rating: 0,
          availability: true,
        },
        limit: 5,
        diversityFactor: 0.3,
        algorithm: 'content-based' as const,
      };

      const recommendations = await recommendationEngine.generateRecommendations(request);

      expect(recommendations).toBeDefined();
      expect(recommendations.items.length).toBeGreaterThan(0);
    });
  });
});
