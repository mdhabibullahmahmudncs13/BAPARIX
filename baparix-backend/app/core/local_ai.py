"""
Local AI Client Module

This module implements the LocalAI client for integrating with Ollama running Qwen2.5-7b model.
It provides methods for text generation, translation, and product categorization.

Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
"""

import asyncio
import logging
import time
from typing import Any, Dict, List, Literal, Optional

import httpx


# Configure logger
logger = logging.getLogger(__name__)


class LocalAIError(Exception):
    """Base exception for Local AI errors"""
    pass


class LocalAITimeoutError(LocalAIError):
    """Exception raised when Local AI request times out"""
    pass


class LocalAIConnectionError(LocalAIError):
    """Exception raised when connection to Ollama fails"""
    pass


class LocalAI:
    """
    Local AI client for Ollama integration with Qwen2.5-7b model.
    
    This client provides methods for:
    - Text generation (onboarding Q&A, content generation)
    - Translation (Chinese to Bengali/English)
    - Product categorization (financial tagging)
    
    All requests are processed locally without sending data to external services.
    
    Requirements:
    - 5.1: Integrates with Ollama running Qwen2.5-7b model
    - 5.2: Provides onboarding question answering
    - 5.3: Provides product title and description translation
    - 5.4: Provides financial data categorization
    - 5.5: Provides Bengali content generation
    - 5.6: Returns responses within 2 seconds
    - 5.7: Processes requests without sending data to external services
    """
    
    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        model: str = "qwen2.5:7b",
        timeout: int = 2,
        max_retries: int = 1
    ):
        """
        Initialize the Local AI client.
        
        Args:
            base_url: Ollama server URL (default: http://localhost:11434)
            model: Model name to use (default: qwen2.5:7b)
            timeout: Request timeout in seconds (default: 2)
            max_retries: Maximum number of retry attempts (default: 1)
        
        Requirements:
            - 5.1: Configures connection to Ollama at http://localhost:11434
            - 5.6: Sets timeout to 2 seconds per request
        """
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout
        self.max_retries = max_retries
        
        # Create HTTP client with timeout configuration
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(timeout=timeout, connect=timeout, read=timeout, write=timeout)
        )
        
        logger.info(
            f"LocalAI client initialized: base_url={base_url}, model={model}, "
            f"timeout={timeout}s, max_retries={max_retries}"
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
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 1024
    ) -> Dict[str, Any]:
        """
        Generate text using the local AI model.
        
        This method is used for:
        - Onboarding question answering
        - Bengali content generation
        - General text generation tasks
        
        Args:
            prompt: The user prompt/question
            system_prompt: Optional system prompt to guide the model's behavior
            temperature: Sampling temperature (0.0-1.0, lower = more deterministic)
            max_tokens: Maximum number of tokens to generate
        
        Returns:
            Dict containing:
                - success: bool indicating if request succeeded
                - response: str with generated text (if successful)
                - model: str with model name used
                - latency_ms: int with request latency in milliseconds
                - tokens: int with approximate token count
                - error: str with error message (if failed)
        
        Requirements:
            - 5.2: Provides onboarding question answering
            - 5.5: Provides Bengali content generation
            - 5.6: Returns response within 2 seconds
            - 5.7: Processes locally without external services
        
        Example:
            >>> client = LocalAI()
            >>> result = await client.generate(
            ...     prompt="What is the best product to sell in Dhaka?",
            ...     system_prompt="You are a business advisor for Bangladeshi entrepreneurs."
            ... )
            >>> print(result["response"])
        """
        start_time = time.time()
        
        try:
            # Prepare the request payload
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            }
            
            # Add system prompt if provided
            if system_prompt:
                payload["system"] = system_prompt
            
            # Make the request with retry logic
            response_text = None
            last_error = None
            
            for attempt in range(self.max_retries + 1):
                try:
                    response = await self.client.post("/api/generate", json=payload)
                    response.raise_for_status()
                    
                    result = response.json()
                    response_text = result.get("response", "")
                    
                    # Calculate latency
                    latency_ms = int((time.time() - start_time) * 1000)
                    
                    # Estimate token count (rough approximation: 1 token ≈ 4 characters)
                    tokens = len(response_text) // 4
                    
                    logger.info(
                        f"LocalAI generate success: latency={latency_ms}ms, "
                        f"tokens={tokens}, model={self.model}"
                    )
                    
                    return {
                        "success": True,
                        "response": response_text,
                        "model": self.model,
                        "latency_ms": latency_ms,
                        "tokens": tokens
                    }
                
                except httpx.TimeoutException as e:
                    last_error = f"Request timed out after {self.timeout}s"
                    logger.warning(
                        f"LocalAI generate timeout (attempt {attempt + 1}/{self.max_retries + 1}): {e}"
                    )
                    if attempt < self.max_retries:
                        await asyncio.sleep(0.5)  # Brief delay before retry
                
                except httpx.ConnectError as e:
                    last_error = f"Failed to connect to Ollama at {self.base_url}"
                    logger.error(f"LocalAI connection error: {e}")
                    break  # Don't retry connection errors
                
                except httpx.HTTPStatusError as e:
                    last_error = f"HTTP error: {e.response.status_code}"
                    logger.error(f"LocalAI HTTP error: {e}")
                    break  # Don't retry HTTP errors
                
                except Exception as e:
                    last_error = str(e)
                    logger.error(f"LocalAI unexpected error: {e}")
                    break
            
            # All attempts failed
            latency_ms = int((time.time() - start_time) * 1000)
            
            return {
                "success": False,
                "error": last_error or "Unknown error",
                "model": self.model,
                "latency_ms": latency_ms,
                "tokens": 0
            }
        
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error(f"LocalAI generate failed: {e}")
            
            return {
                "success": False,
                "error": str(e),
                "model": self.model,
                "latency_ms": latency_ms,
                "tokens": 0
            }
    
    async def translate(
        self,
        text: str,
        source_language: Literal["chinese", "zh"] = "chinese",
        target_language: Literal["bengali", "bn", "english", "en"] = "bengali"
    ) -> Dict[str, Any]:
        """
        Translate text from Chinese to Bengali or English.
        
        This method is specifically designed for translating product titles and descriptions
        from Chinese marketplaces (Alibaba, Pinduoduo, Xianyu) to Bengali or English.
        
        Args:
            text: The text to translate (in Chinese)
            source_language: Source language (default: "chinese")
            target_language: Target language ("bengali", "bn", "english", or "en")
        
        Returns:
            Dict containing:
                - success: bool indicating if request succeeded
                - translated_text: str with translated text (if successful)
                - source_language: str with source language
                - target_language: str with target language
                - model: str with model name used
                - latency_ms: int with request latency in milliseconds
                - tokens: int with approximate token count
                - error: str with error message (if failed)
        
        Requirements:
            - 5.3: Provides product title and description translation
            - 5.6: Returns response within 2 seconds
            - 5.7: Processes locally without external services
        
        Example:
            >>> client = LocalAI()
            >>> result = await client.translate(
            ...     text="无线蓝牙耳机",
            ...     target_language="bengali"
            ... )
            >>> print(result["translated_text"])
            "ওয়্যারলেস ব্লুটুথ ইয়ারফোন"
        """
        # Normalize language codes
        target_lang_map = {
            "bengali": "Bengali",
            "bn": "Bengali",
            "english": "English",
            "en": "English"
        }
        
        target_lang_display = target_lang_map.get(target_language, "Bengali")
        
        # Construct translation prompt
        system_prompt = (
            f"You are a professional translator specializing in Chinese to {target_lang_display} translation. "
            f"Translate the following text accurately and naturally. "
            f"Provide only the translation without any explanations or additional text."
        )
        
        prompt = f"Translate this Chinese text to {target_lang_display}:\n\n{text}"
        
        # Use the generate method for translation
        result = await self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.3,  # Low temperature for consistent translations
            max_tokens=512
        )
        
        if result["success"]:
            return {
                "success": True,
                "translated_text": result["response"].strip(),
                "source_language": source_language,
                "target_language": target_language,
                "model": result["model"],
                "latency_ms": result["latency_ms"],
                "tokens": result["tokens"]
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "Translation failed"),
                "source_language": source_language,
                "target_language": target_language,
                "model": result["model"],
                "latency_ms": result["latency_ms"],
                "tokens": 0
            }
    
    async def tag(
        self,
        text: str,
        categories: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Categorize text into predefined categories.
        
        This method is used for:
        - Financial data categorization (expense tagging)
        - Product categorization
        - Content classification
        
        Args:
            text: The text to categorize
            categories: Optional list of valid categories to choose from.
                       If not provided, uses default financial categories.
        
        Returns:
            Dict containing:
                - success: bool indicating if request succeeded
                - category: str with the assigned category (if successful)
                - confidence: float with confidence score (0.0-1.0)
                - model: str with model name used
                - latency_ms: int with request latency in milliseconds
                - tokens: int with approximate token count
                - error: str with error message (if failed)
        
        Requirements:
            - 5.4: Provides financial data categorization
            - 5.6: Returns response within 2 seconds
            - 5.7: Processes locally without external services
        
        Example:
            >>> client = LocalAI()
            >>> result = await client.tag(
            ...     text="Paid rent for office space",
            ...     categories=["rent", "utilities", "supplies", "marketing", "salary"]
            ... )
            >>> print(result["category"])
            "rent"
        """
        # Default financial categories if none provided
        if categories is None:
            categories = [
                "product_cost",
                "shipping",
                "customs_duty",
                "rent",
                "utilities",
                "marketing",
                "salary",
                "supplies",
                "equipment",
                "other"
            ]
        
        # Construct categorization prompt
        categories_str = ", ".join(categories)
        
        system_prompt = (
            f"You are a financial data categorization assistant. "
            f"Categorize the following text into one of these categories: {categories_str}. "
            f"Respond with ONLY the category name, nothing else."
        )
        
        prompt = f"Categorize this transaction:\n\n{text}"
        
        # Use the generate method for categorization
        result = await self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.1,  # Very low temperature for consistent categorization
            max_tokens=50
        )
        
        if result["success"]:
            # Extract category from response
            category = result["response"].strip().lower()
            
            # Validate that the category is in the allowed list
            if category not in [c.lower() for c in categories]:
                # Try to find the closest match
                category_lower = [c.lower() for c in categories]
                for valid_category in category_lower:
                    if valid_category in category or category in valid_category:
                        category = valid_category
                        break
                else:
                    # Default to "other" if no match found
                    category = "other"
            
            # Simple confidence estimation based on response clarity
            confidence = 0.9 if len(result["response"].strip().split()) == 1 else 0.7
            
            return {
                "success": True,
                "category": category,
                "confidence": confidence,
                "model": result["model"],
                "latency_ms": result["latency_ms"],
                "tokens": result["tokens"]
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "Categorization failed"),
                "model": result["model"],
                "latency_ms": result["latency_ms"],
                "tokens": 0
            }
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check if the Ollama server is healthy and the model is available.
        
        Returns:
            Dict containing:
                - healthy: bool indicating if server is healthy
                - model_available: bool indicating if the configured model is available
                - latency_ms: int with health check latency
                - error: str with error message (if unhealthy)
        """
        start_time = time.time()
        
        try:
            # Check if server is responding
            response = await self.client.get("/api/tags")
            response.raise_for_status()
            
            result = response.json()
            models = result.get("models", [])
            
            # Check if our model is available
            model_available = any(
                model.get("name", "").startswith(self.model.split(":")[0])
                for model in models
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            
            return {
                "healthy": True,
                "model_available": model_available,
                "latency_ms": latency_ms
            }
        
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error(f"LocalAI health check failed: {e}")
            
            return {
                "healthy": False,
                "model_available": False,
                "latency_ms": latency_ms,
                "error": str(e)
            }
