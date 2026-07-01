# Expense Tracker — Implementation Plan

## Overview

A full-stack expense tracker built as a **Progressive Web App (PWA)** — installable on mobile like a native app, no app store needed. Go backend + React TypeScript frontend, deployed for free.

---

## Architecture

```
┌─────────────────────┐         ┌─────────────────────┐         ┌──────────────────┐
│   React PWA         │  HTTP   │   Go REST API       │         │   PostgreSQL     │
│   (TypeScript)      │────────▶│   (Chi router)      │────────▶│   (Supabase)     │
│                     │◀────────│                     │◀────────│                  │
│   Deployed: Vercel  │  JSON   │   Deployed: Render  │   SQL   │   Free Tier      │
└─────────────────────┘         └─────────────────────┘         └──────────────────┘
```

---

## Tech Stack

| Layer         | Technology              | Why                                                         |
|---------------|-------------------------|-------------------------------------------------------------|
| Frontend      | React + TypeScript      | Most popular framework, typed (similar to Go), huge ecosystem |
| UI Library    | Tailwind CSS + shadcn/ui| Clean minimal mobile-first design, no runtime overhead      |
| Charts        | Recharts                | Lightweight charting library for spending visualizations     |
| Build Tool    | Vite                    | Fast dev server, optimized production builds                |
| Backend       | Go + Chi router         | Leverages existing Go skills; Chi is lightweight & idiomatic |
| Database      | PostgreSQL (Supabase)   | Free managed Postgres, can add auth addon later             |
| DB Queries    | sqlc                    | Generates type-safe Go code from raw SQL — no magic ORM     |
| Migrations    | golang-migrate          | Version-controlled database schema changes                  |
| Auth (future) | JWT + Supabase Auth     | Start single-user, expand to multi-user later               |
| PWA           | vite-plugin-pwa         | Service worker, manifest, offline support, installability   |
| Deploy FE     | Vercel                  | Free, auto-deploys from GitHub on push                      |
| Deploy BE     | Render                  | Free tier for Go services                                   |

---

## Features (v1)

### Core
| # | Feature | Details |
|---|---------|---------|
| 1 | **Expense CRUD** | Add, edit, delete expenses with: amount, category, date, optional note (free-text explanation for future reference) |
| 2 | **Categories** | Predefined categories (Food, Transport, Bills, Entertainment, Health, Shopping, Education, Other) + ability to create custom categories with icon and color |
| 3 | **Dashboard** | Monthly/weekly summary — total spent, top category, daily average, budget remaining |
| 4 | **Charts** | Daily spending bar chart + category breakdown donut chart + weekly/monthly toggle |
| 5 | **Budget Limits** | Set monthly budget per category; progress bars color-coded (green < 70%, yellow 70-90%, red > 90%) |
| 6 | **Recurring Expenses** | Define recurring bills (rent, subscriptions, EMIs); auto-generated on schedule |
| 7 | **Multi-currency** | Log expenses in any currency; auto-convert to base currency using free exchange rate API |
| 8 | **Filters & Search** | Filter by: date range, category, amount range — all combinable; free-text search on notes |
| 9 | **CSV Export** | Download filtered or all expenses as spreadsheet |
| 10 | **PWA Install** | Add to home screen on mobile; launches fullscreen like native app |
| 11 | **Offline Viewing** | Cached dashboard and recent expenses viewable without internet |

### Performance Guarantees
- **Lightweight**: ~2-5 MB total (vs 50-100MB typical Play Store apps)
- **No background processes**: Only runs when opened
- **No ads/tracking/bloat**: Zero third-party SDKs
- **Instant load after install**: Service worker caches all assets
- **Virtual scrolling**: Long expense lists won't lag
- **Minimal JS bundle**: Code splitting — only current page loads

---

## Database Schema

### `categories`
```sql
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL,
    icon        VARCHAR(50),          -- emoji or icon name
    color       VARCHAR(7),           -- hex color code
    is_default  BOOLEAN DEFAULT false,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

### `expenses`
```sql
CREATE TABLE expenses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount      DECIMAL(12,2) NOT NULL,
    currency    VARCHAR(3) DEFAULT 'INR',
    note        TEXT,                  -- optional free-text explanation
    category_id UUID REFERENCES categories(id),
    date        DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

