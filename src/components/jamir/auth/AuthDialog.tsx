import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { create } from 'zustand'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { FormField, Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { LogoMark } from '../brand/Logo'

type Mode = 'login' | 'register'

export const useAuthDialog = create<{ mode: Mode | null; show: (m: Mode) => void; hide: () => void }>()((set) => ({
  mode: null,
  show: (mode) => set({ mode }),
  hide: () => set({ mode: null }),
}))

const phone = z
  .string()
  .trim()
  .regex(/^(0|\+84)\d{9}$/, 'Số điện thoại không hợp lệ')

const loginSchema = z.object({
  phone,
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
})
const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, 'Vui lòng nhập họ tên'),
})
type FormValues = z.infer<typeof registerSchema>

/** Demo-only auth: validates the form and pretends to sign in. */
export function AuthDialog() {
  const { mode, show, hide } = useAuthDialog()
  const isRegister = mode === 'register'
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(isRegister ? registerSchema : (loginSchema as unknown as typeof registerSchema)),
    defaultValues: { name: '', phone: '', password: '' },
  })

  const onSubmit = async (v: FormValues) => {
    await new Promise((r) => setTimeout(r, 600))
    hide()
    reset()
    toast.success(isRegister ? `Chào mừng ${v.name} đến với JAMIR!` : 'Đăng nhập thành công', 'Đây là bản demo — dữ liệu không được lưu.')
  }

  return (
    <Dialog open={mode !== null} onOpenChange={(o) => !o && hide()}>
      <DialogContent className="max-w-[400px] p-6 md:p-7" closeClassName="bg-line-soft text-ink-soft hover:bg-line">
        <LogoMark className="mb-4 size-10" />
        <DialogTitle className="text-xl">{isRegister ? 'Tạo tài khoản JAMIR' : 'Đăng nhập'}</DialogTitle>
        <DialogDescription className="mt-1">
          {isRegister ? 'Nhận ưu đãi thành viên và theo dõi đơn hàng dễ dàng.' : 'Chào mừng bạn quay lại!'}
        </DialogDescription>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 flex flex-col gap-3.5" noValidate>
          {isRegister && (
            <FormField label="Họ và tên" error={errors.name?.message}>
              <Input autoComplete="name" placeholder="Nguyễn Văn A" {...register('name')} />
            </FormField>
          )}
          <FormField label="Số điện thoại" error={errors.phone?.message}>
            <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="0912 345 678" {...register('phone')} />
          </FormField>
          <FormField label="Mật khẩu" error={errors.password?.message}>
            <Input
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              placeholder="••••••"
              {...register('password')}
            />
          </FormField>
          <Button type="submit" size="lg" className="mt-2 w-full" loading={isSubmitting}>
            {isRegister ? 'Đăng ký' : 'Đăng nhập'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
          <button
            type="button"
            className="cursor-pointer font-semibold text-brand-700 hover:underline"
            onClick={() => {
              reset()
              show(isRegister ? 'login' : 'register')
            }}
          >
            {isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  )
}
