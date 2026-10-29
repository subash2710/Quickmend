# QuickMend 🛠️
### AI-Powered Local Home-Service Finder & Booking Platform

**QuickMend** is a full-stack, AI-powered on-demand home service finder and booking platform inspired by real-time dispatch systems. It connects customers with nearby available, ON-DUTY service professionals (electricians, plumbers, carpenters, cleaners, AC technicians, appliance repair, painters, locksmiths, and other home-service experts).

---

## 🌟 Key Features

1. **AI Problem Diagnostic & Safety Layer**:
   - Customer describes a problem via text, voice speech-to-text, or image.
   - AI identifies the problem, maps to the exact database service category, determines severity, and provides safe troubleshooting advice.
   - Wrong-service mismatch detection automatically prompts customers to switch service categories if needed.
   - Intelligent fallback mode works out-of-the-box even without an AI API key.

2. **Automatic Provider Matching & Dispatch**:
   - Scores eligible ON-DUTY & AVAILABLE providers based on Distance (30%), Availability (20%), Rating (20%), Experience (15%), and Quality (15%).
   - Provider details are retrieved automatically from the database — no repetitive manual entry required per booking.

3. **Provider Duty System (ON DUTY / OFF DUTY)**:
   - One-tap toggle for providers to go ON DUTY or OFF DUTY.
   - Prevents going OFF DUTY while an active booking is in progress.

4. **Double-Acceptance Protection & Reassignment**:
   - Uses atomic database row locking (`with_for_update()`) to prevent two providers from accepting the same booking.
   - If a provider rejects or fails to respond, the system automatically reassigns the booking to the next best nearby provider.

5. **Live Interactive GPS Tracking**:
   - Real-time location updates via WebSockets (Socket.IO).
   - Shows customer location, provider location, route line, and dynamic ETA overlay.

6. **PayPal Sandbox Payment Integration**:
   - Secure checkout flow for completed bookings.
   - Verifies transactions backend-side and calculates 10% platform fee and net provider takehome earnings.

7. **Automatic Provider Rating Recalculation**:
   - Provider ratings are **never** hard-coded or manually set.
   - After customer feedback submission, backend automatically recalculates provider average rating (`sum(valid_ratings) / count(valid_ratings)`), review count, and quality score.

8. **Multi-Language Internationalization**:
   - Full support for **English (EN)**, **Tamil (TA)**, and **Hindi (HI)** with instant UI language switching.

9. **Role-Based Authorization**:
   - Enforces strict backend authorization for `CUSTOMER`, `PROVIDER`, and `ADMIN` roles.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Axios, Socket.IO Client, Leaflet, `@paypal/react-paypal-js`, Lucide Icons.
- **Backend**: Python 3.11+, Flask 3, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-CORS, Flask-SocketIO, Werkzeug, Pytest.
- **Database**: PostgreSQL (with automatic SQLite fallback for local quick testing).
- **Real-Time**: WebSockets via Flask-SocketIO.
- **Payment**: PayPal Sandbox REST APIs.

---

## 📁 Project Structure

```text
quickmend/
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, Footer, MapView, ServiceCard, PayPalButton, RatingModal, VoiceInput
│   │   ├── pages/            # LandingPage, CustomerDashboard, CustomerTracking, ProviderDashboard, AdminDashboard, etc.
│   │   ├── layouts/          # MainLayout
│   │   ├── services/         # api.ts (Axios client)
│   │   ├── context/          # AuthContext, SocketContext, LanguageContext
│   │   ├── locales/          # en.json, ta.json, hi.json
│   │   ├── types/            # TypeScript interfaces
│   │   └── App.tsx           # Router configuration
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/
│   ├── app/
│   │   ├── models/           # User, ProviderProfile, Service, Booking, Payment, Review, AIRequest, Notification
│   │   ├── routes/           # auth, services, providers, ai, service_requests, bookings, payments, reviews, admin
│   │   ├── services/         # matching, rating, payment_service, notification_service
│   │   ├── ai/               # service.py (Gemini API integration) & fallback.py (Rule-based engine)
│   │   ├── auth/             # Role authorization helpers
│   │   ├── sockets/          # Socket.IO event handlers
│   │   └── utils/            # Geo Haversine distance & ETA utilities
│   ├── tests/                # Pytest unit & integration test suite
│   ├── seed.py               # Seeds 9 core services, 4 providers, 3 customers, and admin
│   ├── run.py                # Server launcher
│   └── requirements.txt
│
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## 🔑 Demo Accounts (Pre-Seeded)

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | Rahul Sharma | `rahul@quickmend.com` | `customer123` | Bangalore customer |
| **Customer** | Priya Patel | `priya@quickmend.com` | `customer123` | Indiranagar customer |
| **Provider** | Arun Kumar | `arun@quickmend.com` | `provider123` | Electrical & AC Service (ON DUTY) |
| **Provider** | Suresh Raina | `suresh@quickmend.com` | `provider123` | Plumbing Specialist (ON DUTY) |
| **Provider** | Meena Kumari | `meena@quickmend.com` | `provider123` | Deep Cleaning (ON DUTY) |
| **Provider** | Vijay Verma | `vijay@quickmend.com` | `provider123` | Carpentry & Cleaning (OFF DUTY) |
| **Admin** | QuickMend Admin | `admin@quickmend.com` | `admin123` | Super Admin Dashboard |

---

## 🚀 Quick Start Guide (Local Setup)

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Run seed database script
python seed.py

# Start Backend Server (Runs on http://127.0.0.1:5000)
python run.py
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite Dev Server (Runs on http://localhost:5173)
npm run dev
```

---

## 🧪 Running Test Suite

```bash
# Run backend pytest suite
.\backend\venv\Scripts\pytest backend/tests

# Run frontend build check
cd frontend && npm run build
```

---

## 🐳 Docker Deployment

To run QuickMend with PostgreSQL container via Docker Compose:

```bash
docker-compose up --build
```

---

## 📜 Complete End-to-End Workflow Test

1. Log in as Customer (`rahul@quickmend.com` / `customer123`).
2. Type problem: *"My kitchen tap is leaking water continuously"*.
3. Click **🤖 Ask AI** &rarr; AI identifies **Plumbing** service.
4. Click **🔧 Find Professional** &rarr; QuickMend automatically searches ON-DUTY plumbers nearby and assigns **Suresh Raina**.
5. Log in as Provider **Suresh** (`suresh@quickmend.com` / `provider123`) in another browser tab.
6. Observe incoming request popup and click **ACCEPT JOB**.
7. Observe status change to `PROVIDER_ACCEPTED`.
8. Switch back to Customer tab &rarr; Observe live interactive map tracking Suresh.
9. On Provider tab, click **`On the way`** &rarr; **`Arrived`** &rarr; **`Start Service`** &rarr; **`Complete Service`**.
10. On Customer tab, click **Pay with PayPal Sandbox** &rarr; Payment verified!
11. Submit 5-star rating and comment &rarr; Provider rating automatically recalculates in database!
