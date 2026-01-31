import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['CUSTOMER', 'PROVIDER', 'ADMIN']).optional(),
  shopName: z.string().optional(),
  address: z.string().optional(),
}).refine(data => {
  if (data.role === 'PROVIDER') {
    return !!data.shopName && !!data.address;
  }
  return true;
}, {
  message: "shopName and address are required for PROVIDER role",
  path: ["shopName"]
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
