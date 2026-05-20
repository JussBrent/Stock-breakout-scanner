<div align="center">

# 📈 Orbis — Stock Breakout Scanner

**A real-time stock breakout scanner and trading intelligence platform.**

Orbis scans the market for technical breakout patterns, delivers AI-powered insights, and gives traders the tools to find high-probability setups before they move.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-stock--breakout--scanner.vercel.app-blue?style=for-the-badge)](https://stock-breakout-scanner.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Stars](https://img.shields.io/github/stars/JussBrent/Stock-breakout-scanner?style=for-the-badge)](https://github.com/JussBrent/Stock-breakout-scanner/stargazers)

</div>

---

## 🚀 Features

- **Real-Time Breakout Scanning** — Continuously monitors the market for technical breakout patterns across hundreds of symbols
- **AI Insights (Sean)** — AI-powered analysis to surface high-probability trade setups
- **Charting & Technicals** — Built-in charting with key technical indicators
- **Saved Scans & Strategies** — Save and reuse your custom scanning configurations
- **Smart Alerts** — Email and SMS notifications when your setups trigger
- **Paper Trading** — Test your strategies risk-free before going live
- **Watchlists** — Track your favorite symbols with per-stock notes and price alerts
- **Broker Connections** — Connect directly to your brokerage (Premium)
- **Subscription Management** — Stripe-powered billing with Core and Premium plans

---

## 💰 Pricing

| Plan | Price | Trial | Highlights |
|---------|--------------|----------------|------------|
| **Core** | $39 / month | 7-day free | Breakout scanner, charting, up to 5 saved scans, email alerts, paper trading |
| **Premium** | $79 / month | 7-day free | Everything in Core + full alt data, AI Insights (Sean), unlimited scans, SMS alerts, broker connections |

> **Note:** Stripe integration is coming soon. Placeholder price IDs (`price_core_monthly`, `price_premium_monthly`) are already wired up in `frontend/src/lib/pricing.ts`.

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations |
| React Router v7 | Client-side routing |
| Supabase JS | Auth + real-time data |
| Recharts | Charting |

### Backend

| Technology | Purpose |
|---|---|
| Python / Flask | API server |
| SQLAlchemy | ORM |
| Supabase (Postgres) | Database + auth |
| Stripe | Payments & subscriptions |
| PyJWT | Token verification |
| SlowAPI | Rate limiting |

---

## 📁 Project Structure

```
Stock-breakout-scanner/
├── frontend/                  # React + TypeScript app
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/             # Route pages
│   │   ├── lib/               # Utilities & config (pricing.ts, etc.)
│   │   └── hooks/             # Custom React hooks
│   └── vite.config.ts
│
├── backend/                   # Python / Flask API
│   ├── api/
│   │   ├── scan_routes.py     # Scan endpoints
│   │   ├── watchlist_routes.py
│   │   ├── preferences_routes.py
│   │   └── subscription_routes.py
│   ├── middleware/
│   │   ├── auth.py            # JWT authentication
│   │   ├── error_handler.py   # Global error handling
│   │   └── rate_limit.py      # Rate limiting
│   ├── models/
│   ├── services/
│   ├── migrations/
│   └── app.py
│
├── SUPABASE_SETUP.sql
├── FILTER_PRESETS_GUIDE.md
├── vercel.json
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Node.js 18+
- Python 3.10+
- A [Supabase](https://supabase.com) project (see `SUPABASE_SETUP.sql`)
- (Optional) A [Stripe](https://stripe.com) account for payments

### 1. Clone the repository

```bash
git clone https://github.com/JussBrent/Stock-breakout-scanner.git
cd Stock-breakout-scanner
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` with your credentials:

```env
DATABASE_URL=your_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_key
```

```bash
python app.py
```

### 4. Database Setup

Run the migration in your Supabase SQL Editor — copy the contents of `SUPABASE_SETUP.sql` and paste it into Supabase Dashboard > SQL Editor > Run.

---

## 🔌 API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/scan/universe` | Run full universe scan |
| `POST` | `/api/scan/symbol` | Scan a single symbol |
| `GET` | `/api/results` | Get latest scan results |
| `GET` | `/api/results/{symbol}` | Get results for a symbol |

### Protected (Require Bearer Token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/watchlist` | Get user's watchlist |
| `POST` | `/api/watchlist` | Add stock to watchlist |
| `PATCH` | `/api/watchlist/{symbol}` | Update watchlist item |
| `DELETE` | `/api/watchlist/{symbol}` | Remove from watchlist |
| `GET` | `/api/preferences` | Get user preferences |
| `PATCH` | `/api/preferences` | Update user preferences |
| `GET` | `/api/subscription` | Get subscription info |
| `POST` | `/api/subscription/checkout` | Create Stripe checkout session |

---

## 🔐 Authentication

Orbis uses **Supabase Auth** for user management and JWT-based API protection.

1. The frontend signs users in via Supabase Auth
2. Supabase returns a signed JWT access token
3. The frontend includes the token in API requests:

```ts
const response = await fetch('/api/watchlist', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

4. The backend validates the JWT using your `SUPABASE_JWT_SECRET`

---

## 🚦 Rate Limiting

| Tier | Limit | Applied To |
|------|-------|------------|
| Strict | 10 / minute | Universe scans |
| Standard | 30 / minute | Authenticated requests |
| Bulk | 100 / hour | Bulk operations |
| General | 1000 / day | General API usage |

---

## 🔒 Security

- JWT verification via Supabase JWT secret
- Row Level Security (RLS) enforced at the database level
- Rate limiting on all endpoints
- CORS configured for controlled origin access
- Errors sanitized in production — no internal details exposed
- All inputs validated with Pydantic models

---

## 🌐 Deployment

- **Frontend** — Deployed on [Vercel](https://vercel.com) (`vercel.json` included)
- **Backend** — Deployed on [Railway](https://railway.app) (`railway.toml` included)
- **Database** — [Supabase](https://supabase.com) (Postgres with RLS)

---

## 🗺 Roadmap

- [ ] Stripe Checkout & Billing integration
- [ ] SMS alerts via Twilio
- [ ] Broker API connections (Alpaca, TD Ameritrade)
- [ ] Mobile app (React Native)
- [ ] Expanded alt data sources
- [ ] Backtesting engine

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
Built with ❤️ by <a href="https://github.com/JussBrent">JussBrent</a>
</div>
