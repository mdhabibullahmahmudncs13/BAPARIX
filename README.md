# BAPARIX

**AI-Powered Business Intelligence and Product Sourcing Platform for Bangladeshi Entrepreneurs**

[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](CHANGELOG.md)
[![Status](https://img.shields.io/badge/status-Production-green.svg)](https://baparix.com)

---

## 🚀 Overview

BAPARIX is a comprehensive business intelligence platform designed specifically for Bangladeshi resellers, importers, and SME owners. The platform combines AI-powered insights, multi-platform product sourcing, market intelligence, financial tracking, and business planning tools to help entrepreneurs make data-driven decisions.

### Key Features

- 🔍 **Multi-Platform Product Search** - Search across Alibaba, Pinduoduo, AliExpress, DHgate, Xianyu, and SkyBuyBD
- 📊 **Market Intelligence** - Real-time trend detection, seasonal forecasts, and competitor analysis
- 📋 **AI Business Blueprints** - Automated business plan generation with financial projections
- 🚢 **Shipping Calculator** - Compare costs across 6+ shipping agencies with customs duty estimation
- 💰 **Financial Tracking** - Revenue/expense tracking with encryption and profit margin analysis
- 🎨 **SEO Strategy** - Keyword research and content recommendations for Bangladesh market
- 👥 **Team Collaboration** - Role-based workspace management
- 🌐 **Bilingual Support** - Full Bengali (বাংলা) and English interface

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.11+ (for backend)
- **Docker** & Docker Compose (for services)
- **Git**

### Clone Repository

```bash
git clone https://github.com/mdhabibullahmahmudncs13/BAPARIX.git
cd BAPARIX
```

### Start Backend Services

```bash
cd baparix-backend
docker-compose up -d
```

### Start Frontend

```bash
cd baparix-ui
npm install
npm run dev
```

### Access Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Celery Monitor:** http://localhost:5555

---


## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BAPARIX Platform                         │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │   Users (Web/Mobile) │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   Next.js Frontend   │
                    │   (baparix-ui)       │
                    │  - React Components  │
                    │  - Tailwind CSS      │
                    │  - i18n (bn/en)      │
                    └──────────┬───────────┘
                               │ HTTPS/REST
                    ┌──────────▼───────────┐
                    │   FastAPI Backend    │
                    │   (baparix-backend)  │
                    │  - API Gateway       │
                    │  - Auth Middleware   │
                    │  - Rate Limiting     │
                    └──────────┬───────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼────────┐  ┌─────────▼────────┐  ┌─────────▼────────┐
│   PostgreSQL   │  │     MongoDB      │  │      Redis       │
│   (Supabase)   │  │  (Product Data)  │  │  (Cache/Queue)   │
│ - User Data    │  │ - Scraped Data   │  │ - Sessions       │
│ - Financial    │  │ - Unstructured   │  │ - Job Queue      │
│ - Blueprints   │  │   Documents      │  │ - Rate Limits    │
└────────────────┘  └──────────────────┘  └──────────────────┘

        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼────────┐  ┌─────────▼────────┐  ┌─────────▼────────┐
│  Meilisearch   │  │  Ollama (Local)  │  │ OpenRouter (Cloud│
│  (Search Eng)  │  │  - Qwen2.5-7b    │  │ - Llama 3.1      │
│ - Full-text    │  │  - Fast/Private  │  │ - Mistral 7b     │
│ - Bengali/Eng  │  │  - Translation   │  │ - Gemma 2        │
└────────────────┘  └──────────────────┘  └──────────────────┘

        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼────────┐  ┌─────────▼────────┐  ┌─────────▼────────┐
│     Celery     │  │    Playwright    │  │      Scrapy      │
│  (Job Queue)   │  │  (JS Scraping)   │  │  (HTML Scraping) │
│ - Async Tasks  │  │ - Alibaba        │  │ - Static Sites   │
│ - Scheduling   │  │ - Pinduoduo      │  │ - Product Data   │
└────────────────┘  └──────────────────┘  └──────────────────┘
```

### Component Overview

| Layer | Components | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14, React, Tailwind CSS | User interface with bilingual support |
| **API** | FastAPI, Uvicorn | RESTful API with async support |
| **Data** | PostgreSQL, MongoDB, Redis | Structured, unstructured, and cache storage |
| **AI** | Ollama (local), OpenRouter (cloud) | Hybrid AI for cost-effective intelligence |
| **Search** | Meilisearch | Full-text search with Bengali support |
| **Jobs** | Celery, Redis | Background task processing |
| **Scraping** | Playwright, Scrapy | Product data collection |

---


## 🛠️ Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 14.2.35 | React framework with App Router and SSR |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 3.4.1 | Utility-first CSS framework |
| **Zustand** | 5.0.13 | Lightweight state management |
| **React Query** | 5.100.14 | Server state management and caching |
| **React Hook Form** | 7.76.1 | Performant form handling |
| **Zod** | 4.4.3 | Schema validation |
| **next-intl** | 4.12.0 | Internationalization (Bengali/English) |
| **Recharts** | 3.8.1 | Data visualization |
| **Jest** | 30.4.2 | Unit testing |
| **Playwright** | 1.60.0 | E2E testing |

### Backend Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **FastAPI** | 0.109.0 | Modern async Python web framework |
| **Python** | 3.11+ | Programming language |
| **Uvicorn** | 0.27.0 | ASGI server |
| **SQLAlchemy** | 2.0.25 | SQL ORM with async support |
| **Pydantic** | 2.5.3 | Data validation |
| **Supabase** | 2.3.4 | Authentication service |
| **Celery** | 5.3.6 | Distributed task queue |
| **Playwright** | 1.41.0 | Browser automation |
| **Scrapy** | 2.11.0 | Web scraping framework |
| **WeasyPrint** | 60.2 | PDF generation |
| **pytest** | 7.4.4 | Testing framework |
| **Hypothesis** | 6.92.2 | Property-based testing |

### Database Stack

| Database | Version | Purpose |
|----------|---------|---------|
| **PostgreSQL** | 16 | Relational data (users, subscriptions, financial) |
| **MongoDB** | 7.0 | Document storage (scraped products) |
| **Redis** | 7 | Caching, sessions, job queue |
| **Meilisearch** | 1.6 | Full-text search engine |

### AI Stack

| Component | Model | Purpose |
|-----------|-------|---------|
| **Ollama** | Qwen2.5-7b | Local AI for fast, private tasks |
| **OpenRouter** | Llama 3.1 8B | Complex reasoning (blueprints) |
| **OpenRouter** | Mistral 7B | Market analysis |
| **OpenRouter** | Gemma 2 9B | SEO strategy |

### Infrastructure

| Tool | Purpose |
|------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **Alembic** | Database migrations |
| **Flower** | Celery monitoring |
| **Sentry** | Error tracking |
| **Prometheus** | Metrics collection |

---


## 📁 Project Structure

```
BAPARIX/
├── baparix-ui/                 # Frontend (Next.js)
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/          # Internationalized routes
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── products/      # Product search
│   │   │   ├── market/        # Market intelligence
│   │   │   ├── blueprint/     # Business planning
│   │   │   ├── shipping/      # Shipping calculator
│   │   │   ├── financial/     # Financial tracking
│   │   │   ├── seo/           # SEO strategy
│   │   │   └── team/          # Team workspace
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── ui/                # Base UI components
│   │   ├── features/          # Feature components
│   │   ├── layouts/           # Layout components
│   │   └── shared/            # Shared components
│   ├── lib/
│   │   ├── api/               # API client
│   │   ├── hooks/             # Custom hooks
│   │   ├── stores/            # Zustand stores
│   │   ├── utils/             # Utilities
│   │   └── validations/       # Zod schemas
│   ├── public/
│   │   └── locales/           # i18n translations
│   │       ├── bn/            # Bengali
│   │       └── en/            # English
│   ├── package.json
│   └── README.md
│
├── baparix-backend/            # Backend (FastAPI)
│   ├── app/
│   │   ├── api/               # API endpoints
│   │   │   ├── v1/           # Version 1 routes
│   │   │   └── internal/     # Internal routes
│   │   ├── core/             # Core logic
│   │   │   ├── auth.py
│   │   │   ├── ai_router.py
│   │   │   ├── local_ai.py
│   │   │   ├── cloud_ai.py
│   │   │   └── permissions.py
│   │   ├── services/         # Business services
│   │   ├── models/           # Database models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── tasks/            # Celery tasks
│   │   ├── scrapers/         # Web scrapers
│   │   ├── db/               # Database utilities
│   │   └── utils/            # Utilities
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── property/         # Property-based tests
│   │   └── e2e/
│   ├── alembic/              # Database migrations
│   ├── docker-compose.yml
│   ├── requirements.txt
│   └── README.md
│
├── .kiro/                      # Kiro specs
│   └── specs/
│       ├── baparix-ui/
│       └── baparix-backend/
│
├── BAPARIX_SYSTEM_DOCUMENTATION.md  # Complete system docs
├── README.md                   # This file
└── LICENSE
```

---


## 💻 Installation

### Frontend Setup

```bash
# Navigate to frontend directory
cd baparix-ui

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your configuration
nano .env.local

# Run development server
npm run dev
```

**Environment Variables (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Backend Setup

```bash
# Navigate to backend directory
cd baparix-backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start services with Docker Compose
docker-compose up -d postgres mongodb redis meilisearch ollama

# Run database migrations
alembic upgrade head

# Pull Ollama model
docker exec -it baparix-ollama ollama pull qwen2.5:7b

# Start development server
uvicorn app.main:app --reload
```

**Environment Variables (.env):**
```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/baparix
MONGODB_URL=mongodb://mongo:password@localhost:27017/baparix_products
REDIS_URL=redis://:password@localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://:password@localhost:6379/1
CELERY_RESULT_BACKEND=redis://:password@localhost:6379/2

# AI
OLLAMA_BASE_URL=http://localhost:11434
OPENROUTER_API_KEY=your_api_key

# Auth
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_secret_key

# Search
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=your_master_key
```

### Docker Compose Services

The `docker-compose.yml` starts all required services:

- **PostgreSQL** (port 5432) - Primary database
- **MongoDB** (port 27017) - Product data storage
- **Redis** (port 6379) - Cache and job queue
- **Meilisearch** (port 7700) - Search engine
- **Ollama** (port 11434) - Local AI model
- **Celery Worker** - Background job processor
- **Celery Beat** - Task scheduler
- **Flower** (port 5555) - Celery monitoring

---


## ⚙️ Configuration

### Frontend Configuration

**Internationalization (i18n):**
```typescript
// i18n.ts
export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./public/locales/${locale}/common.json`)).default
}));
```

**Tailwind Configuration:**
```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { /* blue shades */ },
        secondary: { /* orange shades */ },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Bengali'],
      },
    },
  },
};
```

### Backend Configuration

**Database Models:**
```python
# app/models/user.py
class User(Base):
    __tablename__ = "users"
    id = Column(UUID, primary_key=True)
    email = Column(String, unique=True)
    subscription_tier = Column(String, default="free")
```

**AI Router:**
```python
# app/core/ai_router.py
def route_task(task_type: str):
    if task_type in ["translation", "tagging"]:
        return local_ai  # Ollama
    else:
        return cloud_ai  # OpenRouter
```

**Rate Limiting:**
```python
# app/core/rate_limiter.py
TIER_LIMITS = {
    "free": {"product_search": 20},
    "pro": {"product_search": -1},  # Unlimited
}
```

---

## 🧪 Testing

### Frontend Tests

```bash
cd baparix-ui

# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

**Test Structure:**
```
baparix-ui/
├── components/
│   └── ui/
│       ├── Button.tsx
│       └── Button.test.tsx
└── lib/
    └── hooks/
        ├── useAuth.ts
        └── useAuth.test.tsx
```

### Backend Tests

```bash
cd baparix-backend

# Run all tests
pytest

# Run unit tests only
pytest tests/unit/

# Run with coverage
pytest --cov=app --cov-report=html

# Run property-based tests
pytest tests/property/

# Run specific test file
pytest tests/unit/test_auth.py -v
```

**Test Structure:**
```
baparix-backend/
└── tests/
    ├── unit/              # Unit tests
    ├── integration/       # Integration tests
    ├── property/          # Property-based tests
    └── e2e/              # End-to-end tests
```

### Property-Based Testing

```python
# tests/property/test_auth_properties.py
from hypothesis import given, strategies as st

@given(st.emails())
def test_email_validation(email):
    assert validate_email(email) == True
```

---


## 🔧 Development

### Frontend Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

### Backend Development

```bash
# Start API server
uvicorn app.main:app --reload

# Start Celery worker
celery -A app.tasks.celery_app worker --loglevel=info

# Start Celery beat scheduler
celery -A app.tasks.celery_app beat --loglevel=info

# Monitor Celery tasks
celery -A app.tasks.celery_app flower
```

### Code Quality

**Frontend:**
```bash
npm run lint          # ESLint
npx prettier --write  # Format code
```

**Backend:**
```bash
black app tests       # Format code
isort app tests       # Sort imports
flake8 app tests      # Lint
mypy app              # Type check
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Add new table"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# View migration history
alembic history
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request on GitHub
```

**Commit Message Convention:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Add or update tests
- `chore:` - Maintenance tasks

---


## 🚀 Deployment

### Production Deployment

#### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
cd baparix-ui
vercel --prod
```

**Environment Variables (Vercel):**
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Backend (Docker)

```bash
# Build production image
docker build -t baparix-backend:latest .

# Run production container
docker run -d \
  --name baparix-api \
  -p 8000:8000 \
  --env-file .env.production \
  baparix-backend:latest
```

### Production Checklist

- [ ] Set `ENVIRONMENT=production`
- [ ] Set `DEBUG=False`
- [ ] Generate secure `JWT_SECRET`
- [ ] Configure production database URLs
- [ ] Set up Sentry for error tracking
- [ ] Configure CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerting
- [ ] Review rate limiting settings
- [ ] Configure log aggregation

### Monitoring

**Application Metrics:**
- Prometheus metrics at `/metrics`
- Sentry error tracking
- Structured logging with structlog

**Health Checks:**
```bash
# API health check
curl http://localhost:8000/health

# Database health
curl http://localhost:8000/health/db
```

---


## 📚 API Documentation

### Authentication

#### POST /api/v1/auth/signup
Create a new user account.

```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "full_name": "John Doe"
  }'
```

#### POST /api/v1/auth/login
Authenticate and receive JWT token.

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Product Search

#### GET /api/v1/products/search
Search products across multiple platforms.

```bash
curl -X GET "http://localhost:8000/api/v1/products/search?query=laptop&platforms=alibaba,aliexpress&min_price=100&max_price=500" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "platform": "alibaba",
      "title": {
        "en": "Laptop Computer",
        "bn": "ল্যাপটপ কম্পিউটার"
      },
      "price": {
        "min": 250.00,
        "max": 500.00,
        "currency": "USD"
      },
      "supplier": {
        "name": "Tech Supplier Co.",
        "rating": 4.5
      },
      "moq": 10
    }
  ],
  "total": 150,
  "page": 1
}
```

### Market Intelligence

#### GET /api/v1/market/trends
Get trending products for Bangladesh.

```bash
curl -X GET "http://localhost:8000/api/v1/market/trends?category=electronics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Business Blueprint

#### POST /api/v1/blueprints/generate
Generate AI business blueprint.

```bash
curl -X POST http://localhost:8000/api/v1/blueprints/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "business_type": "product_reseller",
    "product_category": "electronics",
    "investment": 50000,
    "location": "Dhaka"
  }'
```

### Interactive API Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---


## 🎯 Features

### 1. Multi-Platform Product Search
Search across 6 major platforms:
- **Alibaba** - China B2B marketplace
- **Pinduoduo** - China C2C platform
- **AliExpress** - China B2C marketplace
- **DHgate** - China B2B platform
- **Xianyu** - China secondhand marketplace
- **SkyBuyBD** - Bangladesh aggregator

**Features:**
- Unified search results
- Real-time price comparison
- Supplier reliability scoring
- Automatic translation (Chinese → Bengali/English)
- Profit margin calculator

### 2. Market Intelligence
**Data Sources:**
- Google Trends (Bangladesh)
- Facebook Ad Library
- TikTok Research API
- Import/export statistics

**Features:**
- Weekly trending product alerts
- Seasonal demand forecasts (Eid, winter, school, monsoon)
- Competitor mapping
- Demand heatmaps
- Trend trajectory analysis

### 3. AI Business Blueprint Generator
**Components:**
- Business Model Canvas
- 12-month financial projections (3 scenarios)
- Break-even analysis
- TAM/SAM/SOM market sizing
- Go-to-market strategy
- SEO strategy
- Risk register
- Team structure recommendations

### 4. Shipping Cost Calculator
**Agencies:**
- SKS Group
- SkyBuyBD
- BD Express
- Sundarban Courier
- DHL Express
- Aramex

**Features:**
- Multi-agency cost comparison
- Lead time estimates
- Customs duty calculation (NBR rates)
- Total landed cost
- Seasonal delay warnings

### 5. Financial Tracking
- Revenue/expense logging
- AES-256 encryption
- Profit margin analysis
- Break-even tracking
- Best-seller ranking
- Inventory aging alerts
- VAT/tax estimation (15%)

### 6. SEO & Content Strategy
- Keyword research (Bangladesh market)
- Social SEO recommendations
- Hashtag strategy
- Google Lens optimization
- Marketplace SEO templates
- Ad copy generation (Bengali/English)
- TikTok video scripts

### 7. Team Collaboration
**Roles:**
- Owner (full access)
- Co-founder (full access except billing)
- Manager (view all, edit products/market)
- Analyst (view-only)
- Guest (limited view)

**Features:**
- Shared dashboards
- Real-time updates
- Activity indicators
- Role-based permissions

### 8. Bilingual Support
- Full Bengali (বাংলা) and English interface
- Automatic font switching
- Bengali numeral formatting
- Currency formatting (৳)
- Cookie-based locale persistence

---


## 💳 Subscription Tiers

| Feature | Free | Pro (৳999/mo) | Enterprise (৳3,499/mo) |
|---------|------|---------------|------------------------|
| **Product Searches** | 20/day | Unlimited | Unlimited |
| **Blueprint Generations** | 1/month | 10/month | Unlimited |
| **Team Members** | 1 | 5 | Unlimited |
| **Financial Tracking** | ✅ | ✅ | ✅ |
| **Market Intelligence** | Limited | Full | Full + Custom Reports |
| **API Access** | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ✅ | ✅ + Dedicated Manager |
| **Data Export** | CSV only | CSV + PDF | CSV + PDF + JSON |
| **Custom Integrations** | ❌ | ❌ | ✅ |

---

## 🔒 Security

### Authentication
- Supabase Auth integration
- JWT tokens (24h expiry)
- Email, Google OAuth, Phone OTP
- Role-based access control (RBAC)

### Data Protection
- AES-256 encryption for financial data
- Encrypted data at rest
- HTTPS/TLS for data in transit
- Environment-based key management
- Audit logging

### Rate Limiting
- Per-tier API limits
- DDoS protection
- Request throttling
- IP-based rate limiting

### Input Validation
- Pydantic schema validation
- SQL injection prevention
- XSS protection
- CSRF tokens

---

## 📊 Performance

### Frontend Metrics
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: 95+

### Backend Metrics
- API Response Time (p95): < 500ms
- Database Query Time (p95): < 100ms
- Cache Hit Rate: > 80%

### AI Performance
- Local AI (Ollama): ~1.5s
- Cloud AI (OpenRouter): ~30-45s
- Translation: ~1.2s

---


## 🗺️ Roadmap

### Phase 1: MVP ✅ (Current)
- [x] Product search across 6 platforms
- [x] Market intelligence dashboard
- [x] Business blueprint generator
- [x] Shipping calculator
- [x] Financial tracking
- [x] SEO strategy generator
- [x] Team collaboration
- [x] Bilingual support (Bengali/English)

### Phase 2: Enhancement 🔄 (Q3 2026)
- [ ] Mobile app (React Native)
- [ ] WhatsApp integration
- [ ] Voice commands (Bengali)
- [ ] Inventory management
- [ ] Supplier relationship management
- [ ] Advanced analytics dashboard
- [ ] Custom report builder

### Phase 3: Expansion 📋 (Q4 2026)
- [ ] Multi-country support (India, Pakistan)
- [ ] B2B marketplace integration
- [ ] Automated order placement
- [ ] Logistics tracking
- [ ] Payment gateway integration
- [ ] Accounting software integration
- [ ] AI chatbot assistant

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write tests
5. Run code quality checks
6. Commit your changes (`git commit -m 'feat: add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Style

**Frontend:**
- Follow ESLint configuration
- Use TypeScript for type safety
- Write unit tests for components
- Follow React best practices

**Backend:**
- Follow PEP 8 style guide
- Use type hints
- Write unit and integration tests
- Document API endpoints

### Pull Request Process

1. Update README.md with details of changes
2. Update documentation if needed
3. Ensure all tests pass
4. Request review from maintainers
5. Merge after approval

---


## 📖 Documentation

### Main Documentation
- **System Documentation:** [BAPARIX_SYSTEM_DOCUMENTATION.md](BAPARIX_SYSTEM_DOCUMENTATION.md)
- **Frontend README:** [baparix-ui/README.md](baparix-ui/README.md)
- **Backend README:** [baparix-backend/README.md](baparix-backend/README.md)

### API Documentation
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Specifications
- **UI Spec:** [.kiro/specs/baparix-ui/](. kiro/specs/baparix-ui/)
- **Backend Spec:** [.kiro/specs/baparix-backend/](.kiro/specs/baparix-backend/)

---

## 🐛 Troubleshooting

### Common Issues

#### Frontend won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### Backend database connection error
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check connection
psql -h localhost -U postgres -d baparix
```

#### Ollama model not found
```bash
# Pull the model
docker exec -it baparix-ollama ollama pull qwen2.5:7b

# List available models
docker exec -it baparix-ollama ollama list
```

#### Celery tasks not running
```bash
# Check Celery worker status
celery -A app.tasks.celery_app inspect active

# Restart Celery worker
docker-compose restart celery-worker

# Check Flower dashboard
open http://localhost:5555
```

### Getting Help

- **GitHub Issues:** https://github.com/mdhabibullahmahmudncs13/BAPARIX/issues
- **Email:** support@baparix.com
- **Discord:** https://discord.gg/baparix

---


## 📝 License

**Proprietary - All Rights Reserved**

Copyright © 2026 BAPARIX. All rights reserved.

This software and associated documentation files (the "Software") are proprietary and confidential. Unauthorized copying, distribution, modification, or use of this Software, via any medium, is strictly prohibited.

For licensing inquiries, contact: legal@baparix.com

---

## 👥 Team

### Core Team
- **Product Manager** - Strategy and roadmap
- **Backend Lead** - API and infrastructure
- **Frontend Lead** - UI/UX implementation
- **AI/ML Engineer** - AI system and models
- **DevOps Engineer** - Deployment and monitoring
- **UI/UX Designer** - Design system

### Contributors
We thank all contributors who have helped make BAPARIX better!

---

## 🙏 Acknowledgments

- **Bangladeshi Entrepreneur Community** - For valuable feedback and insights
- **Open Source Community** - For amazing tools and libraries
- **Beta Testers** - For helping us improve the platform
- **Supabase** - For authentication infrastructure
- **Vercel** - For frontend hosting
- **Ollama** - For local AI capabilities
- **OpenRouter** - For cloud AI access

---

## 📞 Contact

### Support
- **Email:** support@baparix.com
- **Phone:** +880 1XXX-XXXXXX
- **Address:** Dhaka, Bangladesh

### Social Media
- **Website:** https://baparix.com
- **Facebook:** https://facebook.com/baparix
- **LinkedIn:** https://linkedin.com/company/baparix
- **Twitter:** https://twitter.com/baparix
- **YouTube:** https://youtube.com/@baparix

### Community
- **Discord:** https://discord.gg/baparix
- **Facebook Group:** https://facebook.com/groups/baparix
- **GitHub:** https://github.com/mdhabibullahmahmudncs13/BAPARIX

---

## 📈 Stats

![GitHub stars](https://img.shields.io/github/stars/mdhabibullahmahmudncs13/BAPARIX?style=social)
![GitHub forks](https://img.shields.io/github/forks/mdhabibullahmahmudncs13/BAPARIX?style=social)
![GitHub issues](https://img.shields.io/github/issues/mdhabibullahmahmudncs13/BAPARIX)
![GitHub pull requests](https://img.shields.io/github/issues-pr/mdhabibullahmahmudncs13/BAPARIX)

---

<div align="center">

**Made with ❤️ for Bangladeshi Entrepreneurs**

[Website](https://baparix.com) • [Documentation](BAPARIX_SYSTEM_DOCUMENTATION.md) • [API Docs](http://localhost:8000/docs) • [Support](mailto:support@baparix.com)

</div>
