import { and, count, createDatabaseConnection, eq, gte, ilike, ne, users } from "@marketplace/database-schema"
import { UserProfile, UserRole } from "@marketplace/shared-types"
import { UserEntity } from "../models/User"

// Database connection
const connectionString =
  process.env.DATABASE_URL || "postgresql://marketplace_user:marketplace_pass@localhost:5432/marketplace"
const db = createDatabaseConnection(connectionString)

export interface UserFilters {
  role?: UserRole
  isActive?: boolean
  verificationStatus?: string
  search?: string
}

export interface PaginationOptions {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class UserRepository {
  async create(userData: {
    email: string
    passwordHash: string
    phone?: string
    telegramId?: string
    role: UserRole
    profile: UserProfile
  }): Promise<UserEntity> {
    const [result] = await db
      .insert(users)
      .values({
        email: userData.email,
        passwordHash: userData.passwordHash,
        phone: userData.phone,
        telegramId: userData.telegramId,
        role: userData.role as any,
        firstName: userData.profile.firstName,
        lastName: userData.profile.lastName,
        profile: userData.profile,
      })
      .returning()

    return UserEntity.fromDatabaseRow(result)
  }

  async findById(id: string): Promise<UserEntity | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1)

    if (result.length === 0) {
      return null
    }

    return UserEntity.fromDatabaseRow(result[0])
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1)

    if (result.length === 0) {
      return null
    }

    return UserEntity.fromDatabaseRow(result[0])
  }

  async findByTelegramId(telegramId: string): Promise<UserEntity | null> {
    const result = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1)

    if (result.length === 0) {
      return null
    }

    return UserEntity.fromDatabaseRow(result[0])
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1)

    if (result.length === 0) {
      return null
    }

    return UserEntity.fromDatabaseRow(result[0])
  }

  async update(
    id: string,
    updates: {
      email?: string
      phone?: string
      telegramId?: string
      role?: UserRole
      profile?: UserProfile
      isActive?: boolean
    },
  ): Promise<UserEntity | null> {
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (updates.email !== undefined) updateData.email = updates.email
    if (updates.phone !== undefined) updateData.phone = updates.phone
    if (updates.telegramId !== undefined) updateData.telegramId = updates.telegramId
    if (updates.role !== undefined) updateData.role = updates.role
    if (updates.profile !== undefined) {
      updateData.profile = updates.profile
      updateData.firstName = updates.profile.firstName
      updateData.lastName = updates.profile.lastName
    }
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive

    const [result] = await db.update(users).set(updateData).where(eq(users.id, id)).returning()

    if (!result) {
      return null
    }

    return UserEntity.fromDatabaseRow(result)
  }

  async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, id))

    return true
  }

  async updateProfile(id: string, profile: UserProfile): Promise<UserEntity | null> {
    const [result] = await db
      .update(users)
      .set({
        profile,
        firstName: profile.firstName,
        lastName: profile.lastName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning()

    if (!result) {
      return null
    }

    return UserEntity.fromDatabaseRow(result)
  }

  async updateRole(id: string, role: UserRole): Promise<UserEntity | null> {
    const [result] = await db
      .update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()

    if (!result) {
      return null
    }

    return UserEntity.fromDatabaseRow(result)
  }

  async activate(id: string): Promise<boolean> {
    await db.update(users).set({ isActive: true }).where(eq(users.id, id))
    return true
  }

  async deactivate(id: string): Promise<boolean> {
    await db.update(users).set({ isActive: false }).where(eq(users.id, id))
    return true
  }

  async delete(id: string): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id))
    return true
  }

  async findMany(
    filters: UserFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10 },
  ): Promise<PaginatedResult<UserEntity>> {
    const conditions: any[] = []

    if (filters.role) {
      conditions.push(eq(users.role, filters.role as any))
    }

    if (filters.isActive !== undefined) {
      conditions.push(eq(users.isActive, filters.isActive))
    }

    if (filters.search) {
      conditions.push(ilike(users.email, `%${filters.search}%`))
    }

    const whereCondition =
      conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined

    // Build base queries
    const baseQuery = db.select().from(users)
    const baseCountQuery = db.select({ count: count() }).from(users)

    // Apply where conditions
    const queryWithWhere = whereCondition ? baseQuery.where(whereCondition) : baseQuery
    const countQueryWithWhere = whereCondition ? baseCountQuery.where(whereCondition) : baseCountQuery

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit
    const finalQuery = queryWithWhere.limit(pagination.limit).offset(offset)

    const [data, totalResult] = await Promise.all([finalQuery, countQueryWithWhere])

    const total = totalResult[0]?.count || 0
    const totalPages = Math.ceil(total / pagination.limit)

    return {
      data: data.map((row) => UserEntity.fromDatabaseRow(row)),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
    }
  }

  async findByRole(role: UserRole): Promise<UserEntity[]> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.role, role as any))
    return result.map((row) => UserEntity.fromDatabaseRow(row))
  }

  async findActiveUsers(limit?: number): Promise<UserEntity[]> {
    const baseQuery = db.select().from(users).where(eq(users.isActive, true))
    const finalQuery = limit ? baseQuery.limit(limit) : baseQuery

    const result = await finalQuery
    return result.map((row) => UserEntity.fromDatabaseRow(row))
  }

  async findRecentUsers(days: number = 7): Promise<UserEntity[]> {
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)

    const result = await db.select().from(users).where(gte(users.createdAt, dateThreshold))

    return result.map((row) => UserEntity.fromDatabaseRow(row))
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const conditions = [eq(users.email, email)]

    if (excludeId) {
      conditions.push(ne(users.id, excludeId))
    }

    const result = await db
      .select({ count: count() })
      .from(users)
      .where(and(...conditions))

    return (result[0]?.count || 0) > 0
  }

  async existsByTelegramId(telegramId: string, excludeId?: string): Promise<boolean> {
    const conditions = [eq(users.telegramId, telegramId)]

    if (excludeId) {
      conditions.push(ne(users.id, excludeId))
    }

    const result = await db
      .select({ count: count() })
      .from(users)
      .where(and(...conditions))

    return (result[0]?.count || 0) > 0
  }

  async existsByPhone(phone: string, excludeId?: string): Promise<boolean> {
    const conditions = [eq(users.phone, phone)]

    if (excludeId) {
      conditions.push(ne(users.id, excludeId))
    }

    const result = await db
      .select({ count: count() })
      .from(users)
      .where(and(...conditions))

    return (result[0]?.count || 0) > 0
  }

  async getUserStats(): Promise<{
    total: number
    active: number
    byRole: Record<UserRole, number>
    verified: number
    recentSignups: number
  }> {
    const [totalResult, activeResult, verifiedResult, recentResult] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(users).where(eq(users.isActive, true)),
      db.select({ count: count() }).from(users).where(eq(users.isVerified, true)),
      db
        .select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))),
    ])

    // Simple role counting
    const byRole = {
      [UserRole.USER]: 0,
      [UserRole.AGENCY_OWNER]: 0,
      [UserRole.AGENCY_MANAGER]: 0,
      [UserRole.ADMIN]: 0,
    } as Record<UserRole, number>

    return {
      total: totalResult[0]?.count || 0,
      active: activeResult[0]?.count || 0,
      verified: verifiedResult[0]?.count || 0,
      recentSignups: recentResult[0]?.count || 0,
      byRole,
    }
  }

  async searchUsers(searchTerm: string, limit: number = 10): Promise<UserEntity[]> {
    const result = await db
      .select()
      .from(users)
      .where(ilike(users.email, `%${searchTerm}%`))
      .limit(limit)

    return result.map((row) => UserEntity.fromDatabaseRow(row))
  }

  async bulkUpdateRole(userIds: string[], role: UserRole): Promise<number> {
    // Simple implementation - update one by one
    let count = 0
    for (const id of userIds) {
      await db
        .update(users)
        .set({ role: role as any, updatedAt: new Date() })
        .where(eq(users.id, id))
      count++
    }
    return count
  }

  async bulkDeactivate(userIds: string[]): Promise<number> {
    // Simple implementation - update one by one
    let count = 0
    for (const id of userIds) {
      await db.update(users).set({ isActive: false, updatedAt: new Date() }).where(eq(users.id, id))
      count++
    }
    return count
  }

  async getTopRatedUsers(limit: number = 10): Promise<UserEntity[]> {
    const result = await db.select().from(users).where(eq(users.isActive, true)).limit(limit)

    return result.map((row) => UserEntity.fromDatabaseRow(row))
  }
}