### `budgets`
```sql
CREATE TABLE budgets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id),
    amount      DECIMAL(12,2) NOT NULL,
    currency    VARCHAR(3) DEFAULT 'INR',
    period      VARCHAR(10) DEFAULT 'monthly',  -- monthly | weekly
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

### `recurring_expenses`
```sql
CREATE TABLE recurring_expenses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount      DECIMAL(12,2) NOT NULL,
    currency    VARCHAR(3) DEFAULT 'INR',
    note        TEXT,
    category_id UUID REFERENCES categories(id),
    frequency   VARCHAR(10) NOT NULL,  -- monthly | weekly
    next_date   DATE NOT NULL,
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### Expenses
| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| POST   | `/api/expenses` | Create expense | — |
| GET    | `/api/expenses` | List expenses (filtered) | `from`, `to`, `category_id`, `min_amount`, `max_amount`, `search`, `page`, `limit` |
| GET    | `/api/expenses/:id` | Get single expense | — |
| PUT    | `/api/expenses/:id` | Update expense | — |
| DELETE | `/api/expenses/:id` | Delete expense | — |
| GET    | `/api/expenses/export` | Export as CSV | `from`, `to`, `category_id`, `format=csv` |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/categories` | List all categories |
| POST   | `/api/categories` | Create custom category |
| PUT    | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category (only custom) |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/budgets` | Get all budgets with current spent amounts |
| POST   | `/api/budgets` | Create/update budget for a category |
| DELETE | `/api/budgets/:id` | Remove budget |

### Recurring Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/recurring` | List all recurring expenses |
| POST   | `/api/recurring` | Create recurring expense |
| PUT    | `/api/recurring/:id` | Update recurring expense |
| DELETE | `/api/recurring/:id` | Delete recurring expense |

### Dashboard & Summary
| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET    | `/api/summary` | Aggregated spending data | `period=monthly|weekly`, `date=2026-06` |

---

## Project Structure

```
expense_tracker/
├── plan.md                          ← this file
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go             ← entry point: server setup, routes
│   ├── internal/
│   │   ├── handler/
│   │   │   ├── expense.go          ← expense HTTP handlers
│   │   │   ├── category.go         ← category HTTP handlers
│   │   │   ├── budget.go           ← budget HTTP handlers
│   │   │   ├── recurring.go        ← recurring expense handlers
│   │   │   └── summary.go          ← dashboard/summary handlers
│   │   ├── model/
│   │   │   └── models.go           ← shared structs (Expense, Category, etc.)
│   │   ├── store/
│   │   │   ├── queries.sql         ← raw SQL queries for sqlc
│   │   │   └── (generated files)   ← sqlc-generated Go code
│   │   └── middleware/
│   │       ├── cors.go             ← CORS configuration
│   │       ├── logging.go          ← request logging
│   │       └── auth.go             ← JWT auth (Phase 6)
│   ├── migrations/
│   │   ├── 001_create_categories.up.sql
│   │   ├── 001_create_categories.down.sql
│   │   ├── 002_create_expenses.up.sql
│   │   ├── 002_create_expenses.down.sql
│   │   ├── 003_create_budgets.up.sql
│   │   ├── 003_create_budgets.down.sql
│   │   ├── 004_create_recurring.up.sql
│   │   └── 004_create_recurring.down.sql
│   ├── sqlc.yaml                    ← sqlc configuration
│   ├── Dockerfile                   ← for Render deployment
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                  ← shadcn/ui components (Button, Input, Card, etc.)
│   │   │   ├── ExpenseForm.tsx      ← add/edit expense form
│   │   │   ├── ExpenseCard.tsx      ← single expense display
│   │   │   ├── CategoryPicker.tsx   ← category selector with icons
│   │   │   ├── BudgetBar.tsx        ← color-coded progress bar
│   │   │   ├── FilterPanel.tsx      ← date range, category, amount filters
│   │   │   └── BottomNav.tsx        ← mobile bottom navigation
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx        ← summary cards + charts
│   │   │   ├── AddExpense.tsx       ← add new expense page
│   │   │   ├── History.tsx          ← expense list with filters
│   │   │   ├── Budgets.tsx          ← budget management page
│   │   │   ├── Recurring.tsx        ← recurring expenses page
│   │   │   └── Settings.tsx         ← base currency, export, categories
│   │   ├── hooks/
│   │   │   ├── useExpenses.ts       ← fetch/create/update/delete expenses
│   │   │   ├── useCategories.ts     ← fetch categories
│   │   │   ├── useBudgets.ts        ← fetch budgets
│   │   │   └── useSummary.ts        ← fetch dashboard data
│   │   ├── lib/
│   │   │   ├── api.ts              ← API client (base URL, fetch wrapper)
│   │   │   ├── types.ts            ← TypeScript interfaces (Expense, Category, etc.)
│   │   │   └── utils.ts            ← formatters, date helpers
│   │   ├── App.tsx                  ← router setup
│   │   └── main.tsx                 ← entry point
│   ├── public/
│   │   ├── icons/                   ← PWA icons (192x192, 512x512)
│   │   └── manifest.json           ← PWA manifest
│   ├── index.html
│   ├── vite.config.ts              ← Vite + PWA plugin config
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
└── README.md
```

