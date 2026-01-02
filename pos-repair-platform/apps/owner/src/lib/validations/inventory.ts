import { z } from 'zod';

export const inventoryItemSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  unitCost: z.string().optional().transform((val) => val ? Number(val) : undefined),
  unitPrice: z.string().optional().transform((val) => val ? Number(val) : undefined),
  reorderPoint: z.string().optional().transform((val) => val ? Number(val) : undefined),
  quantityOnHand: z.string().transform((val) => Number(val) || 0),
}).refine(
  (data) => {
    if (data.unitCost !== undefined && data.unitCost < 0) return false;
    if (data.unitPrice !== undefined && data.unitPrice < 0) return false;
    if (data.reorderPoint !== undefined && data.reorderPoint < 0) return false;
    return true;
  },
  {
    message: 'Values cannot be negative',
  }
);

export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

export const stockAdjustmentSchema = z.object({
  quantityChange: z.string().refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num !== 0;
    },
    {
      message: 'Quantity change must be a non-zero number',
    }
  ),
  reason: z.string().optional(),
  note: z.string().optional(),
});

export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;

