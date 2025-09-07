import { Pool, PoolConfig } from "pg"
import * as dotenv from "dotenv"

dotenv.config()

const config: PoolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "marketplace",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

export const pool = new Pool(config)

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params)
}

export const getClient = () => {
  return pool.connect()
}
