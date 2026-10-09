# Laser Grafix — Clinic POS & Management System

Laser Grafix is a clinic management and point-of-sale (POS) web application designed for aesthetic skin and laser clinics. It pairs a customer-facing clinic website with a staff portal for handling treatments, sales, package sessions, expenses, and day-end cash reconciliation.

---

## Features

### 1. Public Clinic Showcase
- **Clinic Website**: Showcase treatments, procedures, pricing, and clinic details.
- **Before & After Gallery**: Interactive comparison view for clinical treatment results.
- **Consultation & Booking Contact**: Direct contact and location details for patients.

### 2. Point of Sale & Clinical Billing
- **New Sale Workflow**: Fast service selection, customer association, custom discounts, and multi-tender payments (Cash, Card, Digital Transfer).
- **Package Management**: Multi-session treatment packages with per-session tracking and automated session balance redemption.
- **Receipts & Invoicing**:
  - **80mm Thermal Receipts**: Streamlined ESC/POS-style receipt formatting via native browser print (`@media print`).
  - **A4 Botanical Invoices**: Formal branded clinic invoices with itemized totals and payment summaries.

### 3. Clinic Operations & Financial Controls
- **Sales History**: Search, filter, and inspect detailed line items, payments, and voided transactions.
- **Customer Directory**: Patient profiles, contact details, total spend, and ongoing package status.
- **Expense Logging**: Clinic expense tracking categorized by payment method and purpose.
- **Day-End Closing & Z-Reports**: Immutable cash reconciliation and day closing records powered by database ledger functions.

### 4. Security & Architecture
- **Role-Based Access Control**: Strict staff separation (`user_roles` table with `app_role` enum).
- **Atomic Money Logic**: All financial transactions (sales, payments, voids, closings) execute through database-level `SECURITY DEFINER` functions.
- **Client Gate**: Protected admin area (`/admin/*`) with authentication checks.

---

## Tech Stack

- **Framework**: TanStack Start (Full-stack React 19 with SSR)
- **Bundler & Tooling**: Vite, Nitro
- **Styling**: Tailwind CSS v4, Radix UI primitives
- **Database & Auth**: Supabase (PostgreSQL, Supabase Auth, Row Level Security)
- **ORM / Migrations**: Drizzle ORM & SQL migrations
- **Icons**: Lucide React

---

## Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- npm or bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/masimkhan-dev/lasergrafixx.git
   cd lasergrafixx
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```env
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
   SUPABASE_URL="https://your-project-id.supabase.co"
   SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```
