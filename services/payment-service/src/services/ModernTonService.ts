import logger from "@marketplace/logger"
import { TonConnect } from "@tonconnect/sdk"
import axios from "axios"
import { internal, TonClient, WalletContractV4 } from "ton"
import { Address, beginCell, Cell, fromNano, toNano } from "ton-core"
import { mnemonicToWalletKey } from "ton-crypto"
import { z } from "zod"
import { env } from "../app"

// Modern Zod schemas for validation
export const tonAddressSchema = z.string().refine(
  (addr) => {
    try {
      Address.parse(addr)
      return true
    } catch {
      return false
    }
  },
  { message: "Invalid TON address format" },
)

export const tonAmountSchema = z.string().refine(
  (amount) => {
    const num = Number.parseFloat(amount)
    return !isNaN(num) && num > 0 && num <= 1000000
  },
  { message: "Invalid TON amount" },
)

export const paymentRequestSchema = z.object({
  toAddress: tonAddressSchema,
  amount: tonAmountSchema,
  comment: z.string().optional(),
  timeout: z.number().min(60).max(3600).optional().default(600), // 10 minutes default
})

export const jettonTransferSchema = z.object({
  jettonWalletAddress: tonAddressSchema,
  toAddress: tonAddressSchema,
  amount: z.string(),
  forwardAmount: tonAmountSchema.optional().default("0.1"),
  comment: z.string().optional(),
})

// Enhanced interfaces with modern TypeScript patterns
export interface ModernTonTransaction {
  readonly hash: string
  readonly from: string
  readonly to: string
  readonly amount: string
  readonly fee: string
  readonly timestamp: number
  readonly confirmed: boolean
  readonly confirmations: number
  readonly jettonInfo?: {
    symbol: string
    decimals: number
    masterAddress: string
  }
}

export interface TonWalletInfo {
  readonly address: string
  readonly balance: string
  readonly isActive: boolean
  readonly lastActivity?: number
  readonly jettonBalances: Record<string, string>
}

export interface TonConnectConfig {
  readonly manifestUrl: string
  readonly bridgeUrl?: string
  readonly walletsListUrl?: string
}

export class ModernTonService {
  private readonly client: TonClient
  private wallet: WalletContractV4 | null = null
  private keyPair: any = null
  private readonly network: "mainnet" | "testnet"
  private readonly apiKey: string
  private tonConnect: TonConnect | null = null

  constructor() {
    this.network = env.TON_NETWORK
    this.apiKey = env.TON_API_KEY

    // Initialize TON client with modern configuration
    const endpoint =
      this.network === "mainnet"
        ? "https://toncenter.com/api/v2/jsonRPC"
        : "https://testnet.toncenter.com/api/v2/jsonRPC"

    this.client = new TonClient({
      endpoint,
      apiKey: this.apiKey,
      timeout: 30000,
    })

    this.initializeWallet()
  }

  /**
   * Initialize TON Connect for modern wallet integration
   */
  async initializeTonConnect(config: TonConnectConfig): Promise<void> {
    this.tonConnect = new TonConnect({
      manifestUrl: config.manifestUrl,
    })

    logger.info("🔗 TON Connect initialized")
  }

  /**
   * Initialize wallet from mnemonic
   */
  private async initializeWallet(): Promise<void> {
    try {
      if (!process.env.TON_WALLET_MNEMONIC) {
        logger.warn("⚠️ TON wallet mnemonic not provided, wallet features disabled")
        return
      }

      const mnemonic = process.env.TON_WALLET_MNEMONIC.split(" ")
      this.keyPair = await mnemonicToWalletKey(mnemonic)

      this.wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: this.keyPair.publicKey,
      })

