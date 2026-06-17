import { vi } from "vitest"

/**
 * Test helper that builds a chainable, awaitable Drizzle-like query-builder mock.
 *
 * The agency-service services use Drizzle's fluent API, e.g.:
 *   db.select().from(t).where(c)
 *   db.select().from(t).where(c).orderBy(o).limit(n).offset(m)
 *   db.insert(t).values(v).returning()
 *   db.update(t).set(v).where(c).returning()
 *   db.delete(t).where(c)
 *
 * Every chain method returns the same thenable object, and the object itself
 * resolves (when awaited) to the configured `rows` array. Because Drizzle
 * queries are awaited at different points in the chain, a single self-returning
 * thenable covers every call shape.
 */
export interface QueryResultQueue {
  // FIFO queue of result arrays, one per top-level db operation.
  results: unknown[][]
  // Records of each terminal builder created (for assertions if needed).
  builders: ChainBuilder[]
}

interface ChainBuilder {
  // The result this builder resolves to when awaited.
  result: unknown[]
  // Methods called on this builder, in order.
  calls: string[]
}

const CHAIN_METHODS = [
  "from",
  "where",
  "orderBy",
  "limit",
  "offset",
  "leftJoin",
  "innerJoin",
  "rightJoin",
  "fullJoin",
  "values",
  "set",
  "returning",
  "groupBy",
  "having",
  "innerJoinLateral",
] as const

/**
 * Create a chainable thenable builder that resolves to `rows`.
 */
function createBuilder(rows: unknown[], record: ChainBuilder): any {
  const builder: any = {}

  for (const method of CHAIN_METHODS) {
    builder[method] = vi.fn((..._args: unknown[]) => {
      record.calls.push(method)
      return builder
    })
  }

  // Make the builder awaitable (a thenable) resolving to the rows.
  // biome-ignore lint/suspicious/noThenProperty: test mock emulates Drizzle's thenable query builder
  builder.then = (resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) => {
    try {
      return Promise.resolve(rows).then(resolve, reject)
    } catch (err) {
      return Promise.reject(err)
    }
  }

  return builder
}

/**
 * Build a `db` mock whose select/insert/update/delete each pop the next queued
 * result array. Pass result arrays in the order the service performs queries.
 */
export function createDbMock(resultQueue: unknown[][] = []): {
  db: any
  state: QueryResultQueue
} {
  const state: QueryResultQueue = {
    results: [...resultQueue],
    builders: [],
  }

  const next = (): unknown[] => {
    const rows = state.results.shift()
    return Array.isArray(rows) ? rows : []
  }

  const makeEntry = () => {
    const record: ChainBuilder = { result: [], calls: [] }
    const rows = next()
    record.result = rows
    state.builders.push(record)
    return createBuilder(rows, record)
  }

  const db: any = {
    select: vi.fn((..._args: unknown[]) => makeEntry()),
    insert: vi.fn((..._args: unknown[]) => makeEntry()),
    update: vi.fn((..._args: unknown[]) => makeEntry()),
    delete: vi.fn((..._args: unknown[]) => makeEntry()),
  }

  return { db, state }
}

/**
 * A single, mutable db mock instance suitable for module-load capture
 * (`const db = sharedDb()`). Tests configure the FIFO result queue and the
 * optional "throw" mode per-test via `configureDb` / `resetDb`.
 */
let sharedState: {
  results: unknown[][]
  error: Error | null
  builders: ChainBuilder[]
} = { results: [], error: null, builders: [] }

export function resetDb(): void {
  sharedState = { results: [], error: null, builders: [] }
}

/**
 * Queue the result arrays that subsequent db operations should resolve to,
 * in the order the service performs them.
 */
export function configureDb(results: unknown[][]): void {
  sharedState.results = [...results]
  sharedState.error = null
}

/**
 * Make every subsequent db operation reject, to exercise catch branches.
 */
export function configureDbError(error: Error = new Error("db boom")): void {
  sharedState.error = error
}

/** Inspect the chain builders produced so far (for call assertions). */
export function getDbBuilders(): ChainBuilder[] {
  return sharedState.builders
}

/**
 * The persistent db mock returned by the mocked `sharedDb()`. Each top-level
 * operation consumes from the shared queue, so behaviour is reconfigured every
 * test through `configureDb` without re-importing the service module.
 */
export const sharedDbMock: any = (() => {
  const next = (): unknown[] => {
    const rows = sharedState.results.shift()
    return Array.isArray(rows) ? rows : []
  }

  const makeEntry = () => {
    if (sharedState.error) {
      const err = sharedState.error
      const builder: any = {}
      for (const method of CHAIN_METHODS) {
        builder[method] = vi.fn(() => builder)
      }
      // biome-ignore lint/suspicious/noThenProperty: test mock emulates Drizzle's thenable query builder
      builder.then = (_resolve: unknown, reject: (reason: unknown) => unknown) => Promise.reject(err).catch(reject)
      return builder
    }
    const record: ChainBuilder = { result: [], calls: [] }
    const rows = next()
    record.result = rows
    sharedState.builders.push(record)
    return createBuilder(rows, record)
  }

  return {
    select: vi.fn((..._args: unknown[]) => makeEntry()),
    insert: vi.fn((..._args: unknown[]) => makeEntry()),
    update: vi.fn((..._args: unknown[]) => makeEntry()),
    delete: vi.fn((..._args: unknown[]) => makeEntry()),
  }
})()

/**
 * Build a `db` mock whose every query rejects with the given error, to exercise
 * the catch branches of the service methods.
 */
export function createThrowingDbMock(error: Error = new Error("db boom")): { db: any } {
  const throwingBuilder = (): any => {
    const builder: any = {}
    for (const method of CHAIN_METHODS) {
      builder[method] = vi.fn(() => builder)
    }
    // biome-ignore lint/suspicious/noThenProperty: test mock emulates Drizzle's thenable query builder
    builder.then = (_resolve: unknown, reject: (reason: unknown) => unknown) => Promise.reject(error).catch(reject)
    return builder
  }

  const db: any = {
    select: vi.fn(() => throwingBuilder()),
    insert: vi.fn(() => throwingBuilder()),
    update: vi.fn(() => throwingBuilder()),
    delete: vi.fn(() => throwingBuilder()),
  }

  return { db }
}
