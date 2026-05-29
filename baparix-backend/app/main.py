"""
VentureOS Backend - FastAPI Application Entry Point

This module initializes the FastAPI application with middleware, routers,
and configuration for the VentureOS platform.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import make_asgi_app
import structlog

from app.config import settings
from app.utils.logging import setup_logging

# Setup structured logging
setup_logging()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    Application lifespan manager for startup and shutdown events.
    
    Handles:
    - Database connection initialization
    - Redis connection pool setup
    - Meilisearch client initialization
    - Graceful shutdown of connections
    """
    logger.info("application_startup", environment=settings.ENVIRONMENT)
    
    # Initialize PostgreSQL database connection pool
    try:
        from app.db import init_db
        await init_db()
        logger.info("postgresql_initialized")
    except Exception as e:
        logger.error("postgresql_initialization_failed", error=str(e))
        raise
    
    # Initialize MongoDB database connection pool
    try:
        from app.db.mongodb import init_db as init_mongodb
        await init_mongodb()
        logger.info("mongodb_initialized")
    except Exception as e:
        logger.error("mongodb_initialization_failed", error=str(e))
        raise
    
    # Initialize Redis connection pool
    try:
        from app.db.redis import init_redis
        await init_redis()
        logger.info("redis_initialized")
    except Exception as e:
        logger.error("redis_initialization_failed", error=str(e))
        raise
    
    # TODO: Initialize Meilisearch client
    # TODO: Warm up cache if enabled
    
    yield
    
    # Shutdown
    logger.info("application_shutdown")
    
    # Close PostgreSQL database connection pool
    try:
        from app.db import close_db
        await close_db()
        logger.info("postgresql_closed")
    except Exception as e:
        logger.error("postgresql_close_failed", error=str(e))
    
    # Close MongoDB database connection pool
    try:
        from app.db.mongodb import close_db as close_mongodb
        await close_mongodb()
        logger.info("mongodb_closed")
    except Exception as e:
        logger.error("mongodb_close_failed", error=str(e))
    
    # Close Redis connection pool
    try:
        from app.db.redis import close_redis
        await close_redis()
        logger.info("redis_closed")
    except Exception as e:
        logger.error("redis_close_failed", error=str(e))
    
    # TODO: Close Meilisearch client


# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered business intelligence and product sourcing platform for Bangladeshi entrepreneurs",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID", "Accept-Language"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    max_age=3600,
)


# GZip Compression Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)


# Request ID Middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add unique request ID to each request for tracing."""
    import uuid
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    
    # Bind request ID to logger context
    structlog.contextvars.bind_contextvars(request_id=request_id)
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    return response


# Request Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests with timing information."""
    import time
    
    start_time = time.time()
    
    logger.info(
        "request_started",
        method=request.method,
        path=request.url.path,
        client_host=request.client.host if request.client else None,
    )
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    
    logger.info(
        "request_completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=round(duration * 1000, 2),
    )
    
    return response


# Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    logger.error(
        "unhandled_exception",
        error=str(exc),
        error_type=type(exc).__name__,
        path=request.url.path,
        method=request.method,
        exc_info=True,
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
            }
        }
    )


# Health Check Endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for container orchestration and monitoring.
    
    Checks:
    - Application status
    - PostgreSQL database connectivity
    - MongoDB database connectivity
    - Redis connectivity
    - Connection pool status
    
    Returns:
        dict: Health status with service availability
    """
    from app.db import check_database_health, get_pool_status
    from app.db.mongodb import check_database_health as check_mongodb_health, get_connection_stats
    from app.db.redis import check_redis_health, get_pool_info
    
    # Check database health
    db_healthy = await check_database_health()
    mongodb_healthy = await check_mongodb_health()
    redis_healthy = await check_redis_health()
    
    # Get connection pool status
    try:
        pool_status = await get_pool_status()
    except Exception:
        pool_status = None
    
    # Get MongoDB connection stats
    try:
        mongodb_stats = await get_connection_stats()
    except Exception:
        mongodb_stats = None
    
    # Get Redis pool info
    try:
        redis_info = await get_pool_info()
    except Exception:
        redis_info = None
    
    health_status = {
        "status": "healthy" if (db_healthy and mongodb_healthy and redis_healthy) else "unhealthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "checks": {
            "postgresql": "healthy" if db_healthy else "unhealthy",
            "mongodb": "healthy" if mongodb_healthy else "unhealthy",
            "redis": "healthy" if redis_healthy else "unhealthy",
        }
    }
    
    # Include pool status if available
    if pool_status:
        health_status["postgresql_pool"] = pool_status
    
    # Include MongoDB stats if available
    if mongodb_stats:
        health_status["mongodb_pool"] = mongodb_stats
    
    # Include Redis info if available
    if redis_info:
        health_status["redis_pool"] = redis_info
    
    return health_status


# Root Endpoint
@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint with API information.
    
    Returns:
        dict: API metadata and documentation links
    """
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": f"{settings.API_V1_PREFIX}/docs" if settings.DEBUG else None,
        "health": "/health",
    }


# Mount Prometheus metrics endpoint
if settings.ENABLE_METRICS:
    metrics_app = make_asgi_app()
    app.mount("/metrics", metrics_app)


# Include API routers
from app.api.v1 import products

app.include_router(products.router, prefix=f"{settings.API_V1_PREFIX}/products", tags=["Products"])

# TODO: Include additional API routers
# from app.api.v1 import auth, onboarding, market, blueprints
# app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"])
# app.include_router(onboarding.router, prefix=f"{settings.API_V1_PREFIX}/onboarding", tags=["Onboarding"])
# app.include_router(market.router, prefix=f"{settings.API_V1_PREFIX}/market", tags=["Market Intelligence"])
# app.include_router(blueprints.router, prefix=f"{settings.API_V1_PREFIX}/blueprints", tags=["Blueprints"])


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        workers=settings.WORKERS if not settings.RELOAD else 1,
        log_level=settings.LOG_LEVEL.lower(),
    )
