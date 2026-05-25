import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { supabase } from '../../api/supabaseClient'
import { Clock, Users, CalendarPlus, Store } from 'lucide-react'
import { useState } from 'react'
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
        .select('*')
        .eq('business_id', business.id)
        .eq('appointment_date', todayStr)
        .in('status', ['pending', 'confirmed'])
        .order('start_time', { ascending: true })
      if (error) throw error
      return data || []
    },
  })

  const queueAhead = todayAppointments?.length || 0
  const avgServiceDuration = 30 // minutes
  const estimatedWaitTime = queueAhead * avgServiceDuration

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.phone) {
      toast.error('Ad Soyad ve Telefon zorunludur')
      return
    }

    try {
      // First create customer
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

      // Then create appointment
      const { error: apptError } = await supabase
        .from('appointments')
        .insert({
          customer_id: customer.id,
          service_id: null, // Walk-in without specific service
          appointment_date: todayStr,
          start_time: '00:00', // Will be assigned by staff
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
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8">
          {!showAppointmentForm ? (
            <button
              onClick={() => setShowAppointmentForm(true)}
              className="w-full flex items-center justify-center gap-3 bg-primary text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:bg-primary-container transition-all active:scale-95"
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
