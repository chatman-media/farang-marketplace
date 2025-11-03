import {
  AuthProvider,
  Location,
  SocialProfile,
  User,
  UserProfile,
  UserRole,
  VerificationStatus,
} from "@marketplace/shared-types"
import { z } from "zod"
import { UserEntity } from "../models/User"
import { UserRepository } from "../repositories/UserRepository"

const UpdateUserSchema = z.object({
  email: z.email().optional(),
  phone: z.string().optional(),
  telegramId: z.string().optional(),
  role: z.enum(UserRole).optional(),
  profile: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      avatar: z.string().url().optional(),
      location: z
        .object({
          latitude: z.number(),
          longitude: z.number(),
          address: z.string(),
          city: z.string(),
          country: z.string(),
          region: z.string(),
        })
        .optional(),
      rating: z.number().min(0).max(5).optional(),
      reviewsCount: z.number().min(0).optional(),
      verificationStatus: z.enum(VerificationStatus).optional(),
      socialProfiles: z
        .array(
          z.object({
            provider: z.string(),
            providerId: z.string(),
            username: z.string().optional(),
            profileUrl: z.string().url().optional(),
          }),
        )
        .optional(),
      primaryAuthProvider: z.nativeEnum(AuthProvider).optional(),
      preferences: z
        .object({
          language: z.enum(["en", "ru", "th", "cn", "ar"]).optional(),
          currency: z
            .string()
            .regex(/^[A-Z]{3}$/, "Invalid currency format")
            .optional(),
          timezone: z.string().optional(),
          notifications: z
            .object({
              email: z.boolean().optional(),
              push: z.boolean().optional(),
              sms: z.boolean().optional(),
              telegram: z.boolean().optional(),
              whatsapp: z.boolean().optional(),
              line: z.boolean().optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
})

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
    socialProfiles?: SocialProfile[]
    primaryAuthProvider?: AuthProvider
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
  constructor(private userRepository: UserRepository) {}

  async createUser(userData: CreateUserData): Promise<User> {
    // Validate input data
    const validatedData = UserEntity.validateCreateData({
      ...userData,
      profile: {
        ...userData.profile,
        rating: 0,
        reviewsCount: 0,
        verificationStatus: VerificationStatus.UNVERIFIED,
        socialProfiles: [],
        primaryAuthProvider: AuthProvider.EMAIL,
      },
    })

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(validatedData.email)
    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    // Check if telegram ID already exists (if provided)
    if (validatedData.telegramId) {
      const existingTelegramUser = await this.userRepository.findByTelegramId(validatedData.telegramId)
      if (existingTelegramUser) {
        throw new Error("User with this Telegram ID already exists")
      }
    }

    // Hash password
    const passwordHash = await UserEntity.hashPassword(validatedData.password)

    // Create default preferences
    const defaultPreferences = {
      language: "en",
      currency: "USD",
      notifications: {
        email: true,
        push: true,
        sms: false,
        telegram: false,
        whatsapp: false,
        line: false,
      },
    }

    // Merge user preferences with defaults
    const preferences = validatedData.profile.preferences
      ? {
          ...defaultPreferences,
          ...validatedData.profile.preferences,
          notifications: {
            ...defaultPreferences.notifications,
            ...(validatedData.profile.preferences.notifications || {}),
          },
        }
      : defaultPreferences

    // Create user
    const userEntity = await this.userRepository.create({
      email: validatedData.email,
      passwordHash,
      phone: validatedData.phone,
      telegramId: validatedData.telegramId,
      role: validatedData.role || UserRole.USER,
      profile: {
        firstName: validatedData.profile.firstName,
        lastName: validatedData.profile.lastName,
        rating: 0,
        reviewsCount: 0,
        verificationStatus: VerificationStatus.UNVERIFIED,
        socialProfiles: [],
        primaryAuthProvider: "email" as any,
        preferences,
        ...(validatedData.profile.avatar && {
          avatar: validatedData.profile.avatar,
        }),
        ...(validatedData.profile.location && {
          location: {
            ...validatedData.profile.location,
            region: "Unknown",
          },
        }),
      },
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

  async updateUser(userId: string, updateData: any): Promise<User | null> {
    try {
      // Validate update data
      const validatedData = UpdateUserSchema.parse(updateData)

      // Check for email conflicts if email is being updated
      if (validatedData.email) {
        const existingEmailUser = await this.userRepository.existsByEmail(validatedData.email)
        if (existingEmailUser) {
          // Check if it's not the same user
          const existingUser = await this.userRepository.findByEmail(validatedData.email)
          if (existingUser && existingUser.id !== userId) {
            throw new Error("Email already in use by another user")
          }
        }
      }

      // Check for telegram ID conflicts if telegram ID is being updated
      if (validatedData.telegramId) {
        const existingTelegramUser = await this.userRepository.existsByTelegramId(validatedData.telegramId)
        if (existingTelegramUser) {
          // Check if it's not the same user
          const existingUser = await this.userRepository.findByTelegramId(validatedData.telegramId)
          if (existingUser && existingUser.id !== userId) {
            throw new Error("Telegram ID already in use by another user")
          }
        }
      }

      // Handle profile updates by merging with existing profile
      const updatePayload: any = { ...validatedData }
      if (validatedData.profile) {
        const currentUser = await this.userRepository.findById(userId)
        if (currentUser) {
          // Deep merge preferences if they exist
          const mergedProfile = {
            ...currentUser.profile,
            ...validatedData.profile,
          } as UserProfile

          // Handle preferences merging specifically
          if ((validatedData.profile as any).preferences) {
            mergedProfile.preferences = {
              ...currentUser.profile.preferences,
              ...(validatedData.profile as any).preferences,
              notifications: {
                ...currentUser.profile.preferences?.notifications,
                ...(validatedData.profile as any).preferences.notifications,
              },
            }
          }

          updatePayload.profile = mergedProfile
        }
      }

      const updatedUser = await this.userRepository.update(userId, updatePayload)
      return updatedUser ? updatedUser.toPublicUser() : null
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.message}`)
      }
      throw error
    }
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    // Validate password change data
    UserEntity.validatePasswordChange({ currentPassword, newPassword })

    // Get user entity
    const userEntity = await this.userRepository.findById(id)
    if (!userEntity) {
      throw new Error("User not found")
    }

    // Verify current password
    const isCurrentPasswordValid = await userEntity.validatePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect")
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
    const userEntity = await this.userRepository.update(id, {
      isActive: false,
    })
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
    const updatedEntity = await this.userRepository.update(id, {
      profile: userEntity.profile,
    })
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
