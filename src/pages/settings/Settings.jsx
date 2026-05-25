import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../api/supabaseClient'
import { useAuthStore } from '../../stores/authStore'
import { Loader2, Save, Store, Clock, QrCode } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { SkeletonCard } from '../../components/ui/Skeleton'

const days = [
  { key: 'monday', label: 'Pazartesi' },
  { key: 'tuesday', label: 'Salı' },
  { key: 'wednesday', label: 'Çarşamba' },
  { key: 'thursday', label: 'Perşembe' },
  { key: 'friday', label: 'Cuma' },
  { key: 'saturday', label: 'Cumartesi' },
  { key: 'sunday', label: 'Pazar' },
]

const defaultHours = () => ({
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '10:00', close: '16:00', closed: false },
  sunday: { open: '10:00', close: '16:00', closed: true },
})

export default function Settings() {
  const businessId = useAuthStore((s) => s.businessId)
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const [form, setForm] = useState(null)
  const [hours, setHours] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['business', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single()
      if (error) throw error
      return data
    },
  })

  const displayForm = form === null && data
    ? { name: data.name || '', phone: data.phone || '', address: data.address || '', slug: data.slug || '' }
    : form || { name: '', phone: '', address: '', slug: '' }

  const displayHours = hours === null && data
    ? (data.opening_hours ? { ...defaultHours(), ...data.opening_hours } : defaultHours())
    : hours || defaultHours()

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: displayForm.name,
          phone: displayForm.phone,
          address: displayForm.address,
          slug: displayForm.slug,
          opening_hours: displayHours,
          owner_id: user?.id,
        })
        .eq('id', businessId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', businessId] })
      toast.success('Ayarlar kaydedildi')
    },
    onError: (err) => {
      console.error('Business update error:', err)
      toast.error(err.message || 'Ayarlar kaydedilemedi')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    updateMutation.mutate()
  }

  const toggleClosed = (key) => {
    setHours((prev) => ({
      ...prev,
      [key]: { ...prev[key], closed: !prev[key].closed },
    }))
  }

  const setTime = (key, field, value) => {
    setHours((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Ayarlar"
        description="İşletme bilgilerinizi ve çalışma saatlerinizi düzenleyin."
      />

      {isLoading ? (
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                <Store className="h-4 w-4 text-indigo-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">İşletme Bilgileri</h2>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">İşletme Adı</label>
                <input
                  type="text"
                  value={displayForm.name}
                  onChange={(e) => setForm({ ...displayForm, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Slug (Public Link)</label>
                <div className="flex items-center mt-1">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    /q/
                  </span>
                  <input
                    type="text"
                    value={displayForm.slug}
                    onChange={(e) => setForm({ ...displayForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    className="flex-1 block w-full rounded-r-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="isletme-adi"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Bu linki müşterilerinizle paylaşın: /q/{displayForm.slug || 'isletme-adi'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefon</label>
                <input
                  type="tel"
                  value={displayForm.phone}
                  onChange={(e) => setForm({ ...displayForm, phone: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Adres</label>
                <textarea
                  value={displayForm.address}
                  onChange={(e) => setForm({ ...displayForm, address: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                <QrCode className="h-4 w-4 text-purple-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Public Link & QR Kod</h2>
            </div>
            <div className="mt-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Müşterileriniz bu linki kullanarak sıra durumunu görebilir:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/q/${displayForm.slug || 'isletme-adi'}`}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/q/${displayForm.slug || 'isletme-adi'}`)
                      toast.success('Link kopyalandı!')
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-container transition-colors"
                  >
                    Kopyala
                  </button>
                </div>
              </div>
              {displayForm.slug && (
                <div className="mt-4 flex justify-center">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/q/${displayForm.slug}`)}`}
                      alt="QR Code"
                      className="w-32 h-32"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Çalışma Saatleri</h2>
            </div>
            <div className="mt-4 space-y-3">
              {days.map((d) => (
                <div key={d.key} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2 sm:w-32">
                    <input
                      type="checkbox"
                      checked={!displayHours[d.key].closed}
                      onChange={() => toggleClosed(d.key)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">{d.label}</span>
                  </div>
                  {displayHours[d.key].closed ? (
                    <span className="text-sm text-gray-400">Kapalı</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={displayHours[d.key].open}
                        onChange={(e) => setTime(d.key, 'open', e.target.value)}
                        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="text-sm text-gray-500">–</span>
                      <input
                        type="time"
                        value={displayHours[d.key].close}
                        onChange={(e) => setTime(d.key, 'close', e.target.value)}
                        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Kaydet
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
