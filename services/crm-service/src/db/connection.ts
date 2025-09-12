import dotenv from "dotenv"
import { Pool, PoolClient } from "pg"

dotenv.config()

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "marketplace",
  user: process.env.DB_USER || "marketplace_user",
  password: process.env.DB_PASSWORD || "marketplace_pass",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start

  if (process.env.NODE_ENV === "development") {
    console.log("Executed query", { text, duration, rows: res.rowCount })
  }

  return res
}

export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect()
}

export const closePool = async (): Promise<void> => {
  await pool.end()
}

export default pool
