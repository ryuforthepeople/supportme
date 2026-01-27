// ─── Value Objects ───

export type Currency = 'EUR' | 'USD' | 'GBP' | string;
export type PaymentMethodType = 'ideal' | 'card' | 'sepa_debit' | 'bancontact' | 'sofort' | 'paypal' | 'apple_pay' | 'google_pay';

export interface Money {
  /** Amount in smallest unit (cents) */
  amount: number;
  currency: Currency;
}

export interface PaymentMetadata {
  widgetId: string;
  creatorId: string;
  supporterEmail?: string;
  supporterName?: string;
  message?: string;
  isRecurring?: boolean;
  recurringInterval?: 'monthly' | 'yearly';
  idempotencyKey: string;
}

// ─── Results ───

export type PaymentStatusType = 'pending' | 'processing' | 'paid' | 'failed' | 'expired' | 'refunded' | 'partially_refunded';

export interface PaymentResult {
  paymentId: string;
  status: PaymentStatusType;
  clientData?: Record<string, unknown>;
  redirectUrl?: string;
  expiresAt?: Date;
}

export interface PaymentStatus {
  paymentId: string;
  status: PaymentStatusType;
  paidAt?: Date;
  amount: Money;
  fee: Money;
  net: Money;
  method: PaymentMethodType;
  metadata: PaymentMetadata;
}

export interface RefundResult {
  refundId: string;
  status: 'pending' | 'completed' | 'failed';
  amount: Money;
}

export interface OnboardingResult {
  creatorId: string;
  status: 'pending' | 'active' | 'requires_info';
  onboardingUrl?: string;
  connectedAccountId?: string;
}

export interface PayoutResult {
  payoutId: string;
  status: 'pending' | 'in_transit' | 'paid' | 'failed';
  amount: Money;
  estimatedArrival?: Date;
}

export interface PaymentMethod {
  type: PaymentMethodType;
  label: string;
  icon: string;
  countries: string[];
  currencies: Currency[];
  minAmount?: Money;
  maxAmount?: Money;
}

export interface FeeEstimate {
  processorFee: Money;
  platformFee: Money;
  totalFee: Money;
  netAmount: Money;
  feePercentage: number;
}

// ─── Creator & Widget ───

export type Tier = 'free' | 'starter' | 'pro' | 'business';

export interface Creator {
  id: string;
  email: string;
  name: string;
  tier: Tier;
  paymentProvider: 'stripe' | 'mollie';
  connectedAccountId: string;
  currency: Currency;
  country: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatorOnboardData {
  email: string;
  name: string;
  country: string;
  paymentProvider: 'stripe' | 'mollie';
  providerApiKey?: string;
}

export interface Widget {
  id: string;
  creatorId: string;
  slug: string;
  config: WidgetConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetConfig {
  title?: string;
  description?: string;
  accentColor?: string;
  theme?: 'light' | 'dark' | 'auto';
  locale?: string;
  showPoweredBy: boolean;

  presetAmounts: number[];
  currency: Currency;
  allowCustomAmount: boolean;
  minAmount: number;
  maxAmount: number;

  allowMessage: boolean;
  allowRecurring: boolean;
  allowSupporterName: boolean;
  allowSupporterEmail: boolean;
  thankYouMessage?: string;
  thankYouRedirect?: string;

  enabledMethods?: PaymentMethodType[];

  webhookUrl?: string;
  webhookSecret?: string;

  activation?: ActivationConfig;
  autoTheme?: boolean;
  showSocialProof?: boolean;

  goal?: {
    amount: number;
    label?: string;
    showProgress?: boolean;
  };

  autoLocale?: boolean;
}

// ─── Webhook Events ───

export type WebhookEventType =
  | 'payment.created'
  | 'payment.paid'
  | 'payment.failed'
  | 'payment.refunded'
  | 'subscription.created'
  | 'subscription.cancelled'
  | 'payout.paid';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  createdAt: Date;
  data: {
    paymentId?: string;
    subscriptionId?: string;
    payoutId?: string;
    amount: Money;
    supporter?: {
      name?: string;
      email?: string;
      message?: string;
    };
    metadata: Record<string, unknown>;
  };
}

// ─── Activation / Nudge System ───

export interface ActivationTrigger {
  type: 'scroll' | 'time' | 'visits' | 'event';
  value: number | string;
}

export interface ActivationConfig {
  triggers: ActivationTrigger[];
  displayMode: 'slide-in' | 'inline' | 'floating-badge';
  dismiss: {
    behavior: 'session' | 'days' | 'permanent';
    cooldownDays?: number;
  };
  activationMessage?: string;
  delay?: number;
}

// ─── Auto-Theming ───

export interface DetectedTheme {
  mode: 'light' | 'dark';
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: string;
}

// ─── Social Proof ───

export interface WidgetStats {
  totalSupporters: number;
  totalAmount?: Money;
  goal?: {
    target: Money;
    current: Money;
    percentage: number;
    label?: string;
  };
}
