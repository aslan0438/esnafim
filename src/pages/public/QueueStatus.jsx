import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { supabase } from '../../api/supabaseClient'
import { Clock, Users, CalendarPlus, Store } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function QueueStatus() {
  const { slug } = useParams()
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', notes: '' })

  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ['business-by-slug', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', slug)
        .single()
      if (error) throw error
      return data
    },
  })

  const todayStr = new Date().toISOString().split('T')[0]

  const { data: todayAppointments } = useQuery({
    queryKey: ['today-appointments-public', business?.id, todayStr],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, customers(full_name)')
        .eq('business_id', business.id)
        .eq('appointment_date', todayStr)
        .in('status', ['pending', 'confirmed'])
        .order('start_time', { ascending: true })
      if (error) throw error
      return data || []
    },
  })

  const { data: services } = useQuery({
    queryKey: ['services-public', business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, duration_minutes')
        .eq('business_id', business.id)
      if (error) throw error
      return data || []
    },
  })

  const isClosedToday = (openingHours) => {
    if (!openingHours) return true
    const today = new Date().getDay()
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const todayKey = dayMap[today]
    return openingHours[todayKey]?.closed || false
  }

  const isOpenNow = (openingHours) => {
    if (!openingHours) return false
    const now = new Date()
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const todayKey = dayMap[now.getDay()]
    const hours = openingHours[todayKey]
    if (!hours || hours.closed) return false
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    return currentTime >= hours.open && currentTime <= hours.close
  }

  const queueAhead = todayAppointments?.length || 0
  const avgServiceDuration = services && services.length > 0
    ? Math.round(services.reduce((sum, s) => sum + (s.duration_minutes || 30), 0) / services.length)
    : 30
  const estimatedWaitTime = queueAhead * avgServiceDuration

  useEffect(() => {
    if (!business?.id) return
    const channel = supabase
      .channel(`queue-status-${business.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `business_id=eq.${business.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['today-appointments-public', business?.id, todayStr] })
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [business?.id, queryClient, todayStr])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.phone) {
      toast.error('Ad Soyad ve Telefon zorunludur')
      return
    }

    try {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          full_name: form.full_name,
          phone: form.phone,
          notes: form.notes,
          business_id: business.id,
        })
        .select()
        .single()

      if (customerError) throw customerError

      const { error: apptError } = await supabase
        .from('appointments')
        .insert({
          customer_id: customer.id,
          service_id: null,
          appointment_date: todayStr,
          start_time: '00:00',
          notes: form.notes,
          status: 'pending',
          business_id: business.id,
        })

      if (apptError) throw apptError

      toast.success('Sıraya alındınız!')
      setShowAppointmentForm(false)
      setForm({ full_name: '', phone: '', notes: '' })
    } catch (error) {
      toast.error(error.message || 'Sıraya alınamadı')
    }
  }

  if (businessLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-on-surface-variant">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-center p-8">
          <Store className="h-16 w-16 text-outline mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-on-surface mb-2">İşletme Bulunamadı</h1>
          <p className="text-on-surface-variant">Bu link geçersiz olabilir.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="max-w-2xl mx-auto px-6 py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
              <Store className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold text-primary">{business.name}</h1>
          </div>
          <p className="text-on-surface-variant">{business.address}</p>
          {business.phone && <p className="text-on-surface-variant">{business.phone}</p>}
        </div>
      </div>

      {/* Queue Status */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Queue Ahead */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-container/10 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-on-surface-variant">Önünüzdeki Kişi</span>
            </div>
            <p className="text-4xl font-bold text-primary">{queueAhead}</p>
            <p className="text-sm text-on-surface-variant mt-1">kişi sıra bekliyor</p>
          </div>

          {/* Estimated Wait Time */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-secondary-container/10 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-secondary" />
              </div>
              <span className="text-sm font-medium text-on-surface-variant">Tahmini Bekleme</span>
            </div>
            <p className="text-4xl font-bold text-secondary">{estimatedWaitTime}</p>
            <p className="text-sm text-on-surface-variant mt-1">dakika</p>
            {business?.opening_hours && !isOpenNow(business.opening_hours) && (
              <p className="mt-2 text-xs text-error font-medium">Kapalı</p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8">
          {!showAppointmentForm ? (
            <button
              onClick={() => setShowAppointmentForm(true)}
              disabled={business?.opening_hours && !isOpenNow(business.opening_hours)}
              className="w-full flex items-center justify-center gap-3 bg-primary text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CalendarPlus className="h-5 w-5" />
              Sıraya Gir / Randevu Al
            </button>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-outline-variant/10">
              <h3 className="text-lg font-semibold text-on-surface mb-4">Randevu Formu</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">Ad Soyad</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">Notlar</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-outline-variant px-4 py-3 text-sm bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAppointmentForm(false)}
                    className="flex-1 rounded-lg border border-outline-variant px-4 py-3 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-container transition-colors"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Waiting List */}
        {todayAppointments && todayAppointments.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg border border-outline-variant/10 p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Sıradaki Kişiler</h3>
            <div className="space-y-3">
              {todayAppointments.map((appt, idx) => (
                <div key={appt.id} className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant/10 bg-surface-container-low">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    idx === 0 ? 'bg-primary text-white' : 'bg-surface text-on-surface-variant'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">
                      {appt.customers?.full_name || 'Bekleyen'}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {appt.start_time?.slice(0, 5) || 'Henüz saat atanmadı'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-on-surface-variant">
            Bu sayfa gerçek zamanlı güncellenir. Lütfen sayfayı yenileyin.
          </p>
        </div>
      </div>
    </div>
  )
}