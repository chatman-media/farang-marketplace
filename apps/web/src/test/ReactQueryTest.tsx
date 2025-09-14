import React from "react"

import { useServiceListings } from "../lib/query/hooks/useListings"

interface TestResultProps {
  label: string
  status: "loading" | "success" | "error"
  data?: any
  error?: any
}

const TestResult: React.FC<TestResultProps> = ({ label, status, data, error }) => {
  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return "🔄"
      case "success":
        return "✅"
      case "error":
        return "❌"
      default:
        return "❓"
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return "text-blue-600"
      case "success":
        return "text-green-600"
      case "error":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className={`flex items-center gap-2 font-semibold ${getStatusColor()}`}>
        <span className="text-xl">{getStatusIcon()}</span>
        <span>{label}</span>
      </div>

      {status === "loading" && <div className="mt-2 text-gray-600">Loading...</div>}

      {status === "success" && data && (
        <div className="mt-2">
          <div className="text-sm text-gray-600 mb-2">Response received:</div>
          <div className="bg-green-50 p-3 rounded text-sm">
            <div>
              <strong>Listings:</strong> {data.listings?.length || 0}
            </div>
            <div>
              <strong>Total:</strong> {data.total}
            </div>
            <div>
              <strong>Page:</strong> {data.page}
            </div>
            <div>
              <strong>Limit:</strong> {data.limit}
            </div>
            <div>
              <strong>Has More:</strong> {data.hasMore ? "Yes" : "No"}
            </div>
          </div>

          {data.listings?.length > 0 && (
            <div className="mt-3">
              <div className="text-sm text-gray-600 mb-2">First Service Provider:</div>
              <div className="bg-blue-50 p-3 rounded text-sm">
                <div>
                  <strong>Name:</strong> {data.listings[0].businessName}
                </div>
                <div>
                  <strong>Type:</strong> {data.listings[0].providerType}
                </div>
                <div>
                  <strong>Rating:</strong> {data.listings[0].rating} ({data.listings[0].reviewCount} reviews)
                </div>
                <div>
                  <strong>Location:</strong> {data.listings[0].primaryLocation?.city}
                </div>
              </div>
            </div>
          )}

          {data.listings?.length === 0 && (
            <div className="mt-3 p-3 bg-yellow-50 rounded text-sm text-yellow-800">
              <strong>No service providers found</strong>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="mt-2">
          <div className="bg-red-50 p-3 rounded text-sm text-red-800">
            <strong>Error:</strong> {error?.message || "Unknown error"}
            {error?.code && (
              <div>
                <strong>Code:</strong> {error.code}
              </div>
            )}
            {error?.status && (
              <div>
                <strong>Status:</strong> {error.status}
              </div>
            )}
            <details className="mt-2">
              <summary className="cursor-pointer">Debug Info</summary>
              <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">{JSON.stringify(error, null, 2)}</pre>
            </details>
          </div>
        </div>
      )}
    </div>
  )
}

const ReactQueryTest: React.FC = () => {
  // Test 1: Basic query
  const basicQuery = useServiceListings()

  // Test 2: Query with pagination
  const paginatedQuery = useServiceListings({ page: 1, limit: 5 })

  // Test 3: Query with different pagination
  const secondPageQuery = useServiceListings({ page: 2, limit: 3 })

  const handleRefresh = () => {
    basicQuery.refetch()
    paginatedQuery.refetch()
    secondPageQuery.refetch()
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">React Query API Test</h1>
        <p className="text-gray-600">Testing the integration between React Query and our Service Providers API</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          🔄 Refresh All Queries
        </button>
      </div>

      <div className="space-y-6">
        <TestResult
          label="Test 1: Basic Service Listings Query"
          status={basicQuery.isLoading ? "loading" : basicQuery.isError ? "error" : "success"}
          data={basicQuery.data}
          error={basicQuery.error}
        />

        <TestResult
          label="Test 2: Paginated Query (page=1, limit=5)"
          status={paginatedQuery.isLoading ? "loading" : paginatedQuery.isError ? "error" : "success"}
          data={paginatedQuery.data}
          error={paginatedQuery.error}
        />

        <TestResult
          label="Test 3: Second Page Query (page=2, limit=3)"
          status={secondPageQuery.isLoading ? "loading" : secondPageQuery.isError ? "error" : "success"}
          data={secondPageQuery.data}
          error={secondPageQuery.error}
        />
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Query States Summary:</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Basic Query:</strong>
            <div>Loading: {basicQuery.isLoading ? "Yes" : "No"}</div>
            <div>Error: {basicQuery.isError ? "Yes" : "No"}</div>
            <div>Success: {basicQuery.isSuccess ? "Yes" : "No"}</div>
            <div>Fetching: {basicQuery.isFetching ? "Yes" : "No"}</div>
          </div>
          <div>
            <strong>Paginated Query:</strong>
            <div>Loading: {paginatedQuery.isLoading ? "Yes" : "No"}</div>
            <div>Error: {paginatedQuery.isError ? "Yes" : "No"}</div>
            <div>Success: {paginatedQuery.isSuccess ? "Yes" : "No"}</div>
            <div>Fetching: {paginatedQuery.isFetching ? "Yes" : "No"}</div>
          </div>
          <div>
            <strong>Second Page Query:</strong>
            <div>Loading: {secondPageQuery.isLoading ? "Yes" : "No"}</div>
            <div>Error: {secondPageQuery.isError ? "Yes" : "No"}</div>
            <div>Success: {secondPageQuery.isSuccess ? "Yes" : "No"}</div>
            <div>Fetching: {secondPageQuery.isFetching ? "Yes" : "No"}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p>
          <strong>Expected behavior:</strong>
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>All queries should start in loading state</li>
          <li>Queries should transition to success state when API responds</li>
          <li>Data should be cached and subsequent requests should be faster</li>
          <li>Refresh button should trigger new requests</li>
          <li>No infinite loading loops should occur</li>
        </ul>
      </div>
    </div>
  )
}

export default ReactQueryTest
