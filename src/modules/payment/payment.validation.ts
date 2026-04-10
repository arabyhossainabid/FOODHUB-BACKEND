import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
});

export const createCheckoutSessionSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
});

export const syncPaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
});
