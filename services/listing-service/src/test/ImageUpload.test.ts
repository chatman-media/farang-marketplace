import fs from "node:fs/promises"
import path from "node:path"
import type { FastifyInstance } from "fastify"
import jwt from "jsonwebtoken"
import sharp from "sharp"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

// Exercises the real upload route the way the modular-monolith root (apps/api)
// wires it: @fastify/multipart + @fastify/static("/uploads/") + the uploads
// plugin, with request.user provided by a Bearer token. No DB needed — the route
// only touches the filesystem and sharp.
process.env.JWT_SECRET = "test-secret"

const BOUNDARY = "----imageuploadtestboundary"
const TEST_USERS = ["alice", "bob", "carol"]

function multipartBody(files: Array<{ field: string; filename: string; contentType: string; data: Buffer }>): Buffer {
  const chunks: Buffer[] = []
  for (const f of files) {
    chunks.push(
      Buffer.from(
        `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${f.field}"; filename="${f.filename}"\r\n` +
          `Content-Type: ${f.contentType}\r\n\r\n`,
      ),
      f.data,
      Buffer.from("\r\n"),
    )
  }
  chunks.push(Buffer.from(`--${BOUNDARY}--\r\n`))
  return Buffer.concat(chunks)
}

function tokenFor(id: string): string {
  return jwt.sign({ id, email: `${id}@test.local`, role: "user", verified: true }, "test-secret")
}

let app: FastifyInstance
let listingsRoot: string

beforeAll(async () => {
  const { env } = await import("../app")
  listingsRoot = path.join(process.cwd(), env.UPLOAD_PATH, "listings")

  const Fastify = (await import("fastify")).default
  app = Fastify()
  await app.register(import("@fastify/multipart"))
  await app.register(import("@fastify/static"), {
    root: path.join(process.cwd(), env.UPLOAD_PATH),
    prefix: "/uploads/",
  })
  const uploadRoutes = (await import("../routes/uploads")).default
  await app.register(uploadRoutes, { prefix: "/api/listings" })
  await app.ready()
})

afterAll(async () => {
  await app?.close()
  // Remove the per-user folders these tests created, keep the checked-in .gitkeep.
  await Promise.all(TEST_USERS.map((u) => fs.rm(path.join(listingsRoot, u), { recursive: true, force: true })))
})

describe("Image upload route (modular-monolith wiring)", () => {
  it("uploads → serves the WebP → owner deletes → blocks cross-user delete", async () => {
    const png = await sharp({ create: { width: 12, height: 10, channels: 3, background: { r: 200, g: 30, b: 30 } } })
      .png()
      .toBuffer()

    const upload = await app.inject({
      method: "POST",
      url: "/api/listings/images",
      headers: {
        authorization: `Bearer ${tokenFor("alice")}`,
        "content-type": `multipart/form-data; boundary=${BOUNDARY}`,
      },
      payload: multipartBody([{ field: "images", filename: "photo.png", contentType: "image/png", data: png }]),
    })
    expect(upload.statusCode).toBe(201)
    const body = upload.json()
    expect(body.success).toBe(true)
    expect(body.images).toHaveLength(1)

    const imgPath: string = body.images[0]
    // Files are namespaced per user (IDOR fix) and converted to WebP.
    expect(imgPath).toMatch(/^\/uploads\/listings\/alice\/[\w-]+\.webp$/)

    const served = await app.inject({ method: "GET", url: imgPath })
    expect(served.statusCode).toBe(200)
    expect((await sharp(served.rawPayload).metadata()).format).toBe("webp")

    // A different user must not be able to delete it.
    const cross = await app.inject({
      method: "DELETE",
      url: "/api/listings/images",
      headers: { authorization: `Bearer ${tokenFor("mallory")}`, "content-type": "application/json" },
      payload: { path: imgPath },
    })
    expect(cross.statusCode).toBe(403)
    expect((await app.inject({ method: "GET", url: imgPath })).statusCode).toBe(200)

    // The owner can.
    const del = await app.inject({
      method: "DELETE",
      url: "/api/listings/images",
      headers: { authorization: `Bearer ${tokenFor("alice")}`, "content-type": "application/json" },
      payload: { path: imgPath },
    })
    expect(del.statusCode).toBe(200)
    expect((await app.inject({ method: "GET", url: imgPath })).statusCode).toBe(404)
  })

  it("blocks path traversal in delete", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/listings/images",
      headers: { authorization: `Bearer ${tokenFor("alice")}`, "content-type": "application/json" },
      payload: { path: "/uploads/listings/alice/../../../../etc/passwd" },
    })
    expect(res.statusCode).toBe(403)
  })

  it("rejects unauthenticated upload (401) and a disallowed MIME batch (400, not 500)", async () => {
    const noAuth = await app.inject({
      method: "POST",
      url: "/api/listings/images",
      headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
      payload: multipartBody([
        { field: "images", filename: "x.png", contentType: "image/png", data: Buffer.from("x") },
      ]),
    })
    expect(noAuth.statusCode).toBe(401)

    const pdf = await app.inject({
      method: "POST",
      url: "/api/listings/images",
      headers: {
        authorization: `Bearer ${tokenFor("bob")}`,
        "content-type": `multipart/form-data; boundary=${BOUNDARY}`,
      },
      payload: multipartBody([
        { field: "images", filename: "doc.pdf", contentType: "application/pdf", data: Buffer.from("%PDF-1.4") },
      ]),
    })
    expect(pdf.statusCode).toBe(400)
  })

  it("does not 500 on a corrupt image carrying an allowed MIME (sharp try/catch)", async () => {
    const corrupt = await app.inject({
      method: "POST",
      url: "/api/listings/images",
      headers: {
        authorization: `Bearer ${tokenFor("carol")}`,
        "content-type": `multipart/form-data; boundary=${BOUNDARY}`,
      },
      payload: multipartBody([
        { field: "images", filename: "fake.png", contentType: "image/png", data: Buffer.from("not really a png") },
      ]),
    })
    expect(corrupt.statusCode).toBe(400)
  })
})
