import { FolderLock, ShieldAlert } from 'lucide-react'
import { useEffect } from 'react'
import { FileBrowser } from '@/components/admin/FileBrowser'
import { useAuthDialog, useSession } from '@/components/jamir/auth/authStore'
import { StateBlock } from '@/components/jamir/layout/PageStates'
import { Button } from '@/components/ui/button'

/** /uploads — the uploads folder, browsable and downloadable by admins only (password protected). */
export default function UploadsPage() {
  const user = useSession((s) => s.user)
  const showAuth = useAuthDialog((s) => s.show)

  useEffect(() => {
    document.title = 'Thư mục tải lên — JAMIR'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  if (user?.role !== 'admin')
    return (
      <StateBlock
        icon={user ? ShieldAlert : FolderLock}
        className="min-h-[60vh] justify-center"
        title={user ? 'Tài khoản này không có quyền xem thư mục' : 'Thư mục tải lên cần mật khẩu'}
        description={user ? 'Chỉ tài khoản quản trị mới xem và tải được file trong thư mục uploads.' : 'Đăng nhập bằng tài khoản quản trị để xem và tải file.'}
        action={<Button onClick={() => showAuth('login')}>{user ? 'Đăng nhập tài khoản khác' : 'Đăng nhập'}</Button>}
      />
    )

  return (
    <div className="container-page flex flex-col gap-4 pt-4 pb-24 md:pt-6 md:pb-10">
      <h1 className="text-2xl font-extrabold tracking-tight">Thư mục tải lên</h1>
      <FileBrowser />
    </div>
  )
}
