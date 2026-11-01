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

## 👥 Upstream Project & Team Attribution

> [!NOTE]
> **MediQ Web (Fork)** is developed from the upstream repository [**`SANTHOSH040106/mediq-web`**](https://github.com/SANTHOSH040106/mediq-web), conceptualized and originally created by **Santhosh M** ([@SANTHOSH040106](https://github.com/SANTHOSH040106)).

* **Upstream Repository:** [`https://github.com/SANTHOSH040106/mediq-web`](https://github.com/SANTHOSH040106/mediq-web)
* **Original Author / Lead:** Santhosh M ([@SANTHOSH040106](https://github.com/SANTHOSH040106)) — Core architecture, Supabase integration, and authentication workflows.
* **Fork Maintainer & Contributor:** Ranjith B ([@ranjithbrs](https://github.com/ranjithbrs)) — Emergency module UI/routing, mobile layout resilience, asset lazy loading, Overpass API request throttling, demo access mode, and technical documentation.
* **Project Team & Collaborators:**
  * **Anusha PP** (Reg No: `721423244010`)
  * **Ranjith B** (Reg No: `721423244049`)
  * **Santhosh M** (Reg No: `721423244053`)
  * **Sripriyan S** (Reg No: `721423244056`)
* **Academic Institution:** Department of Computer Science and Business Systems (CSBS), Nehru Institute of Engineering and Technology (Autonomous), Coimbatore, Tamil Nadu, India.

---

## 💡 What is MediQ in 30 Seconds? (In Plain English)

Have you ever visited a hospital or clinic and had to stand in a long, crowded queue for 2 to 3 hours just to get a doctor's appointment token?

**MediQ** turns your phone into a **smart hospital reception desk**:
- 🏥 **Find Nearby Clinics:** Uses GPS to show you the closest hospitals and available specialist doctors.
- 🎟️ **Book Instant Tokens:** Reserve your doctor consultation token from home so you don't waste hours in crowded waiting rooms.
- 💳 **Pay Safely Online:** Pay the consultation fee securely via UPI, Card, or NetBanking with instant digital receipts.
- 🚨 **One-Click Emergency Assistance:** Instantly locate nearest ICU beds and emergency hospital routes during urgent situations.

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

## 🛠️ Verified Fork Contributions (by @ranjithbrs)

All contributions authored by **Ranjith B** in this repository are verified against git commit diffs across both upstream and fork remotes:

| Commit Hash | Branch | Contribution Scope | Key Technical Changes |
| :---: | :---: | :--- | :--- |
| [`11b55e6`](https://github.com/SANTHOSH040106/mediq-web/commit/11b55e6831f8ae5c903d38cf158e10ccaaf48586) | `main` | `feat(emergency)` | **Emergency Map Viewport & Route Reset:** Increased Leaflet container height (300px &rarr; 400px) in `EmergencyMap.tsx`; added `✕ Clear selection` control in `Emergency.tsx` to deselect active hospital and clear live OSRM routes. |
| [`ba95d55`](https://github.com/SANTHOSH040106/mediq-web/commit/ba95d559368614832e67e5c8fbf5c9c60cf53132) | `main` | `fix(ui)` | **Mobile Layout Guards & Hospital Nav:** Added text truncation (`truncate`, `min-w-0`, `shrink-0`) across `DoctorCard.tsx`, `HospitalCard.tsx`, and `AppointmentCard.tsx` to prevent overflow on mobile; added Hospital Dashboard nav link (`Building2` icon) in `BottomNavigation.tsx`. |
| [`5934ed9`](https://github.com/SANTHOSH040106/mediq-web/commit/5934ed9800773d05003a8eb6aacf5adf629fd638) | `main` | `perf` | **Asset Lazy Loading & Overpass Throttling:** Applied native browser `loading="lazy"` and `decoding="async"` across doctor/hospital card images; introduced 1 km geospatial distance threshold guard (`lastOsmCoordsRef`) in `Emergency.tsx` to prevent redundant Overpass API requests during GPS jitter. |
| [`fa08420`](https://github.com/ranjithbrs/mediq-web/commit/fa084207fe39bbb60276c8d0612106a5675f1c66) | `demo-mode` | `feat(demo)` | **1-Click Live Demo Authentication:** Implemented decoupled client demo authentication mode in `AuthContext.tsx`, `ProtectedRoute.tsx`, `useUserRole.tsx`, and `Auth.tsx` for presentation and testing access without email verification delays. |
| [`5e2c889`](https://github.com/ranjithbrs/mediq-web/commit/5e2c8895e68cca39830292585f093d9aa45bee11) | `main` | `docs` | **Full-Stack Technical Documentation & Architecture:** Authored complete project documentation, ASCII system architecture flow, module breakdown, and local development instructions. |
| [`8627701`](https://github.com/ranjithbrs/mediq-web/commit/86277019579e4071a21834b25115e8c537208e0c) / [`2cdc4a4`](https://github.com/ranjithbrs/mediq-web/commit/2cdc4a4f3bc69967db4ddfe44a2280157ef246a4) | `main` | `docs` | **Documentation Polish:** Added beginner-friendly plain English overview and updated professional contact references. |

---

## 👤 Fork Maintainer & Contact

**Ranjith B**  
*Full-Stack Developer & CSBS Undergraduate*  
*Nehru Institute of Engineering and Technology, Coimbatore, India*

* 🌐 **Live Application:** [mediq-web-delta.vercel.app](https://mediq-web-delta.vercel.app/auth)
* 💼 **LinkedIn:** [linkedin.com/in/ranjith-b-csbs](https://www.linkedin.com/in/ranjith-b-csbs/)
* 💻 **GitHub:** [@ranjithbrs](https://github.com/ranjithbrs)
* 📧 **Email:** [ranjithb2k06@gmail.com](mailto:ranjithb2k06@gmail.com)

---

## 📜 License & Copyright Notice

* **License:** This project and all associated documentation are distributed under the [MIT License](LICENSE).
* **Copyright & Attribution:** Copyright &copy; 2026 Santhosh M, Ranjith B, and MediQ Project Contributors.
* **Upstream Licensing Alignment:** Both the upstream repository ([`SANTHOSH040106/mediq-web`](https://github.com/SANTHOSH040106/mediq-web)) and this fork are unified under the official MIT License, with collaborative copyright ownership explicitly acknowledging the original creator **Santhosh M** and all project co-authors.
