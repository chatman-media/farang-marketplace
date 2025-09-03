import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  UserEntity,
  CreateUserSchema,
  UpdateUserSchema,
  ChangePasswordSchema,
} from '../../models/User'
import { UserRole, VerificationStatus } from '@marketplace/shared-types'
import { testUserData } from '../setup'

// bcrypt is used directly for real password hashing in tests

describe('UserEntity', () => {
  let user: UserEntity

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    
    user = new UserEntity(
      '123e4567-e89b-12d3-a456-426614174000',
      'test@example.com',
      '$2a$12$hashedpassword',
      UserRole.USER,
      {
        firstName: 'John',
        lastName: 'Doe',
        rating: 4.5,
        reviewsCount: 10,
        verificationStatus: VerificationStatus.VERIFIED,
      },
      '+1234567890',
      'telegram123',
      true,
      new Date('2023-01-01'),
      new Date('2023-01-01')
    )
  })

  describe('Factory Methods', () => {
    it('should create UserEntity from database row', () => {
      const row = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password_hash: '$2a$12$hashedpassword',
        role: 'user',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          rating: 4.5,
          reviewsCount: 10,
          verificationStatus: 'verified',
        },
        phone: '+1234567890',
        telegram_id: 'telegram123',
        is_active: true,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
      }

      const userEntity = UserEntity.fromDatabaseRow(row)

      expect(userEntity.id).toBe(row.id)
      expect(userEntity.email).toBe(row.email)
      expect(userEntity.role).toBe(UserRole.USER)
      expect(userEntity.profile.firstName).toBe('John')
    })
  })

  describe('Public User Conversion', () => {
    it('should convert to public user without password hash', () => {
      const publicUser = user.toPublicUser()

      expect(publicUser).not.toHaveProperty('passwordHash')
      expect(publicUser.id).toBe(user.id)
      expect(publicUser.email).toBe(user.email)
      expect(publicUser.role).toBe(user.role)
      expect(publicUser.profile).toEqual(user.profile)
    })
  })

  describe('Password Methods', () => {
    it('should hash password correctly', async () => {
      const password = 'testpassword123'
      const hash = await UserEntity.hashPassword(password)

      // Check that hash is generated and has correct format
      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$.{53}$/)
      expect(hash).not.toBe(password) // Should be different from original
    })

    it('should validate correct password', async () => {
      // Create a user with a known password hash
      const password = 'testpassword123'
      const hash = await UserEntity.hashPassword(password)
      const testUser = new UserEntity(
        'test-id',
        'test@example.com',
        hash,
        UserRole.USER,
        { firstName: 'Test', lastName: 'User', rating: 0, reviewsCount: 0, verificationStatus: VerificationStatus.UNVERIFIED }
      )

      const isValid = await testUser.validatePassword(password)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'testpassword123'
      const hash = await UserEntity.hashPassword(password)
      const testUser = new UserEntity(
        'test-id',
        'test@example.com',
        hash,
        UserRole.USER,
        { firstName: 'Test', lastName: 'User', rating: 0, reviewsCount: 0, verificationStatus: VerificationStatus.UNVERIFIED }
      )

      const isValid = await testUser.validatePassword('wrongpassword')
      expect(isValid).toBe(false)
    })

    it('should update password and timestamp', async () => {
      const oldUpdatedAt = user.updatedAt
      const oldPasswordHash = user.passwordHash
      const newPassword = 'newpassword123'

      await user.updatePassword(newPassword)

      expect(user.passwordHash).not.toBe(oldPasswordHash)
      expect(user.passwordHash).toMatch(/^\$2[ab]\$\d{2}\$.{53}$/)
      expect(user.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime())
    })
  })

  describe('Profile Methods', () => {
    it('should update profile data', () => {
      const oldUpdatedAt = user.updatedAt
      const profileUpdate = {
        firstName: 'Jane',
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          city: 'New York',
        },
      }

      user.updateProfile(profileUpdate)

      expect(user.profile.firstName).toBe('Jane')
      expect(user.profile.lastName).toBe('Doe') // Should remain unchanged
      expect(user.profile.location).toEqual(profileUpdate.location)
      expect(user.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime())
    })

    it('should update rating and reviews count', () => {
      const oldUpdatedAt = user.updatedAt

      user.updateRating(4.8, 15)

      expect(user.profile.rating).toBe(4.8)
      expect(user.profile.reviewsCount).toBe(15)
      expect(user.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime())
    })

    it('should set verification status', () => {
      const oldUpdatedAt = user.updatedAt

      user.setVerificationStatus(VerificationStatus.PENDING)

      expect(user.profile.verificationStatus).toBe(VerificationStatus.PENDING)
      expect(user.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime())
    })
  })

  describe('Role and Permission Methods', () => {
    it('should check if user has specific role', () => {
      expect(user.hasRole(UserRole.USER)).toBe(true)
      expect(user.hasRole(UserRole.ADMIN)).toBe(false)
    })

    it('should check if user has any of multiple roles', () => {
      expect(user.hasAnyRole([UserRole.USER, UserRole.AGENCY])).toBe(true)
      expect(user.hasAnyRole([UserRole.ADMIN, UserRole.MANAGER])).toBe(false)
    })

    it('should identify admin users', () => {
      expect(user.isAdmin()).toBe(false)

      const adminUser = new UserEntity('id', 'admin@test.com', 'hash', UserRole.ADMIN, user.profile)
      expect(adminUser.isAdmin()).toBe(true)
    })

    it('should identify manager users', () => {
      expect(user.isManager()).toBe(false)

      const managerUser = new UserEntity(
        'id',
        'manager@test.com',
        'hash',
        UserRole.MANAGER,
        user.profile
      )
      expect(managerUser.isManager()).toBe(true)

      const adminUser = new UserEntity('id', 'admin@test.com', 'hash', UserRole.ADMIN, user.profile)
      expect(adminUser.isManager()).toBe(true) // Admin should also be considered manager
    })

    it('should identify agency users', () => {
      expect(user.isAgency()).toBe(false)

      const agencyUser = new UserEntity(
        'id',
        'agency@test.com',
        'hash',
        UserRole.AGENCY,
        user.profile
      )
      expect(agencyUser.isAgency()).toBe(true)
    })

    it('should determine user management permissions', () => {
      const regularUser = new UserEntity(
        'id2',
        'user2@test.com',
        'hash',
        UserRole.USER,
        user.profile
      )
      const managerUser = new UserEntity(
        'id3',
        'manager@test.com',
        'hash',
        UserRole.MANAGER,
        user.profile
      )
      const adminUser = new UserEntity(
        'id4',
        'admin@test.com',
        'hash',
        UserRole.ADMIN,
        user.profile
      )

      // User can manage themselves
      expect(user.canManageUser(user)).toBe(true)
      expect(user.canManageUser(regularUser)).toBe(false)

      // Manager can manage regular users but not other managers/admins
      expect(managerUser.canManageUser(user)).toBe(true)
      expect(managerUser.canManageUser(managerUser)).toBe(true) // Self
      expect(managerUser.canManageUser(adminUser)).toBe(false)

      // Admin can manage everyone
      expect(adminUser.canManageUser(user)).toBe(true)
      expect(adminUser.canManageUser(managerUser)).toBe(true)
      expect(adminUser.canManageUser(adminUser)).toBe(true)
    })
  })

  describe('Account Status Methods', () => {
    it('should activate user account', () => {
      user.isActive = false
      const oldUpdatedAt = user.updatedAt

      user.activate()

      expect(user.isActive).toBe(true)
      expect(user.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime())
    })

    it('should deactivate user account', () => {
      const oldUpdatedAt = user.updatedAt

      user.deactivate()

      expect(user.isActive).toBe(false)
      expect(user.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime())
    })
  })

  describe('Validation Methods', () => {
    it('should validate create user data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      }

      expect(() => UserEntity.validateCreateData(validData)).not.toThrow()
    })

    it('should reject invalid create user data', () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        profile: {
          firstName: '', // Empty
          lastName: 'Doe',
        },
      }

      expect(() => UserEntity.validateCreateData(invalidData)).toThrow()
    })

    it('should validate email format in create data', () => {
      const invalidEmails = ['invalid', '@example.com', 'test@', 'test.example.com']
      
      invalidEmails.forEach(email => {
        const data = { ...testUserData.validCreateData, email }
        expect(() => UserEntity.validateCreateData(data)).toThrow()
      })

      const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'test+tag@example.org']
      
      validEmails.forEach(email => {
        const data = { ...testUserData.validCreateData, email }
        expect(() => UserEntity.validateCreateData(data)).not.toThrow()
      })
    })

    it('should validate phone format in create data', () => {
      const invalidPhones = ['abc123', '123abc', '++123456789']
      
      invalidPhones.forEach(phone => {
        const data = { ...testUserData.validCreateData, phone }
        expect(() => UserEntity.validateCreateData(data)).toThrow()
      })

      const validPhones = ['+1234567890', '123-456-7890', '(123) 456-7890', '+66 12 345 6789']
      
      validPhones.forEach(phone => {
        const data = { ...testUserData.validCreateData, phone }
        expect(() => UserEntity.validateCreateData(data)).not.toThrow()
      })
    })

    it('should validate profile fields in create data', () => {
      // Test firstName validation
      expect(() => UserEntity.validateCreateData({
        ...testUserData.validCreateData,
        profile: { ...testUserData.validCreateData.profile, firstName: '' }
      })).toThrow()

      expect(() => UserEntity.validateCreateData({
        ...testUserData.validCreateData,
        profile: { ...testUserData.validCreateData.profile, firstName: 'a'.repeat(51) }
      })).toThrow()

      // Test lastName validation
      expect(() => UserEntity.validateCreateData({
        ...testUserData.validCreateData,
        profile: { ...testUserData.validCreateData.profile, lastName: '' }
      })).toThrow()

      expect(() => UserEntity.validateCreateData({
        ...testUserData.validCreateData,
        profile: { ...testUserData.validCreateData.profile, lastName: 'a'.repeat(51) }
      })).toThrow()
    })

    it('should validate update user data', () => {
      const validUpdateData = {
        email: 'newemail@example.com',
        profile: {
          firstName: 'Jane',
        },
      }

      expect(() => UserEntity.validateUpdateData(validUpdateData)).not.toThrow()
    })

    it('should validate partial update data', () => {
      const partialUpdates = [
        { email: 'new@example.com' },
        { phone: '+9876543210' },
        { profile: { firstName: 'NewName' } },
        { role: UserRole.AGENCY },
        { isActive: false },
      ]

      partialUpdates.forEach(update => {
        expect(() => UserEntity.validateUpdateData(update)).not.toThrow()
      })
    })

    it('should validate password change data', () => {
      const validPasswordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      }

      expect(() => UserEntity.validatePasswordChange(validPasswordData)).not.toThrow()
    })

    it('should reject invalid password change data', () => {
      // Test short new password
      expect(() => UserEntity.validatePasswordChange({
        currentPassword: 'oldpassword',
        newPassword: '123' // Too short
      })).toThrow()

      // Test missing fields
      expect(() => UserEntity.validatePasswordChange({ currentPassword: 'oldpassword' })).toThrow()
      expect(() => UserEntity.validatePasswordChange({ newPassword: 'newpassword123' })).toThrow()
      expect(() => UserEntity.validatePasswordChange({})).toThrow()
    })

    it('should validate user for specific role', () => {
      expect(user.validateForRole(UserRole.USER)).toBe(true)
      expect(user.validateForRole(UserRole.ADMIN)).toBe(false)

      user.deactivate()
      expect(user.validateForRole(UserRole.USER)).toBe(false)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined values gracefully', () => {
      expect(() => UserEntity.fromDatabaseRow(null)).toThrow()
      expect(() => UserEntity.fromDatabaseRow(undefined)).toThrow()
    })

    it('should handle empty profile updates', () => {
      const originalProfile = { ...user.profile }
      
      user.updateProfile({})
      
      expect(user.profile).toEqual(originalProfile)
    })

    it('should handle rating edge cases', () => {
      user.updateRating(0, 0)
      expect(user.profile.rating).toBe(0)
      expect(user.profile.reviewsCount).toBe(0)

      user.updateRating(5, 1000)
      expect(user.profile.rating).toBe(5)
      expect(user.profile.reviewsCount).toBe(1000)
    })

    it('should handle verification status transitions', () => {
      const statuses = [
        VerificationStatus.UNVERIFIED,
        VerificationStatus.PENDING,
        VerificationStatus.VERIFIED,
        VerificationStatus.REJECTED,
      ]

      statuses.forEach(status => {
        user.setVerificationStatus(status)
        expect(user.profile.verificationStatus).toBe(status)
      })
    })

    it('should maintain data integrity during updates', () => {
      const originalId = user.id
      const originalEmail = user.email
      const originalCreatedAt = user.createdAt

      user.updateProfile({ firstName: 'NewName' })
      user.updateRating(4.0, 20)
      user.setVerificationStatus(VerificationStatus.PENDING)

      // These should not change
      expect(user.id).toBe(originalId)
      expect(user.email).toBe(originalEmail)
      expect(user.createdAt).toBe(originalCreatedAt)

      // updatedAt should change
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalCreatedAt.getTime())
    })
  })

  describe('Business Logic Methods', () => {
    it('should determine if user can create listings', () => {
      expect(user.canCreateListing()).toBe(true)

      const agencyUser = new UserEntity(
        'id',
        'agency@test.com',
        'hash',
        UserRole.AGENCY,
        user.profile
      )
      expect(agencyUser.canCreateListing()).toBe(true)

      const managerUser = new UserEntity(
        'id',
        'manager@test.com',
        'hash',
        UserRole.MANAGER,
        user.profile
      )
      expect(managerUser.canCreateListing()).toBe(false)

      user.deactivate()
      expect(user.canCreateListing()).toBe(false)
    })

    it('should determine if user can moderate content', () => {
      expect(user.canModerateContent()).toBe(false)

      const managerUser = new UserEntity(
        'id',
        'manager@test.com',
        'hash',
        UserRole.MANAGER,
        user.profile
      )
      expect(managerUser.canModerateContent()).toBe(true)

      const adminUser = new UserEntity('id', 'admin@test.com', 'hash', UserRole.ADMIN, user.profile)
      expect(adminUser.canModerateContent()).toBe(true)
    })

    it('should determine if user can access admin panel', () => {
      expect(user.canAccessAdminPanel()).toBe(false)

      const managerUser = new UserEntity(
        'id',
        'manager@test.com',
        'hash',
        UserRole.MANAGER,
        user.profile
      )
      expect(managerUser.canAccessAdminPanel()).toBe(true)

      const adminUser = new UserEntity('id', 'admin@test.com', 'hash', UserRole.ADMIN, user.profile)
      expect(adminUser.canAccessAdminPanel()).toBe(true)
    })

    it('should determine if user can manage agencies', () => {
      expect(user.canManageAgencies()).toBe(false)

      const managerUser = new UserEntity(
        'id',
        'manager@test.com',
        'hash',
        UserRole.MANAGER,
        user.profile
      )
      expect(managerUser.canManageAgencies()).toBe(false)

      const adminUser = new UserEntity('id', 'admin@test.com', 'hash', UserRole.ADMIN, user.profile)
      expect(adminUser.canManageAgencies()).toBe(true)
    })
  })
})
