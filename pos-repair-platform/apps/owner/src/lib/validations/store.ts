import { z } from 'zod';

export const storeSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  storeEmail: z.string().email('Invalid email address').min(1, 'Store email is required'),
  storePhone: z.string().optional(),
  notificationEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  timezone: z.string().min(1, 'Timezone is required'),
});

export type StoreFormData = z.infer<typeof storeSchema>;

