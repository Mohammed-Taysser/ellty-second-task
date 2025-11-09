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
const ennValidation = envSchema.safeParse(process.env);

if (!ennValidation.success) {
  console.error('❌ Environment variable validation failed:\n');

  if (ennValidation.error instanceof z.ZodError) {
    for (const issue of ennValidation.error.issues) {
      console.error(`• ${issue.path.join('.')}: ${issue.message}`);
    }
  } else {
    console.error(ennValidation.error);
  }

  process.exit(1); // Exit with failure
}

const CONFIG = ennValidation.data;

export default CONFIG;
