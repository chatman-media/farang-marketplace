import { UserRole, VerificationStatus, AuthProvider } from "@marketplace/shared-types"
import { UserEntity } from "../../models/User"
import { pool, query } from "../../database/connection"
import { runMigrations } from "../../database/migrate"

/**
 * Database fixtures for testing
 * These fixtures provide consistent test data for database operations
 */

export const userFixtures = {
  // Standard user fixture
  standardUser: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "john.doe@example.com",
    passwordHash: "$2a$12$hashedpassword123",
    phone: "+1234567890",
    telegramId: "johndoe123",
    role: UserRole.USER,
    profile: {
      firstName: "John",
      lastName: "Doe",
      rating: 4.5,
      reviewsCount: 10,
      verificationStatus: VerificationStatus.VERIFIED,
      socialProfiles: [],
      primaryAuthProvider: AuthProvider.EMAIL,
      location: {
        latitude: 40.7128,
        longitude: -74.006,
        address: "123 Main St",
        city: "New York",
        country: "USA",
        region: "NY",
      },
    },
    isActive: true,
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-01T00:00:00Z"),
  },

  // Agency user fixture
  agencyUser: {
    id: "456e7890-e89b-12d3-a456-426614174001",
    email: "agency@example.com",
    passwordHash: "$2a$12$hashedpassword456",
    phone: "+1987654321",
    telegramId: "agency123",
    role: UserRole.AGENCY,
    profile: {
      firstName: "Agency",
      lastName: "Manager",
      rating: 4.8,
      reviewsCount: 50,
      verificationStatus: VerificationStatus.VERIFIED,
      socialProfiles: [],
      primaryAuthProvider: AuthProvider.EMAIL,
      location: {
        latitude: 34.0522,
        longitude: -118.2437,
        address: "789 Business Ave",
        city: "Los Angeles",
        country: "USA",
        region: "CA",
      },
    },
    isActive: true,
    createdAt: new Date("2023-01-02T00:00:00Z"),
    updatedAt: new Date("2023-01-02T00:00:00Z"),
  },

  // Manager user fixture
  managerUser: {
    id: "789e0123-e89b-12d3-a456-426614174002",
    email: "manager@example.com",
    passwordHash: "$2a$12$hashedpassword789",
    phone: undefined,
    telegramId: undefined,
    role: UserRole.MANAGER,
    profile: {
      firstName: "Site",
      lastName: "Manager",
      rating: 0,
      reviewsCount: 0,
      verificationStatus: VerificationStatus.VERIFIED,
      socialProfiles: [],
      primaryAuthProvider: AuthProvider.EMAIL,
    },
    isActive: true,
    createdAt: new Date("2023-01-03T00:00:00Z"),
    updatedAt: new Date("2023-01-03T00:00:00Z"),
  },

  // Admin user fixture
  adminUser: {
    id: "012e3456-e89b-12d3-a456-426614174003",
    email: "admin@example.com",
    passwordHash: "$2a$12$hashedpasswordabc",
    phone: undefined,
    telegramId: undefined,
    role: UserRole.ADMIN,
    profile: {
      firstName: "System",
      lastName: "Admin",
      rating: 0,
      reviewsCount: 0,
      verificationStatus: VerificationStatus.VERIFIED,
      socialProfiles: [],
      primaryAuthProvider: AuthProvider.EMAIL,
    },
    isActive: true,
    createdAt: new Date("2023-01-04T00:00:00Z"),
    updatedAt: new Date("2023-01-04T00:00:00Z"),
  },

  // Unverified user fixture
  unverifiedUser: {
    id: "345e6789-e89b-12d3-a456-426614174004",
    email: "unverified@example.com",
    passwordHash: "$2a$12$hashedpassworddef",
    phone: undefined,
    telegramId: undefined,
    role: UserRole.USER,
    profile: {
      firstName: "Unverified",
      lastName: "User",
      rating: 0,
      reviewsCount: 0,
      verificationStatus: VerificationStatus.UNVERIFIED,
      socialProfiles: [],
      primaryAuthProvider: AuthProvider.EMAIL,
    },
    isActive: true,
    createdAt: new Date("2023-01-05T00:00:00Z"),
    updatedAt: new Date("2023-01-05T00:00:00Z"),
  },

  // Inactive user fixture
  inactiveUser: {
    id: "678e9012-e89b-12d3-a456-426614174005",
    email: "inactive@example.com",
    passwordHash: "$2a$12$hashedpasswordghi",
    phone: undefined,
    telegramId: undefined,
    role: UserRole.USER,
    profile: {
      firstName: "Inactive",
      lastName: "User",
      rating: 3.2,
      reviewsCount: 5,
      verificationStatus: VerificationStatus.VERIFIED,
      socialProfiles: [],
      primaryAuthProvider: AuthProvider.EMAIL,
    },
    isActive: false,
    createdAt: new Date("2023-01-06T00:00:00Z"),
    updatedAt: new Date("2023-01-06T00:00:00Z"),
  },
}

/**
 * Create UserEntity instances from fixtures
 */
export const createUserEntities = () => {
  const entities: Record<string, UserEntity> = {}

  Object.entries(userFixtures).forEach(([key, fixture]) => {
    entities[key] = new UserEntity(
      fixture.id,
      fixture.email,
      fixture.passwordHash,
      fixture.role,
      fixture.profile,
      fixture.profile.socialProfiles || [],
      fixture.profile.primaryAuthProvider || AuthProvider.EMAIL,
      "phone" in fixture ? fixture.phone : undefined,
      "telegramId" in fixture ? fixture.telegramId : undefined,
      fixture.isActive,
      fixture.createdAt,
      fixture.updatedAt,
    )
  })

  return entities
}

