import { Hono } from 'hono';
import type { PaymentAdapter } from '@supportme/core';

export function paymentsRoutes(adapter: PaymentAdapter): Hono {
  const app = new Hono();

  // POST /payments — create a payment
  app.post('/', async (c) => {
    try {
      const body = await c.req.json();
      const { amount, currency, method, metadata } = body as {
        amount: number;
        currency: string;
        method: string;
        metadata: {
          widgetId: string;
          creatorId: string;
          supporterEmail?: string;
          supporterName?: string;
          message?: string;
          idempotencyKey: string;
        };
      };

      if (!amount || !currency || !method || !metadata?.idempotencyKey) {
        return c.json({ error: 'Missing required fields: amount, currency, method, metadata.idempotencyKey' }, 400);
      }

      if (amount < 100) {
        return c.json({ error: 'Minimum amount is 100 cents' }, 400);
      }

      if (amount > 50000) {
        return c.json({ error: 'Maximum amount is 50000 cents' }, 400);
      }

      const result = await adapter.createPayment(
        { amount, currency },
        method as Parameters<PaymentAdapter['createPayment']>[1],
        metadata
      );

      return c.json(result, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  // GET /payments/:id/status
  app.get('/:id/status', async (c) => {
    try {
      const id = c.req.param('id');
      const status = await adapter.getPaymentStatus(id);
      return c.json(status);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  return app;
}
