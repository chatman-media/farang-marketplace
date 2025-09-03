import { UserRepository } from '../repositories/UserRepository'
import { UserEntity } from '../models/User'
import { UserRole, UserProfile, User, VerificationStatus, Location } from '@marketplace/shared-types'

export interface CreateUserData {
  email: string
  password: string
  phone?: string
  telegramId?: string
  role?: UserRole
  profile: {
    firstName: string
    lastName: string
    location?: Location
  }
}

export interface UpdateUserData {
  email?: string
  phone?: string
  telegramId?: string
  role?: UserRole
  profile?: Partial<UserProfile>
  isActive?: boolean
}

export class UserService {
  constructor(private userRepository: UserRepository) { }

  async createUser(userData: CreateUserData): Promise<User> {
    // Validate input data
    const validatedData = UserEntity.validateCreateData({
      ...userData,
      profile: {
        ...userData.profile,
        rating: 0,
        reviewsCount: 0,
        verificationStatus: VerificationStatus.UNVERIFIED,
      },
    })

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(validatedData.email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Check if telegram ID already exists (if provided)
    if (validatedData.telegramId) {
      const existingTelegramUser = await this.userRepository.findByTelegramId(
        validatedData.telegramId
      )
      if (existingTelegramUser) {
        throw new Error('User with this Telegram ID already exists')
      }
    }

    // Hash password
    const passwordHash = await UserEntity.hashPassword(validatedData.password)

    // Create user
    const userEntity = await this.userRepository.create({
      email: validatedData.email,
      passwordHash,
      phone: validatedData.phone,
      telegramId: validatedData.telegramId,
      role: validatedData.role || UserRole.USER,
      profile: validatedData.profile,
    })

    return userEntity.toPublicUser()
  }

  async getUserById(id: string): Promise<User | null> {
    const userEntity = await this.userRepository.findById(id)
    return userEntity ? userEntity.toPublicUser() : null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findByEmail(email)
    return userEntity ? userEntity.toPublicUser() : null
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    const userEntity = await this.userRepository.findByTelegramId(telegramId)
    return userEntity ? userEntity.toPublicUser() : null
  }

  async updateUser(id: string, updates: UpdateUserData): Promise<User | null> {
    // Check if email is being changed and doesn't conflict
    if (updates.email) {
      const emailExists = await this.userRepository.existsByEmail(updates.email, id)
      if (emailExists) {
        throw new Error('Email already in use by another user')
      }
    }

    // Check if telegram ID is being changed and doesn't conflict
    if (updates.telegramId) {
      const telegramExists = await this.userRepository.existsByTelegramId(
        updates.telegramId,
        id
      )
      if (telegramExists) {
        throw new Error('Telegram ID already in use by another user')
      }
    }

    // If profile is being updated partially, merge with existing profile
    let finalUpdates = updates
    if (updates.profile) {
      const currentUser = await this.userRepository.findById(id)
      if (currentUser) {
        finalUpdates = {
          ...updates,
          profile: {
            ...currentUser.profile,
            ...updates.profile,
          }
        }
      }
    }

    // Skip validation for profile-only updates since we're merging with existing data
    // The validation will happen at the entity level when creating the full profile
    const validatedUpdates = finalUpdates

    const userEntity = await this.userRepository.update(id, validatedUpdates)
    return userEntity ? userEntity.toPublicUser() : null
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    // Validate password change data
    UserEntity.validatePasswordChange({ currentPassword, newPassword })

    // Get user entity
    const userEntity = await this.userRepository.findById(id)
    if (!userEntity) {
      throw new Error('User not found')
    }

    // Verify current password
    const isCurrentPasswordValid = await userEntity.validatePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect')
    }

    // Hash new password and update
    const newPasswordHash = await UserEntity.hashPassword(newPassword)
    return this.userRepository.updatePassword(id, newPasswordHash)
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userRepository.delete(id)
  }

  async activateUser(id: string): Promise<User | null> {
    const userEntity = await this.userRepository.update(id, { isActive: true })
    return userEntity ? userEntity.toPublicUser() : null
  }

  async deactivateUser(id: string): Promise<User | null> {
    const userEntity = await this.userRepository.update(id, { isActive: false })
    return userEntity ? userEntity.toPublicUser() : null
  }

  async updateUserRole(id: string, role: UserRole): Promise<User | null> {
    const userEntity = await this.userRepository.update(id, { role })
    return userEntity ? userEntity.toPublicUser() : null
  }

  async verifyUser(id: string): Promise<User | null> {
    const userEntity = await this.userRepository.findById(id)
    if (!userEntity) {
      return null
    }

    userEntity.setVerificationStatus(VerificationStatus.VERIFIED)
    const updatedEntity = await this.userRepository.update(id, { profile: userEntity.profile })
    return updatedEntity ? updatedEntity.toPublicUser() : null
  }

  async getUserStats() {
    return this.userRepository.getUserStats()
  }

  // Authentication helper method (for use by auth service)
  async validateUserCredentials(email: string, password: string): Promise<UserEntity | null> {
    const userEntity = await this.userRepository.findByEmail(email)
    if (!userEntity || !userEntity.isActive) {
      return null
    }

    const isPasswordValid = await userEntity.validatePassword(password)
    return isPasswordValid ? userEntity : null
  }
}
