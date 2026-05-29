# BAPARIX Backend

AI-powered business intelligence and product sourcing platform for Bangladeshi entrepreneurs.

## Overview

BAPARIX Backend is a FastAPI-based server application that powers an AI-driven platform covering:

- 🔐 **Authentication & Authorization** - Supabase Auth with JWT tokens
- 🎯 **Product Search** - Multi-platform product sourcing (Alibaba, Pinduoduo, AliExpress, etc.)
- 📊 **Market Intelligence** - Real-time trend detection and competitor analysis
- 📋 **Business Planning** - AI-generated blueprints with financial projections
- 🚢 **Shipping Calculator** - Landed cost estimation with customs duty
- 💰 **Financial Tracking** - Revenue/expense tracking with encryption
- 🎨 **SEO Strategy** - Keyword research and content recommendations
- 👥 **Team Collaboration** - Workspace management with role-based permissions

## Technology Stack

- **Framework**: FastAPI with async/await
- **Databases**: PostgreSQL (Supabase), MongoDB, Redis
- **Job Queue**: Celery with Redis broker
- **Search**: Meilisearch
- **AI**: Ollama (local) + OpenRouter (cloud)
- **Scraping**: Playwright + Scrapy
- **PDF Generation**: WeasyPrint
- **Monitoring**: Prometheus + Sentry

## Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd baparix-backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start services with Docker Compose**
   ```bash
   docker-compose up -d postgres mongodb redis meilisearch ollama
   ```

6. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

7. **Pull Ollama model**
   ```bash
   docker exec -it baparix-ollama ollama pull qwen2.5:7b
   ```

8. **Start the development server**
   ```bash
   uvicorn app.main:app --reload
   ```

9. **Access the application**
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

### Using Docker Compose (Full Stack)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Project Structure

```
baparix-backend/
├── app/
│   ├── api/                    # API routes
│   │   ├── v1/                # Version 1 endpoints
│   │   └── internal/          # Internal/admin endpoints
│   ├── core/                  # Core business logic
│   ├── services/              # Business services
│   ├── models/                # Database models
│   ├── schemas/               # Pydantic schemas
│   ├── tasks/                 # Celery tasks
│   ├── scrapers/              # Web scrapers
│   ├── db/                    # Database utilities
│   ├── utils/                 # Utility functions
│   ├── config.py              # Configuration
│   └── main.py                # Application entry point
├── tests/                     # Test suite
├── alembic/                   # Database migrations
├── docker/                    # Docker configurations
├── scripts/                   # Utility scripts
├── requirements.txt           # Python dependencies
├── docker-compose.yml         # Local development setup
├── Dockerfile                 # Production container
└── README.md                  # This file
```

## Development

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/unit/test_auth.py

# Run with verbose output
pytest -v
```

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

### Code Quality

```bash
# Format code with black
black app tests

# Sort imports with isort
isort app tests

# Lint with flake8
flake8 app tests

# Type checking with mypy
mypy app
```

### Background Jobs

```bash
# Start Celery worker
celery -A app.tasks.celery_app worker --loglevel=info

# Start Celery beat scheduler
celery -A app.tasks.celery_app beat --loglevel=info

# Monitor with Flower
celery -A app.tasks.celery_app flower
# Access at http://localhost:5555
```

## API Documentation

Interactive API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `MONGODB_URL` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `OLLAMA_BASE_URL` - Ollama API endpoint
- `OPENROUTER_API_KEY` - OpenRouter API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon key

## Monitoring

### Health Check

```bash
curl http://localhost:8000/health
```

### Metrics

Prometheus metrics are exposed at:
```
http://localhost:8000/metrics
```

### Logs

Structured JSON logs are written to stdout. View with:
```bash
docker-compose logs -f api
```

## Deployment

### Production Checklist

- [ ] Set `ENVIRONMENT=production`
- [ ] Set `DEBUG=False`
- [ ] Generate secure `SECRET_KEY`
- [ ] Configure production database URLs
- [ ] Set up Sentry for error tracking
- [ ] Configure CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerting
- [ ] Review rate limiting settings
- [ ] Configure log aggregation

### Docker Production Build

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

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Run code quality checks
5. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues and questions, please contact the development team.
