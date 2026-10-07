import { toast } from '@/components/ui/toast'
import { useCartStore } from '@/stores/cartStore'
import { useCheckoutStore, type CheckoutLine } from '@/stores/checkoutStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import type { Product } from '@/types/domain'

/** Buy-now / add-to-cart / wishlist for the product currently on screen. */
export function usePurchaseActions(product: Product) {
  const { colorId, quantity } = useSelectionStore()
  const openBuyNow = useCheckoutStore((s) => s.openBuyNow)
  const addToCart = useCartStore((s) => s.add)
  const toggleWishlist = useWishlistStore((s) => s.toggle)

  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0]!
  const line: CheckoutLine = {
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      thumbnail: product.thumbnail,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock,
    },
    colorId: color.id,
    colorName: color.name,
    colorHex: color.hex,
    quantity,
  }
  const inStock = product.stock > 0

  return {
    inStock,
    buyNow: () => inStock && openBuyNow(line),
    addToCart: () => {
      if (!inStock) return
      addToCart(line)
      toast.success('Đã thêm vào giỏ hàng', `${product.name} · ${color.name} × ${quantity}`)
    },
    toggleWishlist: () => {
      const added = toggleWishlist(product.id)
      toast.success(added ? 'Đã thêm vào Yêu thích' : 'Đã bỏ khỏi Yêu thích')
    },
    notifyRestock: () => toast.info('Đã đăng ký nhận thông báo', 'JAMIR sẽ báo bạn ngay khi có hàng trở lại.'),
  }
}
