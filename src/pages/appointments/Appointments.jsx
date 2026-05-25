import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../api/supabaseClient'
import { useAuthStore } from '../../stores/authStore'
import { CalendarPlus, Loader2, List, Calendar as CalendarIcon } from 'lucide-react'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonList } from '../../components/ui/Skeleton'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import Calendar from '../../components/ui/Calendar'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useNavigate, useSearchParams } from 'react-router-dom'

const statusLabels = {
  pending: 'Bekliyor',
  confirmed: 'Onaylandı',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
}

const statusMap = {
  pending: { label: 'Bekliyor', variant: 'warning' },
  confirmed: { label: 'Onaylandı', variant: 'info' },
  completed: { label: 'Tamamlandı', variant: 'success' },
  cancelled: { label: 'İptal', variant: 'danger' },
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  return timeStr.slice(0, 5)
}

function getSmartDateLabel(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const diffDays = Math.round((date - today) / 86400000)
  if (diffDays === 0) return 'Bugün'
  if (diffDays === 1) return 'Yarın'
  if (diffDays === -1) return 'Dün'
  if (diffDays > 1 && diffDays <= 7) return `${diffDays} gün sonra`
  return ''
}

export default function Appointments() {
  const businessId = useAuthStore((state) => state.businessId)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('list') // 'list' or 'calendar'
  const [selectedDate, setSelectedDate] = useState(null)
  const [form, setForm] = useState({
    customer_id: '',
    service_id: '',
    appointment_date: '',
    start_time: '',
    notes: '',
    status: 'pending',
  })
  const shouldOpenFromQuery = searchParams.get('new') === '1'
  console.log('[Appointments] businessId:', businessId)

  const closeModal = () => {
    setOpen(false)
    if (searchParams.get('new')) {
      navigate('/randevular', { replace: true })
    }
  }

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, customers(full_name, phone), services(name)')
        .eq('business_id', businessId)
        .order('appointment_date', { ascending: false })
        .order('start_time', { ascending: true })
      if (error) throw error
      return data
    },
  })

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['customers', businessId, 'appointment-form'],
    enabled: !!businessId,
    queryFn: async () => {
      console.log('[Appointments] customers query triggered with businessId:', businessId)
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name')
        .eq('business_id', businessId)
        .order('full_name')
      console.log('[Appointments] customers query result:', { data, error })
      if (error) throw error
      return data
    },
  })

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services', businessId, 'appointment-form'],
    enabled: !!businessId,
    queryFn: async () => {
      console.log('[Appointments] services query triggered with businessId:', businessId)
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .eq('business_id', businessId)
        .eq('category', 'service')
        .order('name')
      console.log('[Appointments] services query result:', { data, error })
      if (error) throw error
      return data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (values) => {
      const { error } = await supabase.from('appointments').insert({
        ...values,
        business_id: businessId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] })
      toast.success('Randevu eklendi')
      closeModal()
      setForm({ customer_id: '', service_id: '', appointment_date: '', start_time: '', notes: '', status: 'pending' })
    },
    onError: (err) => {
      toast.error(err.message || 'Randevu eklenemedi')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] })
      toast.success('Durum güncellendi')
    },
    onError: (err) => {
      toast.error(err.message || 'Durum güncellenemedi')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.customer_id || !form.service_id || !form.appointment_date || !form.start_time) {
      toast.error('Lütfen tüm zorunlu alanları doldurun')
      return
    }
    createMutation.mutate(form)
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    const dateStr = format(date, 'yyyy-MM-dd')
    setForm({ ...form, appointment_date: dateStr })
    setOpen(true)
  }

  const grouped = appointments?.reduce((acc, ap) => {
    const key = ap.appointment_date
    if (!acc[key]) acc[key] = []
    acc[key].push(ap)
    return acc
  }, {}) || {}

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  // Filter appointments by selected date if in calendar view
  const filteredAppointments = selectedDate
    ? appointments?.filter(ap => ap.appointment_date === format(selectedDate, 'yyyy-MM-dd')) || []
    : appointments

  const filteredGrouped = selectedDate
    ? { [format(selectedDate, 'yyyy-MM-dd')]: filteredAppointments }
    : grouped

  const filteredSortedDates = selectedDate
    ? [format(selectedDate, 'yyyy-MM-dd')]
    : sortedDates

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero / Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h3 className="font-semibold text-2xl mb-2 text-primary">Randevular</h3>
          <p className="text-on-surface-variant max-w-xl">
            Müşteri randevularınızı planlayın ve yönetin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-container rounded-lg p-1">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'list' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <List className="h-4 w-4" />
              Liste
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'calendar' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              Takvim
            </button>
          </div>
          <button
            onClick={() => {
              setSelectedDate(null)
              setOpen(true)
            }}
            className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:-translate-y-1 transition-all active:scale-95"
          >
            <CalendarPlus className="h-5 w-5" />
            Yeni Randevu
          </button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : view === 'calendar' ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              appointments={appointments}
            />
          </div>
          <div className="lg:col-span-1">
            {selectedDate ? (
              <div className="bg-white rounded-2xl shadow-lg border border-outline-variant/10 p-6">
                <h3 className="font-semibold text-lg mb-4 text-on-surface">
                  {format(selectedDate, 'd MMMM yyyy', { locale: tr })}
                </h3>
                {filteredAppointments.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-8">
                    Bu tarihte randevu yok
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredAppointments.map((ap) => (
                      <div
                        key={ap.id}
                        className="flex items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-low p-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-surface shadow-sm">
                          <span className="text-xs font-semibold text-primary">{formatTime(ap.start_time)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-on-surface">
                            {ap.customers?.full_name || 'Bilinmiyor'}
                          </p>
                          <p className="truncate text-xs text-on-surface-variant">
                            {ap.services?.name || 'Bilinmiyor'}
                          </p>
                        </div>
                        <Badge variant={statusMap[ap.status]?.variant || 'default'} className="shrink-0">
                          {statusMap[ap.status]?.label || ap.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-outline-variant/10 p-6">
                <p className="text-sm text-on-surface-variant text-center py-8">
                  Takvimden bir tarih seçin
                </p>
              </div>
            )}
          </div>
        </div>
      ) : sortedDates.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="Randevularınızı buradan planlayın"
          description="İlk randevunuzu oluşturarak müşterilerinizle bağlantı kurmaya başlayın."
          action={{
            label: 'Yeni Randevu Oluştur',
            onClick: () => {
              setSelectedDate(null)
              setOpen(true)
            }
          }}
        />
      ) : (
        <div className="space-y-8">
          {filteredSortedDates.map((date) => (
            <div key={date}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                {formatDate(date)}
              </h2>
              <div className="overflow-hidden rounded-xl border border-outline-variant/20 bg-surface/80 shadow-sm backdrop-blur-sm">
                <ul className="divide-y divide-outline-variant/10">
                  {filteredGrouped[date].map((ap) => (
                    <li key={ap.id} className="group p-4 sm:px-6 transition-all hover:bg-primary-container/5 hover:shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary-container/10 to-surface text-center shadow-sm ring-1 ring-primary/10">
                            <span className="text-xs font-medium text-primary">
                              {formatDate(ap.appointment_date).split('.')[1]}
                            </span>
                            <span className="text-lg font-bold text-on-surface">
                              {formatDate(ap.appointment_date).split('.')[0]}
                            </span>
                          </div>
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tertiary-container/10 text-sm font-bold text-tertiary ring-1 ring-tertiary/10">
                            {(ap.customers?.full_name || 'M').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-on-surface">
                                {ap.customers?.full_name || 'Bilinmiyor'}
                              </p>
                              {getSmartDateLabel(ap.appointment_date) && (
                                <span className="rounded-full bg-primary-container/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                  {getSmartDateLabel(ap.appointment_date)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-on-surface-variant">
                              {ap.services?.name || 'Bilinmiyor'} · {formatTime(ap.start_time)}
                            </p>
                            {ap.notes && (
                              <p className="mt-0.5 text-xs text-outline">{ap.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            value={ap.status}
                            onChange={(e) =>
                              updateStatusMutation.mutate({ id: ap.id, status: e.target.value })
                            }
                            className="rounded-lg border border-outline-variant px-2 py-1 text-xs font-medium text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer bg-surface-container"
                          >
                            {Object.entries(statusLabels).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <Badge variant={statusMap[ap.status]?.variant || 'default'}>
                            {statusMap[ap.status]?.label || ap.status}
                          </Badge>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={open || shouldOpenFromQuery} onClose={closeModal} title="Yeni Randevu">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!businessId && (
            <div className="bg-error-container/10 border border-error/20 rounded-lg p-3 text-sm text-error">
              İşletme bilgisi yükleniyor. Lütfen bekleyin veya sayfayı yenileyin.
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-on-surface">Müşteri</label>
            <select
              value={form.customer_id}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
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
            <label className="block text-sm font-medium text-on-surface">Hizmet</label>
            <select
              value={form.service_id}
              onChange={(e) => setForm({ ...form, service_id: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
              disabled={!businessId || servicesLoading}
            >
              <option value="">Seçiniz</option>
              {servicesLoading ? (
                <option value="">Yükleniyor...</option>
              ) : services?.length === 0 ? (
                <option value="">Hizmet bulunamadı</option>
              ) : (
                services?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface">Tarih</label>
              <input
                type="date"
                value={form.appointment_date}
                onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface">Saat</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
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
              onClick={closeModal}
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
