import type { PaymentAdapter } from '../adapters/adapter.js';
import type {
  Money,
  PaymentMethodType,
  PaymentMetadata,
  PaymentResult,
  PaymentStatus,
  RefundResult,
} from '../types/index.js';

export class PaymentService {
  constructor(private adapter: PaymentAdapter) {}

  async createPayment(
    amount: Money,
    method: PaymentMethodType,
    metadata: PaymentMetadata
  ): Promise<PaymentResult> {
    if (amount.amount < 100) {
      throw new Error('Minimum amount is 100 cents (€1.00)');
    }
    if (amount.amount > 50000) {
      throw new Error('Maximum amount is 50000 cents (€500.00)');
    }
    return this.adapter.createPayment(amount, method, metadata);
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    return this.adapter.getPaymentStatus(paymentId);
  }

  async refundPayment(paymentId: string, amount?: Money): Promise<RefundResult> {
    return this.adapter.createRefund(paymentId, amount);
  }
}
