import Stripe from 'stripe';
import type { PaymentAdapter } from './adapter.js';
import type {
  Money,
  PaymentMethodType,
  PaymentMetadata,
  PaymentResult,
  PaymentStatus,
  PaymentStatusType,
  RefundResult,
  OnboardingResult,
  PayoutResult,
  PaymentMethod,
  FeeEstimate,
  WebhookEvent,
  WebhookEventType,
  CreatorOnboardData,
  Currency,
  Tier,
} from '../types/index.js';
import { calculateFees } from '../services/fees.js';

const METHOD_TO_STRIPE: Record<string, string> = {
  ideal: 'ideal',
  card: 'card',
  sepa_debit: 'sepa_debit',
  bancontact: 'bancontact',
  sofort: 'sofort',
};

function mapStripeStatus(status: string): PaymentStatusType {
  switch (status) {
    case 'requires_payment_method':
    case 'requires_confirmation':
    case 'requires_action':
      return 'pending';
    case 'processing':
      return 'processing';
    case 'succeeded':
      return 'paid';
    case 'canceled':
      return 'expired';
    default:
      return 'failed';
  }
}

export interface StripeAdapterConfig {
  secretKey: string;
  webhookSecret: string;
}

export class StripeAdapter implements PaymentAdapter {
  readonly provider = 'stripe' as const;
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(config: StripeAdapterConfig) {
    this.stripe = new Stripe(config.secretKey);
    this.webhookSecret = config.webhookSecret;
  }

  async createPayment(
    amount: Money,
    method: PaymentMethodType,
    metadata: PaymentMetadata
  ): Promise<PaymentResult> {
    const stripeMethod = METHOD_TO_STRIPE[method];
    const paymentMethodTypes = stripeMethod ? [stripeMethod] : ['card'];

    const intent = await this.stripe.paymentIntents.create(
      {
        amount: amount.amount,
        currency: amount.currency.toLowerCase(),
        payment_method_types: paymentMethodTypes,
        metadata: {
          widgetId: metadata.widgetId,
          creatorId: metadata.creatorId,
          supporterEmail: metadata.supporterEmail ?? '',
          supporterName: metadata.supporterName ?? '',
          message: metadata.message ?? '',
          isRecurring: String(metadata.isRecurring ?? false),
        },
      },
      { idempotencyKey: metadata.idempotencyKey }
    );

    return {
      paymentId: intent.id,
      status: mapStripeStatus(intent.status),
      clientData: { clientSecret: intent.client_secret },
      expiresAt: undefined,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const intent = await this.stripe.paymentIntents.retrieve(paymentId);
    const meta = intent.metadata ?? {};

    return {
      paymentId: intent.id,
      status: mapStripeStatus(intent.status),
      paidAt: intent.status === 'succeeded' ? new Date((intent.created ?? 0) * 1000) : undefined,
      amount: { amount: intent.amount, currency: intent.currency.toUpperCase() },
      fee: { amount: 0, currency: intent.currency.toUpperCase() },
      net: { amount: intent.amount, currency: intent.currency.toUpperCase() },
      method: (meta['method'] as PaymentMethodType) ?? 'card',
      metadata: {
        widgetId: meta['widgetId'] ?? '',
        creatorId: meta['creatorId'] ?? '',
        supporterEmail: meta['supporterEmail'] || undefined,
        supporterName: meta['supporterName'] || undefined,
        message: meta['message'] || undefined,
        idempotencyKey: meta['idempotencyKey'] ?? paymentId,
      },
    };
  }

  async createRefund(paymentId: string, amount?: Money): Promise<RefundResult> {
    const params: Stripe.RefundCreateParams = { payment_intent: paymentId };
    if (amount) params.amount = amount.amount;

    const refund = await this.stripe.refunds.create(params);
    return {
      refundId: refund.id,
      status: refund.status === 'succeeded' ? 'completed' : refund.status === 'pending' ? 'pending' : 'failed',
      amount: { amount: refund.amount ?? 0, currency: (refund.currency ?? 'eur').toUpperCase() },
    };
  }

  async onboardCreator(creatorData: CreatorOnboardData): Promise<OnboardingResult> {
    const account = await this.stripe.accounts.create({
      type: 'express',
      email: creatorData.email,
      country: creatorData.country,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
        ideal_payments: { requested: true },
      },
      business_profile: {
        name: creatorData.name,
      },
    });

    const link = await this.stripe.accountLinks.create({
      account: account.id,
      type: 'account_onboarding',
      refresh_url: 'https://supportme.dev/onboard/refresh',
      return_url: 'https://supportme.dev/onboard/complete',
    });

    return {
      creatorId: account.id,
      status: 'pending',
      onboardingUrl: link.url,
      connectedAccountId: account.id,
    };
  }

