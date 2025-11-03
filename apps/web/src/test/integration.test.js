// Integration test for React Query with real API
// This test checks that our API endpoint works correctly

import { fetch } from "undici"
import { describe, expect, it } from "vitest"

async function testServiceProvidersAPI() {
  console.log("🧪 Testing Service Providers API...")

  try {
    // Test the API endpoint directly
    const response = await fetch("http://localhost:3000/api/service-providers")

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Check response structure
    console.log("✅ API Response received")
    console.log("📊 Response structure:")
    console.log(`  - success: ${data.success}`)
    console.log(`  - message: ${data.message}`)
    console.log(`  - data.serviceProviders.length: ${data.data?.serviceProviders?.length || 0}`)
    console.log(`  - data.pagination: ${JSON.stringify(data.data?.pagination || {})}`)

    // Validate response structure
    if (!data.success) {
      throw new Error("API returned success: false")
    }

    if (!data.data || !Array.isArray(data.data.serviceProviders)) {
      throw new Error("Invalid data structure: serviceProviders should be an array")
    }

    if (!data.data.pagination) {
      throw new Error("Invalid data structure: pagination is missing")
    }

    // Check first service provider structure
    if (data.data.serviceProviders.length > 0) {
      const firstProvider = data.data.serviceProviders[0]
      const requiredFields = [
        "id",
        "businessName",
        "description",
        "providerType",
        "serviceCapabilities",
        "primaryLocation",
        "contactInfo",
        "rating",
        "reviewCount",
        "verificationLevel",
        "pricing",
      ]

      for (const field of requiredFields) {
        if (!(field in firstProvider)) {
          throw new Error(`Missing required field: ${field}`)
        }
      }

      console.log("✅ Service provider structure is valid")
      console.log(`📝 First provider: ${firstProvider.businessName}`)
      console.log(`⭐ Rating: ${firstProvider.rating} (${firstProvider.reviewCount} reviews)`)
    }

    console.log("🎉 All tests passed!")
    return true
  } catch (error) {
    console.error("❌ Test failed:", error.message)
    return false
  }
}

async function testReactQueryBehavior() {
  console.log("\n🔄 Testing React Query behavior simulation...")

  try {
    // Simulate multiple requests (like React Query might do)
    const requests = []
    for (let i = 0; i < 3; i++) {
      requests.push(fetch("http://localhost:3000/api/service-providers"))
    }

    const responses = await Promise.all(requests)

    // Check all responses are successful
    for (let i = 0; i < responses.length; i++) {
      if (!responses[i].ok) {
        throw new Error(`Request ${i + 1} failed with status: ${responses[i].status}`)
      }
    }

    console.log("✅ Multiple concurrent requests handled successfully")

    // Test with query parameters
    const responseWithParams = await fetch("http://localhost:3000/api/service-providers?page=1&limit=10")

    if (!responseWithParams.ok) {
      throw new Error(`Request with params failed: ${responseWithParams.status}`)
    }

    const dataWithParams = await responseWithParams.json()
    console.log("✅ Request with query parameters successful")
    console.log(
      `📊 Pagination: page ${dataWithParams.data.pagination.page}, limit ${dataWithParams.data.pagination.limit}`
    )

    return true
  } catch (error) {
    console.error("❌ React Query behavior test failed:", error.message)
    return false
  }
}

describe("Integration Tests", () => {
  it.skip("should test Service Providers API", async () => {
    const result = await testServiceProvidersAPI()
    expect(result).toBe(true)
  })

  it.skip("should test React Query Behavior", async () => {
    const result = await testReactQueryBehavior()
    expect(result).toBe(true)
  })
})
