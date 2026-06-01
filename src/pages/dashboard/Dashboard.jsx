import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../api/supabaseClient'
import { useAuthStore } from '../../stores/authStore'
import { Badge } from '../../components/ui/Badge'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  CalendarDays,
  ShoppingBag,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  Package,
  CalendarPlus,
  UserPlus,
  Plus,
  Sparkles,
  Sun,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const currency = (val) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)

const formatTime = (t) => t?.slice(0, 5) || ''

export default function Dashboard() {
  const businessId = useAuthStore((s) => s.businessId)
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const currentHour = new Date().getHours()
  const showDailySummary = currentHour >= 20 && currentHour < 21

  // Mevcut istatistikler
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { count: todayAppts } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('appointment_date', todayStr)

      const { count: activeOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .in('status', ['new', 'processing', 'ready'])

      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)

      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('business_id', businessId)
        .in('status', ['ready', 'delivered'])

      const totalRevenue = revenueData?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0

      return {
        todayAppts: todayAppts || 0,
        activeOrders: activeOrders || 0,
        totalCustomers: totalCustomers || 0,
        totalRevenue,
      }
    },
  })

  // Bugünkü randevular
  const { data: todayAppointments, isLoading: apptsLoading } = useQuery({
    queryKey: ['dashboard-today-appts', businessId, todayStr],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, customers(full_name, phone), services(name)')
        .eq('business_id', businessId)
        .eq('appointment_date', todayStr)
        .order('start_time', { ascending: true })
      if (error) throw error
      return data || []
    },
  })

  // Son siparişler
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['dashboard-recent-orders', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers(full_name)')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data || []
    },
  })

  // Haftalık karşılaştırma
  const { data: weeklyComparison } = useQuery({
    queryKey: ['weekly-comparison', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const now = new Date()
      const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
      const lastWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7)
      const lastWeekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())

      const { count: thisWeekAppts } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('appointment_date', thisWeekStart.toISOString().split('T')[0])

      const { count: lastWeekAppts } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('appointment_date', lastWeekStart.toISOString().split('T')[0])
        .lt('appointment_date', lastWeekEnd.toISOString().split('T')[0])

      const { data: thisWeekRevenue } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('business_id', businessId)
        .gte('created_at', thisWeekStart.toISOString())
        .in('status', ['ready', 'delivered'])

      const { data: lastWeekRevenue } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('business_id', businessId)
        .gte('created_at', lastWeekStart.toISOString())
        .lt('created_at', lastWeekEnd.toISOString())
        .in('status', ['ready', 'delivered'])

      const thisWeekTotal = thisWeekRevenue?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
      const lastWeekTotal = lastWeekRevenue?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0

      const apptChange = lastWeekAppts > 0 ? ((thisWeekAppts - lastWeekAppts) / lastWeekAppts) * 100 : 0
      const revenueChange = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0

      return {
        thisWeekAppts: thisWeekAppts || 0,
        lastWeekAppts: lastWeekAppts || 0,
        apptChange,
        thisWeekRevenue: thisWeekTotal,
        lastWeekRevenue: lastWeekTotal,
        revenueChange,
      }
    },
  })

  // Saatlik yoğunluk
  const { data: hourlyDensity } = useQuery({
    queryKey: ['hourly-density', businessId, todayStr],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('start_time')
        .eq('business_id', businessId)
        .eq('appointment_date', todayStr)

      if (error) throw error

      const hourCounts = Array(12).fill(0).map((_, i) => ({
        hour: i + 9,
        count: 0,
      }))

      data?.forEach((appt) => {
        const hour = parseInt(appt.start_time?.split(':')[0]) || 0
        if (hour >= 9 && hour <= 20) {
          const index = hour - 9
          if (index >= 0 && index < 12) {
            hourCounts[index].count++
          }
        }
      })

      return hourCounts
    },
  })

  // Günlük özet
  const { data: dailySummary } = useQuery({
    queryKey: ['daily-summary', businessId, todayStr],
    enabled: !!businessId,
    queryFn: async () => {
      const { count: todayCustomers } = await supabase
        .from('appointments')
        .select('customer_id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('appointment_date', todayStr)

      const { data: todayRevenue } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('business_id', businessId)
        .gte('created_at', todayStr)
        .in('status', ['ready', 'delivered'])

      const { data: todayServices } = await supabase
        .from('appointments')
        .select('services(name)')
        .eq('business_id', businessId)
        .eq('appointment_date', todayStr)

      const serviceCounts = todayServices?.reduce((acc, appt) => {
        const serviceName = appt.services?.name || 'Bilinmiyor'
        acc[serviceName] = (acc[serviceName] || 0) + 1
        return acc
      }, {}) || {}

      const mostPopularService = Object.entries(serviceCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

      const totalRevenue = todayRevenue?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0

      return {
        customerCount: todayCustomers || 0,
        revenue: totalRevenue,
        mostPopularService,
      }
    },
  })

  // GRAFİKLER İÇİN YENİ QUERY'LER
  const { data: revenueTrend } = useQuery({
    queryKey: ['revenue-trend', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const dates = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        dates.push(d.toISOString().split('T')[0])
      }
      const { data, error } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .eq('business_id', businessId)
        .in('status', ['ready', 'delivered'])
      if (error) throw error
      return dates.map(date => ({
        date,
        total: data.filter(o => o.created_at?.split('T')[0] === date).reduce((s, o) => s + (o.total_amount || 0), 0)
      }))
    }
  })

  const { data: popularServices } = useQuery({
    queryKey: ['popular-services', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('services(name)')
        .eq('business_id', businessId)
        .not('service_id', 'is', null)
      if (error) throw error
      const counts = {}
      data.forEach(({ services }) => {
        const name = services?.name || 'Bilinmiyor'
        counts[name] = (counts[name] || 0) + 1
      })
      return Object.entries(counts).map(([name, count]) => ({ name, count })).slice(0, 5)
    }
  })

  const statCards = [
    { label: 'Bugünkü Randevular', value: stats?.todayAppts ?? 0, icon: CalendarDays, bg: 'bg-primary-container/10', text: 'text-primary', link: '/randevular' },
    { label: 'Aktif Siparişler', value: stats?.activeOrders ?? 0, icon: ShoppingBag, bg: 'bg-secondary-container/10', text: 'text-secondary', link: '/siparisler' },
    { label: 'Toplam Müşteri', value: stats?.totalCustomers ?? 0, icon: Users, bg: 'bg-tertiary-container/10', text: 'text-tertiary', link: '/musteriler' },
    { label: 'Toplam Gelir', value: currency(stats?.totalRevenue ?? 0), icon: TrendingUp, bg: 'bg-error-container/20', text: 'text-error', link: '/siparisler' },
  ]

  const [greeting, setGreeting] = useState('Merhaba')
  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting('Günaydın')
    else if (h < 18) setGreeting('İyi günler')
    else setGreeting('İyi akşamlar')
  }, [])

  const statusMap = {
    new: { label: 'Yeni', variant: 'warning' },
    processing: { label: 'Hazırlanıyor', variant: 'info' },
    ready: { label: 'Hazır', variant: 'success' },
    delivered: { label: 'Teslim', variant: 'default' },
    cancelled: { label: 'İptal', variant: 'danger' },
  }

  const apptStatusMap = {
    pending: { label: 'Bekliyor', variant: 'warning' },
    confirmed: { label: 'Onaylandı', variant: 'info' },
    completed: { label: 'Tamamlandı', variant: 'success' },
    cancelled: { label: 'İptal', variant: 'danger' },
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-container to-secondary-container p-6 text-on-primary shadow-lg sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Sun className="h-3.5 w-3.5" />
              {format(new Date(), 'd MMMM yyyy, EEEE', { locale: tr })}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{greeting}, hoş geldiniz 👋</h1>
            <p className="mt-1 text-sm text-on-primary-variant max-w-md">İşletmenizin günlük özetini buradan takip edin.</p>
          </div>
          <div className="hidden sm:block">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Sparkles className="h-7 w-7 text-on-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Günlük Özet (saat 20:00'de göster) */}
      {showDailySummary && dailySummary && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-container to-secondary-container p-6 text-on-primary shadow-lg animate-fade-scale">
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6" />
              <h2 className="text-xl font-bold">Günlük Özet</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm text-on-primary-variant mb-1">Bugün {dailySummary.customerCount} müşteri</p>
                <p className="text-2xl font-bold">{dailySummary.customerCount}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm text-on-primary-variant mb-1">Kazanç</p>
                <p className="text-2xl font-bold">{currency(dailySummary.revenue)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm text-on-primary-variant mb-1">En Popüler</p>
                <p className="text-lg font-bold truncate">{dailySummary.mostPopularService}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* İstatistik Kartları */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsLoading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : statCards.map((card) => (
          <Link key={card.label} to={card.link} className="group block">
            <div className="glass-card rounded-xl p-4 transition-all hover:shadow-xl">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
                  <card.icon className={`h-6 w-6 ${card.text}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface-variant">{card.label}</p>
                  <p className="mt-0.5 text-2xl font-bold text-on-surface">{card.value}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Hızlı İşlemler */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/randevular" className="group flex items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface px-4 py-3 text-sm font-medium text-on-surface shadow-sm transition-all hover:border-primary/30 hover:shadow-md hover:text-primary">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container/10"><CalendarPlus className="h-4 w-4 text-primary" /></div>
          Yeni Randevu <ArrowRight className="ml-auto h-4 w-4 text-outline" />
        </Link>
        <Link to="/musteriler" className="group flex items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface px-4 py-3 text-sm font-medium text-on-surface shadow-sm transition-all hover:border-tertiary/30 hover:shadow-md hover:text-tertiary">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-tertiary-container/10"><UserPlus className="h-4 w-4 text-tertiary" /></div>
          Yeni Müşteri <ArrowRight className="ml-auto h-4 w-4 text-outline" />
        </Link>
        <Link to="/siparisler" className="group flex items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface px-4 py-3 text-sm font-medium text-on-surface shadow-sm transition-all hover:border-secondary/30 hover:shadow-md hover:text-secondary">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-container/10"><Plus className="h-4 w-4 text-secondary" /></div>
          Yeni Sipariş <ArrowRight className="ml-auto h-4 w-4 text-outline" />
        </Link>
      </div>

      {/* Haftalık Karşılaştırma */}
      <div className="glass-card rounded-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-outline" /><h2 className="text-base font-semibold text-on-surface">Haftalık Karşılaştırma</h2></div>
          <span className="text-xs text-on-surface-variant">Bu hafta vs Geçen hafta</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="bg-surface-container-low rounded-lg p-4">
            <p className="text-sm text-on-surface-variant mb-2">Randevu Sayısı</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-on-surface">{weeklyComparison?.thisWeekAppts || 0}</span>
              <span className={`text-sm font-medium ${weeklyComparison?.apptChange >= 0 ? 'text-success' : 'text-error'}`}>{weeklyComparison?.apptChange >= 0 ? '+' : ''}{weeklyComparison?.apptChange?.toFixed(1) || 0}%</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">Geçen hafta: {weeklyComparison?.lastWeekAppts || 0}</p>
          </div>
          <div className="bg-surface-container-low rounded-lg p-4">
            <p className="text-sm text-on-surface-variant mb-2">Gelir</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-on-surface">{currency(weeklyComparison?.thisWeekRevenue || 0)}</span>
              <span className={`text-sm font-medium ${weeklyComparison?.revenueChange >= 0 ? 'text-success' : 'text-error'}`}>{weeklyComparison?.revenueChange >= 0 ? '+' : ''}{weeklyComparison?.revenueChange?.toFixed(1) || 0}%</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">Geçen hafta: {currency(weeklyComparison?.lastWeekRevenue || 0)}</p>
          </div>
        </div>
      </div>

      {/* Saatlik Yoğunluk */}
      <div className="glass-card rounded-xl p-6">
        <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-outline" /><h2 className="text-base font-semibold text-on-surface">Saatlik Yoğunluk</h2></div><span className="text-xs text-on-surface-variant">Bugün</span></div>
        <div className="flex items-end gap-2 h-32">
          {hourlyDensity?.map((item) => {
            const maxCount = Math.max(...hourlyDensity.map(h => h.count), 1)
            const height = (item.count / maxCount) * 100
            const isMorning = item.hour >= 9 && item.hour < 12
            const isLunch = item.hour >= 12 && item.hour < 14
            return (
              <div key={item.hour} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-surface-container-low rounded-t-lg relative" style={{ height: '100%' }}>
                  <div className={`absolute bottom-0 w-full rounded-t-lg transition-all ${isMorning ? 'bg-primary' : isLunch ? 'bg-secondary' : 'bg-tertiary'}`} style={{ height: `${Math.max(height, 5)}%` }} />
                </div>
                <span className="text-xs text-on-surface-variant">{item.hour}:00</span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary" /><span className="text-on-surface-variant">Sabah (09-12)</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-secondary" /><span className="text-on-surface-variant">Öğle (12-14)</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-tertiary" /><span className="text-on-surface-variant">Diğer</span></div>
        </div>
      </div>

      {/* İki kolon: Bugünkü Randevular & Son Siparişler */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-xl p-6">
          <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-outline" /><h2 className="text-base font-semibold text-on-surface">Bugünkü Randevular</h2></div><Link to="/randevular" className="text-sm font-medium text-primary">Tümü</Link></div>
          {apptsLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="flex items-center gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-low p-3"><div className="skeleton h-12 w-14 shrink-0 rounded-xl" /><div className="flex-1 space-y-2"><div className="skeleton h-4 w-1/3" /><div className="skeleton h-3 w-1/4" /></div></div>)}</div>
          ) : todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low py-12 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-highest"><CalendarDays className="h-6 w-6 text-outline" /></div><p className="mt-3 text-sm font-medium text-on-surface">Bugün randevu yok</p><p className="mt-1 text-xs text-on-surface-variant">Rahat bir gün, keyfini çıkarın!</p></div>
          ) : (
            <div className="space-y-2">{todayAppointments.map((ap) => (
              <div key={ap.id} className="group flex items-center gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-low p-3 transition-all hover:border-primary/30">
                <div className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-surface shadow-sm"><span className="text-[10px] font-semibold uppercase text-outline">{formatTime(ap.start_time)}</span></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-on-surface">{ap.customers?.full_name || 'Bilinmiyor'}</p><p className="truncate text-xs text-on-surface-variant">{ap.services?.name || 'Bilinmiyor'} · {ap.customers?.phone || ''}</p></div>
                <Badge variant={apptStatusMap[ap.status]?.variant || 'default'}>{apptStatusMap[ap.status]?.label || ap.status}</Badge>
              </div>
            ))}</div>
          )}
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><Package className="h-5 w-5 text-outline" /><h2 className="text-base font-semibold text-on-surface">Son Siparişler</h2></div><Link to="/siparisler" className="text-sm font-medium text-primary">Tümü</Link></div>
          {ordersLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="flex items-center gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-low p-3"><div className="skeleton h-10 w-10 shrink-0 rounded-full" /><div className="flex-1 space-y-2"><div className="skeleton h-4 w-1/3" /><div className="skeleton h-3 w-1/4" /></div></div>)}</div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low py-12 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-highest"><ShoppingBag className="h-6 w-6 text-outline" /></div><p className="mt-3 text-sm font-medium text-on-surface">Henüz sipariş yok</p><p className="mt-1 text-xs text-on-surface-variant">İlk siparişinizi oluşturun!</p></div>
          ) : (
            <div className="space-y-2">{recentOrders.map((order) => (
              <div key={order.id} className="group flex items-center gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-low p-3 transition-all hover:border-secondary/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface shadow-sm"><ShoppingBag className="h-4 w-4 text-outline" /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-on-surface">#{order.id.slice(0, 8).toUpperCase()}</p><p className="truncate text-xs text-on-surface-variant">{order.customers?.full_name || 'Bilinmiyor'} · {currency(order.total_amount)}</p></div>
                <Badge variant={statusMap[order.status]?.variant || 'default'}>{statusMap[order.status]?.label || order.status}</Badge>
              </div>
            ))}</div>
          )}
        </div>
      </div>

      {/* 🆕 GRAFİKLER – YENİ EKLENEN KISIM */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-base font-semibold text-on-surface mb-4">Son 7 Gün Gelir Trendi</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--color-on-surface-variant)' }} />
              <YAxis tick={{ fill: 'var(--color-on-surface-variant)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline-variant)' }} />
              <Line type="monotone" dataKey="total" stroke="var(--color-primary)" strokeWidth={2} dot={{ fill: 'var(--color-primary)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-base font-semibold text-on-surface mb-4">Popüler Hizmetler</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={popularServices || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" />
              <XAxis type="number" tick={{ fill: 'var(--color-on-surface-variant)' }} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--color-on-surface-variant)' }} width={100} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline-variant)' }} />
              <Bar dataKey="count" fill="var(--color-secondary)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}