  async createPayout(creatorId: string, amount: Money): Promise<PayoutResult> {
    const payout = await this.stripe.payouts.create(
      {
        amount: amount.amount,
        currency: amount.currency.toLowerCase(),
      },
      { stripeAccount: creatorId }
    );

    return {
      payoutId: payout.id,
      status: payout.status === 'paid' ? 'paid' : payout.status === 'in_transit' ? 'in_transit' : payout.status === 'failed' ? 'failed' : 'pending',
      amount: { amount: payout.amount, currency: payout.currency.toUpperCase() },
      estimatedArrival: payout.arrival_date ? new Date(payout.arrival_date * 1000) : undefined,
    };
  }

  async listPaymentMethods(country: string, currency: Currency): Promise<PaymentMethod[]> {
    const methods: PaymentMethod[] = [
      {
        type: 'card',
        label: 'Credit Card',
        icon: '/icons/card.svg',
        countries: ['*'],
        currencies: ['EUR', 'USD', 'GBP'],
      },
    ];

    if (['NL'].includes(country.toUpperCase()) && currency.toUpperCase() === 'EUR') {
      methods.unshift({
        type: 'ideal',
        label: 'iDEAL',
        icon: '/icons/ideal.svg',
        countries: ['NL'],
        currencies: ['EUR'],
        minAmount: { amount: 100, currency: 'EUR' },
      });
    }

    if (['NL', 'DE', 'AT', 'BE', 'FR', 'IT', 'ES'].includes(country.toUpperCase()) && currency.toUpperCase() === 'EUR') {
      methods.push({
        type: 'sepa_debit',
        label: 'SEPA Direct Debit',
        icon: '/icons/sepa.svg',
        countries: ['NL', 'DE', 'AT', 'BE', 'FR', 'IT', 'ES'],
        currencies: ['EUR'],
      });
    }

    if (['BE'].includes(country.toUpperCase())) {
      methods.push({
        type: 'bancontact',
        label: 'Bancontact',
        icon: '/icons/bancontact.svg',
        countries: ['BE'],
        currencies: ['EUR'],
      });
    }

    return methods;
  }

  async estimateFees(amount: Money, method: PaymentMethodType, creatorTier: Tier): Promise<FeeEstimate> {
    return calculateFees(amount, method, 'stripe', creatorTier);
  }

  async handleWebhook(payload: string | Buffer, signature: string): Promise<WebhookEvent> {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret
    );

    const eventTypeMap: Record<string, WebhookEventType> = {
      'payment_intent.succeeded': 'payment.paid',
      'payment_intent.created': 'payment.created',
      'payment_intent.payment_failed': 'payment.failed',
      'charge.refunded': 'payment.refunded',
      'customer.subscription.created': 'subscription.created',
      'customer.subscription.deleted': 'subscription.cancelled',
      'payout.paid': 'payout.paid',
    };

    const mappedType = eventTypeMap[event.type] ?? 'payment.created';
    const obj = event.data.object as unknown as Record<string, unknown>;

    return {
      id: event.id,
      type: mappedType,
      createdAt: new Date(event.created * 1000),
      data: {
        paymentId: (obj['id'] as string) ?? undefined,
        amount: {
          amount: (obj['amount'] as number) ?? 0,
          currency: ((obj['currency'] as string) ?? 'eur').toUpperCase(),
        },
        metadata: (obj['metadata'] as Record<string, unknown>) ?? {},
      },
    };
  }
}
