import * as bcrypt from "bcryptjs"
import { z } from "zod"
import { User, UserRole, UserProfile, VerificationStatus, SocialProfile, AuthProvider } from "@marketplace/shared-types"

// Validation schemas
export const UserProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  avatar: z.string().url().optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      address: z.string(),
      city: z.string(),
      country: z.string(),
    })
    .optional(),
  rating: z.number().min(0).max(5).default(0),
  reviewsCount: z.number().min(0).default(0),
  verificationStatus: z.nativeEnum(VerificationStatus).default(VerificationStatus.UNVERIFIED),
})

export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]+$/, "Invalid phone format")
    .optional(),
  telegramId: z.string().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  profile: UserProfileSchema,
})

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true }).extend({
  profile: UserProfileSchema.partial().optional(),
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
})

export class UserEntity {
  constructor(
    public id: string,
    public email: string,
    public passwordHash: string,
    public role: UserRole,
    public profile: UserProfile,
    public socialProfiles: SocialProfile[] = [],
    public primaryAuthProvider: AuthProvider = AuthProvider.EMAIL,
    public phone?: string,
    public telegramId?: string,
    public isActive: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}

  // Static factory method to create user from database row
  static fromDatabaseRow(row: any): UserEntity {
    return new UserEntity(
      row.id,
      row.email,
      row.password_hash,
      row.role,
      row.profile,
      row.social_profiles || [],
      row.primary_auth_provider || AuthProvider.EMAIL,
      row.phone,
      row.telegram_id,
      row.is_active,
      row.created_at,
      row.updated_at,
    )
  }

  // Convert to public User interface (without password hash)
  toPublicUser(): User {
    return {
      id: this.id,
      email: this.email,
      phone: this.phone,
      telegramId: this.telegramId,
      role: this.role,
      profile: this.profile,
      socialProfiles: this.socialProfiles,
      primaryAuthProvider: this.primaryAuthProvider,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  // Password methods
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash)
  }

  async updatePassword(newPassword: string): Promise<void> {
    this.passwordHash = await UserEntity.hashPassword(newPassword)
    this.updatedAt = new Date()
  }

  // Profile methods
  updateProfile(profileData: Partial<UserProfile>): void {
    this.profile = { ...this.profile, ...profileData }
    this.updatedAt = new Date()
  }

  updateRating(newRating: number, reviewsCount: number): void {
    this.profile.rating = newRating
    this.profile.reviewsCount = reviewsCount
    this.updatedAt = new Date()
  }

  setVerificationStatus(status: VerificationStatus): void {
    this.profile.verificationStatus = status
    this.updatedAt = new Date()
  }

  // Role and permission methods
  hasRole(role: UserRole): boolean {
    return this.role === role
  }

  hasAnyRole(roles: UserRole[]): boolean {
    return roles.includes(this.role)
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN
  }

  isManager(): boolean {
    return this.role === UserRole.MANAGER || this.isAdmin()
  }

  isAgency(): boolean {
    return this.role === UserRole.AGENCY
  }

  canManageUser(targetUser: UserEntity): boolean {
    if (this.isAdmin()) return true
    if (this.isManager() && !targetUser.isAdmin() && !targetUser.isManager()) return true
    return this.id === targetUser.id
  }

  // Account status methods
  activate(): void {
    this.isActive = true
    this.updatedAt = new Date()
  }

  deactivate(): void {
    this.isActive = false
    this.updatedAt = new Date()
  }

  // Validation methods
  static validateCreateData(data: any) {
    return CreateUserSchema.parse(data)
  }

  static validateUpdateData(data: any) {
    return UpdateUserSchema.parse(data)
  }

  static validatePasswordChange(data: any) {
    return ChangePasswordSchema.parse(data)
  }

  validateForRole(requiredRole: UserRole): boolean {
    return this.isActive && this.hasRole(requiredRole)
  }

  // Business logic methods
  canCreateListing(): boolean {
    return this.isActive && (this.role === UserRole.USER || this.role === UserRole.AGENCY)
  }

  canModerateContent(): boolean {
    return this.isActive && (this.role === UserRole.MANAGER || this.role === UserRole.ADMIN)
  }

  canAccessAdminPanel(): boolean {
    return this.isActive && (this.role === UserRole.ADMIN || this.role === UserRole.MANAGER)
  }

  canManageAgencies(): boolean {
    return this.isActive && this.role === UserRole.ADMIN
  }
}
