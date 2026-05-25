# System Patterns: Esnafım

## Component Patterns
- **Pages** are route-level components in `src/pages/`
- **Shared components** live in `src/components/` (not in `ui/` unless generic)
- **UI primitives** (Button, Input, Dialog) are built with Tailwind in `src/components/ui/`
- All components use default export for pages, named exports for utilities
- Use `cn()` from `lib/utils.js` for conditional className composition

## State Management Patterns
- **Server state**: TanStack React Query (useQuery, useMutation, useQueryClient)
- **Global client state**: Zustand stores in `src/stores/`
- **Local component state**: React useState/useReducer
- Auth state lives in Zustand but is hydrated by Supabase `onAuthStateChange`

## Data Fetching Patterns
```javascript
// API functions in src/api/<resource>.js
export async function getAppointments(businessId, date) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, customers(full_name), services(name)')
    .eq('business_id', businessId)
    .eq('appointment_date', date)
  if (error) throw error
  return data
}

// Hook usage in components
const { data, isLoading } = useQuery({
  queryKey: ['appointments', businessId, date],
  queryFn: () => getAppointments(businessId, date),
})
```

## Form Patterns
- Use React Hook Form + Zod for all forms
- Validation messages in Turkish
- Submit handlers show toast on success/error

## Styling Patterns
- Tailwind utility classes only; no custom CSS files except `index.css`
- Custom theme tokens via `@theme` in CSS (primary, surface, muted)
- Responsive breakpoints: `sm:`, `md:`, `lg:`
- Color palette: gray neutrals with blue (`#2563eb`) primary accent

## File Naming
- Components: PascalCase (`Layout.jsx`, `Login.jsx`)
- Hooks: camelCase starting with `use` (`useAuth.js`)
- Utilities: camelCase (`utils.js`, `dateUtils.js`)
- Stores: camelCase ending with `Store` (`authStore.js`)
- API: camelCase matching resource (`appointments.js`)

## Error Handling
- API errors thrown to React Query which surfaces them via `error` property
- User-facing errors shown via `react-hot-toast`
- Form validation via Zod schema before submission

## Performance Rules
- Use React Query caching aggressively (staleTime: 5 min)
- Lazy load page components if bundle grows
- Keep components small; extract when >150 lines
- Use `useMemo`/`useCallback` only when measurable impact
