import { z } from 'zod';

// Common validation patterns
const namePattern = /^[a-zA-Z\s'-]+$/;

// User validation schemas
export const inviteUserSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  firstName: z.string()
    .trim()
    .min(1, { message: "First name is required" })
    .max(100, { message: "First name must be less than 100 characters" })
    .regex(namePattern, { message: "First name can only contain letters, spaces, hyphens, and apostrophes" }),
  lastName: z.string()
    .trim()
    .min(1, { message: "Last name is required" })
    .max(100, { message: "Last name must be less than 100 characters" })
    .regex(namePattern, { message: "Last name can only contain letters, spaces, hyphens, and apostrophes" }),
  role: z.enum(['admin', 'user'], { message: "Role must be either 'admin' or 'user'" })
});

export const editUserSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  firstName: z.string()
    .trim()
    .min(1, { message: "First name is required" })
    .max(100, { message: "First name must be less than 100 characters" })
    .regex(namePattern, { message: "First name can only contain letters, spaces, hyphens, and apostrophes" }),
  lastName: z.string()
    .trim()
    .min(1, { message: "Last name is required" })
    .max(100, { message: "Last name must be less than 100 characters" })
    .regex(namePattern, { message: "Last name can only contain letters, spaces, hyphens, and apostrophes" }),
  role: z.enum(['admin', 'user'], { message: "Role must be either 'admin' or 'user'" })
});

// Authentication validation schemas
export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z.string()
    .min(1, { message: "Password is required" })
});

export const signupSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
  confirmPassword: z.string(),
  firstName: z.string()
    .trim()
    .min(1, { message: "First name is required" })
    .max(100, { message: "First name must be less than 100 characters" })
    .regex(namePattern, { message: "First name can only contain letters, spaces, hyphens, and apostrophes" }),
  lastName: z.string()
    .trim()
    .min(1, { message: "Last name is required" })
    .max(100, { message: "Last name must be less than 100 characters" })
    .regex(namePattern, { message: "Last name can only contain letters, spaces, hyphens, and apostrophes" })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// Bill validation schema
export const addBillSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Bill name is required" })
    .max(200, { message: "Bill name must be less than 200 characters" }),
  amount: z.number()
    .positive({ message: "Amount must be greater than 0" })
    .max(9999999.99, { message: "Amount is too large" }),
  dueDate: z.string()
    .min(1, { message: "Due date is required" })
    .refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
  category: z.string()
    .trim()
    .min(1, { message: "Category is required" })
    .max(100, { message: "Category must be less than 100 characters" }),
  isPaid: z.boolean().default(false)
});

// Category validation schema
export const categorySchema = z.string()
  .trim()
  .min(1, { message: "Category name is required" })
  .max(100, { message: "Category name must be less than 100 characters" })
  .regex(/^[a-zA-Z0-9\s&-]+$/, { message: "Category can only contain letters, numbers, spaces, hyphens, and ampersands" });

// Type exports for TypeScript
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type EditUserInput = z.infer<typeof editUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type AddBillInput = z.infer<typeof addBillSchema>;
