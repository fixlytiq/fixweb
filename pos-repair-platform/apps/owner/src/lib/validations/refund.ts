import { z } from 'zod';

export const refundSchema = z.object({
  saleId: z.string().min(1, 'Please select a sale'),
  amount: z.string().refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0;
    },
    {
      message: 'Amount must be a positive number',
    }
  ),
  reason: z.string().optional(),
});

export type RefundFormData = z.infer<typeof refundSchema>;

