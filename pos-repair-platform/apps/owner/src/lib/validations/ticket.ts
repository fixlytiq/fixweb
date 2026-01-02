import { z } from 'zod';

export const ticketSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['RECEIVED', 'IN_PROGRESS', 'AWAITING_PARTS', 'READY', 'COMPLETED', 'CANCELLED']).optional(),
  technicianId: z.string().optional(),
  customerId: z.string().optional(),
  estimatedCost: z.string().optional().transform((val) => val ? Number(val) : undefined),
}).refine(
  (data) => {
    if (data.estimatedCost !== undefined && data.estimatedCost < 0) return false;
    return true;
  },
  {
    message: 'Estimated cost cannot be negative',
    path: ['estimatedCost'],
  }
);

export type TicketFormData = z.infer<typeof ticketSchema>;

