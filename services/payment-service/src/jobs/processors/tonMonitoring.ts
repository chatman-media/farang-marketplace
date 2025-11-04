import { and, inArray } from "@marketplace/database-schema"
import logger from "@marketplace/logger"
import { PaymentStatus } from "@marketplace/shared-types"
import axios from "axios"
import { Job, Worker } from "bullmq"
import { db, schema } from "../../db/connection"

const { payments } = schema

import { ModernTonService } from "../../services/ModernTonService"
import { PaymentService } from "../../services/PaymentService"

const tonService = new ModernTonService()
const paymentService = new PaymentService()

// Process TON transaction monitoring
async function checkPendingTransactions(job: Job) {
  const { batchSize = 50 } = job.data

  try {
    logger.info("🔍 Checking pending TON transactions...")

    // Get pending TON payments
    const pendingPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          inArray(payments.paymentMethod, ["ton_wallet", "ton_connect", "jetton_usdt", "jetton_usdc"]),
          inArray(payments.status, [PaymentStatus.PENDING, PaymentStatus.PROCESSING]),
        ),
      )
      .limit(batchSize)

    let processed = 0
    let confirmed = 0

    for (const payment of pendingPayments) {
      if (payment.blockchainTxHash) {
        try {
          // Check transaction status
          const isConfirmed = await tonService.verifyTransaction(payment.blockchainTxHash)

          if (isConfirmed && payment.status !== "completed") {
            await paymentService.updatePaymentStatus(
              payment.id,
              PaymentStatus.COMPLETED,
              "Transaction confirmed on TON blockchain",
            )
            confirmed++
          }

          processed++
        } catch (error) {
          logger.error(`Failed to check transaction ${payment.blockchainTxHash}:`, error)
        }
      }
    }

    logger.info(`✅ Processed ${processed} transactions, ${confirmed} confirmed`)
    return { processed, confirmed }
  } catch (error) {
    logger.error("Failed to check pending transactions:", error)
    throw error
  }
}

// Process TON exchange rate updates
async function updateExchangeRates(_job: Job) {
  try {
    logger.info("💱 Updating TON exchange rates...")

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
      logger.info("💱 Exchange rates updated:", exchangeRates)

      return exchangeRates
    }
  } catch (error) {
    logger.error("Failed to update exchange rates:", error)
    throw error
  }
}

// Process Jetton balance synchronization
async function syncJettonBalances(job: Job) {
  const { walletAddress } = job.data

  try {
    logger.info(`🪙 Syncing Jetton balances for ${walletAddress}...`)

    // Get wallet info which includes jetton balances
    const walletInfo = await tonService.getWalletInfo(walletAddress)

    const balances = {
      usdt: walletInfo.jettonBalances.USDT || "0",
      usdc: walletInfo.jettonBalances.USDC || "0",
      updated_at: new Date(),
    }

    logger.info("🪙 Jetton balances synced:", balances)
    return balances
  } catch (error) {
    logger.error("Failed to sync Jetton balances:", error)
    throw error
  }
}

// Process blockchain network health check
async function healthCheckTonNetwork(_job: Job) {
  try {
    logger.info("🏥 Checking TON network health...")

    // Check if we can connect to TON network
    const isHealthy = await tonService.isNetworkHealthy()

    if (!isHealthy) {
      logger.error("❌ TON network is unhealthy!")
      // Could send alerts here
    } else {
      logger.info("✅ TON network is healthy")
    }

    return { healthy: isHealthy, timestamp: new Date() }
  } catch (error) {
    logger.error("Failed to check TON network health:", error)
    throw error
  }
}

// Create worker for TON monitoring jobs
export function createTonMonitoringWorker(redisConnection: any) {
  const worker = new Worker(
    "ton-monitoring",
    async (job: Job) => {
      switch (job.name) {
        case "check-pending-transactions":
          return await checkPendingTransactions(job)
        case "update-exchange-rates":
          return await updateExchangeRates(job)
        case "sync-jetton-balances":
          return await syncJettonBalances(job)
        case "health-check-ton-network":
          return await healthCheckTonNetwork(job)
        default:
          throw new Error(`Unknown job name: ${job.name}`)
      }
    },
    { connection: redisConnection },
  )

  logger.info("🔄 TON monitoring job processors loaded")
  return worker
}
