import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../api/supabaseClient'
import { useAuthStore } from '../../stores/authStore'
import { UserPlus, Loader2, Trash2, Phone, TrendingUp, Calendar, FileText, Search, X, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonList } from '../../components/ui/Skeleton'
import { Modal } from '../../components/ui/Modal'
import { useSearchParams } from 'react-router-dom'

export default function Customers() {
  const businessId = useAuthStore((s) => s.businessId)
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ full_name: '', phone: '', notes: '' })
  const searchTerm = searchParams.get('q') || ''

  const resetForm = () => {
    setEditingId(null)
    setForm({ full_name: '', phone: '', notes: '' })
  }

  const clearSearch = () => {
    setSearchParams({})
  }

  const { data, isLoading } = useQuery({
    queryKey: ['customers', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', businessId)
        .order('full_name')
      if (error) throw error
      return data
    },
  })

  const { data: customerStats } = useQuery({
    queryKey: ['customer-stats', selectedCustomer?.id, businessId],
    enabled: !!selectedCustomer?.id && !!businessId,
    queryFn: async () => {
      const { count: appointmentCount, error: apptCountError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', selectedCustomer.id)
        .eq('business_id', businessId)
      if (apptCountError) throw apptCountError

      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('customer_id', selectedCustomer.id)
        .eq('business_id', businessId)
      if (orderError) throw orderError

      const { data: lastAppointment, error: lastVisitError } = await supabase
        .from('appointments')
        .select('appointment_date')
        .eq('customer_id', selectedCustomer.id)
        .eq('business_id', businessId)
        .order('appointment_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (lastVisitError) throw lastVisitError

      const totalSpending = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0

      return {
        totalSpending,
        appointmentCount: appointmentCount || 0,
        lastVisit: lastAppointment?.appointment_date || null,
      }
    },
  })

  const createMutation = useMutation({
    mutationFn: async (values) => {
      if (!businessId) throw new Error('businessId bulunamadı. Lütfen tekrar giriş yapın.')
      const { error } = await supabase.from('customers').insert({ ...values, business_id: businessId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', businessId] })
      toast.success('Müşteri eklendi')
      setOpen(false)
      resetForm()
    },
    onError: (err) => toast.error(err.message || 'Müşteri eklenemedi'),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }) => {
      const { error } = await supabase.from('customers').update(values).eq('id', id).eq('business_id', businessId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', businessId] })
      toast.success('Müşteri güncellendi')
      setOpen(false)
      setProfileOpen(false)
      resetForm()
    },
    onError: (err) => toast.error(err.message || 'Müşteri güncellenemedi'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', businessId] })
      toast.success('Müşteri silindi')
    },
    onError: (err) => toast.error(err.message || 'Müşteri silinemedi'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.full_name || !form.phone) {
      toast.error('Ad Soyad ve Telefon zorunludur')
      return
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, values: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase('tr-TR')
  const filteredCustomers = data?.filter((customer) => {
    if (!normalizedSearch) return true
    const name = customer.full_name?.toLocaleLowerCase('tr-TR') || ''
    const phone = customer.phone || ''
    return name.includes(normalizedSearch) || phone.includes(normalizedSearch)
  }) || []

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Hero / Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-6 md:mb-8">
        <div>
          <h3 className="font-semibold text-2xl mb-2 text-primary">Müşteriler</h3>
          <p className="text-on-surface-variant max-w-xl">
            Müşteri listenizi görüntüleyin ve yeni kayıtlar ekleyin.
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
            <input
              type="text"
              placeholder="İsim veya telefon ara..."
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value
                setSearchParams(value ? { q: value } : {})
              }}
              className="pl-10 pr-4 py-3 rounded-xl border border-outline-variant/20 bg-surface-container text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm()
              setOpen(true)
              setTimeout(() => window.scrollTo(0, 0), 100)
            }}
            className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:-translate-y-1 transition-all active:scale-95 w-full md:w-auto"
          >
            <UserPlus className="h-5 w-5" />
            Yeni Müşteri
          </button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Müşterilerinizi buradan yönetin"
          description="İlk müşterinizi ekleyerek müşteri veritabanınızı oluşturmaya başlayın."
          action={{
            label: 'Yeni Müşteri Ekle',
            onClick: () => setOpen(true),
          }}
        />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sonuç bulunamadı"
          description="Arama kriterlerine uygun müşteri yok."
          action={{
            label: 'Aramayı Temizle',
            onClick: clearSearch,
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-outline-variant/20 bg-surface/80 shadow-sm backdrop-blur-sm">
          <ul className="divide-y divide-outline-variant/10">
            {filteredCustomers.map((c) => (
              <li
                key={c.id}
                className="group flex items-center justify-between p-4 sm:px-6 transition-all hover:bg-tertiary-container/5 hover:shadow-sm cursor-pointer"
                onClick={() => {
                  setSelectedCustomer(c)
                  setProfileOpen(true)
                }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-tertiary-container/10 to-surface shadow-sm ring-1 ring-tertiary/10 shrink-0">
                    <span className="text-sm font-semibold text-tertiary">
                      {c.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{c.full_name}</p>
                    <div className="flex items-center gap-1 text-sm text-on-surface-variant">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{c.phone}</span>
                    </div>
                    {c.notes && <p className="mt-0.5 text-xs text-outline truncate">{c.notes}</p>}
                    {c.loyalty_points > 0 && (
                      <p className="text-xs text-yellow-600 mt-0.5">⭐ {c.loyalty_points} puan</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) {
                      deleteMutation.mutate(c.id)
                    }
                  }}
                  className="rounded-lg p-2 text-outline hover:bg-error-container/20 hover:text-error transition-colors shrink-0"
                  title="Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Yeni Müşteri Modalı */}
      <Modal
        isOpen={open && !editingId}
        onClose={() => {
          setOpen(false)
          resetForm()
        }}
        title="Yeni Müşteri"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface">Ad Soyad</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface">Telefon</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface">Notlar</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                resetForm()
              }}
              className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-container disabled:opacity-50 transition-colors"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {editingId ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Düzenleme Modalı */}
      {open && editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-2 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Müşteriyi Düzenle</h2>
              <button
                onClick={() => {
                  setOpen(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface">Ad Soyad</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface">Telefon</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface">Notlar</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    resetForm()
                  }}
                  className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-container disabled:opacity-50 transition-colors"
                >
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Müşteri Profili Modalı */}
      {profileOpen && (
        <div
          onClick={() => setProfileOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6"
          >
            <div className="max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-outline-variant/10 p-5">
                <h3 className="text-lg font-semibold text-on-surface">Müşteri Profili</h3>
                <button
                  onClick={() => setProfileOpen(false)}
                  className="p-2 rounded-lg hover:bg-surface-container transition-colors"
                  aria-label="Kapat"
                >
                  <X className="h-5 w-5 text-outline" />
                </button>
              </div>

              {selectedCustomer && (
                <div className="space-y-6 p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-primary text-2xl font-bold text-white shadow-lg shadow-primary/20">
                      {selectedCustomer.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-semibold text-on-surface truncate">
                        {selectedCustomer.full_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <Phone className="h-4 w-4" />
                        {selectedCustomer.phone}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="bg-surface-container-low rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-xs text-on-surface-variant">Toplam Harcama</span>
                      </div>
                      <p className="text-2xl font-bold text-on-surface">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        }).format(customerStats?.totalSpending || 0)}
                      </p>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-secondary" />
                        <span className="text-xs text-on-surface-variant">Randevu Sayısı</span>
                      </div>
                      <p className="text-2xl font-bold text-on-surface">
                        {customerStats?.appointmentCount || 0}
                      </p>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-tertiary" />
                        <span className="text-xs text-on-surface-variant">Son Ziyaret</span>
                      </div>
                      <p className="text-xl font-bold text-on-surface">
                        {customerStats?.lastVisit
                          ? new Date(customerStats.lastVisit).toLocaleDateString('tr-TR')
                          : '-'}
                      </p>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-outline" />
                        <span className="text-xs text-on-surface-variant">Notlar</span>
                      </div>
                      <p className="line-clamp-4 text-sm font-medium text-on-surface">
                        {selectedCustomer.notes || '-'}
                      </p>
                    </div>
                    {/* ⭐ SADAKAT PUANI KARTI */}
                    <div className="bg-surface-container-low rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs text-on-surface-variant">Sadakat Puanı</span>
                      </div>
                      <p className="text-2xl font-bold text-on-surface">{selectedCustomer.loyalty_points ?? 0}</p>
                      {(selectedCustomer.loyalty_points ?? 0) >= 100 && (
                        <button
                          onClick={async () => {
                            try {
                              const { data, error } = await supabase.rpc('generate_discount_code', {
                                customer_id: selectedCustomer.id,
                                points: 100
                              })
                              if (error) throw error
                              toast.success(`İndirim kodunuz: ${data} (100 puan kullanıldı)`)
                              queryClient.invalidateQueries({ queryKey: ['customers', businessId] })
                              setProfileOpen(false)
                            } catch (err) {
                              toast.error(err.message || 'Kod oluşturulamadı')
                            }
                          }}
                          className="mt-2 w-full text-xs bg-primary text-white py-1.5 rounded-lg hover:bg-primary-container transition-colors"
                        >
                          100 Puanı Kullan (İndirim Kodu Al)
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingId(selectedCustomer.id)
                      setProfileOpen(false)
                      setOpen(true)
                      setForm({
                        full_name: selectedCustomer.full_name || '',
                        phone: selectedCustomer.phone || '',
                        notes: selectedCustomer.notes || '',
                      })
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:bg-primary-container transition-all"
                  >
                    <UserPlus className="h-5 w-5" />
                    Düzenle
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}