/**
 * Database row format fixtures (snake_case for database compatibility)
 */
export const databaseRowFixtures = {
  standardUser: {
    id: userFixtures.standardUser.id,
    email: userFixtures.standardUser.email,
    password_hash: userFixtures.standardUser.passwordHash,
    phone: userFixtures.standardUser.phone,
    telegram_id: userFixtures.standardUser.telegramId,
    role: userFixtures.standardUser.role,
    profile: userFixtures.standardUser.profile,
    is_active: userFixtures.standardUser.isActive,
    created_at: userFixtures.standardUser.createdAt,
    updated_at: userFixtures.standardUser.updatedAt,
  },

  agencyUser: {
    id: userFixtures.agencyUser.id,
    email: userFixtures.agencyUser.email,
    password_hash: userFixtures.agencyUser.passwordHash,
    phone: userFixtures.agencyUser.phone,
    telegram_id: userFixtures.agencyUser.telegramId,
    role: userFixtures.agencyUser.role,
    profile: userFixtures.agencyUser.profile,
    is_active: userFixtures.agencyUser.isActive,
    created_at: userFixtures.agencyUser.createdAt,
    updated_at: userFixtures.agencyUser.updatedAt,
  },
}

/**
 * Test data for user creation
 */
export const createUserTestData = {
  valid: {
    email: "newuser@example.com",
    password: "securepassword123",
    profile: {
      firstName: "New",
      lastName: "User",
      rating: 0,
      reviewsCount: 0,
      verificationStatus: VerificationStatus.UNVERIFIED,
      socialProfiles: [],
      primaryAuthProvider: AuthProvider.EMAIL,
    },
  },

  validWithOptionalFields: {
    email: "fulluser@example.com",
    password: "securepassword123",
    phone: "+1555123456",
    telegramId: "fulluser123",
    role: UserRole.AGENCY,
    profile: {
      firstName: "Full",
      lastName: "User",
      rating: 0,
      reviewsCount: 0,
      verificationStatus: VerificationStatus.UNVERIFIED,
      socialProfiles: [],
      primaryAuthProvider: AuthProvider.EMAIL,
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        address: "456 Market St",
        city: "San Francisco",
        country: "USA",
        region: "CA",
      },
    },
  },

  invalid: {
    email: "invalid-email",
    password: "123", // Too short
    profile: {
      firstName: "", // Empty
      lastName: "User",
      rating: 0,
      reviewsCount: 0,
      verificationStatus: VerificationStatus.UNVERIFIED,
      socialProfiles: [],
      primaryAuthProvider: AuthProvider.EMAIL,
    },
  },
}

/**
 * Test data for user updates
 */
export const updateUserTestData = {
  profileUpdate: {
    profile: {
      firstName: "Updated",
      lastName: "Name",
      location: {
        latitude: 51.5074,
        longitude: -0.1278,
        address: "789 Oxford St",
        city: "London",
        country: "UK",
        region: "London",
      },
    },
  },

  emailUpdate: {
    email: "newemail@example.com",
  },

  roleUpdate: {
    role: UserRole.AGENCY,
  },

  statusUpdate: {
    isActive: false,
  },
}

/**
 * Mock database statistics
 */
export const mockUserStats = {
  totalUsers: 100,
  activeUsers: 85,
  usersByRole: {
    [UserRole.USER]: 80,
    [UserRole.AGENCY]: 15,
    [UserRole.MANAGER]: 4,
    [UserRole.ADMIN]: 1,
  },
  verifiedUsers: 60,
  unverifiedUsers: 25,
  pendingVerification: 10,
  rejectedVerification: 5,
}
/**
 
* Setup test database
 * Runs migrations and prepares database for testing
 */
export async function setupTestDatabase(): Promise<void> {
  try {
    // Skip migrations since we're using centralized schema
    // The database schema is already set up via @marketplace/database-schema
    console.log("Using centralized database schema, skipping local migrations")

    // Clear any existing test data
    await cleanupTestDatabase()
  } catch (error) {
    console.error("Failed to setup test database:", error)
    throw error
  }
}

/**
 * Cleanup test database
 * Removes all test data from database tables
 */
export async function cleanupTestDatabase(): Promise<void> {
  try {
    // Delete all users (this will cascade to related tables)
    await query("DELETE FROM users WHERE email LIKE $1", ["%@example.com"])
    await query("DELETE FROM users WHERE email LIKE $1", ["test%@%"])
  } catch (error) {
    console.error("Failed to cleanup test database:", error)
    // Don't throw error during cleanup to avoid masking test failures
  }
}

/**
 * Insert test user fixtures into database
 */
export async function insertUserFixtures(): Promise<void> {
  const fixtures = Object.values(userFixtures)

  for (const fixture of fixtures) {
    await query(
      `INSERT INTO users (id, email, password_hash, phone, telegram_id, role, profile, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [
        fixture.id,
        fixture.email,
        fixture.passwordHash,
        fixture.phone || null,
        fixture.telegramId || null,
        fixture.role,
        JSON.stringify(fixture.profile),
        fixture.isActive,
        fixture.createdAt,
        fixture.updatedAt,
      ],
    )
  }
}

/**
 * Get test database connection for direct queries
 */
export function getTestConnection() {
  return pool
}
