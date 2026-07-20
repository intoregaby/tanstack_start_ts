# TanStack Start App

A modern, high-performance web application built with **TanStack Start**, **React 19**, **Vite**, **Tailwind CSS**, and **Supabase**.

---

## 🚀 Features & Tech Stack

### Tech Stack
- **Framework:** [TanStack Start](https://tanstack.com/start) & [TanStack Router](https://tanstack.com/router)
- **UI & Styling:** React 19, Tailwind CSS, Radix UI Primitives, Lucide Icons, Framer Motion
- **Backend & Auth:** Supabase (`@supabase/supabase-js`)
- **Build Tool:** Vite, Nitro Engine
- **Maps & Media:** Leaflet / React Leaflet

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/intoregaby/tanstack_start_ts.git
   cd tanstack_start_ts
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

---

## 🌐 Deployment on Vercel

1. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
2. Import the `intoregaby/tanstack_start_ts` repository from GitHub.
3. Configure the environment variables from your `.env` file in the Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_PROJECT_ID`
4. Click **Deploy**. Vercel will automatically build and deploy the app on every push to `main`.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