---

## Implementation Phases

### Phase 1: Backend Foundation
**Goal**: Running Go API connected to PostgreSQL

**Steps**:
1. Initialize Go module (`go mod init github.com/<you>/expense-tracker`)
2. Install dependencies: `chi`, `pgx` (Postgres driver), `golang-migrate`
3. Set up Supabase project → get `DATABASE_URL`
4. Write migration SQL files for all 4 tables
5. Run migrations against Supabase
6. Configure `sqlc.yaml` and write query SQL
7. Generate Go code with `sqlc generate`
8. Set up Chi router in `main.go` with CORS + JSON middleware
9. Implement all handlers (expenses → categories → budgets → recurring → summary)
10. Test every endpoint with curl

**Verification**: 
- `curl POST /api/expenses` creates an expense → returns it with ID
- `curl GET /api/expenses?from=2026-06-01&to=2026-06-30` returns filtered list
- `curl GET /api/summary?period=monthly&date=2026-06` returns correct totals

---

### Phase 2: Frontend Core UI
**Goal**: Working mobile UI for expense management

**Steps**:
1. `npm create vite@latest frontend -- --template react-ts`
2. Install Tailwind CSS, shadcn/ui, React Router, Recharts
3. Set up mobile-first layout (max-width container, bottom nav)
4. Build pages: AddExpense → History → Dashboard → Settings
5. Build reusable components: ExpenseForm, ExpenseCard, CategoryPicker, FilterPanel
6. Create API client (`lib/api.ts`) pointing to backend URL
7. Build custom hooks for data fetching (useExpenses, etc.)
8. Wire up forms → API → list updates
9. Add loading spinners, error toasts, empty states

**Verification**:
- Open in Chrome DevTools mobile view (iPhone SE size)
- Add expense → appears in history
- Edit expense → changes reflect
- Delete expense → removed from list
- Filter by date range → correct results

---

### Phase 3: Dashboard & Analytics
**Goal**: Visual spending insights

**Steps**:
1. Build summary cards (total spent, daily average, top category, budget remaining)
2. Add Recharts bar chart — daily spending for current month
3. Add Recharts donut chart — spending by category
4. Add period toggle (this week / this month)
5. Build budget progress bars with color thresholds:
   - Green: < 70% spent
   - Yellow: 70-90% spent  
   - Red: > 90% spent
6. Add "over budget" notification badge

**Verification**:
- Add 10+ test expenses across categories
- Dashboard numbers match manual calculation
- Charts render correctly on mobile width
- Budget bars change color at correct thresholds

---

### Phase 4: Advanced Features ⚠️ NOT IMPLEMENTED (skipped — recurring & multi-currency not needed)
**Goal**: Recurring expenses, multi-currency, export

**Steps**:
1. **Recurring**: Backend endpoint to process due recurring expenses (called on app open or via cron)
2. **Recurring**: Frontend page to manage recurring expenses (add/edit/pause/delete)
3. **Multi-currency**: Integrate free exchange rate API (exchangerate-api.com)
4. **Multi-currency**: Add currency picker to expense form; convert for summaries
5. **Export**: Backend CSV generation with filters applied
6. **Export**: Frontend download button in Settings/History page
7. **Amount filter**: Add min/max amount inputs to FilterPanel

**Verification**:
- Create monthly recurring → it auto-generates expense on due date
- Add expense in USD → summary shows converted INR value
- Export CSV → opens correctly in Excel/Google Sheets with all columns

---

### Phase 5: PWA & Deployment
**Goal**: Live app installable on your phone

**Steps**:
1. Configure `vite-plugin-pwa`:
   - App name, description, theme color
   - Generate icons (192x192, 512x512)
   - Service worker with cache-first strategy for assets
   - Network-first for API calls with stale fallback
2. Add install prompt UI (banner or button)
3. **Deploy backend**:
   - Write Dockerfile (multi-stage: build Go binary → minimal runtime image)
   - Push to GitHub → connect to Render
   - Set `DATABASE_URL` environment variable
   - Verify API responds at `https://your-app.onrender.com/api/expenses`
4. **Deploy frontend**:
   - Push to GitHub → connect to Vercel
   - Set `VITE_API_URL` environment variable
   - Verify app loads at `https://your-app.vercel.app`
5. **Configure CORS**: Allow Vercel domain in Go backend
6. **Test on phone**:
   - Open URL in mobile Chrome/Safari
   - Tap "Add to Home Screen"
   - Open from home screen → verify fullscreen (no browser bar)
   - Turn off WiFi → verify cached data still shows

