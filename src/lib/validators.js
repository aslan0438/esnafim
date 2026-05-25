import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-posta adresi gereklidir')
    .email('Geçerli bir e-posta adresi girin'),
  password: z
    .string()
    .min(1, 'Şifre gereklidir')
    .min(6, 'Şifre en az 6 karakter olmalıdır'),
})

export const registerSchema = z
  .object({
    businessName: z
      .string()
      .min(1, 'İşletme adı gereklidir')
      .min(2, 'İşletme adı en az 2 karakter olmalıdır'),
    email: z
      .string()
      .min(1, 'E-posta adresi gereklidir')
      .email('Geçerli bir e-posta adresi girin'),
    password: z
      .string()
      .min(1, 'Şifre gereklidir')
      .min(6, 'Şifre en az 6 karakter olmalıdır')
      .max(128, 'Şifre en fazla 128 karakter olabilir'),
    confirmPassword: z.string().min(1, 'Şifreyi onaylayın'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  })
