import type {
  Money,
  PaymentMethodType,
  PaymentMetadata,
  PaymentResult,
  PaymentStatus,
  RefundResult,
  OnboardingResult,
  PayoutResult,
  PaymentMethod,
  FeeEstimate,
  WebhookEvent,
  CreatorOnboardData,
  Currency,
  Tier,
} from '../types/index.js';

export interface PaymentAdapter {
  readonly provider: 'stripe' | 'mollie' | string;

  createPayment(
    amount: Money,
    method: PaymentMethodType,
    metadata: PaymentMetadata
  ): Promise<PaymentResult>;

  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;

  createRefund(paymentId: string, amount?: Money): Promise<RefundResult>;

  onboardCreator(creatorData: CreatorOnboardData): Promise<OnboardingResult>;

  createPayout(creatorId: string, amount: Money): Promise<PayoutResult>;

  listPaymentMethods(country: string, currency: Currency): Promise<PaymentMethod[]>;

  estimateFees(amount: Money, method: PaymentMethodType, creatorTier: Tier): Promise<FeeEstimate>;

  handleWebhook(payload: string | Buffer, signature: string): Promise<WebhookEvent>;
}
