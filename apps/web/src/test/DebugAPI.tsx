import React, { useState } from "react"

import { api } from "../lib/api/client"
import { getApiConfig } from "../lib/api/config"

const DebugAPI: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<any>(null)
  const config = getApiConfig()

  const testDirectAPI = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log("Making direct API call to:", `${config.BASE_URL}${config.ENDPOINTS.SERVICE_PROVIDERS.BASE}`)

      const response = await api.get(config.ENDPOINTS.SERVICE_PROVIDERS.BASE)
      console.log("Raw API response:", response)

      setResult(response)
    } catch (err) {
      console.error("API Error:", err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const testFetch = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const url = `${config.BASE_URL}${config.ENDPOINTS.SERVICE_PROVIDERS.BASE}`
      console.log("Making fetch call to:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      })

      console.log("Fetch response status:", response.status)
      console.log("Fetch response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Fetch response data:", data)

      setResult(data)
    } catch (err) {
      console.error("Fetch Error:", err)
      const error = err instanceof Error ? err : new Error(String(err))
      setError({
        message: error.message,
        name: error.name,
        stack: error.stack,
        toString: error.toString(),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">API Debug Tool</h1>

      <div className="space-y-4 mb-6">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Configuration:</h3>
          <div className="text-sm">
            <div>
              <strong>Base URL:</strong> {config.BASE_URL}
            </div>
            <div>
              <strong>Service Providers Endpoint:</strong> {config.ENDPOINTS.SERVICE_PROVIDERS.BASE}
            </div>
            <div>
              <strong>Full URL:</strong> {config.BASE_URL}
              {config.ENDPOINTS.SERVICE_PROVIDERS.BASE}
            </div>
          </div>
        </div>

        <div className="space-x-4">
          <button
            onClick={testDirectAPI}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test with API Client"}
          </button>

          <button
            onClick={testFetch}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test with Fetch"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-blue-50 p-4 rounded">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
            Loading...
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded mb-4">
          <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
          <div className="text-sm text-red-700">
            <div>
              <strong>Message:</strong> {error.message}
            </div>
            {error.code && (
              <div>
                <strong>Code:</strong> {error.code}
              </div>
            )}
            {error.status && (
              <div>
                <strong>Status:</strong> {error.status}
              </div>
            )}
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-red-800">Full Error Details</summary>
            <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">{JSON.stringify(error, null, 2)}</pre>
          </details>
        </div>
      )}

      {result && (
        <div className="bg-green-50 p-4 rounded">
          <h3 className="font-semibold text-green-800 mb-2">Success!</h3>
          <div className="text-sm text-green-700 mb-2">
            <div>
              <strong>Type:</strong> {typeof result}
            </div>
            <div>
              <strong>Has success property:</strong>{" "}
              {Object.prototype.hasOwnProperty.call(result, "success") ? "Yes" : "No"}
            </div>
            <div>
              <strong>Has data property:</strong> {Object.prototype.hasOwnProperty.call(result, "data") ? "Yes" : "No"}
            </div>
            {result.success !== undefined && (
              <div>
                <strong>Success value:</strong> {String(result.success)}
              </div>
            )}
            {result.data && (
              <div>
                <strong>Data type:</strong> {typeof result.data}
              </div>
            )}
            {result.data?.serviceProviders && (
              <div>
                <strong>Service providers count:</strong> {result.data.serviceProviders.length}
              </div>
            )}
          </div>

          <details>
            <summary className="cursor-pointer text-green-800 font-semibold">Full Response</summary>
            <pre className="mt-2 text-xs bg-green-100 p-2 rounded overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}

export default DebugAPI
