import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../api/supabaseClient'
import { useAuthStore } from '../../stores/authStore'
import { Plus, Loader2, Trash2, Tag, Edit } from 'lucide-react'
import toast from 'react-hot-toast'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonList } from '../../components/ui/Skeleton'
import { Modal } from '../../components/ui/Modal'

const iconMap = {
  service: Tag,
  product: Tag,
}

const colorMap = {
  service: { bg: 'bg-primary-container/10', text: 'text-primary' },
  product: { bg: 'bg-secondary-container/10', text: 'text-secondary' },
}

export default function Services() {
  const businessId = useAuthStore((s) => s.businessId)
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    price: '',
    duration_minutes: '',
    category: 'service',
  })

  console.log('[Services] businessId:', businessId)

  const { data, isLoading } = useQuery({
    queryKey: ['services', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      console.log('[Services] Fetching services for businessId:', businessId)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .order('name')
      console.log('[Services] Services result:', data)
      if (error) throw error
      return data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (values) => {
      const { error } = await supabase.from('services').insert({
        ...values,
        price: Number(values.price) || 0,
        duration_minutes: Number(values.duration_minutes) || 0,
        business_id: businessId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', businessId] })
      toast.success('Hizmet eklendi')
      setOpen(false)
      resetForm()
    },
    onError: (err) => {
      toast.error(err.message || 'Hizmet eklenemedi')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }) => {
      const { error } = await supabase.from('services').update({
        ...values,
        price: Number(values.price) || 0,
        duration_minutes: Number(values.duration_minutes) || 0,
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', businessId] })
      toast.success('Hizmet güncellendi')
      setOpen(false)
      resetForm()
    },
    onError: (err) => {
      toast.error(err.message || 'Hizmet güncellenemedi')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('services').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', businessId] })
      toast.success('Hizmet silindi')
    },
    onError: (err) => {
      toast.error(err.message || 'Hizmet silinemedi')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.price) {
      toast.error('İsim ve Fiyat zorunludur')
      return
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, values: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const handleEdit = (service) => {
    setEditingId(service.id)
    setForm({
      name: service.name,
      price: service.price,
      duration_minutes: service.duration_minutes,
      category: service.category,
    })
    setOpen(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setForm({ name: '', price: '', duration_minutes: '', category: 'service' })
  }

  const formatPrice = (val) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero / Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h3 className="font-semibold text-2xl mb-2 text-primary">Hizmet Portföyü</h3>
          <p className="text-on-surface-variant max-w-xl">
            İşletmenizin sunduğu profesyonel hizmetleri yönetin, fiyatlandırın ve randevu akışını optimize edin.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setOpen(true)
          }}
          className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:-translate-y-1 transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Yeni Hizmet Ekle
        </button>
      </div>

      {isLoading ? (
        <SkeletonList count={6} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Hizmetlerinizi buradan yönetin"
          description="İlk hizmetinizi ekleyerek portföyünüzü oluşturmaya başlayın."
          action={{
            label: 'Yeni Hizmet Ekle',
            onClick: () => {
              resetForm()
              setOpen(true)
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((s, index) => {
            const Icon = iconMap[s.category] || Tag
            const colors = colorMap[s.category] || colorMap.service
            const isFeatured = index === 2

            return (
              <div
                key={s.id}
                className={`glass-card rounded-xl p-6 flex flex-col gap-4 group transition-all hover:shadow-xl ${
                  isFeatured ? 'lg:col-span-1 bg-gradient-to-br from-white/60 to-primary-container/5' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center ${colors.text}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="bg-surface-container-highest/50 px-3 py-1 rounded-full text-sm font-bold text-on-surface-variant">
                    {s.duration_minutes ? `${s.duration_minutes} Dakika` : 'Ürün'}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">{s.name}</h4>
                  <p className="text-on-surface-variant text-base mt-1">
                    {s.category === 'service' ? 'Profesyonel hizmet sunumu.' : 'Ürün satışı.'}
                  </p>
                </div>
                <div className="mt-auto pt-4 border-t border-outline-variant/10 flex justify-between items-center">
                  <span className="text-lg font-bold text-primary">{formatPrice(s.price)}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(s)}
                      className="p-2 rounded-lg hover:bg-surface-container text-outline transition-colors"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Bu hizmeti silmek istediğinize emin misiniz?')) {
                          deleteMutation.mutate(s.id)
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-error-container/20 text-error transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={open} onClose={() => { setOpen(false); resetForm() }} title={editingId ? 'Hizmet Düzenle' : 'Yeni Hizmet'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface">İsim</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface">Fiyat (₺)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface">Süre (dk)</label>
              <input
                type="number"
                min="1"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface">Kategori</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="service">Hizmet</option>
              <option value="product">Ürün</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-container disabled:opacity-50 transition-colors"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
