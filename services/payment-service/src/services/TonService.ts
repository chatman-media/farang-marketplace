import { TonClient, WalletContractV4, internal } from 'ton';
import { mnemonicToWalletKey } from 'ton-crypto';
import { Address, toNano, fromNano } from 'ton-core';
import axios from 'axios';

export interface TonTransaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  timestamp: number;
  confirmed: boolean;
  confirmations: number;
}

export interface TonWalletInfo {
  address: string;
  balance: string;
  isActive: boolean;
}

export interface PaymentRequest {
  toAddress: string;
  amount: string;
  comment?: string;
  timeout?: number;
}

export class TonService {
  private client: TonClient;
  private wallet: WalletContractV4 | null = null;
  private keyPair: any = null;
  private network: 'mainnet' | 'testnet';
  private apiKey: string;

  constructor() {
    this.network =
      (process.env.TON_NETWORK as 'mainnet' | 'testnet') || 'testnet';
    this.apiKey = process.env.TON_API_KEY || '';

    // Initialize TON client
    const endpoint =
      this.network === 'mainnet'
        ? 'https://toncenter.com/api/v2/jsonRPC'
        : 'https://testnet.toncenter.com/api/v2/jsonRPC';

    this.client = new TonClient({
      endpoint,
      apiKey: this.apiKey,
    });
  }

  /**
   * Initialize wallet from mnemonic
   */
  async initializeWallet(mnemonic?: string): Promise<void> {
    try {
      const mnemonicPhrase = mnemonic || process.env.TON_WALLET_MNEMONIC;
      if (!mnemonicPhrase) {
        throw new Error('Wallet mnemonic not provided');
      }

      // Convert mnemonic to key pair
      this.keyPair = await mnemonicToWalletKey(mnemonicPhrase.split(' '));

      // Create wallet contract
      this.wallet = WalletContractV4.create({
        publicKey: this.keyPair.publicKey,
        workchain: 0,
      });

      console.log(`TON Wallet initialized: ${this.wallet.address.toString()}`);
    } catch (error) {
      console.error('Failed to initialize TON wallet:', error);
      throw error;
    }
  }

  /**
   * Get wallet information
   */
  async getWalletInfo(address?: string): Promise<TonWalletInfo> {
    try {
      const walletAddress = address || this.wallet?.address.toString();
      if (!walletAddress) {
        throw new Error('Wallet address not available');
      }

      const balance = await this.client.getBalance(
        Address.parse(walletAddress)
      );
      const state = await this.client.getContractState(
        Address.parse(walletAddress)
      );

      return {
        address: walletAddress,
        balance: fromNano(balance),
        isActive: state.state === 'active',
      };
    } catch (error) {
      console.error('Failed to get wallet info:', error);
      throw error;
    }
  }

  /**
   * Send TON payment
   */
  async sendPayment(request: PaymentRequest): Promise<string> {
    try {
      if (!this.wallet || !this.keyPair) {
        throw new Error('Wallet not initialized');
      }

      const walletContract = this.client.open(this.wallet);
      const seqno = await walletContract.getSeqno();

      // Create transfer message
      const transfer = walletContract.createTransfer({
        secretKey: this.keyPair.secretKey,
        seqno,
        messages: [
          internal({
            to: Address.parse(request.toAddress),
            value: toNano(request.amount),
            body: request.comment || '',
            bounce: false,
          }),
        ],
      });

      // Send transaction
      await walletContract.send(transfer);

      // Get transaction hash (simplified - in real implementation you'd wait for confirmation)
      const txHash = transfer.hash().toString('hex');

      console.log(`TON payment sent: ${txHash}`);
      return txHash;
    } catch (error) {
      console.error('Failed to send TON payment:', error);
      throw error;
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(hash: string): Promise<TonTransaction | null> {
    try {
      // Use TON API to get transaction details
      const response = await axios.get(
        `https://${this.network === 'testnet' ? 'testnet.' : ''}tonapi.io/v2/blockchain/transactions/${hash}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const tx = response.data;
      if (!tx) return null;

      return {
        hash: tx.hash,
        from: tx.in_msg?.source?.address || '',
        to: tx.in_msg?.destination?.address || '',
        amount: fromNano(tx.in_msg?.value || '0'),
        fee: fromNano(tx.total_fees || '0'),
        timestamp: tx.now,
        confirmed: tx.success,
        confirmations: tx.success ? 1 : 0, // Simplified
      };
    } catch (error) {
      console.error('Failed to get transaction:', error);
      return null;
    }
  }

  /**
   * Monitor transaction confirmations
   */
  async waitForConfirmation(
    hash: string,
    requiredConfirmations: number = 3,
    timeoutMs: number = 30000
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const tx = await this.getTransaction(hash);
        if (tx && tx.confirmed && tx.confirmations >= requiredConfirmations) {
          return true;
        }

        // Wait 5 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        console.error('Error checking transaction confirmation:', error);
      }
    }

    return false;
  }

  /**
   * Validate TON address
   */
  validateAddress(address: string): boolean {
    try {
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert TON to nano-TON
   */
  toNano(amount: string): bigint {
    return toNano(amount);
  }

  /**
   * Convert nano-TON to TON
   */
  fromNano(amount: bigint | string): string {
    return fromNano(amount);
  }

  /**
   * Get current TON price in USD
   */
  async getTonPrice(): Promise<number> {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd'
      );

      return response.data['the-open-network']?.usd || 0;
    } catch (error) {
      console.error('Failed to get TON price:', error);
      return 0;
    }
  }

  /**
   * Calculate payment amount in TON from fiat
   */
  async calculateTonAmount(
    fiatAmount: number,
    fiatCurrency: string = 'USD'
  ): Promise<string> {
    try {
      const tonPrice = await this.getTonPrice();
      if (tonPrice === 0) {
        throw new Error('Unable to get TON price');
      }

      // For simplicity, assuming USD. In production, you'd handle multiple currencies
      const tonAmount = fiatAmount / tonPrice;
      return tonAmount.toFixed(8);
    } catch (error) {
      console.error('Failed to calculate TON amount:', error);
      throw error;
    }
  }

  /**
   * Generate payment URL for TON Connect
   */
  generatePaymentUrl(request: PaymentRequest): string {
    const params = new URLSearchParams({
      to: request.toAddress,
      amount: toNano(request.amount).toString(),
      text: request.comment || '',
    });

    return `ton://transfer/${request.toAddress}?${params.toString()}`;
  }

  /**
   * Verify webhook signature (for payment confirmations)
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Failed to verify webhook signature:', error);
      return false;
    }
  }
}
