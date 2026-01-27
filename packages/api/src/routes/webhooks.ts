import { Hono } from 'hono';
import type { PaymentAdapter } from '@supportme/core';

export function webhooksRoutes(adapter: PaymentAdapter): Hono {
  const app = new Hono();

  // POST /webhooks/stripe
  app.post('/stripe', async (c) => {
    try {
      const signature = c.req.header('stripe-signature');
      if (!signature) {
        return c.json({ error: 'Missing stripe-signature header' }, 400);
      }

      const body = await c.req.text();
      const event = await adapter.handleWebhook(body, signature);

      // Log the event (in production, dispatch to queue)
      console.log(`[webhook] ${event.type}: ${event.id}`);

      return c.json({ received: true, eventId: event.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Webhook error';
      console.error('[webhook] Error:', message);
      return c.json({ error: message }, 400);
    }
  });

  return app;
}
