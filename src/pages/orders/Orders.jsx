import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../api/supabaseClient'
import { useAuthStore } from '../../stores/authStore'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonList } from '../../components/ui/Skeleton'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { ShoppingCart, Loader2, Plus, Trash2, Package } from 'lucide-react'
import toast from 'react-hot-toast'

const statusLabels = {
  new: 'Yeni',
  processing: 'Hazırlanıyor',
  ready: 'Hazır',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal',
}

const statusMap = {
  new: { label: 'Yeni', variant: 'warning' },
  processing: { label: 'Hazırlanıyor', variant: 'info' },
  ready: { label: 'Hazır', variant: 'success' },
  delivered: { label: 'Teslim', variant: 'default' },
  cancelled: { label: 'İptal', variant: 'danger' },
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('tr-TR')
}

export default function Orders() {
  const businessId = useAuthStore((state) => state.businessId)
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [cart, setCart] = useState([])
  const [selectedService, setSelectedService] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [customerId, setCustomerId] = useState('')

  console.log('[Orders] businessId:', businessId)

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers(full_name)')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['customers', businessId, 'order-form'],
    enabled: !!businessId,
    queryFn: async () => {
      console.log('[Orders] customers query triggered with businessId:', businessId)
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name')
        .eq('business_id', businessId)
        .order('full_name')
      console.log('[Orders] customers query result:', { data, error })
      if (error) throw error
      return data
    },
  })

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services', businessId, 'order-form'],
    enabled: !!businessId,
    queryFn: async () => {
      console.log('[Orders] services query triggered with businessId:', businessId)
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price')
        .eq('business_id', businessId)
        .order('name')
      console.log('[Orders] services query result:', { data, error })
      if (error) throw error
      return data
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const { error } = await supabase.from('orders').insert({
        business_id: businessId,
        customer_id: customerId || null,
        items: cart.map((item) => ({
          service_id: item.service_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total_amount: total,
        status: 'new',
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', businessId] })
      toast.success('Sipariş eklendi')
      setOpen(false)
      resetForm()
    },
    onError: (err) => {
      toast.error(err.message || 'Sipariş eklenemedi')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', businessId] })
      toast.success('Durum güncellendi')
    },
    onError: (err) => {
      toast.error(err.message || 'Durum güncellenemedi')
    },
  })

  const addToCart = () => {
    if (!selectedService) {
      toast.error('Lütfen bir ürün/hizmet seçin')
      return
    }
    const svc = services?.find((s) => s.id === selectedService)
    if (!svc) return
    setCart((prev) => {
      const existing = prev.find((i) => i.service_id === svc.id)
      if (existing) {
        return prev.map((i) =>
          i.service_id === svc.id ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      return [...prev, { service_id: svc.id, name: svc.name, price: svc.price, quantity }]
    })
    setSelectedService('')
    setQuantity(1)
  }

  const removeFromCart = (serviceId) => {
    setCart((prev) => prev.filter((i) => i.service_id !== serviceId))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const resetForm = () => {
    setCart([])
    setSelectedService('')
    setQuantity(1)
    setCustomerId('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (cart.length === 0) {
      toast.error('Sepete en az bir ürün ekleyin')
      return
    }
    createMutation.mutate()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero / Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h3 className="font-semibold text-2xl mb-2 text-primary">Siparişler</h3>
          <p className="text-on-surface-variant max-w-xl">
            Gelen siparişleri takip edin ve durumlarını güncelleyin.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:-translate-y-1 transition-all active:scale-95"
        >
          <ShoppingCart className="h-5 w-5" />
          Yeni Sipariş
        </button>
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : !orders || orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Siparişlerinizi buradan takip edin"
          description="İlk siparişinizi oluşturarak satışlarınızı yönetmeye başlayın."
          action={{
            label: 'Yeni Sipariş Oluştur',
            onClick: () => setOpen(true)
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-outline-variant/20 bg-surface/80 shadow-sm backdrop-blur-sm">
          <ul className="divide-y divide-outline-variant/10">
            {orders.map((order) => (
              <li key={order.id} className="group p-4 sm:px-6 transition-all hover:bg-secondary-container/5 hover:shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <ShoppingCart className="h-3.5 w-3.5 text-outline" />
                        <p className="text-sm font-semibold text-on-surface">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <Badge variant={statusMap[order.status]?.variant || 'default'}>
                        {statusMap[order.status]?.label || order.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-on-surface-variant">
                      {order.customers?.full_name || 'Bilinmiyor'} · {formatDate(order.created_at)}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {(order.items || []).map((item, idx) => (
                        <li key={idx} className="text-xs text-on-surface-variant">
                          {item.quantity}x {item.name} — {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                          }).format(item.price * item.quantity)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-on-surface">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                        order.total_amount
                      )}
                    </p>
                    <select
                      value={order.status}
                      onChange={(e) => updateStatusMutation.mutate({ id: order.id, status: e.target.value })}
                      className="rounded-lg border border-outline-variant px-2 py-1 text-xs font-medium text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface-container"
                    >
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal isOpen={open} onClose={() => { setOpen(false); resetForm() }} title="Yeni Sipariş">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface">Müşteri (isteğe bağlı)</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={!businessId || customersLoading}
            >
              <option value="">Seçiniz</option>
              {customersLoading ? (
                <option value="">Yükleniyor...</option>
              ) : customers?.length === 0 ? (
                <option value="">Müşteri bulunamadı</option>
              ) : (
                customers?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface">Ürün / Hizmet Ekle</label>
            <div className="mt-1 flex gap-2">
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="block flex-1 rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={!businessId || servicesLoading}
              >
                <option value="">Seçiniz</option>
                {servicesLoading ? (
                  <option value="">Yükleniyor...</option>
                ) : services?.length === 0 ? (
                  <option value="">Ürün veya hizmet bulunamadı</option>
                ) : (
                  services?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(s.price)}
                    </option>
                  ))
                )}
              </select>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                className="w-20 rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={addToCart}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-3 text-sm font-medium text-white hover:bg-primary-container transition-colors"
              >
                <Plus className="h-4 w-4" />
                Ekle
              </button>
            </div>
          </div>

          {cart.length > 0 && (
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
              <ul className="space-y-2">
                {cart.map((item) => (
                  <li key={item.service_id} className="flex items-center justify-between text-sm">
                    <span className="text-on-surface">
                      {item.quantity}x {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-on-surface-variant">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                          item.price * item.quantity
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.service_id)}
                        aria-label="Sepetten kaldır"
                        className="rounded p-1 text-outline hover:bg-error-container/20 hover:text-error transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-outline-variant/20 pt-2 text-sm font-semibold">
                <span>Toplam</span>
                <span className="text-on-surface">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(cartTotal)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setOpen(false); resetForm() }}
              className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-container disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Kaydet
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
