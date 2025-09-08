import { FastifyInstance } from "fastify"

export interface TestResponse {
  statusCode: number
  status: number // Alias for statusCode to match supertest API
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

  let responseBody: any
  try {
    responseBody = JSON.parse(response.body)
  } catch {
    // If response is not JSON, return as string
    responseBody = response.body
  }

  return {
    statusCode: response.statusCode,
    status: response.statusCode, // Alias for supertest compatibility
    body: responseBody,
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
    let payload = this.payload
    let headers = { ...this.headers }

    // For file uploads, we need to handle multipart form data
    if (this.files.length > 0) {
      // Create a simple multipart boundary
      const boundary = `----formdata-test-${Date.now()}`
      headers["content-type"] = `multipart/form-data; boundary=${boundary}`

      // Build multipart body manually
      let body = ""

      // Add regular form fields
      if (this.payload) {
        Object.entries(this.payload).forEach(([key, value]) => {
          body += `--${boundary}\r\n`
          body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`
          body += `${value}\r\n`
        })
      }

      // Add file fields
      this.files.forEach((file) => {
        body += `--${boundary}\r\n`
        body += `Content-Disposition: form-data; name="${file.field}"; filename="${file.filename}"\r\n`

        // Determine content type based on file extension
        let contentType = "application/octet-stream"
        if (file.filename.endsWith(".jpg") || file.filename.endsWith(".jpeg")) {
          contentType = "image/jpeg"
        } else if (file.filename.endsWith(".png")) {
          contentType = "image/png"
        } else if (file.filename.endsWith(".gif")) {
          contentType = "image/gif"
        } else if (file.filename.endsWith(".txt")) {
          contentType = "text/plain"
        }

        body += `Content-Type: ${contentType}\r\n\r\n`
        body += file.data.toString("binary") + "\r\n"
      })

      body += `--${boundary}--\r\n`
      payload = Buffer.from(body, "binary")
    }

    const response = await this.app.inject({
      method: this.method,
      url: this.url,
      headers,
      payload,
    })

    let responseBody: any
    try {
      responseBody = JSON.parse(response.body)
    } catch {
      // If response is not JSON, return as string
      responseBody = response.body
    }

    return {
      statusCode: response.statusCode,
      status: response.statusCode, // Alias for supertest compatibility
      body: responseBody,
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

/**
 * Enhanced TestRequestBuilder that auto-executes when awaited
 */
export class AwaitableTestRequestBuilder extends TestRequestBuilder {
  // Make the builder thenable so it can be awaited directly
  then<TResult1 = TestResponse, TResult2 = never>(
    onfulfilled?: ((value: TestResponse) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
  ): Promise<TestResponse | TResult> {
    return this.execute().catch(onrejected)
  }

  finally(onfinally?: (() => void) | undefined | null): Promise<TestResponse> {
    return this.execute().finally(onfinally)
  }

  // Override methods to return AwaitableTestRequestBuilder
  set(header: string, value: string): AwaitableTestRequestBuilder {
    super.set(header, value)
    return this
  }

  send(data: any): AwaitableTestRequestBuilder {
    super.send(data)
    return this
  }

  attach(field: string, data: Buffer, filename: string): AwaitableTestRequestBuilder {
    super.attach(field, data, filename)
    return this
  }
}

/**
 * Enhanced factory function that returns awaitable builders
 */
export function awaitableTestRequest(app: FastifyInstance) {
  return {
    get: (url: string) => new AwaitableTestRequestBuilder(app, "GET", url),
    post: (url: string) => new AwaitableTestRequestBuilder(app, "POST", url),
    put: (url: string) => new AwaitableTestRequestBuilder(app, "PUT", url),
    patch: (url: string) => new AwaitableTestRequestBuilder(app, "PATCH", url),
    delete: (url: string) => new AwaitableTestRequestBuilder(app, "DELETE", url),
  }
}