      logger.info(`🔑 TON wallet initialized: ${this.wallet.address.toString()}`)
    } catch (error) {
      logger.error("❌ Failed to initialize TON wallet:", error)
    }
  }

  /**
   * Create payment with modern validation
   */
  async createPayment(request: z.infer<typeof paymentRequestSchema>): Promise<ModernTonTransaction> {
    const validatedRequest = paymentRequestSchema.parse(request)

    if (!this.wallet || !this.keyPair) {
      throw new Error("Wallet not initialized")
    }

    try {
      const amount = toNano(validatedRequest.amount)
      const toAddress = Address.parse(validatedRequest.toAddress)

      // Get current seqno
      const seqno = await this.client.runMethod(this.wallet.address, "seqno")
      const currentSeqno = seqno.stack.readNumber()

      // Create transfer message
      const transfer = this.wallet.createTransfer({
        seqno: currentSeqno,
        secretKey: this.keyPair.secretKey,
        messages: [
          internal({
            to: toAddress,
            value: amount,
            body: validatedRequest.comment
              ? beginCell().storeUint(0, 32).storeStringTail(validatedRequest.comment).endCell()
              : undefined,
            bounce: false,
          }),
        ],
      })

      // Send transaction
      await this.client.sendExternalMessage(this.wallet, transfer)

      // Get transaction hash (simplified for example)
      const txHash = transfer.hash().toString("hex")

      return {
        hash: txHash,
        from: this.wallet.address.toString(),
        to: validatedRequest.toAddress,
        amount: validatedRequest.amount,
        fee: "0.01", // Estimated
        timestamp: Date.now(),
        confirmed: false,
        confirmations: 0,
      }
    } catch (error) {
      logger.error("❌ Failed to create TON payment:", error)
      throw error
    }
  }

  /**
   * Transfer Jetton tokens (USDT/USDC)
   */
  async transferJetton(request: z.infer<typeof jettonTransferSchema>): Promise<ModernTonTransaction> {
    const validatedRequest = jettonTransferSchema.parse(request)

    if (!this.wallet || !this.keyPair) {
      throw new Error("Wallet not initialized")
    }

    try {
      const jettonWallet = Address.parse(validatedRequest.jettonWalletAddress)
      const toAddress = Address.parse(validatedRequest.toAddress)
      const amount = BigInt(validatedRequest.amount)
      const forwardAmount = toNano(validatedRequest.forwardAmount)

      // Create Jetton transfer body
      const jettonTransferBody = beginCell()
        .storeUint(0xf8a7ea5, 32) // Jetton transfer op
        .storeUint(0, 64) // query_id
        .storeCoins(amount) // amount
        .storeAddress(toAddress) // destination
        .storeAddress(this.wallet.address) // response_destination
        .storeBit(false) // custom_payload
        .storeCoins(forwardAmount) // forward_ton_amount
        .storeBit(false) // forward_payload
        .endCell()

      // Get current seqno
      const seqno = await this.client.runMethod(this.wallet.address, "seqno")
      const currentSeqno = seqno.stack.readNumber()

      const transfer = this.wallet.createTransfer({
        seqno: currentSeqno,
        secretKey: this.keyPair.secretKey,
        messages: [
          internal({
            to: jettonWallet,
            value: toNano("0.1"), // Gas for Jetton transfer
            body: jettonTransferBody,
            bounce: true,
          }),
        ],
      })

      await this.client.sendExternalMessage(this.wallet, transfer)
      const txHash = transfer.hash().toString("hex")

      return {
        hash: txHash,
        from: this.wallet.address.toString(),
        to: validatedRequest.toAddress,
        amount: validatedRequest.amount,
        fee: "0.1",
        timestamp: Date.now(),
        confirmed: false,
        confirmations: 0,
        jettonInfo: {
          symbol: "USDT", // Would be determined from contract
          decimals: 6,
          masterAddress: validatedRequest.jettonWalletAddress,
        },
      }
    } catch (error) {
      logger.error("❌ Failed to transfer Jetton:", error)
      throw error
    }
  }

  /**
   * Verify transaction with enhanced checking
   */
  async verifyTransaction(hash: string): Promise<boolean> {
    try {
      const transactions = await this.client.getTransactions(Address.parse(env.TON_WALLET_ADDRESS), { limit: 100 })

      const transaction = transactions.find((tx) => tx.hash().toString("hex") === hash)

      return !!transaction
    } catch (error) {
      logger.error("❌ Failed to verify transaction:", error)
      return false
    }
  }

  /**
   * Get enhanced wallet information
   */
  async getWalletInfo(address: string): Promise<TonWalletInfo> {
    const validAddress = tonAddressSchema.parse(address)
    const addr = Address.parse(validAddress)

    try {
      const balance = await this.client.getBalance(addr)
      const state = await this.client.getContractState(addr)

      // Get Jetton balances (simplified)
      const jettonBalances: Record<string, string> = {}

      // You would implement actual Jetton balance checking here
      // This is a placeholder
      // biome-ignore lint/complexity/useLiteralKeys: temporary
      jettonBalances["USDT"] = "0"
      // biome-ignore lint/complexity/useLiteralKeys: temporary
      jettonBalances["USDC"] = "0"

      return {
        address: validAddress,
        balance: fromNano(balance),
        isActive: state.state === "active",
        lastActivity: state.lastTransaction ? Date.now() : undefined,
        jettonBalances,
      }
    } catch (error) {
      logger.error("❌ Failed to get wallet info:", error)
      throw error
    }
  }

  /**
   * Calculate TON amount from fiat with modern exchange rates
   */
  async calculateTonAmount(fiatAmount: number, fiatCurrency: string): Promise<string> {
    try {
      const response = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
        params: {
          ids: "the-open-network",
          vs_currencies: fiatCurrency.toLowerCase(),
          precision: 6,
        },
        timeout: 10000,
      })

      const tonPrice = response.data["the-open-network"]?.[fiatCurrency.toLowerCase()]

      if (!tonPrice) {
        throw new Error(`Exchange rate not available for ${fiatCurrency}`)
      }

      const tonAmount = (fiatAmount / tonPrice).toFixed(6)
      return tonAmount
    } catch (error) {
      logger.error("❌ Failed to calculate TON amount:", error)
      throw error
    }
  }

  /**
   * Check network health
   */
  async isNetworkHealthy(): Promise<boolean> {
    try {
      const masterchainInfo = await this.client.getMasterchainInfo()
      // Simple check - if we can get masterchain info, network is healthy
      return masterchainInfo.latestSeqno > 0
    } catch (error) {
      logger.error("❌ Network health check failed:", error)
      return false
    }
  }

  /**
   * Generate payment URL for TON Connect
   */
  generatePaymentUrl(request: z.infer<typeof paymentRequestSchema>): string {
    const validatedRequest = paymentRequestSchema.parse(request)

    const params = new URLSearchParams({
      to: validatedRequest.toAddress,
      amount: toNano(validatedRequest.amount).toString(),
      text: validatedRequest.comment || "",
    })

    return `ton://transfer/${validatedRequest.toAddress}?${params.toString()}`
  }
}
