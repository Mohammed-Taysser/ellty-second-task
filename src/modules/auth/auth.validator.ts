import { z } from 'zod';

const registerSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.email().max(100),
    password: z.string().trim().min(6).max(100),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.email().max(100),
    password: z.string().trim().min(6).max(100),
  }),
};

const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().trim(),
  }),
};

type RegisterInput = z.infer<typeof registerSchema.body>;
type LoginInput = z.infer<typeof loginSchema.body>;
type RefreshTokenInput = z.infer<typeof refreshTokenSchema.body>;

const authValidator = {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
};

export type { LoginInput, RefreshTokenInput, RegisterInput };

export default authValidator;
