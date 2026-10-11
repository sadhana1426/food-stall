import { z } from 'zod';

export const updateBusinessSettingsSchema = z.object({
  body: z.object({
    businessName: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    receiptFooter: z.string().optional(),
    adminPin: z.string().length(4).regex(/^\d+$/).optional(),
    securityQuestions: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
  }),
});

export const updateBillingSettingsSchema = z.object({
  body: z.object({
    taxEnabled: z.boolean().optional(),
    taxRate: z.number().min(0).optional(),
    defaultDiscount: z.object({
      type: z.enum(['NONE', 'PERCENTAGE', 'FIXED']),
      value: z.number().min(0),
    }).optional(),
    defaultOrderType: z.enum(['DINE_IN', 'TAKEAWAY']).optional(),
  }),
});

export const verifyPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(1),
  }),
});
