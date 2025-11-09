import { configDotenv } from 'dotenv';
import { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';

configDotenv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().trim().transform(Number),

  ALLOWED_ORIGINS: z
    .string()
    .default('')
    .transform((val) => {
      const origins = val
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin !== '');
      return origins;
    }),

  JWT_SECRET: z.string().trim().min(10),
  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .trim()
    .regex(/^\d+[smhd]$/, {
      message: 'JWT_EXPIRES_IN must be a duration like "7d", "15m", "1h", or "30s"',
    }) as z.ZodType<SignOptions['expiresIn']>,
  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .trim()
    .regex(/^\d+[smhd]$/, {
      message: 'JWT_EXPIRES_IN must be a duration like "7d", "15m", "1h", or "30s"',
    }) as z.ZodType<SignOptions['expiresIn']>,
});

// Validate and catch errors with friendly messages
// let CONFIG: z.infer<typeof envSchema>;
const envValidation = envSchema.safeParse(process.env);

if (!envValidation.success) {
  console.error('❌ Environment variable validation failed:\n');

  if (envValidation.error instanceof z.ZodError) {
    for (const issue of envValidation.error.issues) {
      console.error(`• ${issue.path.join('.')}: ${issue.message}`);
    }
  } else {
    console.error(envValidation.error);
  }

  process.exit(1); // Exit with failure
}

if (envValidation.data.ALLOWED_ORIGINS.length === 0) {
  console.warn('⚠️  ALLOWED_ORIGINS is empty, CORS is disabled');
}

const CONFIG = envValidation.data;

export default CONFIG;
