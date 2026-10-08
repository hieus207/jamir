import { Compass } from 'lucide-react'
import { Link } from 'react-router'
import { StateBlock } from '@/components/jamir/layout/PageStates'
import { buttonVariants } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <StateBlock
      icon={Compass}
      titleAs="h1"
      title="Trang không tồn tại"
      description="Đường dẫn có thể đã thay đổi. Quay lại trang chủ để tiếp tục mua sắm nhé."
      className="min-h-[60vh] justify-center"
      action={
        <Link to="/" className={buttonVariants({ variant: 'primary' })}>
          Về trang chủ
        </Link>
      }
    />
  )
}
