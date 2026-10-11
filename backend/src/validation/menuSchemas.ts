import { z } from 'zod';

export const createMenuSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    pricePaise: z.coerce.number().int().min(1, 'Price must be greater than 0'),
    category: z.string().min(1, 'Category is required'),
    isAvailable: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true').default(true),
    sortOrder: z.coerce.number().int().default(0),
  }),
});

export const updateMenuSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    pricePaise: z.coerce.number().int().min(1).optional(),
    category: z.string().min(1).optional(),
    isAvailable: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true').optional(),
    sortOrder: z.coerce.number().int().optional(),
    removeImage: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true').optional(),
  }),
});
