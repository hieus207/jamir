import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { FormField, Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTab } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toast'
import { ApiError, login, loginWithGoogle, register } from '@/services'
import type { AuthSession } from '@/types/domain'
import { LogoMark } from '../brand/Logo'
import { useAuthDialog, useSession } from './authStore'
import { GoogleButton } from './GoogleButton'

const phone = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s.]/g, ''))
  .pipe(z.string().regex(/^(0|\+84)\d{9}$/, 'Số điện thoại không hợp lệ'))

const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Nhập email hoặc số điện thoại'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
})
const registerSchema = z.object({
  name: z.string().trim().min(2, 'Vui lòng nhập họ tên'),
  phone,
  email: z.union([z.literal(''), z.email('Email không hợp lệ')]),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
})

/** Sign in / register: account (email or phone + password) or Google. */
export default function AuthDialog() {
  const { mode, show, hide } = useAuthDialog()
  const setSession = useSession((s) => s.setSession)
  const qc = useQueryClient()
  const [googleBusy, setGoogleBusy] = useState(false)

  const done = (s: AuthSession, isNew: boolean) => {
    setSession(s)
    qc.invalidateQueries({ queryKey: ['me'] })
    qc.invalidateQueries({ queryKey: ['orders'] })
    hide()
    toast.success(isNew ? `Chào mừng ${s.user.name} đến với JAMIR!` : `Xin chào ${s.user.name}`)
  }

  const onGoogle = async (credential: string) => {
    setGoogleBusy(true)
    try {
      done(await loginWithGoogle(credential), false)
    } catch (e) {
      toast.error('Đăng nhập Google thất bại', e instanceof ApiError ? e.message : undefined)
    } finally {
      setGoogleBusy(false)
    }
  }

  return (
    <Dialog open={mode !== null} onOpenChange={(o) => !o && hide()}>
      <DialogContent className="max-w-[420px] overflow-y-auto p-6 md:p-7" closeClassName="bg-line-soft text-ink-soft hover:bg-line">
        <LogoMark className="mb-4 size-10" />
        <DialogTitle className="text-xl">{mode === 'register' ? 'Tạo tài khoản JAMIR' : 'Đăng nhập JAMIR'}</DialogTitle>
        <DialogDescription className="mt-1">Theo dõi đơn hàng, lưu địa chỉ và nhận ưu đãi thành viên.</DialogDescription>

        <div className="mt-5 flex flex-col gap-3">
          <GoogleButton onCredential={onGoogle} />
          {googleBusy && <p className="text-center text-xs text-muted">Đang xác thực với Google…</p>}
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-subtle">
          <span className="h-px flex-1 bg-line" />
          hoặc dùng tài khoản JAMIR
          <span className="h-px flex-1 bg-line" />
        </div>

        <Tabs value={mode ?? 'login'} onValueChange={(v) => show(v as 'login' | 'register')}>
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTab value="login" className="justify-center">
              Đăng nhập
            </TabsTab>
            <TabsTab value="register" className="justify-center">
              Đăng ký
            </TabsTab>
          </TabsList>
        </Tabs>
        {mode === 'register' ? <RegisterForm onDone={(s) => done(s, true)} /> : <LoginForm onDone={(s) => done(s, false)} />}
      </DialogContent>
    </Dialog>
  )
}

function LoginForm({ onDone }: { onDone: (s: AuthSession) => void }) {
  const {
    register: field,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof loginSchema>>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: '', password: '' } })
  const onSubmit = handleSubmit(async (v) => {
    try {
      onDone(await login(v.identifier, v.password))
    } catch (e) {
      setError('password', { message: e instanceof ApiError ? e.message : 'Không đăng nhập được, thử lại sau' })
    }
  })
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5" noValidate>
      <FormField label="Email hoặc số điện thoại" error={errors.identifier?.message}>
        <Input autoComplete="username" placeholder="ban@gmail.com / 0912 345 678" {...field('identifier')} />
      </FormField>
      <FormField label="Mật khẩu" error={errors.password?.message}>
        <Input type="password" autoComplete="current-password" placeholder="••••••" {...field('password')} />
      </FormField>
      <Button type="submit" size="lg" className="mt-1 w-full" loading={isSubmitting}>
        Đăng nhập
      </Button>
    </form>
  )
}

function RegisterForm({ onDone }: { onDone: (s: AuthSession) => void }) {
  const {
    register: field,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof registerSchema>, unknown, z.output<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', phone: '', email: '', password: '' },
  })
  const onSubmit = handleSubmit(async (v) => {
    try {
      onDone(await register({ name: v.name, phone: v.phone, email: v.email || undefined, password: v.password }))
    } catch (e) {
      setError('phone', { message: e instanceof ApiError ? e.message : 'Không đăng ký được, thử lại sau' })
    }
  })
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5" noValidate>
      <FormField label="Họ và tên" error={errors.name?.message}>
        <Input autoComplete="name" placeholder="Nguyễn Văn A" {...field('name')} />
      </FormField>
      <FormField label="Số điện thoại" error={errors.phone?.message}>
        <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="0912 345 678" {...field('phone')} />
      </FormField>
      <FormField label="Email (không bắt buộc)" error={errors.email?.message}>
        <Input type="email" autoComplete="email" placeholder="ban@gmail.com" {...field('email')} />
      </FormField>
      <FormField label="Mật khẩu" error={errors.password?.message}>
        <Input type="password" autoComplete="new-password" placeholder="Tối thiểu 6 ký tự" {...field('password')} />
      </FormField>
      <Button type="submit" size="lg" className="mt-1 w-full" loading={isSubmitting}>
        Tạo tài khoản
      </Button>
    </form>
  )
}
