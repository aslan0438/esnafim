import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { Store, Mail, Briefcase } from 'lucide-react'
import { supabase } from '../../api/supabaseClient'
import { useAuthStore } from '../../stores/authStore'
import { registerSchema } from '../../lib/validators'
import InputField from '../../components/ui/InputField'
import PasswordField from '../../components/ui/PasswordField'
import AuthButton from '../../components/ui/AuthButton'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const [passwordValue, setPasswordValue] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const passwordField = register('password')

  const onSubmit = async (values) => {
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    })

    if (error) {
      toast.error(
        error.message === 'User already registered'
          ? 'Bu e-posta adresi zaten kayıtlı'
          : 'Kayıt sırasında bir hata oluştu'
      )
      return
    }

    if (data.user) {
      const { data: bizData, error: bizError } = await supabase
        .from('businesses')
        .insert({
          owner_id: data.user.id,
          name: values.businessName,
        })
        .select('id')
        .single()

      if (bizError) {
        toast.error('İşletme profili oluşturulamadı')
        return
      }

      useAuthStore.getState().setBusinessId(bizData.id)
    }

    toast.success('Kayıt başarılı! Giriş yapabilirsiniz.')
    navigate('/login')
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
            İşletmeniz için yeni hesap oluşturun
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputField
            label="İşletme Adı"
            type="text"
            placeholder="Örnek Berber, Örnek Pastane..."
            icon={Briefcase}
            error={errors.businessName?.message}
            {...register('businessName')}
          />

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
            placeholder="En az 6 karakter"
            showStrength
            passwordValue={passwordValue}
            error={errors.password?.message}
            {...passwordField}
            onChange={(event) => {
              passwordField.onChange(event)
              setPasswordValue(event.target.value)
            }}
          />

          <PasswordField
            label="Şifreyi Onaylayın"
            placeholder="Şifrenizi tekrar girin"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <AuthButton loading={isSubmitting}>Hesap Oluştur</AuthButton>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-outline-variant/30" />
          <span className="text-xs text-outline">veya</span>
          <div className="h-px flex-1 bg-outline-variant/30" />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-on-surface-variant">
          Zaten hesabınız var mı?{' '}
          <Link
            to="/login"
            className="font-medium text-primary transition-colors hover:text-primary-container hover:underline"
          >
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  )
}
