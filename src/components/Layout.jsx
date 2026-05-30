import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'
import { supabase } from '../api/supabaseClient'
import {
  LayoutDashboard,
  CalendarDays,
  ShoppingBag,
  Users,
  Briefcase,
  Settings,
  LogOut,
  Store,
  Plus,
  Search,
  Bell,
  User,
  HelpCircle,
  Moon,
  Sun,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/randevular', label: 'Randevular', icon: CalendarDays },
  { to: '/musteriler', label: 'Müşteriler', icon: Users },
  { to: '/hizmetler', label: 'Hizmetler', icon: Briefcase },
  { to: '/siparisler', label: 'Siparişler', icon: ShoppingBag },
  { to: '/ayarlar', label: 'Ayarlar', icon: Settings },
]

const mobileNavItems = [
  { to: '/', label: 'Ana Sayfa', icon: LayoutDashboard },
  { to: '/musteriler', label: 'Müşteriler', icon: Users },
  { to: '/hizmetler', label: 'Hizmetler', icon: Briefcase },
  { to: '/ayarlar', label: 'Profil', icon: User },
]

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}.${month}.${year}`
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const businessId = useAuthStore((s) => s.businessId)
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const [businessName, setBusinessName] = useState('Esnafım')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)

  const notifRef = useRef(null)
  const profileRef = useRef(null)
  const shortcutsRef = useRef(null)
  const searchRef = useRef(null)

  const trimmedSearch = searchQuery.trim()

  // DÜZELTME: Undefined kontrolü eklendi
  const toggleTheme = () => {
    const currentTheme = theme || 'system'
    if (currentTheme === 'light') setTheme('dark')
    else if (currentTheme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const { data: searchResults, isFetching: searchLoading } = useQuery({
    queryKey: ['global-search', businessId, trimmedSearch],
    enabled: !!businessId && trimmedSearch.length >= 2,
    queryFn: async () => {
      const normalized = trimmedSearch.toLocaleLowerCase('tr-TR')
      const safeQuery = trimmedSearch.replace(/[%,]/g, '').trim()

      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, full_name, phone')
        .eq('business_id', businessId)
        .or(`full_name.ilike.%${safeQuery}%,phone.ilike.%${safeQuery}%`)
        .order('full_name')
        .limit(5)

      if (customersError) throw customersError

      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id, appointment_date, start_time, customers(full_name)')
        .eq('business_id', businessId)
        .order('appointment_date', { ascending: false })
        .limit(30)

      if (appointmentsError) throw appointmentsError

      const matchingAppointments = (appointments || [])
        .filter((appointment) => {
          const customerName = appointment.customers?.full_name?.toLocaleLowerCase('tr-TR') || ''
          const date = appointment.appointment_date || ''
          return customerName.includes(normalized) || date.includes(trimmedSearch)
        })
        .slice(0, 5)

      return {
        customers: customers || [],
        appointments: matchingAppointments,
      }
    },
  })

  useEffect(() => {
    const fetchBusinessName = async () => {
      const businessId = useAuthStore.getState().businessId
      if (!businessId) return
      const { data } = await supabase.from('businesses').select('name').eq('id', businessId).single()
      if (data?.name) setBusinessName(data.name)
    }
    fetchBusinessName()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
      if (shortcutsRef.current && !shortcutsRef.current.contains(event.target)) {
        setShowShortcuts(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return
      }
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        navigate('/randevular?new=1')
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault()
        navigate('/musteriler')
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault()
        navigate('/siparisler')
      } else if (e.key === '?') {
        e.preventDefault()
        setShowShortcuts(!showShortcuts)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [navigate, showShortcuts])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    navigate('/login')
  }

  const openNewAppointment = () => {
    navigate('/randevular?new=1')
  }

  const handleGlobalSearch = () => {
    const query = searchQuery.trim()
    if (!query) return
    navigate(`/musteriler?q=${encodeURIComponent(query)}`)
    setSearchQuery('')
    setShowSearchResults(false)
  }

  const goToSearchResult = (path) => {
    navigate(path)
    setSearchQuery('')
    setShowSearchResults(false)
  }

  const NavItem = ({ item }) => (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${
          isActive
            ? 'bg-primary-container text-on-primary-container font-semibold'
            : 'text-on-surface-variant hover:bg-surface-container-low transition-transform duration-200 hover:translate-x-1'
        }`
      }
    >
      <item.icon className="h-5 w-5 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  )

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/') return 'Dashboard'
    if (path === '/randevular') return 'Randevular'
    if (path === '/siparisler') return 'Siparişler'
    if (path === '/musteriler') return 'Müşteriler'
    if (path === '/hizmetler') return 'Hizmetler'
    if (path === '/ayarlar') return 'Ayarlar'
    return ''
  }

  // DÜZELTME: Net isDarkMode hesaplaması
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      {/* SideNavBar (Desktop Only) */}
      <aside className="h-screen w-64 fixed left-0 top-0 hidden md:flex flex-col bg-surface border-r border-outline-variant/20 p-6 gap-2 z-50">
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-semibold text-lg text-primary">{businessName}</h1>
              <p className="text-[10px] uppercase tracking-widest text-outline">İşletme Yönetimi</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-1">
          <button
            type="button"
            onClick={openNewAppointment}
            className="bg-primary-container text-white py-3 rounded-xl font-semibold mb-4 shadow-md active:scale-95 transition-all"
          >
            Yeni Randevu
          </button>
          <NavLink
            to="/ayarlar"
            className="flex items-center gap-4 px-4 py-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-transform duration-200 hover:translate-x-1"
          >
            <HelpCircle className="h-5 w-5 shrink-0" />
            <span>Destek</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 text-sm font-medium text-error hover:bg-error-container/20 rounded-lg transition-transform duration-200 hover:translate-x-1"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Çıkış</span>
          </button>
        </div>
      </aside>

      {/* TopNavBar (Responsive) */}
      <header className="fixed top-0 w-full z-40 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm md:pl-64">
        <div className="flex justify-between items-center px-8 h-16 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="md:hidden font-semibold text-lg text-primary">{businessName}</span>
            <h2 className="hidden md:block font-semibold text-lg text-primary">{getPageTitle()}</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative hidden sm:block" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline h-4 w-4" />
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSearchResults(true)
                }}
                onFocus={() => setShowSearchResults(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGlobalSearch()
                }}
                className="pl-10 pr-4 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary/20 text-sm w-64 outline-none"
                placeholder="Müşteri veya randevu ara..."
                type="text"
              />
              {showSearchResults && trimmedSearch.length >= 2 && (
                <div className="absolute right-0 top-12 w-80 overflow-hidden rounded-xl border border-outline-variant/20 bg-surface shadow-lg z-50">
                  {searchLoading ? (
                    <div className="px-4 py-3 text-sm text-on-surface-variant">Aranıyor...</div>
                  ) : (searchResults?.customers?.length || 0) + (searchResults?.appointments?.length || 0) === 0 ? (
                    <div className="px-4 py-3 text-sm text-on-surface-variant">Sonuç bulunamadı</div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto py-2">
                      {searchResults?.customers?.length > 0 && (
                        <div>
                          <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase text-outline">Müşteriler</p>
                          {searchResults.customers.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => goToSearchResult(`/musteriler?q=${encodeURIComponent(customer.full_name)}`)}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-surface-container-low"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tertiary-container/10 text-sm font-semibold text-tertiary">
                                {customer.full_name?.charAt(0).toUpperCase() || 'M'}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-on-surface">{customer.full_name}</span>
                                <span className="block truncate text-xs text-on-surface-variant">{customer.phone}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults?.appointments?.length > 0 && (
                        <div>
                          <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase text-outline">Randevular</p>
                          {searchResults.appointments.map((appointment) => (
                            <button
                              key={appointment.id}
                              type="button"
                              onClick={() => goToSearchResult('/randevular')}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-surface-container-low"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-primary">
                                <CalendarDays className="h-4 w-4" />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-on-surface">
                                  {appointment.customers?.full_name || 'Bilinmeyen müşteri'}
                                </span>
                                <span className="block truncate text-xs text-on-surface-variant">
                                  {formatDate(appointment.appointment_date)} · {appointment.start_time?.slice(0, 5)}
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* DÜZELTME: Tema butonu */}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-surface-container-high/50 transition-colors active:scale-95"
                title={theme === 'system' ? 'Sistem teması' : theme === 'dark' ? 'Koyu mod' : 'Açık mod'}
              >
                {isDarkMode ? (
                  <Moon className="h-5 w-5 text-on-surface-variant" />
                ) : (
                  <Sun className="h-5 w-5 text-on-surface-variant" />
                )}
              </button>
              
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full hover:bg-surface-container-high/50 transition-colors active:scale-95"
                >
                  <Bell className="h-5 w-5 text-on-surface-variant" />
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-72 bg-surface rounded-xl shadow-lg border border-outline-variant/20 p-4 z-50">
                    <h3 className="text-sm font-semibold mb-3">Bildirimler</h3>
                    <p className="text-sm text-on-surface-variant">Henüz bildirim yok.</p>
                  </div>
                )}
              </div>
              <button 
                onClick={() => navigate('/ayarlar')}
                className="p-2 rounded-full hover:bg-surface-container-high/50 transition-colors active:scale-95"
              >
                <Settings className="h-5 w-5 text-on-surface-variant" />
              </button>
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-xs ml-2 hover:ring-2 hover:ring-primary/20 transition-all"
                >
                  {user?.email?.charAt(0).toUpperCase() || 'E'}
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 top-12 w-48 bg-surface rounded-xl shadow-lg border border-outline-variant/20 p-2 z-50">
                    <div className="px-3 py-2 border-b border-outline-variant/10">
                      <p className="text-sm font-medium truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        navigate('/ayarlar')
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
                    >
                      <User className="h-4 w-4" />
                      <span>Profil</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        navigate('/ayarlar')
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Ayarlar</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-container/10 rounded-lg transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div ref={shortcutsRef} className="bg-surface rounded-2xl shadow-2xl border border-outline-variant/20 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-on-surface">Klavye Kısayolları</h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-2 rounded-lg hover:bg-surface-container transition-colors"
              >
                <HelpCircle className="h-5 w-5 text-outline" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
                <span className="text-sm text-on-surface">Yeni Randevu</span>
                <kbd className="px-2 py-1 bg-surface-container rounded text-xs font-mono text-on-surface-variant">N</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
                <span className="text-sm text-on-surface">Müşteriler</span>
                <kbd className="px-2 py-1 bg-surface-container rounded text-xs font-mono text-on-surface-variant">M</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
                <span className="text-sm text-on-surface">Siparişler</span>
                <kbd className="px-2 py-1 bg-surface-container rounded text-xs font-mono text-on-surface-variant">S</kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-on-surface">Kısayolları Göster</span>
                <kbd className="px-2 py-1 bg-surface-container rounded text-xs font-mono text-on-surface-variant">?</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Canvas */}
      <main className="pt-20 pb-24 md:pb-12 px-8 md:ml-64 min-h-screen">
        <div className="max-w-screen-xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 w-full md:hidden rounded-t-xl bg-surface/95 backdrop-blur-2xl border-t border-outline-variant/10 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50">
        <div className="flex justify-around items-center h-16 pb-safe px-4">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-on-surface-variant/60 active:bg-surface-container-highest/30'
                }`
              }
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Contextual FAB (Mobile Only) */}
      <button
        type="button"
        onClick={openNewAppointment}
        className="fixed bottom-20 right-6 md:hidden w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-40"
        title="Yeni randevu"
      >
        <Plus className="h-7 w-7" />
      </button>
    </div>
  )
}