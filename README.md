# TanStack Start App

A modern, high-performance web application built with **TanStack Start**, **React 19**, **Vite**, **Tailwind CSS**, and **Supabase**.

---

## 🚀 Features & Tech Stack

### Tech Stack
- **Framework:** [TanStack Start](https://tanstack.com/start) & [TanStack Router](https://tanstack.com/router)
- **UI & Styling:** React 19, Tailwind CSS, Radix UI Primitives, Lucide Icons, Framer Motion
- **Backend & Auth:** Supabase (`@supabase/supabase-js`)
- **Build Tool:** Vite, Nitro
- **Maps & Media:** Leaflet / React Leaflet

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/intoregaby/<repository-name>.git
   cd <repository-name>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
   SUPABASE_URL=your_supabase_url
   SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   SUPABASE_PROJECT_ID=your_supabase_project_id
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

1. Push your repository to GitHub under your account (`intoregaby`).
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Add the environment variables specified in `.env`.
5. Click **Deploy**.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
