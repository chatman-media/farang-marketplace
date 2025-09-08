import { FastifyInstance } from "fastify"

export interface TestResponse {
  statusCode: number
  body: any
  headers: any
}

export interface TestRequest {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  url: string
  headers?: Record<string, string>
  payload?: any
  files?: Array<{
    field: string
    filename: string
    data: Buffer
  }>
}

/**
 * Helper function to make HTTP requests to Fastify app in tests
 * Mimics supertest API but uses Fastify's inject method
 */
export async function request(app: FastifyInstance, options: TestRequest): Promise<TestResponse> {
  const response = await app.inject({
    method: options.method,
    url: options.url,
    headers: options.headers,
    payload: options.payload,
  })

  return {
    statusCode: response.statusCode,
    body: JSON.parse(response.body),
    headers: response.headers,
  }
}

/**
 * Helper class that mimics supertest's chainable API
 */
export class TestRequestBuilder {
  private app: FastifyInstance
  private method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  private url: string
  private headers: Record<string, string> = {}
  private payload?: any
  private files: Array<{ field: string; filename: string; data: Buffer }> = []

  constructor(app: FastifyInstance, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", url: string) {
    this.app = app
    this.method = method
    this.url = url
  }

  set(header: string, value: string): TestRequestBuilder {
    this.headers[header.toLowerCase()] = value
    return this
  }

  send(data: any): TestRequestBuilder {
    this.payload = data
    return this
  }

  attach(field: string, data: Buffer, filename: string): TestRequestBuilder {
    this.files.push({ field, filename, data })
    return this
  }

  async expect(statusCode: number): Promise<TestResponse> {
    const response = await this.execute()
    if (response.statusCode !== statusCode) {
      throw new Error(`Expected status ${statusCode}, got ${response.statusCode}`)
    }
    return response
  }

  async execute(): Promise<TestResponse> {
    // For file uploads, we need to handle multipart form data
    if (this.files.length > 0) {
      // For now, we'll simulate file upload by adding file info to payload
      // In a real implementation, you'd need to create proper multipart data
      const formData = new FormData()
      if (this.payload) {
        Object.entries(this.payload).forEach(([key, value]) => {
          formData.append(key, value as string)
        })
      }
      this.files.forEach((file) => {
        formData.append(file.field, new Blob([file.data]), file.filename)
      })
      this.payload = formData
    }

    const response = await this.app.inject({
      method: this.method,
      url: this.url,
      headers: this.headers,
      payload: this.payload,
    })

    return {
      statusCode: response.statusCode,
      body: JSON.parse(response.body),
      headers: response.headers,
    }
  }
}

/**
 * Factory function that mimics supertest's API
 */
export function testRequest(app: FastifyInstance) {
  return {
    get: (url: string) => new TestRequestBuilder(app, "GET", url),
    post: (url: string) => new TestRequestBuilder(app, "POST", url),
    put: (url: string) => new TestRequestBuilder(app, "PUT", url),
    patch: (url: string) => new TestRequestBuilder(app, "PATCH", url),
    delete: (url: string) => new TestRequestBuilder(app, "DELETE", url),
  }
}
