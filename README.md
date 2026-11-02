# PhishGuard AI

## 🛡️ Detecting E-Banking Phishing Websites Using Associative Classification

PhishGuard AI is an advanced AI-powered cybersecurity platform that detects phishing e-banking websites using **Associative Classification** algorithms. It analyzes URLs, domain data, SSL certificates, HTML behavior, and more to classify websites as **Legitimate**, **Suspicious**, or **Phishing**.

![PhishGuard AI](https://img.shields.io/badge/PhishGuard-AI-00f5ff?style=for-the-badge&logo=shield&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)

---

## 🚀 Features

### Core Features
- **URL Scanner** — Scan any URL for phishing indicators
- **AI Classification** — Associative Classification using Apriori/FP-Growth
- **Explainable AI** — Detailed reasoning for each detection
- **Risk Scoring** — 0-100 risk meter with confidence percentage
- **25+ Feature Extraction** — URL, domain, SSL, content analysis

### Authentication
- 📧 Email/Password registration & login
- 🔐 JWT-based sessions
- 🌐 Google OAuth integration
- 📱 OTP email verification
- 🔑 Forgot password flow
- 👑 Role-based access (User/Admin)

### User Dashboard
- 🔍 Real-time URL scanner with progress animation
- 📊 Scan results with risk meter
- 🧠 Explainable AI section
- 📋 Scan history
- 📈 Reports & analytics
- ⚙️ Profile settings

### Admin Panel
- 📊 Overview dashboard with stats
- 👥 User management
- 🚫 Blocked domains management
- 🧠 ML model retraining
- 🔍 All scans viewer
- 📈 Weekly trends

### Premium UI/UX
- 🌙 Cybersecurity dark theme + light mode
- ✨ Neon glow effects
- 🔮 Glassmorphism cards
- 🎆 Floating particles
- 📡 Animated threat radar
- ⌨️ Typing effect
- 📊 Animated counters
- 📱 Fully responsive

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python), Uvicorn |
| ML Engine | Scikit-learn, Pandas, NumPy, Apriori Algorithm |
| Database | MongoDB (Motor - async driver) |
| Auth | JWT, Google OAuth, OTP |
| Deployment | Vercel (Frontend), Render/Railway (Backend), MongoDB Atlas |

---

## 📁 Project Structure

```
Banking Phishing Website/
├── frontend/                    # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── layout.tsx       # Root layout
│   │   │   ├── globals.css      # Global styles
│   │   │   ├── login/           # Login page
│   │   │   ├── register/        # Register page
│   │   │   ├── forgot-password/ # Password reset
│   │   │   ├── dashboard/       # User dashboard
│   │   │   └── admin/           # Admin panel
│   │   ├── components/
│   │   │   └── Navbar.tsx       # Navigation bar
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # Auth state management
│   │   └── lib/
│   │       └── api.ts           # API client
│   ├── .env.local               # Environment variables
│   └── package.json
│
├── backend/                     # FastAPI Backend
│   ├── main.py                  # App entry point
│   ├── app/
│   │   ├── config.py            # Settings
│   │   ├── database.py          # MongoDB connection
│   │   ├── models.py            # Pydantic schemas
│   │   ├── auth.py              # JWT & password utils
│   │   ├── routes/
│   │   │   ├── auth.py          # Auth endpoints
│   │   │   ├── scan.py          # Scan endpoints
│   │   │   └── admin.py         # Admin endpoints
│   │   └── ml/
│   │       ├── feature_extractor.py  # Feature extraction
│   │       └── classifier.py         # Associative classifier
│   ├── requirements.txt
│   └── .env.example
│
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone the Repository
```bash
cd "Banking Phishing Website"
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate    # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Create .env file from template
copy .env.example .env
# Edit .env with your MongoDB URL and other settings

# Run the server
uvicorn main:app --reload --port 8000
```

The ML model will auto-train on first startup.

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
# Already created with defaults pointing to localhost:8000

# Run development server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🗄️ Database Collections

| Collection | Purpose |
|-----------|---------|
| `users` | User accounts and profiles |
| `scans` | URL scan results |
| `reports` | Saved scan reports |
| `blocked_domains` | Admin-managed blocklist |
| `admin_logs` | Admin activity tracking |
| `feedback` | User feedback on accuracy |

---

## 🧠 ML Model: Associative Classification

### How It Works

1. **Feature Extraction** — 25+ features from URL, domain, SSL, and content
2. **Binary Encoding** — Features converted to binary (present/absent)
3. **Apriori Mining** — Frequent itemsets discovered with min_support
4. **Rule Generation** — Association rules extracted (Feature → Class)
5. **Classification** — Rules ranked by confidence and applied to new URLs

### Features Analyzed

| Category | Features |
|----------|----------|
| URL-based | Length, IP address, @ symbol, dashes, subdomains, dots |
| Security | HTTPS, SSL validity, certificate age |
| Domain | Age, WHOIS privacy, DNS availability |
| Content | Redirects, iframes, forms, JavaScript, popups |

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Google OAuth |
| POST | `/api/auth/verify-otp` | Verify email OTP |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Scanning
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/scan/url` | Scan a URL |
| GET | `/api/scan/history` | Get scan history |
| GET | `/api/scan/result/{id}` | Get scan result |
| POST | `/api/scan/feedback` | Submit feedback |
| DELETE | `/api/scan/history/{id}` | Delete scan |

### Admin
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | List all users |
| PUT | `/api/admin/users/{id}/role` | Update user role |
| DELETE | `/api/admin/users/{id}` | Delete user |
| GET | `/api/admin/blocked-domains` | List blocked domains |
| POST | `/api/admin/blocked-domains` | Block a domain |
| DELETE | `/api/admin/blocked-domains/{id}` | Unblock domain |
| POST | `/api/admin/retrain-model` | Retrain ML model |

---

## 🚀 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy via Vercel CLI or GitHub integration
```

### Backend → Render/Railway
1. Push backend to a Git repository
2. Connect to Render/Railway
3. Set environment variables
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Database → MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user
3. Add connection string to backend `.env`

---

## 🔒 Security Features

- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation with Pydantic
- ✅ CORS configuration
- ✅ Role-based access control
- ✅ MongoDB sanitization
- ✅ API rate limiting ready

---

## 📄 License

This project is built for educational and research purposes.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Built with ❤️ for Cybersecurity | PhishGuard AI © 2026
