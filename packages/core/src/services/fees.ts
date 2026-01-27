import type { Money, PaymentMethodType, Tier, FeeEstimate } from '../types/index.js';

const processorFees: Record<string, { percentage: number; fixed: number }> = {
  'stripe:card':       { percentage: 0.015, fixed: 25 },
  'stripe:ideal':      { percentage: 0, fixed: 29 },
  'stripe:sepa_debit': { percentage: 0, fixed: 35 },
  'stripe:bancontact': { percentage: 0.014, fixed: 25 },
  'stripe:sofort':     { percentage: 0.014, fixed: 25 },
  'mollie:card':       { percentage: 0.018, fixed: 25 },
  'mollie:ideal':      { percentage: 0, fixed: 29 },
  'mollie:sepa_debit': { percentage: 0, fixed: 25 },
};

const platformFeeRates: Record<Tier, number> = {
  free: 0,
  starter: 0.02,
  pro: 0,
  business: 0,
};

export function calculateFees(
  amount: Money,
  method: PaymentMethodType,
  provider: 'stripe' | 'mollie',
  tier: Tier
): FeeEstimate {
  const key = `${provider}:${method}`;
  const pf = processorFees[key] ?? { percentage: 0.029, fixed: 30 };

  const processorFee = Math.round(amount.amount * pf.percentage) + pf.fixed;
  const platformFee = Math.round(amount.amount * platformFeeRates[tier]);
  const totalFee = processorFee + platformFee;

  return {
    processorFee: { amount: processorFee, currency: amount.currency },
    platformFee: { amount: platformFee, currency: amount.currency },
    totalFee: { amount: totalFee, currency: amount.currency },
    netAmount: { amount: amount.amount - totalFee, currency: amount.currency },
    feePercentage: amount.amount > 0 ? (totalFee / amount.amount) * 100 : 0,
  };
}
