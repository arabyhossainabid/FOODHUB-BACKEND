import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z.array(z.object({
    mealId: z.string().uuid('Invalid meal ID'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item is required'),
  address: z.string().min(1, 'Delivery address is required'),
  offerCode: z.string().trim().min(1).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
