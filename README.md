# 🏥 MediQ — Full-Stack Telemedicine & Outpatient (OP) Queue Management Platform

<div align="center">

[![Live Deployment](https://img.shields.io/badge/Live_App-mediq--web--delta.vercel.app-10B981?style=for-the-badge&logo=vercel&logoColor=white)](https://mediq-web-delta.vercel.app/auth)
[![React 18](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Capacitor PWA](https://img.shields.io/badge/Capacitor-Android_&_PWA-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-6366F1?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](LICENSE)

<p align="center">
  <b>A production-grade healthcare Progressive Web App (PWA) designed to eliminate physical hospital waiting queues, automate outpatient (OP) registration, provide real-time hospital geolocation, and secure seamless medical payments.</b>
</p>

[**🚀 Access Live Application**](https://mediq-web-delta.vercel.app/auth) · [**📱 Live PWA Demo**](https://mediq-web-delta.vercel.app/) · [**📫 Report Issue**](https://github.com/ranjithbrs/mediq-web/issues)

</div>

---

## 📌 The Healthcare Challenge: Modernizing Outpatient Care

Physical hospital outpatient departments (OPDs) in developing and urban environments face persistent bottlenecks:
* **Overcrowded Waiting Rooms:** Patients wait 2 to 4 hours in waiting lobbies just to secure an initial doctor consultation token.
* **Paper-Based Record Delays:** Manual registration desks increase administrative overhead and human triage error.
* **Emergency Dispatch Friction:** Lack of real-time hospital bed discovery and distance calculation during acute medical emergencies.

**MediQ** solves these challenges through a unified digital health portal, enabling patients to discover healthcare centers, book verified consultation tokens remotely, pay consultation fees online, and access emergency services from any web or mobile device.

---

## 📐 System Architecture

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                        CLIENT APPLICATION LAYER                        │
 │                                                                        │
 │  ┌──────────────────────────┐         ┌─────────────────────────────┐  │
 │  │ Responsive React 18 / TS │         │ Capacitor Native Android App│  │
 │  │ (Vite + Tailwind CSS)    │         │ (Geolocation + Push Alerts) │  │
 │  └─────────────┬────────────┘         └──────────────┬──────────────┘  │
 └────────────────┼─────────────────────────────────────┼─────────────────┘
                  │  HTTPS REST / WebSocket Realtime    │
                  ▼                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      SUPABASE CLOUD BACKEND LAYER                      │
 │                                                                        │
 │   ┌────────────────────────┐               ┌───────────────────────┐   │
 │   │ Supabase Auth & JWT    │ ────────────► │ PostgreSQL Database   │   │
 │   │ (RBAC: Patient/Doctor) │               │ (RLS Protected Tables)│   │
 │   └────────────────────────┘               └───────────┬───────────┘   │
 └────────────────────────────────────────────────────────┼───────────────┘
                  │                                       │
                  ▼                                       ▼
 ┌───────────────────────────────────┐  ┌─────────────────────────────────┐
 │ Razorpay Payment Gateway API      │  │ Google Maps & Leaflet Geolocation│
 │ (Secure Token Checkout & Receipt) │  │ (Hospital Discovery & Routing)  │
 └───────────────────────────────────┘  └─────────────────────────────────┘
```

---

## ✨ Core Features & Functional Modules

### 1. 🎫 Digital OP Pre-Registration & Token Generation
* **Remote Slot Booking:** Patients schedule appointments by selecting specialty departments (General Medicine, Cardiology, Pediatrics, Orthopedics) and available doctors.
* **Live Digital Token:** Generates a real-time sequential token with estimated consultation timestamps, minimizing physical lobby waiting time.

### 2. 🗺️ Hospital Discovery & Interactive Maps
* **Real-time Geolocation:** Leverages `@capacitor/geolocation` and `@react-google-maps/api` / `leaflet` to locate the patient.
* **Hospital Directory:** Displays nearby registered primary health centers, multi-specialty clinics, and emergency hospitals sorted by distance.

### 3. 💳 Integrated Razorpay Payment Gateway
* **Seamless Checkout:** Integrated checkout flow for OPD consultation and registration fees via Razorpay.
* **Automated Receipts:** Generates downloadable, tamper-proof payment and prescription receipts using `jspdf`.

### 4. 🚨 Emergency Triage & Quick Response
* **One-Tap SOS:** Instant emergency routing to the nearest trauma centers with direct hotline dialing.
* **Bed Availability Overview:** High-level availability indicators for emergency triage.

### 5. 📱 Progressive Web App (PWA) & Mobile Ready
* Offline capability and home-screen installability via standard PWA service workers.
* Android native runtime wrapper configured via **Capacitor 8** (`@capacitor/android`, `@capacitor/core`).

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18** + **Vite** | Blazing-fast component rendering and HMR development |
| **Language** | **TypeScript** | Strict compile-time type safety across medical models |
| **Styling & UI** | **Tailwind CSS** + **shadcn/ui** | Clean, accessible medical dashboard design system |
| **Backend & Database** | **Supabase (PostgreSQL)** | Managed relational database with Row Level Security (RLS) |
| **Authentication** | **Supabase Auth** | Secure email/password and session token management |
| **State & Cache** | **TanStack Query (React Query)** | Server-state caching and real-time query invalidation |
| **Mapping & Location** | **Google Maps API & Leaflet** | Geospatial hospital search and distance computation |
| **Payments** | **Razorpay API** | Secure transaction processing and webhook confirmation |
| **Mobile Runtime** | **Capacitor 8** | Cross-platform native bridge for Android deployment |
| **Hosting & CI/CD** | **Vercel** | Global edge network hosting with automated Git deployments |

---

## 🚀 Local Development Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm** or **bun**

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ranjithbrs/mediq-web.git
   cd mediq-web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_RAZORPAY_KEY_ID=your-razorpay-key-id
   ```

4. **Launch the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 📱 Android Native Build (Capacitor)

To compile and preview the native Android application:
```bash
# Sync web assets to native Android project
npx cap sync android

# Open in Android Studio
npx cap open android
```

---

## 👤 Author & Connect

**Ranjith B**  
*Full-Stack Developer & CSBS Undergraduate*  
*Panimalar Engineering College, Chennai, India*

* 🌐 **Live Application:** [mediq-web-delta.vercel.app](https://mediq-web-delta.vercel.app/auth)
* 💼 **LinkedIn:** [linkedin.com/in/ranjith-b-csbs](https://www.linkedin.com/in/ranjith-b-csbs/)
* 💻 **GitHub:** [@ranjithbrs](https://github.com/ranjithbrs)
* 📧 **Email:** [ranjithb2k06@gmail.com](mailto:ranjithb2k06@gmail.com)

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
