"""
Cloud AI Client Module

This module implements the CloudAI client for integrating with OpenRouter API.
It provides methods for complex AI tasks like blueprint generation, market analysis,
and SEO strategy generation using free tier models.

Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7
"""

import asyncio
import hashlib
import json
import logging
import time
from typing import Any, Dict, Literal, Optional

import httpx


# Configure logger
logger = logging.getLogger(__name__)


class CloudAIError(Exception):
    """Base exception for Cloud AI errors"""
    pass


class CloudAITimeoutError(CloudAIError):
    """Exception raised when Cloud AI request times out"""
    pass


class CloudAIConnectionError(CloudAIError):
    """Exception raised when connection to OpenRouter fails"""
    pass


class CloudAI:
    """
    Cloud AI client for OpenRouter integration with free tier models.
    
    This client provides methods for complex AI tasks:
    - Blueprint generation (llama-3.1-8b)
    - Market analysis (mistral-7b)
    - SEO strategy generation (gemma-2-9b)
    
    All requests include retry logic with exponential backoff.
    
    Requirements:
    - 6.1: Integrates with OpenRouter API using free tier models
    - 6.2: Uses meta-llama/llama-3.1-8b-instruct:free for blueprint generation
    - 6.3: Uses mistralai/mistral-7b-instruct:free for market analysis
    - 6.4: Uses google/gemma-2-9b-it:free for SEO strategy generation
    - 6.5: Implements retry logic with exponential backoff (1s, 2s, 4s)
    """
    
    # Model configurations for different task types
    MODELS = {
        "blueprint": {
            "model": "meta-llama/llama-3.1-8b-instruct:free",
            "max_tokens": 4096,
            "temperature": 0.7,
            "timeout": 60
        },
        "market_analysis": {
            "model": "mistralai/mistral-7b-instruct:free",
            "max_tokens": 2048,
            "temperature": 0.5,
            "timeout": 30
        },
        "seo_strategy": {
            "model": "google/gemma-2-9b-it:free",
            "max_tokens": 2048,
            "temperature": 0.6,
            "timeout": 30
        }
    }
    
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://openrouter.ai/api/v1",
        timeout: int = 30,
        max_retries: int = 3,
        redis_client: Optional[Any] = None
    ):
        """
        Initialize the Cloud AI client.
        
        Args:
            api_key: OpenRouter API key
            base_url: OpenRouter API base URL (default: https://openrouter.ai/api/v1)
            timeout: Request timeout in seconds (default: 30)
            max_retries: Maximum number of retry attempts (default: 3)
            redis_client: Optional Redis client for response caching (default: None)
        
        Requirements:
            - 6.1: Configures connection to OpenRouter API
            - 6.5: Sets up retry logic with max 3 retries
            - 6.7: Configures Redis client for response caching
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.redis_client = redis_client
        
        # Create HTTP client with timeout configuration
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(timeout=timeout, connect=10, read=timeout, write=10),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://ventureos.app",  # Optional: for OpenRouter analytics
                "X-Title": "VentureOS"  # Optional: for OpenRouter analytics
            }
        )
        
        logger.info(
            f"CloudAI client initialized: base_url={base_url}, "
            f"timeout={timeout}s, max_retries={max_retries}, "
            f"caching_enabled={redis_client is not None}"
        )
    
    async def close(self) -> None:
        """Close the HTTP client connection."""
        await self.client.aclose()
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()
    
    def _generate_cache_key(
        self,
        model: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> str:
        """
        Generate a cache key from prompt and parameters.
        
        Creates a deterministic hash from the model, prompt, system prompt,
        and generation parameters to enable response caching.
        
        Args:
            model: OpenRouter model identifier
            prompt: The user prompt
            system_prompt: Optional system prompt
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
        
        Returns:
            str: SHA256 hash of the prompt and parameters
        
        Requirements:
            - 6.7: Creates cache key from prompt hash for response caching
        
        Example:
            >>> client = CloudAI(api_key="key")
            >>> key = client._generate_cache_key(
            ...     model="llama-3.1-8b",
            ...     prompt="Generate a business plan",
            ...     temperature=0.7
            ... )
            >>> print(key)
            'ai:cloudai:abc123...'
        """
        # Create a deterministic representation of the request
        cache_data = {
            "model": model,
            "prompt": prompt,
            "system_prompt": system_prompt,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        # Convert to JSON string with sorted keys for deterministic hashing
        cache_string = json.dumps(cache_data, sort_keys=True)
        
        # Generate SHA256 hash
        prompt_hash = hashlib.sha256(cache_string.encode()).hexdigest()
        
        # Return cache key with prefix
        return f"ai:cloudai:{prompt_hash}"
    
    async def _get_cached_response(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """
        Get a cached response from Redis.
        
        Args:
            cache_key: The cache key to lookup
        
        Returns:
            Cached response dict or None if not found or caching disabled
        
        Requirements:
            - 6.7: Checks cache before making API calls
        """
        if self.redis_client is None:
            return None
        
        try:
            # Import here to avoid circular dependency
            from app.db.redis import cache_get
            
            cached = await cache_get(cache_key)
            
            if cached:
                logger.info(f"Cache hit for CloudAI request: {cache_key[:16]}...")
                return cached
            else:
                logger.debug(f"Cache miss for CloudAI request: {cache_key[:16]}...")
                return None
        
        except Exception as e:
            logger.error(f"Error retrieving cached response: {e}")
            return None
    
    async def _cache_response(
        self,
        cache_key: str,
        response: Dict[str, Any]
    ) -> bool:
        """
        Cache a response in Redis with 24-hour TTL.
        
        Args:
            cache_key: The cache key to store under
            response: The response dict to cache
        
        Returns:
            bool: True if caching succeeded, False otherwise
        
        Requirements:
            - 6.7: Stores responses in Redis with 24-hour TTL
        """
        if self.redis_client is None:
            return False
        
        try:
            # Import here to avoid circular dependency
            from app.db.redis import cache_ai_response
            
            # Extract just the prompt hash from the cache key
            prompt_hash = cache_key.replace("ai:cloudai:", "")
            
            success = await cache_ai_response(prompt_hash, response)
            
            if success:
                logger.info(f"Cached CloudAI response: {cache_key[:16]}...")
            else:
                logger.warning(f"Failed to cache CloudAI response: {cache_key[:16]}...")
            
            return success
        
        except Exception as e:
            logger.error(f"Error caching response: {e}")
            return False
    
    async def llama(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate text using Llama 3.1 8B model for blueprint generation.
        
        This method is specifically designed for complex business plan generation tasks
        that require high-quality reasoning and structured output.
        
        Args:
            prompt: The user prompt/question
            system_prompt: Optional system prompt to guide the model's behavior
            temperature: Sampling temperature (overrides default 0.7)
            max_tokens: Maximum tokens to generate (overrides default 4096)
        
        Returns:
            Dict containing:
                - success: bool indicating if request succeeded
                - response: str with generated text (if successful)
                - model: str with model name used
                - latency_ms: int with request latency in milliseconds
                - tokens: int with token count
                - error: str with error message (if failed)
        
        Requirements:
            - 6.2: Uses meta-llama/llama-3.1-8b-instruct:free for blueprint generation
            - 6.5: Implements retry logic with exponential backoff
        
        Example:
            >>> client = CloudAI(api_key="your-key")
            >>> result = await client.llama(
            ...     prompt="Generate a business model canvas for a wireless earbuds business",
            ...     system_prompt="You are a business strategy consultant."
            ... )
            >>> print(result["response"])
        """
        config = self.MODELS["blueprint"].copy()
        
        # Override defaults if provided
        if temperature is not None:
            config["temperature"] = temperature
        if max_tokens is not None:
            config["max_tokens"] = max_tokens
        
        return await self._generate(
            model=config["model"],
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=config["temperature"],
            max_tokens=config["max_tokens"],
            timeout=config["timeout"]
        )
    
    async def mistral(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate text using Mistral 7B model for market analysis.
        
        This method is specifically designed for market intelligence tasks including
        trend analysis, competitor research, and market opportunity assessment.
        
        Args:
            prompt: The user prompt/question
            system_prompt: Optional system prompt to guide the model's behavior
            temperature: Sampling temperature (overrides default 0.5)
            max_tokens: Maximum tokens to generate (overrides default 2048)
        
        Returns:
            Dict containing:
                - success: bool indicating if request succeeded
                - response: str with generated text (if successful)
                - model: str with model name used
                - latency_ms: int with request latency in milliseconds
                - tokens: int with token count
                - error: str with error message (if failed)
        
        Requirements:
            - 6.3: Uses mistralai/mistral-7b-instruct:free for market analysis
            - 6.5: Implements retry logic with exponential backoff
        
        Example:
            >>> client = CloudAI(api_key="your-key")
            >>> result = await client.mistral(
            ...     prompt="Analyze the wireless earbuds market in Bangladesh",
            ...     system_prompt="You are a market research analyst."
            ... )
            >>> print(result["response"])
        """
        config = self.MODELS["market_analysis"].copy()
        
        # Override defaults if provided
        if temperature is not None:
            config["temperature"] = temperature
        if max_tokens is not None:
            config["max_tokens"] = max_tokens
        
        return await self._generate(
            model=config["model"],
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=config["temperature"],
            max_tokens=config["max_tokens"],
            timeout=config["timeout"]
        )
    
    async def gemma(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate text using Gemma 2 9B model for SEO strategy generation.
        
        This method is specifically designed for SEO and content strategy tasks including
        keyword research, content optimization, and social media strategy.
        
        Args:
            prompt: The user prompt/question
            system_prompt: Optional system prompt to guide the model's behavior
            temperature: Sampling temperature (overrides default 0.6)
            max_tokens: Maximum tokens to generate (overrides default 2048)
        
        Returns:
            Dict containing:
                - success: bool indicating if request succeeded
                - response: str with generated text (if successful)
                - model: str with model name used
                - latency_ms: int with request latency in milliseconds
                - tokens: int with token count
                - error: str with error message (if failed)
        
        Requirements:
            - 6.4: Uses google/gemma-2-9b-it:free for SEO strategy generation
            - 6.5: Implements retry logic with exponential backoff
        
        Example:
            >>> client = CloudAI(api_key="your-key")
            >>> result = await client.gemma(
            ...     prompt="Generate SEO keywords for wireless earbuds in Bangladesh",
            ...     system_prompt="You are an SEO specialist."
            ... )
            >>> print(result["response"])
        """
        config = self.MODELS["seo_strategy"].copy()
        
        # Override defaults if provided
        if temperature is not None:
            config["temperature"] = temperature
        if max_tokens is not None:
            config["max_tokens"] = max_tokens
        
        return await self._generate(
            model=config["model"],
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=config["temperature"],
            max_tokens=config["max_tokens"],
            timeout=config["timeout"]
        )
    
    async def _generate(
        self,
        model: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        timeout: int = 30
    ) -> Dict[str, Any]:
        """
        Internal method to generate text using OpenRouter API with retry logic and caching.
        
        Implements exponential backoff: 1s, 2s, 4s between retries.
        Checks cache before making API calls and caches successful responses.
        
        Args:
            model: OpenRouter model identifier
            prompt: The user prompt
            system_prompt: Optional system prompt
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            timeout: Request timeout in seconds
        
        Returns:
            Dict with success status, response, model, latency_ms, tokens, and optional error
        
        Requirements:
            - 6.5: Implements retry logic with exponential backoff (1s, 2s, 4s)
            - 6.7: Checks cache before making API calls and caches responses
        """
        start_time = time.time()
        
        # Generate cache key
        cache_key = self._generate_cache_key(
            model=model,
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        # Check cache first (Requirement 6.7)
        cached_response = await self._get_cached_response(cache_key)
        if cached_response:
            # Add latency for cache retrieval
            latency_ms = int((time.time() - start_time) * 1000)
            cached_response["latency_ms"] = latency_ms
            cached_response["cached"] = True
            return cached_response
        
        try:
            # Prepare messages for chat completion
            messages = []
            
            if system_prompt:
                messages.append({
                    "role": "system",
                    "content": system_prompt
                })
            
            messages.append({
                "role": "user",
                "content": prompt
            })
            
            # Prepare the request payload
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            
            # Retry logic with exponential backoff
            last_error = None
            
            for attempt in range(self.max_retries):
                try:
                    # Make the request with custom timeout for this specific call
                    response = await self.client.post(
                        "/chat/completions",
                        json=payload,
                        timeout=timeout
                    )
                    response.raise_for_status()
                    
                    result = response.json()
                    
                    # Extract response text
                    if "choices" in result and len(result["choices"]) > 0:
                        response_text = result["choices"][0]["message"]["content"]
                    else:
                        raise CloudAIError("No response content in API result")
                    
                    # Extract token usage
                    usage = result.get("usage", {})
                    tokens = usage.get("total_tokens", 0)
                    
                    # Calculate latency
                    latency_ms = int((time.time() - start_time) * 1000)
                    
                    logger.info(
                        f"CloudAI generate success: model={model}, latency={latency_ms}ms, "
                        f"tokens={tokens}, attempt={attempt + 1}"
                    )
                    
                    response_data = {
                        "success": True,
                        "response": response_text,
                        "model": model,
                        "latency_ms": latency_ms,
                        "tokens": tokens,
                        "cached": False
                    }
                    
                    # Cache the successful response (Requirement 6.7)
                    await self._cache_response(cache_key, response_data)
                    
                    return response_data
                
                except httpx.TimeoutException as e:
                    last_error = f"Request timed out after {timeout}s"
                    logger.warning(
                        f"CloudAI generate timeout (attempt {attempt + 1}/{self.max_retries}): {e}"
                    )
                
                except httpx.ConnectError as e:
                    last_error = f"Failed to connect to OpenRouter at {self.base_url}"
                    logger.error(f"CloudAI connection error: {e}")
                    break  # Don't retry connection errors
                
                except httpx.HTTPStatusError as e:
                    status_code = e.response.status_code
                    
                    # Try to extract error message from response
                    try:
                        error_data = e.response.json()
                        error_message = error_data.get("error", {}).get("message", str(e))
                    except:
                        error_message = str(e)
                    
                    last_error = f"HTTP {status_code}: {error_message}"
                    
                    # Log different severity based on status code
                    if status_code == 429:
                        logger.warning(f"CloudAI rate limit exceeded (attempt {attempt + 1}/{self.max_retries})")
                    elif status_code >= 500:
                        logger.error(f"CloudAI server error: {status_code}")
                    else:
                        logger.error(f"CloudAI HTTP error: {status_code} - {error_message}")
                
                except Exception as e:
                    last_error = str(e)
                    logger.error(f"CloudAI unexpected error: {e}")
                
                # If not the last attempt, wait with exponential backoff
                if attempt < self.max_retries - 1:
                    backoff_seconds = 2 ** attempt  # 1s, 2s, 4s
                    logger.info(
                        f"Retrying CloudAI request in {backoff_seconds}s "
                        f"(attempt {attempt + 2}/{self.max_retries})"
                    )
                    await asyncio.sleep(backoff_seconds)
            
            # All retries failed
            latency_ms = int((time.time() - start_time) * 1000)
            
            logger.error(
                f"CloudAI generate failed after {self.max_retries} attempts: {last_error}"
            )
            
            return {
                "success": False,
                "error": f"All {self.max_retries} attempts failed. Last error: {last_error}",
                "model": model,
                "latency_ms": latency_ms,
                "tokens": 0,
                "cached": False
            }
        
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error(f"CloudAI generate failed: {e}")
            
            return {
                "success": False,
                "error": str(e),
                "model": model,
                "latency_ms": latency_ms,
                "tokens": 0,
                "cached": False
            }
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check if the OpenRouter API is accessible and the API key is valid.
        
        Returns:
            Dict containing:
                - healthy: bool indicating if API is accessible
                - latency_ms: int with health check latency
                - error: str with error message (if unhealthy)
        """
        start_time = time.time()
        
        try:
            # Make a minimal request to check API accessibility
            # Using a very small max_tokens to minimize cost
            response = await self.client.post(
                "/chat/completions",
                json={
                    "model": "meta-llama/llama-3.1-8b-instruct:free",
                    "messages": [{"role": "user", "content": "test"}],
                    "max_tokens": 1
                },
                timeout=10
            )
            response.raise_for_status()
            
            latency_ms = int((time.time() - start_time) * 1000)
            
            return {
                "healthy": True,
                "latency_ms": latency_ms
            }
        
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error(f"CloudAI health check failed: {e}")
            
            return {
                "healthy": False,
                "latency_ms": latency_ms,
                "error": str(e)
            }
