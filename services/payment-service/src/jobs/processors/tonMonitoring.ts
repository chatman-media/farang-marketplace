import { Worker, Job } from "bullmq"
import { redis } from "../index.js"
import { ModernTonService } from "../../services/ModernTonService.js"
import { PaymentService } from "../../services/PaymentService.js"
import { db } from "../../db/connection.js"
import { payments, transactions } from "../../db/schema.js"
import { eq, and, inArray } from "drizzle-orm"
import axios from "axios"

const tonService = new ModernTonService()
const paymentService = new PaymentService()

// Process TON transaction monitoring
async function checkPendingTransactions(job: Job) {
  const { batchSize = 50 } = job.data

  try {
    console.log("🔍 Checking pending TON transactions...")

    // Get pending TON payments
    const pendingPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          inArray(payments.paymentMethod, [
            "ton_wallet",
            "ton_connect",
            "jetton_usdt",
            "jetton_usdc",
          ]),
          inArray(payments.status, ["pending", "processing"])
        )
      )
      .limit(batchSize)

    let processed = 0
    let confirmed = 0

    for (const payment of pendingPayments) {
      if (payment.tonTransactionHash) {
        try {
          // Check transaction status
          const isConfirmed = await tonService.verifyTransaction(payment.tonTransactionHash)

          if (isConfirmed && payment.status !== "confirmed") {
            await paymentService.updatePaymentStatus(
              payment.id,
              "confirmed",
              "Transaction confirmed on TON blockchain"
            )
            confirmed++
          }

          processed++
        } catch (error) {
          console.error(`Failed to check transaction ${payment.tonTransactionHash}:`, error)
        }
      }
    }

    console.log(`✅ Processed ${processed} transactions, ${confirmed} confirmed`)
    return { processed, confirmed }
  } catch (error) {
    console.error("Failed to check pending transactions:", error)
    throw error
  }
}

// Process TON exchange rate updates
async function updateExchangeRates(job: Job) {
  try {
    console.log("💱 Updating TON exchange rates...")

    // Fetch current TON price from CoinGecko
    const response = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
      params: {
        ids: "the-open-network",
        vs_currencies: "usd,thb,eur",
        include_24hr_change: true,
        include_last_updated_at: true,
      },
    })

    const tonData = response.data["the-open-network"]

    if (tonData) {
      // Store exchange rates in cache or database
      const exchangeRates = {
        ton_usd: tonData.usd,
        ton_thb: tonData.thb,
        ton_eur: tonData.eur,
        change_24h: tonData.usd_24h_change,
        updated_at: new Date(tonData.last_updated_at * 1000),
      }

      // You could store this in Redis or a dedicated table
      console.log("💱 Exchange rates updated:", exchangeRates)

      return exchangeRates
    }
  } catch (error) {
    console.error("Failed to update exchange rates:", error)
    throw error
  }
}

// Process Jetton balance synchronization
async function syncJettonBalances(job: Job) {
  const { walletAddress } = job.data

  try {
    console.log(`🪙 Syncing Jetton balances for ${walletAddress}...`)

    // Get wallet info which includes jetton balances
    const walletInfo = await tonService.getWalletInfo(walletAddress)

    const balances = {
      usdt: walletInfo.jettonBalances.USDT || "0",
      usdc: walletInfo.jettonBalances.USDC || "0",
      updated_at: new Date(),
    }

    console.log("🪙 Jetton balances synced:", balances)
    return balances
  } catch (error) {
    console.error("Failed to sync Jetton balances:", error)
    throw error
  }
}

// Process blockchain network health check
async function healthCheckTonNetwork(job: Job) {
  try {
    console.log("🏥 Checking TON network health...")

    // Check if we can connect to TON network
    const isHealthy = await tonService.isNetworkHealthy()

    if (!isHealthy) {
      console.error("❌ TON network is unhealthy!")
      // Could send alerts here
    } else {
      console.log("✅ TON network is healthy")
    }

    return { healthy: isHealthy, timestamp: new Date() }
  } catch (error) {
    console.error("Failed to check TON network health:", error)
    throw error
  }
}

// Create worker for TON monitoring jobs
const tonMonitoringWorker = new Worker(
  "ton-monitoring-v2",
  async (job: Job) => {
    const { type } = job.data

    switch (type) {
      case "check-transactions":
        return await checkPendingTransactions(job)
      case "update-rates":
        return await updateExchangeRates(job)
      case "sync-balances":
        return await syncJettonBalances(job)
      case "health-check":
        return await healthCheckTonNetwork(job)
      default:
        throw new Error(`Unknown job type: ${type}`)
    }
  },
  { connection: redis }
)

console.log("🔄 TON monitoring job processors loaded")
