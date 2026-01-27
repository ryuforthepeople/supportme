import { Hono } from 'hono';
import { StripeAdapter } from '@supportme/core';
import { createCorsMiddleware } from './middleware/cors.js';
import { rateLimiter } from './middleware/ratelimit.js';
import { paymentsRoutes } from './routes/payments.js';
import { webhooksRoutes } from './routes/webhooks.js';

export interface AppConfig {
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  corsOrigins?: string[];
}

export function createApp(config: AppConfig): Hono {
  const app = new Hono();

  const adapter = new StripeAdapter({
    secretKey: config.stripeSecretKey,
    webhookSecret: config.stripeWebhookSecret,
  });

  // Global middleware
  app.use('*', createCorsMiddleware(config.corsOrigins ?? ['*']));
  app.use('/api/*', rateLimiter(60, 60_000));

  // Health check
  app.get('/health', (c) => c.json({ status: 'ok', provider: 'stripe' }));

  // Routes
  app.route('/api/v1/payments', paymentsRoutes(adapter));
  app.route('/api/v1/webhooks', webhooksRoutes(adapter));

  return app;
}

export { createCorsMiddleware } from './middleware/cors.js';
export { rateLimiter } from './middleware/ratelimit.js';
export { paymentsRoutes } from './routes/payments.js';
export { webhooksRoutes } from './routes/webhooks.js';
