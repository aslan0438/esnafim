# Product Context: Esnafım

## Overview
**Esnafım** is an appointment and order management application built specifically for small business owners (esnaf) in Turkey. It helps local businesses manage customer appointments, track orders, and organize their daily operations through a simple, modern web interface.

## Target Users
- Small business owners in Turkey (barbers, tailors, repair shops, local artisans, etc.)
- Business size: solo operators to small teams (1-10 employees)
- Technical skill level: non-technical; requires intuitive UI
- Language: Turkish (TR) throughout the entire application

## Core Features (MVP)
1. **Authentication** — Email/password login via Supabase Auth
2. **Dashboard** — Daily overview: appointment count, open orders, revenue summary, customer count
3. **Appointments** — Calendar view, customer selection, service assignment, conflict detection
4. **Orders** — Quick order creation, status tracking, customer history
5. **Customers** — Phone number search, customer cards, view history
6. **Services** — Define services/products with price and duration
7. **Settings** — Business info, working hours configuration

## User Flow
1. Business owner registers with email + creates business profile
2. Logs in to Dashboard with daily summary
3. Manages appointments via calendar
4. Creates and tracks orders
5. Maintains customer records
6. Configures services and business settings

## Design Principles
- Mobile-first responsive design (many esnaf use phones/tablets)
- Minimalist, clean UI — no clutter
- Fast interactions (single-page app feel)
- Turkish language throughout (including form validation messages)
- No complex onboarding; immediate usability
