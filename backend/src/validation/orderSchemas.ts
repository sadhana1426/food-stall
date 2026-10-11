import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    clientOrderId: z.string().min(1, 'clientOrderId is required'),
    orderType: z.enum(['DINE_IN', 'TAKEAWAY']),
    items: z.array(z.object({
      menuItemId: z.string().min(1),
      quantity: z.number().int().min(1),
    })).min(1, 'Order must have at least one item'),
    discount: z.object({
      type: z.enum(['NONE', 'PERCENTAGE', 'FIXED']),
      value: z.number().int().min(0),
    }),
  }),
});
