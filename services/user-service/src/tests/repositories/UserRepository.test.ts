import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { UserRepository } from '../../repositories/UserRepository'
import { UserEntity } from '../../models/User'
import { UserRole, VerificationStatus } from '@marketplace/shared-types'
import * as connection from '../../database/connection'

// Mock the database connection
vi.mock('../../database/connection', () => ({
  query: vi.fn(),
}))

const mockQuery = vi.mocked(connection.query)

describe('UserRepository', () => {
  let userRepository: UserRepository
  let mockUser: any
  let mockUserEntity: UserEntity

  beforeEach(() => {
    userRepository = new UserRepository()

    mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      password_hash: 'hashedpassword',
      phone: '+1234567890',
      telegram_id: 'telegram123',
      role: UserRole.USER,
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        rating: 4.5,
        reviewsCount: 10,
        verificationStatus: VerificationStatus.VERIFIED,
      },
      is_active: true,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01'),
    }

    mockUserEntity = UserEntity.fromDatabaseRow(mockUser)

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        phone: '+1234567890',
        telegramId: 'telegram123',
        role: UserRole.USER,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          rating: 0,
          reviewsCount: 0,
          verificationStatus: VerificationStatus.UNVERIFIED,
        },
      }

      mockQuery.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
      } as any)

      const result = await userRepository.create(userData)

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users'), [
        userData.email,
        userData.passwordHash,
        userData.phone,
        userData.telegramId,
        userData.role,
        JSON.stringify(userData.profile),
      ])
      expect(result).toBeInstanceOf(UserEntity)
      expect(result.email).toBe(userData.email)
    })

    it('should create user without optional fields', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: UserRole.USER,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          rating: 0,
          reviewsCount: 0,
          verificationStatus: VerificationStatus.UNVERIFIED,
        },
      }

      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockUser, phone: null, telegram_id: null }],
        rowCount: 1,
      } as any)

      const result = await userRepository.create(userData)

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users'), [
        userData.email,
        userData.passwordHash,
        undefined,
        undefined,
        userData.role,
        JSON.stringify(userData.profile),
      ])
      expect(result).toBeInstanceOf(UserEntity)
    })
  })

  describe('findById', () => {
    it('should find user by id successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
      } as any)

      const result = await userRepository.findById(mockUser.id)

      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [mockUser.id])
      expect(result).toBeInstanceOf(UserEntity)
      expect(result?.id).toBe(mockUser.id)
    })

    it('should return null when user not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await userRepository.findById('nonexistent-id')

      expect(result).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('should find user by email successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
      } as any)

      const result = await userRepository.findByEmail(mockUser.email)

      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', [
        mockUser.email,
      ])
      expect(result).toBeInstanceOf(UserEntity)
      expect(result?.email).toBe(mockUser.email)
    })

    it('should return null when user not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await userRepository.findByEmail('nonexistent@example.com')

      expect(result).toBeNull()
    })
  })

  describe('findByTelegramId', () => {
    it('should find user by telegram id successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
      } as any)

      const result = await userRepository.findByTelegramId(mockUser.telegram_id)

      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE telegram_id = $1', [
        mockUser.telegram_id,
      ])
      expect(result).toBeInstanceOf(UserEntity)
      expect(result?.telegramId).toBe(mockUser.telegram_id)
    })
  })

  describe('findByPhone', () => {
    it('should find user by phone successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
      } as any)

      const result = await userRepository.findByPhone(mockUser.phone)

      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE phone = $1', [
        mockUser.phone,
      ])
      expect(result).toBeInstanceOf(UserEntity)
      expect(result?.phone).toBe(mockUser.phone)
    })
  })

  describe('update', () => {
    it('should update user successfully', async () => {
      const updates = {
        email: 'newemail@example.com',
        role: UserRole.AGENCY,
      }

      const updatedUser = { ...mockUser, ...updates }
      mockQuery.mockResolvedValueOnce({
        rows: [updatedUser],
        rowCount: 1,
      } as any)

      const result = await userRepository.update(mockUser.id, updates)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining([updates.email, updates.role, mockUser.id])
      )
      expect(result).toBeInstanceOf(UserEntity)
      expect(result?.email).toBe(updates.email)
    })

    it('should return existing user when no updates provided', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
      } as any)

      const result = await userRepository.update(mockUser.id, {})

      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [mockUser.id])
      expect(result).toBeInstanceOf(UserEntity)
    })

    it('should return null when user not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await userRepository.update('nonexistent-id', { email: 'test@example.com' })

      expect(result).toBeNull()
    })
  })

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
      } as any)

      const result = await userRepository.updatePassword(mockUser.id, 'newhash')

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        ['newhash', mockUser.id]
      )
      expect(result).toBe(true)
    })

    it('should return false when user not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rowCount: 0,
      } as any)

      const result = await userRepository.updatePassword('nonexistent-id', 'newhash')

      expect(result).toBe(false)
    })
  })

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const newProfile = {
        firstName: 'Jane',
        lastName: 'Smith',
        rating: 5,
        reviewsCount: 20,
        verificationStatus: VerificationStatus.VERIFIED,
      }

      const updatedUser = { ...mockUser, profile: newProfile }
      mockQuery.mockResolvedValueOnce({
        rows: [updatedUser],
        rowCount: 1,
      } as any)

      const result = await userRepository.updateProfile(mockUser.id, newProfile)

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE users SET profile = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [JSON.stringify(newProfile), mockUser.id]
      )
      expect(result).toBeInstanceOf(UserEntity)
    })
  })

  describe('activate and deactivate', () => {
    it('should activate user successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
      } as any)

      const result = await userRepository.activate(mockUser.id)

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE users SET is_active = true, updated_at = NOW() WHERE id = $1',
        [mockUser.id]
      )
      expect(result).toBe(true)
    })

    it('should deactivate user successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
      } as any)

      const result = await userRepository.deactivate(mockUser.id)

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
        [mockUser.id]
      )
      expect(result).toBe(true)
    })
  })

  describe('delete', () => {
    it('should delete user successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
      } as any)

      const result = await userRepository.delete(mockUser.id)

      expect(mockQuery).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1', [mockUser.id])
      expect(result).toBe(true)
    })

    it('should return false when user not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rowCount: 0,
      } as any)

      const result = await userRepository.delete('nonexistent-id')

      expect(result).toBe(false)
    })
  })

  describe('findMany', () => {
    it('should find users with filters and pagination', async () => {
      const filters = {
        role: UserRole.USER,
        isActive: true,
        search: 'john',
      }
      const pagination = { page: 1, limit: 10 }

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ total: '25' }],
        } as any)
        .mockResolvedValueOnce({
          rows: [mockUser, mockUser],
        } as any)

      const result = await userRepository.findMany(filters, pagination)

      expect(result).toEqual({
        data: expect.arrayContaining([expect.any(UserEntity)]),
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      })
    })

    it('should find users without filters', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ total: '5' }],
        } as any)
        .mockResolvedValueOnce({
          rows: [mockUser],
        } as any)

      const result = await userRepository.findMany()

      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(5)
    })
  })

  describe('findByRole', () => {
    it('should find users by role', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockUser, mockUser],
      } as any)

      const result = await userRepository.findByRole(UserRole.USER)

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE role = $1 AND is_active = true ORDER BY created_at DESC',
        [UserRole.USER]
      )
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(UserEntity)
    })
  })

  describe('existsByEmail', () => {
    it('should return true when email exists', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: '1' }],
      } as any)

      const result = await userRepository.existsByEmail('test@example.com')

      expect(result).toBe(true)
    })

    it('should return false when email does not exist', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as any)

      const result = await userRepository.existsByEmail('nonexistent@example.com')

      expect(result).toBe(false)
    })

    it('should exclude specific user id when checking', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as any)

      await userRepository.existsByEmail('test@example.com', 'exclude-id')

      expect(mockQuery).toHaveBeenCalledWith('SELECT 1 FROM users WHERE email = $1 AND id != $2', [
        'test@example.com',
        'exclude-id',
      ])
    })
  })

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total: '100',
            active: '90',
            user_count: '80',
            agency_count: '8',
            manager_count: '1',
            admin_count: '1',
            verified: '50',
            recent_signups: '10',
          },
        ],
      } as any)

      const result = await userRepository.getUserStats()

      expect(result).toEqual({
        total: 100,
        active: 90,
        byRole: {
          [UserRole.USER]: 80,
          [UserRole.AGENCY]: 8,
          [UserRole.MANAGER]: 1,
          [UserRole.ADMIN]: 1,
        },
        verified: 50,
        recentSignups: 10,
      })
    })
  })

  describe('searchUsers', () => {
    it('should search users by term', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockUser],
      } as any)

      const result = await userRepository.searchUsers('john', 5)

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('ILIKE'), ['%john%', 5])
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(UserEntity)
    })
  })

  describe('bulkUpdateRole', () => {
    it('should update multiple users role', async () => {
      const userIds = ['id1', 'id2', 'id3']
      mockQuery.mockResolvedValueOnce({
        rowCount: 3,
      } as any)

      const result = await userRepository.bulkUpdateRole(userIds, UserRole.AGENCY)

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('UPDATE users SET role'), [
        ...userIds,
        UserRole.AGENCY,
      ])
      expect(result).toBe(3)
    })

    it('should return 0 for empty user ids array', async () => {
      const result = await userRepository.bulkUpdateRole([], UserRole.AGENCY)

      expect(result).toBe(0)
      expect(mockQuery).not.toHaveBeenCalled()
    })
  })

  describe('bulkDeactivate', () => {
    it('should deactivate multiple users', async () => {
      const userIds = ['id1', 'id2']
      mockQuery.mockResolvedValueOnce({
        rowCount: 2,
      } as any)

      const result = await userRepository.bulkDeactivate(userIds)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET is_active = false'),
        userIds
      )
      expect(result).toBe(2)
    })
  })

  describe('getTopRatedUsers', () => {
    it('should return top rated users', async () => {
      const topRatedUser = {
        ...mockUser,
        profile: {
          ...mockUser.profile,
          rating: 5,
          reviewsCount: 100,
        },
      }

      mockQuery.mockResolvedValueOnce({
        rows: [topRatedUser],
      } as any)

      const result = await userRepository.getTopRatedUsers(5)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY (profile->>'rating')::numeric DESC"),
        [5]
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(UserEntity)
    })
  })
})
