// Integration test for React Query with real API
// This test checks that our API endpoint works correctly

// Import fetch for Node.js
import { fetch } from "undici"

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
      `📊 Pagination: page ${dataWithParams.data.pagination.page}, limit ${dataWithParams.data.pagination.limit}`,
    )

    return true
  } catch (error) {
    console.error("❌ React Query behavior test failed:", error.message)
    return false
  }
}

async function runTests() {
  console.log("🚀 Starting Integration Tests\n")

  const test1 = await testServiceProvidersAPI()
  const test2 = await testReactQueryBehavior()

  console.log("\n📋 Test Results:")
  console.log(`  Service Providers API: ${test1 ? "✅ PASS" : "❌ FAIL"}`)
  console.log(`  React Query Behavior: ${test2 ? "✅ PASS" : "❌ FAIL"}`)

  if (test1 && test2) {
    console.log("\n🎉 All integration tests passed!")
    console.log("✨ React Query should now work correctly with the API")
    process.exit(0)
  } else {
    console.log("\n💥 Some tests failed!")
    process.exit(1)
  }
}

// Run the tests
runTests().catch((error) => {
  console.error("💥 Unexpected error:", error)
  process.exit(1)
})
