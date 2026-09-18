# Gym Management Software (TitanForge Fitness)

A comprehensive, production-ready, full-stack **Gym Management Software** built for real-world gym businesses, athletic facilities, and fitness clubs.

---

## Key Features

- **Executive Admin Dashboard**: Real-time KPI metrics, active memberships, monthly revenue, pending fee alerts, attendance charts, and expiring membership notices.
- **Member Management**: Comprehensive member profiles, personal records, emergency contacts, profile photos, assigned trainers, and status tracking.
- **Membership & Plan Management**: Custom membership tiers (Monthly, Quarterly, Bi-Annual, Annual, VIP) with admission fees, discounts, and auto-calculated expiration dates.
- **Payment & Fee Processing**: Complete billing system with receipt generation, partial payment handling, balance tracking, and PDF/printable receipts.
- **Attendance Tracking**: Check-in / check-out terminal for members and staff, daily logs, and check-in history.
- **Trainer Management**: Staff roster with trainer specializations, commission structures, assigned members, and salary records.
- **Expense & Financial Management**: Expense categorization, vendor logs, profit & loss statement generation, and exportable financial summaries.
- **Automated Transactional Emails (Brevo SMTP)**: Automated delivery of member welcome emails, payment receipts, membership expiry alerts, and administrative password resets.
- **Role-Based Access Control (RBAC)**: Secure multi-tier permissions (`SUPER_ADMIN`, `ADMIN`, `RECEPTIONIST`, `TRAINER`) with immutable audit logging.
- **Dual Database Architecture**: Seamless support for **PostgreSQL** in production (Render, Supabase, Neon) and **SQLite** for zero-setup local development.

---

## Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts |
| **Backend** | Node.js, Express, TypeScript, tsx, esbuild |
| **ORM & Database** | Prisma ORM with dynamic PostgreSQL / SQLite provider engine |
| **Authentication** | JSON Web Tokens (JWT) via secure cookies and Bearer headers, bcrypt password hashing |
| **Transactional Email** | Nodemailer with Brevo (Sendinblue) SMTP relay |
| **Deployment Targets** | **Render** (Backend API + PostgreSQL) & **Vercel** (Frontend SPA) |

---

## Environment Variables Reference

Configure these in your deployment platforms (Render / Vercel) or in a local `.env` file. **Never commit actual credentials to git.**

| Variable | Description | Required in Production | Example Value |
|---|---|---|---|
| `NODE_ENV` | Application environment mode | Yes | `production` |
| `PORT` | HTTP port for the Express backend | Render sets this automatically | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `AUTH_SECRET` | 32+ character random secret for signing JWTs | Yes | `openssl rand -base64 32` |
| `JWT_SECRET` | Alias for `AUTH_SECRET` (fallback) | Optional | Same as `AUTH_SECRET` |
| `CORS_ORIGIN` | Allowed frontend domains (comma-separated or wildcard) | Yes | `https://your-app.vercel.app,http://localhost:3000` |
| `VITE_API_URL` | Render backend URL (configured on Vercel frontend) | Yes (on Vercel) | `https://gym-management-api.onrender.com` |
| `SMTP_HOST` | Brevo SMTP host | Yes (for email) | `smtp-relay.brevo.com` |
| `SMTP_PORT` | Brevo SMTP port | Yes (for email) | `587` |
| `SMTP_USER` | Brevo account login email | Yes (for email) | `your-brevo-email@domain.com` |
| `SMTP_PASSWORD` | Brevo Master SMTP API Key | Yes (for email) | `xsmtpsib-...` |
| `SMTP_FROM` | Sender email address | Yes (for email) | `noreply@yourgymdomain.com` |
| `SMTP_FROM_NAME` | Sender display name | Optional | `TitanForge Fitness` |
| `ADMIN_EMAIL` | Initial Super Administrator email for DB seed | Optional | `admin@yourgym.com` |
| `ADMIN_PASSWORD` | Initial Super Administrator password for DB seed | Optional | `StrongAdminPass123!` |

---

## Production Deployment Guide

### Option 1: Backend on Render + Frontend on Vercel (Recommended)

#### Step 1: Deploy PostgreSQL & Backend on Render

