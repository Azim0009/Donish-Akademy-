import { z } from 'zod';

// Сообщения — это ключи i18n, переводятся в компоненте через t()
// Пароль: минимум 8 символов и минимум одна цифра (ТЗ 6.1)
const password = z
  .string()
  .min(8, 'validation.passwordMin')
  .regex(/\d/, 'validation.passwordDigit');

const email = z.string().min(1, 'validation.required').email('validation.email');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'validation.required'),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'validation.nameMin'),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'validation.passwordsMatch',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'validation.passwordsMatch',
    path: ['confirmPassword'],
  });

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
