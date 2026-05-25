import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Store } from 'lucide-react'
import { supabase } from '../../api/supabaseClient'
import { useAuthStore } from '../../stores/authStore'
import { loginSchema } from '../../lib/validators'
import InputField from '../../components/ui/InputField'
import PasswordField from '../../components/ui/PasswordField'
import AuthButton from '../../components/ui/AuthButton'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      toast.error(
        error.message === 'Invalid login credentials'
          ? 'E-posta veya şifre hatalı'
          : 'Bir hata oluştu, lütfen tekrar deneyin'
      )
      return
    }

    setUser(data.user)

    const { data: bizData, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', data.user.id)
      .maybeSingle()

    console.log('[Login] business fetch result:', { bizData, bizError })

    if (bizData?.id) {
      useAuthStore.getState().setBusinessId(bizData.id)
      console.log('[Login] set businessId:', bizData.id)
    } else if (!bizData) {
      console.log('[Login] no business found, creating...')
      const { data: newBiz, error: insertErr } = await supabase
        .from('businesses')
        .insert({ owner_id: data.user.id, name: data.user.email?.split('@')[0] || 'İşletmem' })
        .select('id')
        .single()
      console.log('[Login] business insert result:', { newBiz, insertErr })
      if (newBiz?.id) useAuthStore.getState().setBusinessId(newBiz.id)
    }

    toast.success('Giriş başarılı! Hoş geldiniz.')
    navigate('/')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-surface to-surface-bright p-4 animate-fade-in">
      {/* Decorative shapes */}
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary-container/20 blur-3xl" />
      <div className="absolute -right-20 bottom-20 h-96 w-96 rounded-full bg-secondary-container/20 blur-3xl" />
      <div className="absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-tertiary-container/10 blur-3xl" />

      <div className="relative w-full max-w-sm space-y-6 rounded-2xl border border-outline-variant/20 bg-surface/80 p-6 shadow-xl shadow-outline-variant/10 backdrop-blur-xl sm:p-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/25">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-on-surface">Esnafım</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            İşletmenizi yönetmek için giriş yapın
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputField
            label="E-posta Adresi"
            type="email"
            placeholder="ornek@firma.com"
            icon={Mail}
            error={errors.email?.message}
            {...register('email')}
          />

          <PasswordField
            label="Şifre"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <AuthButton loading={isSubmitting}>Giriş Yap</AuthButton>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-outline-variant/30" />
          <span className="text-xs text-outline">veya</span>
          <div className="h-px flex-1 bg-outline-variant/30" />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-on-surface-variant">
          Hesabınız yok mu?{' '}
          <Link
            to="/register"
            className="font-medium text-primary transition-colors hover:text-primary-container hover:underline"
          >
            Ücretsiz kaydol
          </Link>
        </p>
      </div>
    </div>
  )
}
