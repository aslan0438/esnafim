# Tech Context: Esnafım

## Stack
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Build Tool | Vite 8 | Fast dev server and optimized builds |
| Framework | React 19 | UI layer with hooks and modern patterns |
| Styling | Tailwind CSS 4 | Utility-first responsive styling |
| State (Global) | Zustand 5 | Lightweight global state management |
| State (Server) | TanStack React Query 5 | Server data fetching, caching, sync |
| Routing | React Router 7 | Client-side SPA routing |
| Forms | React Hook Form + Zod | Form handling and schema validation |
| Backend | Supabase | Auth, PostgreSQL, Realtime, Storage |
| Icons | Lucide React | Consistent, lightweight icon set |
| Dates | date-fns (TR locale) | Turkish date formatting and manipulation |
| Notifications | react-hot-toast | Toast notifications |
| Utilities | clsx + tailwind-merge | Conditional className composition |

## Project Structure
```
src/
  main.jsx              — Entry point with providers (QueryClient, Router, Toaster)
  App.jsx               — Route definitions
  index.css             — Tailwind directives + theme tokens
  api/
    supabaseClient.js   — Supabase client initialization
    appointments.js     — Appointment CRUD functions
    orders.js           — Order CRUD functions
    customers.js        — Customer CRUD functions
    services.js         — Service CRUD functions
    business.js         — Business CRUD functions
  components/
    ui/                 — shadcn/ui-style components (Button, Input, Dialog, etc.)
    Layout.jsx          — Sidebar + MobileNav + Footer
    PrivateRoute.jsx    — Auth guard wrapper
    MobileNav.jsx       — Mobile navigation overlay
  hooks/
    useAuth.js          — Auth state change listener + business fetch
    useBusiness.js      — Business data hooks
    useRealtime.js      — Supabase realtime subscriptions
  pages/
    auth/               — Login, Register
    dashboard/          — Dashboard + StatsCards + TodaySchedule
    appointments/       — Appointments + Calendar + Form
    orders/             — Orders + List + Form
    customers/          — Customers + Detail
    services/           — Services management
    settings/           — Business info, working hours
  stores/
    authStore.js        — Zustand: user, businessId, loading
    uiStore.js          — UI state (sidebar open, theme, etc.)
  lib/
    utils.js            — cn() helper (clsx + tailwind-merge)
    dateUtils.js        — Turkish date formatting utilities
    validators.js       — TR-specific form validations
  types/
    index.js            — JSDoc type definitions
```

## Environment Variables
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Database Schema (Supabase PostgreSQL)
### businesses
- `id` uuid PK
- `owner_id` uuid FK → auth.users
- `name`, `phone`, `address`, `city` text
- `opening_hours` jsonb
- `created_at` timestamptz

### services
- `id` uuid PK
- `business_id` uuid FK
- `name` text, `price` numeric, `duration_minutes` int
- `category` text enum: 'service' | 'product'

### customers
- `id` uuid PK
- `business_id` uuid FK
- `full_name`, `phone`, `notes` text
- Unique: `phone` per `business_id`

### appointments
- `id` uuid PK
- `business_id`, `customer_id`, `service_id` uuid FKs
- `appointment_date` date, `start_time` time
- `status` text enum: 'pending' | 'confirmed' | 'completed' | 'cancelled'
- `notes` text

### orders
- `id` uuid PK
- `business_id`, `customer_id` uuid FKs
- `items` jsonb array of {service_id, quantity, price}
- `total_amount` numeric
- `status` text enum: 'new' | 'processing' | 'ready' | 'delivered' | 'cancelled'
- `created_at` timestamptz

## Security
- Row Level Security (RLS) on all tables filtered by `business_id`
- Supabase Auth for user authentication
- Users only access data belonging to their own business

## Deployment
- Frontend: Vercel (with SPA rewrite rules in vercel.json)
- Backend: Supabase (managed)