1. **Create PostgreSQL Database on Render**:
   - Log in to your [Render Dashboard](https://dashboard.render.com/).
   - Click **New +** → **PostgreSQL**.
   - Name: `gym-management-db`.
   - Select the **Free** or **Starter** plan.
   - Once provisioned, copy the **Internal Database URL** (or External Database URL if deploying backend outside Render).

2. **Create Web Service on Render**:
   - Click **New +** → **Web Service**.
   - Connect your GitHub repository: `gym-Application`.
   - **Environment**: `Node`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Health Check Path**: `/api/health`

3. **Add Environment Variables on Render**:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: *(paste the Render PostgreSQL connection string)*
   - `AUTH_SECRET`: *(generate a 32+ character random string)*
   - `CORS_ORIGIN`: `https://your-app.vercel.app,http://localhost:3000`
   - `SMTP_HOST`: `smtp-relay.brevo.com`
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: *(your Brevo SMTP login)*
   - `SMTP_PASSWORD`: *(your Brevo master SMTP key)*
   - `SMTP_FROM`: `noreply@yourgymdomain.com`
   - `SMTP_FROM_NAME`: `TitanForge Fitness`
   - `ADMIN_EMAIL`: `admin@yourgym.com`
   - `ADMIN_PASSWORD`: *(your secure admin password)*

4. **Initialize Database Schema on Render**:
   - In your Render Web Service dashboard, navigate to **Shell**.
   - Run the database push command to initialize all PostgreSQL tables:
     ```bash
     npm run db:push
     ```
   - (Optional) Seed the database with default gym settings, roles, and plans:
     ```bash
     npm run db:seed
     ```

#### Step 2: Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com/) and click **Add New...** → **Project**.
2. Select your `gym-Application` repository.
3. Configure the Project Settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build:frontend`
   - **Output Directory**: `dist`
4. Add Environment Variables on Vercel:
   - `VITE_API_URL`: `https://your-backend-service.onrender.com` (your deployed Render Web Service URL)
5. Click **Deploy**.
6. Once deployed, copy your Vercel URL (e.g., `https://your-gym-app.vercel.app`) and ensure it is listed in your Render backend's `CORS_ORIGIN` variable!

---

### Option 2: All-in-One Full-Stack Deployment on Render

If you prefer serving both the API and the React frontend from a single Render Web Service:

1. Follow Step 1 above.
2. Leave `VITE_API_URL` empty. In production, Express automatically serves the compiled Vite assets from `/dist` and serves `index.html` on SPA routes.
3. All requests to `/api/*` are handled directly by the Express server.

---

## Brevo SMTP Configuration & Testing

1. Register an account at [Brevo.com](https://www.brevo.com/).
2. Navigate to **Transactional** → **Settings** → **Configuration**.
3. Copy your SMTP server (`smtp-relay.brevo.com`), port (`587`), and generate a new **SMTP Key**.
4. Set `SMTP_USER` and `SMTP_PASSWORD` in your deployment environment variables.
5. In the Gym Management Software, log in as an Admin, navigate to **Settings** → **Brevo SMTP & Transactional Email**, and click **Send Test Email** to verify end-to-end delivery.

---

## Local Development Quickstart

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/gym-Application.git
   cd gym-Application
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   *(For quick local testing, you can use the default SQLite database `file:./dev.db`)*

4. **Initialize database & generate Prisma client**:
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Default Seed Credentials**:
   - **Super Admin**: `admin@example.com` / `Admin@Password123!`
   - **Manager (Admin)**: `manager@example.com` / `Staff@Password123!`
   - **Receptionist**: `reception@example.com` / `Staff@Password123!`
   - **Trainer**: `trainer@example.com` / `Staff@Password123!`

---

## Available NPM Scripts

- `npm run dev`: Prepares DB provider, generates Prisma client, and launches full-stack dev server.
- `npm run build`: Builds both client assets and server bundle for production.
- `npm run build:frontend`: Builds Vite client bundle only (for Vercel).
- `npm run build:server`: Builds esbuild server bundle only.
- `npm run start`: Launches compiled production server (`dist/server.cjs`).
- `npm run db:prepare`: Dynamically configures `schema.prisma` provider for PostgreSQL or SQLite.
- `npm run db:generate`: Regenerates Prisma client.
- `npm run db:push`: Pushes schema directly to the database without manual migration files.
- `npm run db:migrate`: Deploys migration history in production.
- `npm run db:seed`: Seeds gym profile, plans, test members, and demo transactions.
- `npm run lint`: Runs TypeScript type validation.

---

## Security Highlights

- **Zero Hardcoded Secrets**: All credentials (database connection strings, JWT keys, SMTP passwords) are loaded strictly via environment variables.
- **Cryptographic Password Hashing**: Passwords stored using `bcrypt` with salt rounds = 10.
- **Granular RBAC**: Sensitive routes (`/api/users/*`, `/api/audit-logs`, `/api/email/*`) require administrative role claims.
- **Strict CORS Protection**: Configurable whitelist preventing cross-site scripting abuses across domains.
- **Audit Logging**: All member modifications, financial transactions, and privilege changes are permanently logged to the database.
