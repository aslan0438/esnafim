import { useEffect } from 'react'
import { supabase } from '../api/supabaseClient'
import { useAuthStore } from '../stores/authStore'

async function fetchOrCreateBusiness(user) {
  console.log('[AuthProvider] fetchOrCreateBusiness for user:', user.id)

  const { data, error } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  console.log('[AuthProvider] business fetch result:', { data, error })

  if (data?.id) {
    console.log('[AuthProvider] found businessId:', data.id)
    return data.id
  }

  if (!data) {
    console.log('[AuthProvider] no business found, creating...')
    const { data: newBiz, error: insertErr } = await supabase
      .from('businesses')
      .insert({
        owner_id: user.id,
        name: user.email?.split('@')[0] || 'İşletmem',
      })
      .select('id')
      .single()
    console.log('[AuthProvider] business insert result:', { newBiz, insertErr })
    if (!insertErr && newBiz?.id) return newBiz.id
  }

  console.warn('[AuthProvider] failed to get/create business')
  return null
}

export default function AuthProvider({ children }) {
  const setUser = useAuthStore((s) => s.setUser)
  const setBusinessId = useAuthStore((s) => s.setBusinessId)
  const setLoading = useAuthStore((s) => s.setLoading)

  useEffect(() => {
    let mounted = true

    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        const bizId = await fetchOrCreateBusiness(session.user)
        if (bizId) setBusinessId(bizId)
      } else {
        setUser(null)
        setBusinessId(null)
      }
      setLoading(false)
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return
        if (session?.user) {
          setUser(session.user)
          fetchOrCreateBusiness(session.user).then((bizId) => {
            if (bizId) setBusinessId(bizId)
          })
        } else {
          setUser(null)
          setBusinessId(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setUser, setBusinessId, setLoading])

  return children
}
