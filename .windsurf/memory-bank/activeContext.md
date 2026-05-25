# Active Context: Esnafım

## Current Session (2026-05-10)
Project scaffolding completed. Dev server running at localhost:5173.

## Recently Completed
1. ✅ Vite + React project created
2. ✅ Tailwind CSS v4 configured with @theme tokens
3. ✅ All dependencies installed (Supabase, Zustand, React Query, Router, etc.)
4. ✅ Folder structure created (api, components, hooks, pages, stores, lib, types)
5. ✅ Entry files wired: main.jsx with providers, App.jsx with routes
6. ✅ Layout.jsx with responsive sidebar + mobile hamburger menu
7. ✅ PrivateRoute.jsx auth guard
8. ✅ Auth pages (Login, Register) with Supabase integration
9. ✅ authStore.js (Zustand) for global auth state
10. ✅ useAuth.js hook for Supabase auth state changes + business fetch
11. ✅ supabaseClient.js configured for env variables
12. ✅ Skeleton pages created for all routes
13. ✅ vercel.json SPA rewrite rules
14. ✅ .env.example with Supabase keys

## Current Focus
Project foundation is solid. Next step is to either:
- Set up Supabase database schema (tables + RLS policies)
- OR begin building out page UIs with real data patterns

## Open Decisions
1. Will we use Supabase Realtime for live appointment/order updates? — **Yes**, planned for dashboard
2. Will we add i18n library (react-i18next) or keep hardcoded Turkish? — **Decision**: keep hardcoded Turkish for simplicity; add i18n only if needed later
3. Will we implement shadcn/ui or build custom components? — **Decision**: build custom Tailwind components for lightweight bundle; no shadcn CLI dependency

## Next Actions (Pending)
1. Create Supabase project and apply database schema
2. Build Dashboard with real stats queries
3. Implement Appointments page with calendar view
4. Implement Customers CRUD with phone search
5. Implement Orders workflow
6. Implement Services management
7. Implement Settings page
8. Deploy to Vercel
