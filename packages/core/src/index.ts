// Types
export type {
  Currency,
  PaymentMethodType,
  Money,
  PaymentMetadata,
  PaymentStatusType,
  PaymentResult,
  PaymentStatus,
  RefundResult,
  OnboardingResult,
  PayoutResult,
  PaymentMethod,
  FeeEstimate,
  Tier,
  Creator,
  CreatorOnboardData,
  Widget,
  WidgetConfig,
  WebhookEventType,
  WebhookEvent,
  ActivationTrigger,
  ActivationConfig,
  DetectedTheme,
  WidgetStats,
} from './types/index.js';

// Adapter interface
export type { PaymentAdapter } from './adapters/adapter.js';

// Stripe adapter
export { StripeAdapter } from './adapters/stripe.js';
export type { StripeAdapterConfig } from './adapters/stripe.js';

// Services
export { PaymentService } from './services/payment.js';
export { calculateFees } from './services/fees.js';
