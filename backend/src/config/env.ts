import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  PORT: z.string().default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_VERSION: z.string().default('v1'),
  ADMIN_TOKEN_SECRET: z.string().min(1, "ADMIN_TOKEN_SECRET is required"),
  BUSINESS_TIMEZONE: z.string().default('Asia/Kolkata'),
  CORS_ORIGINS: z.string().default('*'),
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().optional(),
  BREVO_SENDER_NAME: z.string().optional(),
  ACCESS_TOKEN_SECRET: z.string().optional(),
  REFRESH_TOKEN_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default('tasty-bites/menu-items'),
  CLOUDINARY_URL: z.string().optional(), // kept for fallback
});

export type EnvConfig = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const config: EnvConfig = parsed.data;
