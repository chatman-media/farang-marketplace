import { query } from "../database/connection"
import { UserEntity } from "../models/User"
import { UserRole, UserProfile } from "@marketplace/shared-types"

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
    const result = await query(
      `INSERT INTO users (email, password_hash, phone, telegram_id, role, profile)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userData.email,
        userData.passwordHash,
        userData.phone,
        userData.telegramId,
        userData.role,
        JSON.stringify(userData.profile),
      ],
    )

    return UserEntity.fromDatabaseRow(result.rows[0])
  }

  async findById(id: string): Promise<UserEntity | null> {
    const result = await query("SELECT * FROM users WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return null
    }

    return UserEntity.fromDatabaseRow(result.rows[0])
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await query("SELECT * FROM users WHERE email = $1", [email])

    if (result.rows.length === 0) {
      return null
    }

    return UserEntity.fromDatabaseRow(result.rows[0])
  }

  async findByTelegramId(telegramId: string): Promise<UserEntity | null> {
    const result = await query("SELECT * FROM users WHERE telegram_id = $1", [telegramId])

    if (result.rows.length === 0) {
      return null
    }

    return UserEntity.fromDatabaseRow(result.rows[0])
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    const result = await query("SELECT * FROM users WHERE phone = $1", [phone])

    if (result.rows.length === 0) {
      return null
    }

    return UserEntity.fromDatabaseRow(result.rows[0])
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
    const fields: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (updates.email !== undefined) {
      fields.push(`email = $${paramCount++}`)
      values.push(updates.email)
    }

    if (updates.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`)
      values.push(updates.phone)
    }

    if (updates.telegramId !== undefined) {
      fields.push(`telegram_id = $${paramCount++}`)
      values.push(updates.telegramId)
    }

    if (updates.role !== undefined) {
      fields.push(`role = $${paramCount++}`)
      values.push(updates.role)
    }

    if (updates.profile !== undefined) {
      fields.push(`profile = $${paramCount++}`)
      values.push(JSON.stringify(updates.profile))
    }

    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`)
      values.push(updates.isActive)
    }

    if (fields.length === 0) {
      return this.findById(id)
    }

    fields.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`, values)

    if (result.rows.length === 0) {
      return null
    }

    return UserEntity.fromDatabaseRow(result.rows[0])
  }

  async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    const result = await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
      passwordHash,
      id,
    ])

    return (result.rowCount ?? 0) > 0
  }

  async updateProfile(id: string, profile: UserProfile): Promise<UserEntity | null> {
    const result = await query("UPDATE users SET profile = $1, updated_at = NOW() WHERE id = $2 RETURNING *", [
      JSON.stringify(profile),
      id,
    ])

    if (result.rows.length === 0) {
      return null
    }

    return UserEntity.fromDatabaseRow(result.rows[0])
  }

  async updateRole(id: string, role: UserRole): Promise<UserEntity | null> {
    const result = await query("UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *", [role, id])

    if (result.rows.length === 0) {
      return null
    }

    return UserEntity.fromDatabaseRow(result.rows[0])
  }

  async activate(id: string): Promise<boolean> {
    const result = await query("UPDATE users SET is_active = true, updated_at = NOW() WHERE id = $1", [id])

    return (result.rowCount ?? 0) > 0
  }

  async deactivate(id: string): Promise<boolean> {
    const result = await query("UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1", [id])

    return (result.rowCount ?? 0) > 0
  }

  async delete(id: string): Promise<boolean> {
    const result = await query("DELETE FROM users WHERE id = $1", [id])
    return (result.rowCount ?? 0) > 0
  }

  async findMany(
    filters: UserFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10 },
  ): Promise<PaginatedResult<UserEntity>> {
    const conditions: string[] = []
    const values: any[] = []
    let paramCount = 1

    // Build WHERE conditions
    if (filters.role !== undefined) {
      conditions.push(`role = $${paramCount++}`)
      values.push(filters.role)
    }

    if (filters.isActive !== undefined) {
      conditions.push(`is_active = $${paramCount++}`)
      values.push(filters.isActive)
    }

    if (filters.verificationStatus !== undefined) {
      conditions.push(`profile->>'verificationStatus' = $${paramCount++}`)
      values.push(filters.verificationStatus)
    }

    if (filters.search) {
      conditions.push(`(
        email ILIKE $${paramCount} OR 
        profile->>'firstName' ILIKE $${paramCount} OR 
        profile->>'lastName' ILIKE $${paramCount}
      )`)
      values.push(`%${filters.search}%`)
      paramCount++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM users ${whereClause}`, values)
    const total = parseInt(countResult.rows[0].total)

    // Calculate pagination
    const offset = (pagination.page - 1) * pagination.limit
    const totalPages = Math.ceil(total / pagination.limit)

    // Get paginated results
    const dataResult = await query(
      `SELECT * FROM users ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      [...values, pagination.limit, offset],
    )

    const users = dataResult.rows.map((row) => UserEntity.fromDatabaseRow(row))

    return {
      data: users,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
    }
  }

  async findByRole(role: UserRole): Promise<UserEntity[]> {
    const result = await query("SELECT * FROM users WHERE role = $1 AND is_active = true ORDER BY created_at DESC", [
      role,
    ])

    return result.rows.map((row) => UserEntity.fromDatabaseRow(row))
  }

  async findActiveUsers(limit?: number): Promise<UserEntity[]> {
    const queryText = limit
      ? "SELECT * FROM users WHERE is_active = true ORDER BY created_at DESC LIMIT $1"
      : "SELECT * FROM users WHERE is_active = true ORDER BY created_at DESC"

    const params = limit ? [limit] : []
    const result = await query(queryText, params)

    return result.rows.map((row) => UserEntity.fromDatabaseRow(row))
  }

  async findRecentUsers(days: number = 7): Promise<UserEntity[]> {
    const result = await query(
      `SELECT * FROM users 
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       ORDER BY created_at DESC`,
      [],
    )

    return result.rows.map((row) => UserEntity.fromDatabaseRow(row))
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    let queryText = "SELECT 1 FROM users WHERE email = $1"
    const values = [email]

    if (excludeId) {
      queryText += " AND id != $2"
      values.push(excludeId)
    }

    const result = await query(queryText, values)
    return result.rows.length > 0
  }

  async existsByTelegramId(telegramId: string, excludeId?: string): Promise<boolean> {
    let queryText = "SELECT 1 FROM users WHERE telegram_id = $1"
    const values = [telegramId]

    if (excludeId) {
      queryText += " AND id != $2"
      values.push(excludeId)
    }

    const result = await query(queryText, values)
    return result.rows.length > 0
  }

  async existsByPhone(phone: string, excludeId?: string): Promise<boolean> {
    let queryText = "SELECT 1 FROM users WHERE phone = $1"
    const values = [phone]

    if (excludeId) {
      queryText += " AND id != $2"
      values.push(excludeId)
    }

    const result = await query(queryText, values)
    return result.rows.length > 0
  }

  async getUserStats(): Promise<{
    total: number
    active: number
    byRole: Record<UserRole, number>
    verified: number
    recentSignups: number
  }> {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE role = 'user') as user_count,
        COUNT(*) FILTER (WHERE role = 'agency') as agency_count,
        COUNT(*) FILTER (WHERE role = 'manager') as manager_count,
        COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
        COUNT(*) FILTER (WHERE profile->>'verificationStatus' = 'verified') as verified,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_signups
      FROM users
    `)

    const row = result.rows[0]

    return {
      total: parseInt(row.total),
      active: parseInt(row.active),
      byRole: {
        [UserRole.USER]: parseInt(row.user_count),
        [UserRole.AGENCY]: parseInt(row.agency_count),
        [UserRole.MANAGER]: parseInt(row.manager_count),
        [UserRole.ADMIN]: parseInt(row.admin_count),
      },
      verified: parseInt(row.verified),
      recentSignups: parseInt(row.recent_signups),
    }
  }

  async searchUsers(searchTerm: string, limit: number = 10): Promise<UserEntity[]> {
    const result = await query(
      `SELECT * FROM users 
       WHERE (
         email ILIKE $1 OR 
         profile->>'firstName' ILIKE $1 OR 
         profile->>'lastName' ILIKE $1 OR
         phone ILIKE $1
       ) AND is_active = true
       ORDER BY created_at DESC
       LIMIT $2`,
      [`%${searchTerm}%`, limit],
    )

    return result.rows.map((row) => UserEntity.fromDatabaseRow(row))
  }

  async bulkUpdateRole(userIds: string[], role: UserRole): Promise<number> {
    if (userIds.length === 0) return 0

    const placeholders = userIds.map((_, index) => `$${index + 1}`).join(",")
    const result = await query(
      `UPDATE users SET role = $${userIds.length + 1}, updated_at = NOW() 
       WHERE id IN (${placeholders})`,
      [...userIds, role],
    )

    return result.rowCount ?? 0
  }

  async bulkDeactivate(userIds: string[]): Promise<number> {
    if (userIds.length === 0) return 0

    const placeholders = userIds.map((_, index) => `$${index + 1}`).join(",")
    const result = await query(
      `UPDATE users SET is_active = false, updated_at = NOW() 
       WHERE id IN (${placeholders})`,
      userIds,
    )

    return result.rowCount ?? 0
  }

  async getTopRatedUsers(limit: number = 10): Promise<UserEntity[]> {
    const result = await query(
      `SELECT * FROM users 
       WHERE is_active = true AND (profile->>'rating')::numeric > 0
       ORDER BY (profile->>'rating')::numeric DESC, (profile->>'reviewsCount')::numeric DESC
       LIMIT $1`,
      [limit],
    )

    return result.rows.map((row) => UserEntity.fromDatabaseRow(row))
  }
}
