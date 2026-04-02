
# Nimbus — AI Parametric Income Insurance Platform

## Overview
A full-stack insurance platform for food delivery partners in India, built with React + TypeScript + Tailwind CSS on the frontend and Supabase (PostgreSQL + Edge Functions) on the backend.

---

## Phase 1: Foundation

### Theme & Design System
- Add Nimbus color palette to Tailwind config (bg: #0A0F1E, accent: #63B3ED, danger: #FC8181, success: #68D391, etc.)
- Create ThemeContext with dark/light toggle, persisted to localStorage
- Default dark mode, Inter font family
- Consistent card styles: `rounded-2xl bg-slate-900/80 p-6 border border-slate-800`

### Navigation
- Top navbar with "NIMBUS" branding + "AI Parametric Insurance" subtitle
- Links: Dashboard, Policy, Claims, Triggers, Admin
- Sun/Moon theme toggle button
- Active link with blue underline indicator
- Mobile-responsive hamburger menu

---

## Phase 2: Database & Backend

### Supabase Database Tables
- **workers** — name, phone, swiggy_id, zone, pincode, city, trust_score, earnings_baseline, upi_id
- **policies** — worker_id, tier (basic/standard/premium), weekly_premium, max_payout, status, dates
- **disruptions** — event_id, type, zone, pincode, severity, reading, threshold, status
- **claims** — worker_id, disruption_id, payout_amount, baseline_earnings, protection_percentage, explainer_text, fraud_flag
- **payouts** — claim_id, worker_id, amount, upi_id, status

### Seed Data
- Pre-load demo worker "Rajan Kumar" with active Standard policy, trust score 87, and 2 recent paid claims

### Edge Functions
- **register-worker** — Creates worker + policy, returns worker data
- **process-claim** — Calculates payout based on disruption severity and policy tier
- **trigger-disruption** — Creates disruption record and auto-processes claims for affected workers
- **calculate-premium** — Simulated ML pricing with zone risk, trust score, and forecast adjustments
- **admin-stats** — Aggregated stats for admin dashboard

---

## Phase 3: Pages

### 1. Worker Onboarding (/onboard)
- 3-step wizard with animated progress bar
- Step 1: Name, phone (+91), Swiggy ID
- Step 2: City dropdown, zone, pincode
- Step 3: Coverage tier selection (Basic ₹99 / Standard ₹179 / Premium ₹299) with side-by-side cards
- Live summary sidebar showing entered data
- On submit: registers worker → redirects to dashboard

### 2. Worker Dashboard (/dashboard)
- Greeting header "Hey Rajan 👋" with zone info
- 3 stat cards: Coverage Status, Trust Score (with progress bar), Zone Risk Level
- Recent payouts list + quick action buttons
- Auto-loads Rajan's data as default demo

### 3. Policy Management (/policy)
- Current policy summary card with tier badge, premium, coverage limit, dates
- Upgrade/Downgrade buttons
- Tier comparison table highlighting current plan
- Policy history table

### 4. Claims & Payouts (/claims)
- Active disruptions cards with severity chips and real-time status
- Explainable payout cards with human-readable breakdown
- Claims history table with filtering

### 5. Admin Dashboard (/admin)
- 4 stat cards: active workers, premiums collected, payouts issued, loss ratio
- Recharts line chart: weekly premiums vs payouts (6 weeks)
- Bar chart: claims by disruption type
- Active disruptions panel
- Fraud alerts queue with approve/reject actions
- Trust Score leaderboard (top 10)

### 6. Disruption Trigger Monitor (/triggers)
- 7 trigger cards in grid: Rain, Heat, Flood, AQI, Curfew, Platform Drop, GPS Dead Zone
- Each shows current reading, threshold, and status pill (Normal/Warning/Triggered)
- "Simulate Disruption" button → modal to select type + zone → triggers disruption + toast notification
- Recent trigger events log table

---

## Phase 4: Polish

### UX Details
- Loading spinners on all data fetches
- Empty states with helpful messages
- Toast notifications for all actions (react-hot-toast)
- Fully responsive on mobile and desktop
- Consistent button styles (primary blue, secondary outlined)
- Smooth page transitions
