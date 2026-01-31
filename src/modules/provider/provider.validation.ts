import { z } from 'zod';

export const mealSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  categoryId: z.string().uuid('Invalid category ID'),
  image: z.string().url('Invalid image URL').or(z.literal('')).optional(),
  isAvailable: z.boolean().optional(),
});

export const updateMealSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  image: z.string().url('Invalid image URL').or(z.literal('')).optional(),
  isAvailable: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  shopName: z.string().min(1, 'Shop name is required').optional(),
  address: z.string().min(1, 'Address is required').optional(),
  cuisine: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PLACED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'] as const, {
    message: 'Invalid order status',
  }),
});

export type MealInput = z.infer<typeof mealSchema>;
export type UpdateMealInput = z.infer<typeof updateMealSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
