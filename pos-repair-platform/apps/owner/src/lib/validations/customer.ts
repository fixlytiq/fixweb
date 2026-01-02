import { z } from 'zod';

export const customerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // At least one identifier must be provided
    return !!(data.firstName || data.lastName || data.email || data.phone);
  },
  {
    message: 'Please provide at least one identifier (name, email, or phone)',
    path: ['firstName'], // Show error on firstName field
  }
);

export type CustomerFormData = z.infer<typeof customerSchema>;

