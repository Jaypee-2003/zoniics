# ⚡ ZONIICS.AI — Platform Documentation

> **AI-powered communication infrastructure for modern businesses.**  
> Automate customer conversations across voice calls and WhatsApp with a single platform.

---

## 🔐 Super Admin Access

| Field    | Value                      |
|----------|---------------------------|
| URL      | `http://localhost:5173/superadmin/login` |
| Email    | `admin@zoniics.ai`        |
| Password | `SuperAdmin@2025!`        |

> Override defaults via `.env` — `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_NAME`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ZONIICS.AI PLATFORM                   │
├──────────────────────┬──────────────────────────────────┤
│   Super Admin        │   Business Admin (Tenant)        │
│   /superadmin/*      │   /dashboard/*                   │
│                      │                                  │
│ • Platform KPIs      │ • AI Voice Calls                 │
│ • Tenant management  │ • WhatsApp Automation            │
│ • Plan editor        │ • Outreach Campaigns             │
│ • AI core settings   │ • CRM / Contacts                 │
│ • Security audit     │ • Analytics                      │
│ • Platform config    │ • Team & Billing                 │
└──────────────────────┴──────────────────────────────────┘
         │                          │
         ▼                          ▼
   zoniics_sa_token           zoniics_token
   (localStorage)             (localStorage)
```

**3-tier role system:**

| Role            | Access                                      |
|-----------------|---------------------------------------------|
| `super_admin`   | Full platform control — AI core, billing, all tenants |
| `tenant_admin`  | Full access to their own business workspace |
| `staff`         | Scoped access based on permission flags     |

> `tenantId` is **always** read from the signed JWT — never from request body or query params.

---

## 🛠️ Tech Stack

| Layer     | Technology                                     |
|-----------|------------------------------------------------|
| Frontend  | React 19 · Vite 8 · Tailwind CSS 3 · React Router v7 |
| Backend   | Node.js · Express 5 · MongoDB · Mongoose        |
| Auth      | JWT (RS256) · bcryptjs · RBAC middleware        |
| Queue     | BullMQ · Redis (AI job workers)                 |
| AI / Voice| Vapi (outbound calls) · OpenAI GPT-4o          |
| Messaging | Meta WhatsApp Business API                     |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (for BullMQ queue workers)

### 1 — Clone & Install

```bash
git clone https://github.com/your-org/zoniics.git
cd zoniics

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2 — Configure Environment

Copy and edit the backend `.env`:

```bash
cp backend/.env.example backend/.env
```

| Variable               | Description                              |
|------------------------|------------------------------------------|
| `MONGO_URI`            | MongoDB connection string                |
| `REDIS_URL`            | Redis URL for BullMQ                     |
| `JWT_SECRET`           | Long random string (min 32 chars)        |
| `SUPER_ADMIN_EMAIL`    | Platform admin email (default: `admin@zoniics.ai`) |
| `SUPER_ADMIN_PASSWORD` | Platform admin password (default: `SuperAdmin@2025!`) |
| `WHATSAPP_ACCESS_TOKEN`| Meta permanent access token              |
| `WHATSAPP_VERIFY_TOKEN`| Your custom webhook verify token         |
| `VAPI_API_KEY`         | Vapi private API key for voice calls     |

### 3 — Run

```bash
# Terminal 1 — Backend (port 8000)
cd backend && npm start

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

On first start, the backend automatically:
- Seeds the **Super Admin** account
- Seeds **Starter / Pro / Enterprise** plan definitions

### 4 — Open

| Portal           | URL                                     |
|------------------|-----------------------------------------|
| Landing Page     | `http://localhost:5173`                 |
| Business Login   | `http://localhost:5173/login`           |
| Business Register| `http://localhost:5173/register`        |
| Business Dashboard | `http://localhost:5173/dashboard`     |
| Super Admin Login| `http://localhost:5173/superadmin/login`|
| Super Admin Panel| `http://localhost:5173/superadmin`      |

---

## 📁 Project Structure

```
zoniics/
├── backend/
│   ├── controllers/
│   │   ├── auth.controller.js        # Login, register, JWT issuance
│   │   ├── campaign.controller.js    # Outreach campaign CRUD + CSV upload
│   │   └── superadmin.controller.js  # Platform admin API (protected)
│   ├── middleware/
│   │   └── auth.middleware.js        # JWT verify, RBAC guards
│   ├── models/
│   │   ├── Tenant.js                 # Business accounts + staff sub-accounts
│   │   ├── SuperAdmin.js             # Platform admin (isolated model)
│   │   ├── Plan.js                   # Subscription plan definitions
│   │   ├── Interaction.js            # Voice + WhatsApp interaction logs
│   │   ├── Campaign.js               # Outreach campaigns
│   │   └── Lead.js                   # CSV leads per campaign
│   ├── routes/
│   │   └── api.routes.js             # Business tenant API (/api/*)
│   ├── services/
│   │   └── dialerQueue.service.js    # BullMQ job queue for AI calling
│   └── server.js                     # App entry, seeds, route mounting
│
└── frontend/
    └── src/
        ├── api/
        │   ├── client.js             # Axios for business auth (zoniics_token)
        │   └── saClient.js           # Axios for super admin (zoniics_sa_token)
        ├── components/
        │   ├── DashboardLayout.jsx   # Business dashboard shell + sidebar
        │   ├── SuperAdminLayout.jsx  # Super admin dark shell + sidebar
        │   ├── ProtectedRoute.jsx    # Business auth guard
        │   └── SuperAdminRoute.jsx   # Super admin auth guard
        └── pages/
            ├── OverviewPage.jsx      # Business dashboard home
            ├── VoicePage.jsx         # AI voice calls + agent config
            ├── WhatsAppPage.jsx      # WhatsApp automation + templates
            ├── CampaignPage.jsx      # Outreach campaigns (CSV cold calling)
            ├── AutomationPage.jsx    # Workflow templates
            ├── ContactsPage.jsx      # CRM contacts
            ├── AnalyticsPage.jsx     # Performance analytics
            ├── BillingPage.jsx       # Plans + invoices
            ├── TeamPage.jsx          # Staff management + permissions
            ├── OnboardingPage.jsx    # 4-step setup wizard
            ├── ConfigPage.jsx        # My AI Agent settings
            ├── LoginPage.jsx         # Business login
            ├── RegisterPage.jsx      # Business registration
            ├── SuperAdminLoginPage.jsx
            └── superadmin/
                ├── SAOverview.jsx    # Platform KPIs
                ├── SABusinesses.jsx  # Tenant management
                ├── SAPlans.jsx       # Plan editor + MRR
                ├── SAAIManagement.jsx# AI core settings (SA only)
                ├── SAAnalytics.jsx   # Platform analytics
                ├── SASecurity.jsx    # Audit log
                └── SASettings.jsx    # Platform config
```

---

## 🔒 Security Model

```
Super Admin ──────────────────────────────────────────────────┐
│  AI model, temperature, system prompt baseline              │
│  All tenant metadata and operational metrics                │
│  Suspend / delete / upgrade tenants                         │
│  Security audit log (immutable)                             │
│  Platform-wide rate limits and maintenance mode             │
└─────────────────────────────────────────────────────────────┘

Business Admin ───────────────────────────────────────────────┐
│  Their own workspace ONLY (tenantId from JWT, never params) │
│  AI agent personality and instructions                      │
│  Voice + WhatsApp automation                                │
│  Team members (with permission scoping)                     │
│  ✗ Cannot access: AI core, other tenants, platform config   │
└─────────────────────────────────────────────────────────────┘

Staff ────────────────────────────────────────────────────────┐
│  Permission flags: canManageCalls, canManageWhatsApp,       │
│  canManageCRM, canManageCampaigns, canViewAnalytics,        │
│  canManageTeam, canManageBilling, canManageAutomation       │
│  parentTenantId enforces workspace isolation                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌐 API Reference

### Auth

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| POST   | `/api/auth/register`            | Register a business      |
| POST   | `/api/auth/login`               | Business login           |
| GET    | `/api/auth/me`                  | Current user info        |
| POST   | `/api/auth/superadmin/login`    | Super admin login        |

### Business API `(Bearer: zoniics_token)`

| Method | Endpoint                          | Description               |
|--------|-----------------------------------|---------------------------|
| GET    | `/api/tenant`                     | Get workspace config      |
| PUT    | `/api/tenant`                     | Update workspace config   |
| GET    | `/api/stats`                      | Interaction stats         |
| GET    | `/api/interactions`               | Call + WhatsApp logs      |
| GET    | `/api/team`                       | List staff members        |
| POST   | `/api/team`                       | Invite staff member       |
| DELETE | `/api/team/:id`                   | Remove staff member       |
| GET    | `/api/campaigns`                  | List outreach campaigns   |
| POST   | `/api/campaigns`                  | Create campaign           |
| POST   | `/api/campaigns/:id/upload`       | Upload CSV leads          |
| POST   | `/api/campaigns/:id/launch`       | Launch campaign dialer    |

### Super Admin API `(Bearer: zoniics_sa_token)`

| Method | Endpoint                           | Description              |
|--------|------------------------------------|--------------------------|
| GET    | `/api/superadmin/overview`         | Platform KPIs            |
| GET    | `/api/superadmin/businesses`       | All tenants (paginated)  |
| PATCH  | `/api/superadmin/businesses/:id/status` | Suspend / activate  |
| PATCH  | `/api/superadmin/businesses/:id/plan`   | Change plan         |
| DELETE | `/api/superadmin/businesses/:id`   | Delete tenant            |
| GET    | `/api/superadmin/plans/:slug`      | Get plan definition      |
| PUT    | `/api/superadmin/plans/:slug`      | Update plan features     |
| GET    | `/api/superadmin/analytics`        | Signup + usage time series|
| GET    | `/api/superadmin/security`         | Audit log                |

---

## 📋 Subscription Plans

| Feature                | Starter `$29/mo` | Pro `$79/mo` | Enterprise `$199/mo` |
|------------------------|:----------------:|:------------:|:--------------------:|
| Inbound WhatsApp       | ✅               | ✅           | ✅                   |
| Outbound WhatsApp      | ✗                | ✅           | ✅                   |
| Inbound Voice Calls    | ✗                | ✅           | ✅                   |
| Outbound Voice Calls   | ✗                | ✗            | ✅                   |
| CSV Cold Calling       | ✗                | ✗            | ✅                   |
| Campaign Dashboard     | ✗                | ✅           | ✅                   |
| CRM Integration        | ✗                | ✅           | ✅                   |
| Advanced Analytics     | ✗                | ✅           | ✅                   |
| Team Members           | ✗                | ✅           | ✅                   |
| Custom AI Persona      | ✗                | ✗            | ✅                   |
| Voice Cloning          | ✗                | ✗            | ✅                   |
| White-label            | ✗                | ✗            | ✅                   |
| Messages / Month       | 2,000            | 20,000       | Unlimited            |
| Requests / Minute      | 50               | 200          | 1,000                |

---

## ⚙️ Environment Variables Reference

```env
# Server
PORT=8000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/zoniics_ai

# Queue
REDIS_URL=redis://localhost:6380

# Auth
JWT_SECRET=your_long_random_secret_here

# CORS
FRONTEND_URL=http://localhost:5173

# Super Admin (seeded on first boot)
SUPER_ADMIN_EMAIL=admin@zoniics.ai
SUPER_ADMIN_PASSWORD=SuperAdmin@2025!
SUPER_ADMIN_NAME=Platform Admin

# WhatsApp / Meta
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token
WHATSAPP_ACCESS_TOKEN=your_meta_permanent_access_token

# Vapi (AI Voice)
VAPI_API_KEY=your_vapi_private_key
```

---

## 🧪 Quick Test

```bash
# 1. Register a business
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Acme Corp","email":"test@acme.com","password":"Test@1234"}'

# 2. Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@acme.com","password":"Test@1234"}'

# 3. Get stats (replace TOKEN)
curl http://localhost:8000/api/stats \
  -H "Authorization: Bearer TOKEN"

# 4. Super admin login
curl -X POST http://localhost:8000/api/auth/superadmin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zoniics.ai","password":"SuperAdmin@2025!"}'
```

---

## 📦 Production Checklist

- [ ] Set a strong `JWT_SECRET` (32+ random chars)
- [ ] Change `SUPER_ADMIN_PASSWORD` from the default
- [ ] Set `NODE_ENV=production`
- [ ] Use MongoDB Atlas or a managed replica set
- [ ] Use a managed Redis (Upstash, Railway, etc.)
- [ ] Enable HTTPS — update `FRONTEND_URL` to your domain
- [ ] Configure Meta Webhook URL to your server's `/api/webhook/whatsapp`
- [ ] Store secrets in a vault (AWS Secrets Manager, Doppler, etc.)

---

<div align="center">

**Built with Zoniics.AI Platform**  
`v1.0.0` · React 19 · Node.js · MongoDB · BullMQ

</div>