**Verification**:
- Lighthouse PWA score > 90
- App installs on both Android (Chrome) and iOS (Safari)
- Offline mode shows cached dashboard
- All features work end-to-end on mobile

---

### Phase 7 (Future): Multi-user & Auth
**Goal**: Share with friends

1. Add `users` table + `user_id` FK to all tables
2. Integrate Supabase Auth (email + Google sign-in)
3. Add JWT middleware to Go backend (validate Supabase tokens)
4. Add login/signup pages in frontend
5. Each user sees only their own data

---

## Deployment Details

| Service  | Purpose         | Free Tier Limits                          | URL Pattern                    |
|----------|-----------------|-------------------------------------------|-------------------------------|
| Supabase | PostgreSQL DB   | 500MB storage, 50K rows, 2 projects       | (connection string, not public) |
| Render   | Go backend API  | 750 hrs/month, spins down after 15min idle | `https://expense-api.onrender.com` |
| Vercel   | React frontend  | Unlimited deploys, 100GB bandwidth        | `https://expense-tracker.vercel.app` |

**Note on cold starts**: Render free tier sleeps after 15min of no requests. First request after sleep takes ~30 seconds. Mitigation: service worker shows cached data while API wakes up.

---

## Prerequisites to Install

### For Backend Development
```bash
# Go (if not installed)
brew install go

# golang-migrate CLI
brew install golang-migrate

# sqlc
brew install sqlc
```

### For Frontend Development
```bash
# Node.js (LTS)
brew install node

# Verify
node --version  # should be 18+
npm --version
```

### Accounts to Create (Free)
1. **GitHub** — code hosting + deployment trigger
2. **Supabase** (supabase.com) — free PostgreSQL database
3. **Render** (render.com) — free backend hosting
4. **Vercel** (vercel.com) — free frontend hosting

---

## Key Design Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| App type | PWA | No app store fees, one codebase, works on any phone, free hosting |
| Backend language | Go | Leverages existing skills, focus learning effort on frontend |
| Router | Chi | Standard `net/http` compatible, minimal magic, popular in Go ecosystem |
| DB queries | sqlc | Write SQL → get type-safe Go code. No ORM abstractions to debug |
| Frontend framework | React | Largest ecosystem, most job-relevant, excellent TypeScript support |
| Styling | Tailwind + shadcn/ui | Utility-first (fast to build), shadcn gives beautiful pre-built components |
| State management | React hooks + fetch | No Redux needed for this scale. Custom hooks keep it simple |
| Deployment | Vercel + Render | Both free, GitHub-connected auto-deploy, zero DevOps needed |

---

## How to Run Locally (After Setup)

```bash
# Terminal 1: Backend
cd backend
export DATABASE_URL="postgres://..."
go run cmd/api/main.go
# → API running at http://localhost:8080

# Terminal 2: Frontend
cd frontend
npm run dev
# → App running at http://localhost:5173
```

Open `http://localhost:5173` in Chrome → DevTools → Toggle device toolbar → select mobile device.

---

## Phase 6: Infinite Scroll + Filters + Custom Categories

**Goal**: Better expense browsing with pagination, filtering, and user-created categories.

### Phase 6A: Infinite Scroll in History

1. Replace single `getExpenses({ limit: '50' })` with paginated loading — start at page 1, limit 20
2. Add `IntersectionObserver` on a sentinel element at bottom of list. When visible → load next page → append to list
3. Show "Loading more..." indicator while fetching
4. Stop loading when `expenses.length >= total`
5. Reset pagination when filters change

### Phase 6B: Filter Panel in History

6. Add "Filter" toggle button at top of History (funnel icon from lucide-react)
7. Create collapsible filter section with:
   - **Search**: text input (searches notes via `search` param)
   - **Category**: dropdown using categories from API (sends `category_id`)
   - **Date range**: `from` and `to` date inputs
   - **Amount range**: `min_amount` and `max_amount` number inputs
8. On filter change → reset expense list and page to 1 → re-fetch with filter params
9. Show active filter count as badge on filter button

### Phase 6C: Custom Category Creation

10. Add "Create Category" section in Settings (below Budgets) with:
    - Name input (required)
    - Emoji/text input for icon
    - Color picker (predefined palette of 8-10 colors)
11. On submit → call `POST /api/categories` with `{ name, icon, color }`
12. Show toast on success → new category appears in all category pickers

### Verification
- Scroll to bottom of History → more expenses load automatically
- Apply category filter → only that category's expenses show
- Apply date range → correct subset returned
- Create custom category in Settings → shows in Add Expense picker
- Search by note text → matching expenses appear
