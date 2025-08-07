import { z } from 'zod';

// Sign up form schema
export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  restaurantName: z
    .string()
    .min(2, 'Restaurant name must be at least 2 characters long')
    .max(100, 'Restaurant name cannot exceed 100 characters')
    .trim()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Sign in form schema
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
});

// Password reset form schema
export const passwordResetSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
});

// Category creation schema
export const categorySchema = z.object({
  name: z
    .string()
    .min(2, 'Category name must be at least 2 characters long')
    .max(50, 'Category name cannot exceed 50 characters')
    .trim(),
  description: z
    .string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional(),
  displayOrder: z
    .number()
    .int()
    .min(0, 'Display order must be a positive number')
    .optional(),
  isVisible: z.boolean().optional().default(true)
});

// Product creation schema
export const productSchema = z.object({
  name: z
    .string()
    .min(2, 'Product name must be at least 2 characters long')
    .max(100, 'Product name cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  price: z
    .number()
    .positive('Price must be greater than 0')
    .max(9999.99, 'Price cannot exceed $9,999.99'),
  categoryId: z
    .string()
    .min(1, 'Please select a category'),
  isAvailable: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  allergens: z.array(z.string()).optional(),
  preparationTime: z
    .number()
    .int()
    .min(1, 'Preparation time must be at least 1 minute')
    .max(180, 'Preparation time cannot exceed 180 minutes')
    .optional()
});

// Table creation schema
export const tableSchema = z.object({
  name: z
    .string()
    .min(1, 'Table name is required')
    .max(20, 'Table name cannot exceed 20 characters')
    .trim(),
  description: z
    .string()
    .max(100, 'Description cannot exceed 100 characters')
    .optional(),
  capacity: z
    .number()
    .int()
    .min(1, 'Capacity must be at least 1')
    .max(20, 'Capacity cannot exceed 20')
    .optional(),
  isActive: z.boolean().optional().default(true)
});