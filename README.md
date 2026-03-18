# 🌧️ Nimbus
### AI-Powered Parametric Income Insurance for India's Gig Economy

> *"When the rain stops deliveries, we make sure it doesn't stop your income."*

**Guidewire DEVTrails 2026 — Unicorn Chase**

---

## 📋 Table of Contents
1. [Events](#events)
2. [The Problem](#the-problem)
3. [Meet Rajan — Our Persona](#meet-rajan--our-persona)
4. [The Solution](#the-solution)
5. [Core Features](#core-features)
6. [Disruption Triggers](#disruption-triggers)
7. [Weekly Premium Model](#weekly-premium-model)
8. [AI/ML Architecture](#aiml-architecture)
9. [Fraud Detection](#fraud-detection)
10. [Tech Stack](#tech-stack)
11. [System Architecture](#system-architecture)
12. [Application Workflow](#application-workflow)
13. [6-Week Development Plan](#6-week-development-plan)
14. [Future Roadmap](#future-roadmap)

---

## Events

### Phase 1 Market Crash — Adversarial Defense & Anti-Spoofing Strategy
**Event Triggered: March 20, 2026** | **Status: LIVE** | **Deadline: March 20, 3:59 PM**

**Nimbus Compliance Summary:**(Phase 2 implimentation)</br>
Nimbus passes automated fraud validations through our production-ready **3-Layer Fraud Detection** + **named gig-economy fraud patterns**:

| Validation Type | Nimbus Defense | Implementation |
|----------------|---------------|----------------|
| **GPS Spoofing** | Layer 1: Geospatial Validation | Flags impossible speeds (>100kmph), teleporting (>5km in <5min), GPS vs cell-tower mismatch |
| **Rain-Chaser** | Named Pattern Detection | Max 1 payout per Event ID cluster across neighboring pincodes (4hr window) |
| **Zone-Hopper** | Behavioral Anomaly | >2 pincode changes in 30 days → Trust Score -10 + manual review |
| **Multi-Claim** | Event ID Uniques | 1 claim per worker per unique Disruption Event ID |
| **False Trigger** | Layer 2: Cross-Signal | ≥2 independent APIs required (weather + AQI + platform drop) |

**Key Code Locations:**
```plaintext
src/fraud/
├── gps_validator.py              # Layer 1: speed/teleport detection
├── event_id_generator.py         # Unique claims per disruption
├── rain_chaser_detector.py       # Named pattern: zone hopping
├── zone_hopper_monitor.py        # Pincode change frequency
└── three_layer_orchestrator.py   # Parallel validation pipeline
```

**Demo Plan:** `demo/fraud_simulation.ipynb` — Spoofed GPS data pipeline catches all adversarial patterns (Phase 2 deliverable).

**Trust Score Integration:** Low-score workers (<70) auto-routed to manual review even if technical validations pass.

**Full details:** [Fraud Detection](#fraud-detection) | **Architecture Battle-Ready.**

---
## The Problem

India's 15+ million platform-based delivery partners (Zomato, Swiggy, Amazon, Flipkart, Zepto, Blinkit) are the backbone of the digital economy — yet they have **zero income protection** against uncontrollable external disruptions.

External events like extreme rain, floods, AQI emergencies, curfews, and platform outages cause delivery partners to **lose 20–30% of their monthly earnings**. When disruptions hit:

- The platform does not compensate them
- No insurance product exists that covers this specific loss
- Government schemes don't apply to urban gig workers
- Traditional insurance requires monthly premiums, paperwork, and weeks-long claim processes — entirely incompatible with a gig worker's week-to-week financial reality

**The result:** Rajan loses ₹12,000 in a bad monsoon month. He has no savings, no backup, no safety net. His family bears the full shock.

---

## Meet Rajan — Our Persona

**Rajan, 28, Swiggy Delivery Partner, Bangalore (Koramangala zone)**

| Detail | Value |
|--------|-------|
| Daily earnings | ₹800 – ₹1,200 |
| Working hours | 10–12 hrs/day |
| Family | Wife + 2 children |
| Savings buffer | None |
| Last monsoon loss | ~₹12,000 (11 disrupted working days) |
| Insurance | None |
| Primary phone usage | WhatsApp, UPI payments |

Rajan pays **₹199/week** for Nimbus Standard. The next time his zone floods, **₹600 lands in his UPI wallet automatically** — before he even opens an app. No form. No call. No claim. Just a WhatsApp message:

> *"Nimbus: ₹600 credited. Heavy rain detected in Koramangala. Stay safe. 🌧️"*

---

## The Solution

**Nimbus** is an AI-enabled parametric income insurance platform designed exclusively for food delivery partners (Zomato/Swiggy). It provides:

- ✅ **Zero-touch automated payouts** — no manual claims process
- ✅ **Multi-signal disruption detection** — 7 independent trigger types
- ✅ **Personalized weekly premiums** — AI-calculated per worker, per week
- ✅ **WhatsApp-first UX** — no app download required
- ✅ **Instant UPI payouts** — money arrives before the worker realises income is lost
- ✅ **Intelligent fraud detection** — 3-layer system including gig-specific fraud patterns

The word *Nimbus* refers to a rain-bearing cloud — the very symbol of the disruptions we protect against. Unlike a storm, Nimbus is always on the worker's side.

---

## Core Features

### 1. 🗺️ Hyperlocal Zone Intelligence
Nimbus builds a **Zone Risk Score** for every operational pincode — not just city-level risk. Koramangala floods differently from Whitefield. HSR Layout has different AQI patterns from Yelahanka.

- Computed from 3 years of historical weather, flood, curfew, and platform order data
- Recalculated every week incorporating the upcoming 7-day forecast
- Powers premium pricing, payout sizing, and 24-hour advance disruption alerts

### 2. 🔍 Earnings Fingerprint
Nimbus doesn't ask workers what they earn — it learns.

- Worker optionally connects Swiggy Partner account or logs earnings via WhatsApp for 2 weeks
- AI builds a worker-specific model of average daily income, peak hours, typical working days, and seasonal patterns
- Payouts are calculated as a **% of their personal earnings baseline** — not a flat industry average
- No two workers receive the same payout for the same disruption

### 3. ⚡ Disruption Stacking Engine
Multiple simultaneous triggers produce compounding payouts — because real disruptions compound real losses:

```
Heavy Rain alone              → ₹300 payout
Heavy Rain + Flood Alert      → ₹650 payout  
Heavy Rain + Flood + Curfew   → ₹1,050 payout  (capped at weekly limit)
```

### 4. 🤖 Dynamic AI Weekly Premium Engine
XGBoost model calculates a personalized weekly premium every Sunday for each worker based on zone risk, earnings baseline, claims history, Trust Score, and upcoming weather forecast.

### 5. ⭐ Trust Score System
Every worker starts at Trust Score 100. Honest behaviour earns lower premiums over time. Fraudulent behaviour triggers review and premium increases. This creates a powerful incentive loop that rewards good actors.

### 6. 📊 Explainable AI — Premium & Payout Cards
Every AI decision comes with a human-readable explanation:

**Premium Card example:**
> *"Your premium this week: ₹199. Zone risk HIGH (+₹12), Earnings baseline medium (+₹5), Clean history discount (−₹8), Rain forecast (+₹10). Final: ₹199."*

**Payout Card example:**
> *"Event #BLR-24-07: Heavy rain (28mm/hr) + Flood Alert + 74% order drop. Your Tuesday baseline: ₹1,000. Protected at 60% = ₹600 credited."*

### 7. 💬 WhatsApp-First UX
The entire worker-facing experience is available on WhatsApp — zero app download required.

| WhatsApp Command | Action |
|-----------------|--------|
| (onboarding flow) | Register in Hindi/Kannada/Tamil/Telugu/English |
| `STATUS` | View coverage, Trust Score, next renewal |
| `BUFFER ON` | Activate Income Smoothing Pocket |
| `BUFFER OFF` | Deactivate Income Smoothing |
| (auto) | Weekly premium UPI payment link |
| (auto) | Instant payout notification |
| (auto) | Safe Day Bonus alert |

### 8. 💰 Income Smoothing Pocket
Addresses income volatility — without crossing into savings or lending.

- Worker activates `BUFFER ON` via WhatsApp
- Disruption payout splits: **80% to UPI immediately + 20% to Next Week Buffer**
- Buffer auto-releases next week if earnings fall below Earnings Fingerprint baseline
- If next week is a normal earnings week, buffer releases at week end regardless

### 9. 🛡️ Safe Day Bonus
When Nimbus predicts a truly hazardous day (e.g., AQI > 300 + heavy rain + traffic chaos simultaneously), it proactively recommends workers stay home — and pays them for doing so.

- Eligibility: Trust Score > 75, zero active GPS movement during declared hazard window
- Bonus: ₹100–200 credited to UPI by 10AM
- WhatsApp alert at 6AM: *"Conditions in Koramangala are hazardous today. Stay home — we'll credit ₹150 to your UPI."*

### 10. 🌊 Catastrophe Guardrails
When a city-wide event exceeds a severity threshold (multi-day red alerts, or payouts surpassing 60% of the premium pool), Nimbus activates **Catastrophe Mode** automatically:

- Payouts capped at 70% of normal to preserve pool solvency
- Broader eligibility extended to adjacent affected zones
- Catastrophe Dashboard activated in admin panel showing real-time exposure vs worst-case scenarios
- Community Pool supplements standard payouts by up to 50%

---

## Disruption Triggers

| Trigger | Data Source | Threshold | Base Payout |
|---------|------------|-----------|-------------|
| Heavy Rain | OpenWeatherMap API | > 20mm/hr in pincode | ₹250–400 |
| Extreme Heat | OpenWeatherMap API | > 42°C for 3+ hours | ₹150–300 |
| Flood Alert | IMD API | Official red/flood alert | ₹300–500 |
| Severe AQI | AQICN API | AQI > 300 (Hazardous) | ₹150–250 |
| Curfew / Strike | NewsAPI + ops override | Confirmed civic event in zone | ₹300–450 |
| Platform Order Drop | Mock Swiggy/Zomato API | Orders drop > 70% in 2-hr window | ₹200–350 |
| GPS Dead Zone | GPS validation layer | Worker in zone, zero orders for 90+ mins | ₹150–300 |

> All trigger APIs use free tiers or mock/simulated data where real APIs are unavailable.

---

## Weekly Premium Model

Gig workers operate week-to-week — so Nimbus prices week-to-week.

| Tier | Max Weekly Payout | Premium Range | Best For |
|------|------------------|---------------|----------|
| Basic | ₹500 / week | ₹79 – ₹129 / week | Part-time, low-risk zones |
| Standard | ₹1,000 / week | ₹149 – ₹199 / week | Full-time, moderate-risk zones |
| Premium | ₹2,000 / week | ₹249 – ₹349 / week | High earners, high-risk zones |

**Premium Formula:**
```
Base Premium     = Zone Risk Score × Tier Multiplier
AI Adjustment    = f(earnings_baseline, claims_history, trust_score, 7_day_forecast)
Final Premium    = Base + AI Adjustment  (recalculated every Sunday)
```

---

## AI/ML Architecture

### Model 1 — Zone Risk Scorer
- **Type:** Gradient Boosted Trees (XGBoost)
- **Inputs:** Historical weather events, flood frequency, curfew records, platform order volume patterns — all at pincode level
- **Output:** Zone Risk Score (0–100) per pincode, updated weekly
- **Training data:** 3 years of IMD weather data + simulated historical disruption records

### Model 2 — Earnings Fingerprint Builder
- **Type:** Time-series regression
- **Inputs:** Worker's logged or connected daily earnings over 2+ weeks
- **Output:** Personalized earnings baseline per worker (daily, weekly, by day-of-week)
- **Used for:** Payout calculation (% of actual lost income)

### Model 3 — Dynamic Premium Calculator
- **Type:** XGBoost regression
- **Inputs:** Zone Risk Score, Earnings Fingerprint baseline, claims history, Trust Score, upcoming 7-day weather forecast
- **Output:** Personalized weekly premium per worker
- **Run schedule:** Every Sunday night for the coming week

### Model 4 — Fraud Detection & Anomaly Detector
- **Type:** Isolation Forest + rule-based system
- **Inputs:** GPS pings, claim timestamps, zone disruption data, worker's historical claim patterns
- **Output:** Fraud risk score per claim (auto-approve / flag for review / auto-reject)
- **Named patterns detected:** Rain-Chaser, Zone-Hopper (see Fraud Detection section)

---

## Fraud Detection

Nimbus runs three validation layers in parallel on every claim event:

### Layer 1 — Geospatial Validation
- Worker GPS cross-referenced with disruption zone boundary at claim time
- GPS spoofing detection: flags impossible speeds, teleporting location pings
- Auto-reject if GPS shows worker was in a different city during the claimed event

### Layer 2 — Cross-Signal Verification
- Auto-approve only when ≥ 2 independent data sources confirm the disruption
- Single-source confirmation routes to manual review if Trust Score < 70
- If no external API recorded the disruption — automatic flag

### Layer 3 — Behavioural Anomaly Detection
- ML model identifies statistical outliers vs zone-wide claim patterns
- Each disruption event has a unique Event ID — one claim per worker per Event ID
- Sudden spike detection: unusual claim frequency triggers automatic review

### Named Fraud Patterns

**Rain-Chaser 🌧️**
A rider who jumps between adjacent wet zones just long enough to trigger multiple small payouts in a short window.
- *Detection rule:* No more than one disruption payout per worker per Event ID cluster across neighbouring pincodes within a 4-hour window.

**Zone-Hopper 📍**
A rider who repeatedly changes their registered pincode in anticipation of predicted high-payout events.
- *Detection rule:* Pincode changes tracked — more than 2 changes in a rolling 30-day window triggers a review flag.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Python (FastAPI) |
| AI / ML | scikit-learn, XGBoost |
| Database | PostgreSQL |
| Frontend | React.js + Tailwind CSS |
| WhatsApp | Twilio / Meta WhatsApp Business API |
| Weather | OpenWeatherMap API (free tier) |
| AQI | AQICN API (free tier) |
| News / Curfew | NewsAPI (free tier) |
| Payments | Razorpay Test Mode / UPI Sandbox |
| Auth | Firebase Auth (phone OTP) |
| Hosting | AWS Free Tier / Render |
| Version Control | GitHub (this repo) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKER INTERFACE LAYER                    │
│         WhatsApp Bot  ◄──────────────►  React Web App       │
│   (onboarding, alerts, payouts, controls)  (policy mgmt)    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   INTELLIGENCE ENGINE                        │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Zone Risk   │  │  Earnings    │  │ Dynamic Premium   │  │
│  │ Scorer      │  │  Fingerprint │  │ Calculator        │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Disruption  │  │ Fraud        │  │ Catastrophe       │  │
│  │ Monitor     │  │ Detection    │  │ Monitor           │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
└──────────┬──────────────────────────────────────┬──────────┘
           │                                      │
┌──────────▼──────────┐              ┌────────────▼──────────┐
│   EXTERNAL APIs     │              │   ADMIN DASHBOARD      │
│                     │              │                        │
│ • OpenWeatherMap    │              │ • Live disruption map  │
│ • AQICN             │              │ • Loss ratio analytics │
│ • IMD               │              │ • Fraud alert queue    │
│ • NewsAPI           │              │ • Catastrophe view     │
│ • Mock Platform API │              │ • Trust Score board    │
│ • Razorpay Sandbox  │              └────────────────────────┘
└─────────────────────┘
```

---

## Application Workflow

### Step 1 — Onboard (2 minutes via WhatsApp)
```
Worker receives Nimbus WhatsApp invite
→ Selects language (Hindi/Kannada/Tamil/Telugu/English)
→ Enters phone number + Swiggy Partner ID
→ AI fetches zone, estimates earnings baseline
→ Suggests best coverage tier with premium
→ Worker pays first week via UPI link
→ Coverage active immediately
```

### Step 2 — Monitor (always on, background)
```
Disruption Monitor polls APIs every 15 minutes
→ Detects threshold breach in active zone
→ Cross-checks worker GPS to confirm presence in zone
→ Verifies against 2+ independent data sources
```

### Step 3 — Trigger (automatic)
```
Disruption confirmed across multiple signals
→ Unique Event ID generated for this disruption
→ Fraud detection runs across all 3 layers (<30 seconds)
→ If clean: payout amount calculated via Earnings Fingerprint
→ Income Smoothing applied if BUFFER ON
→ Payout approved and queued for transfer
```

### Step 4 — Payout (zero touch)
```
UPI transfer hits worker's account
→ WhatsApp notification with Payout Card explanation
→ Trust Score updated (+1 for confirmed clean claim)
→ Event logged for zone-level analytics
```

### Step 5 — Safe Day Flow (proactive)
```
Intelligence Engine detects multi-signal hazardous day forecast
→ WhatsApp alert sent at 6AM to eligible workers (Trust Score >75)
→ Worker stays home, GPS confirms no movement in zone
→ Safe Day Bonus (₹100–200) credited by 10AM
```

---

## 6-Week Development Plan

### Phase 1 — Seed (Mar 4–20): Ideate & Know Your Worker
- [x] Define persona (Rajan, Swiggy, Bangalore)
- [x] Design weekly premium model and parametric triggers
- [x] Plan AI/ML architecture and tech stack
- [x] Create product README and concept document
- [ ] Build Figma prototype (key screens)
- [ ] Record 2-minute pitch video

### Phase 2 — Scale (Mar 21–Apr 4): Protect Your Worker
- [ ] Worker registration and onboarding flow (WhatsApp + web)
- [ ] Insurance policy management (create, view, renew)
- [ ] Dynamic premium calculation engine (XGBoost model)
- [ ] Claims management system
- [ ] 3–5 automated disruption triggers (weather + AQI + mock platform)
- [ ] Explainable Premium Cards and Payout Cards
- [ ] 2-minute demo video

### Phase 3 — Soar (Apr 5–17): Perfect for Your Worker
- [ ] Advanced 3-layer fraud detection
- [ ] Rain-Chaser and Zone-Hopper detection
- [ ] Income Smoothing Pocket (BUFFER ON/OFF)
- [ ] Safe Day Bonus system
- [ ] Catastrophe Guardrails and Catastrophe Mode
- [ ] Intelligent dual dashboard (worker + admin)
- [ ] Simulated instant payout via Razorpay test mode
- [ ] 5-minute demo video
- [ ] Final pitch deck (PDF)

---

## Future Roadmap

Features planned for post-hackathon development:

| Feature | Description |
|---------|-------------|
| 🧭 Smart Shift Advisor | Daily WhatsApp nudges advising best hours and zones to work based on risk + demand forecast — Nimbus as income co-pilot |
| 🏅 Nimbus Reliability Badge | Portable Trust Score exported as a credential workers can show in partner apps and delivery hubs |
| 📈 Lifecycle Coverage Tuning | Automatic quarterly coverage adjustment suggestions as a worker's earnings profile evolves |
| 📊 B2B Platform Insights | Anonymised disruption and retention analytics sold to Swiggy/Zomato as a B2B intelligence layer |
| 🏢 Hub & Crew Level Covers | Group-level coverage for entire delivery hubs or rider crews — one event covers all enrolled members |
| 📵 Offline & Low-Signal Mode | Fallback to cell-tower location during network blackouts common in floods and heavy rain |

---

## Constraints Compliance

| Requirement | Nimbus Approach |
|-------------|----------------|
| ✅ No health/life/accident/vehicle coverage | Nimbus covers **income loss only** — all payouts are wage replacements, not medical or repair payouts |
| ✅ Weekly pricing model | All premiums are structured and collected on a **weekly basis** aligned with gig workers' earnings cycle |
| ✅ Parametric triggers | All claims are triggered automatically by **external data signals** — no manual claim submission required |
| ✅ AI/ML integration | XGBoost premium engine, Isolation Forest fraud detection, time-series Earnings Fingerprint — all core to the product |
| ✅ Fraud detection | 3-layer system: GPS validation + cross-signal verification + behavioural anomaly detection |

---

*Built with ❤️ for Rajan and 15 million delivery partners across India.*
*Guidewire DEVTrails 2026 — Seed. Scale. Soar.*
