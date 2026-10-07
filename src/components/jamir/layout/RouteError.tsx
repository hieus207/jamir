import { RotateCcw, TriangleAlert } from 'lucide-react'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'
import { StateBlock } from './PageStates'

/** Router-level error boundary (render errors, failed lazy chunks after a redeploy…). */
export function RouteError() {
  const error = useRouteError()
  const chunkFailed = error instanceof Error && /dynamically imported module|Failed to fetch/i.test(error.message)
  if (import.meta.env.DEV) console.error(error)
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <StateBlock
        icon={TriangleAlert}
        tone="error"
        title={chunkFailed ? 'Đã có phiên bản mới' : 'Đã có lỗi xảy ra'}
        description={
          chunkFailed
            ? 'JAMIR vừa được cập nhật. Tải lại trang để dùng phiên bản mới nhất.'
            : isRouteErrorResponse(error)
              ? `${error.status} — ${error.statusText}`
              : 'Xin lỗi vì sự bất tiện. Vui lòng thử tải lại trang.'
        }
        action={
          <Button onClick={() => window.location.reload()}>
            <RotateCcw aria-hidden="true" />
            Tải lại trang
          </Button>
        }
      />
    </div>
  )
}
