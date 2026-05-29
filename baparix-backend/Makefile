.PHONY: help install dev test lint format clean docker-up docker-down migrate

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	pip install -r requirements.txt
	playwright install chromium

dev: ## Run development server
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test: ## Run tests
	pytest

test-cov: ## Run tests with coverage report
	pytest --cov=app --cov-report=html --cov-report=term

lint: ## Run linters
	flake8 app tests
	mypy app

format: ## Format code
	black app tests
	isort app tests

clean: ## Clean up generated files
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .pytest_cache
	rm -rf .coverage
	rm -rf htmlcov
	rm -rf dist
	rm -rf build

docker-up: ## Start all Docker services
	docker-compose up -d

docker-down: ## Stop all Docker services
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-rebuild: ## Rebuild and restart Docker services
	docker-compose down
	docker-compose build
	docker-compose up -d

migrate: ## Run database migrations
	alembic upgrade head

migrate-create: ## Create a new migration (use MSG="description")
	alembic revision --autogenerate -m "$(MSG)"

migrate-rollback: ## Rollback last migration
	alembic downgrade -1

celery-worker: ## Start Celery worker
	celery -A app.tasks.celery_app worker --loglevel=info

celery-beat: ## Start Celery beat scheduler
	celery -A app.tasks.celery_app beat --loglevel=info

celery-flower: ## Start Flower monitoring
	celery -A app.tasks.celery_app flower

init-ollama: ## Initialize Ollama with required models
	./scripts/init_ollama.sh

setup: install docker-up init-ollama migrate ## Complete setup for new development environment
	@echo "✅ Setup complete! Run 'make dev' to start the server."
