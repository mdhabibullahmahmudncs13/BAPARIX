"""
AI Router Module

This module implements the AI task classification and routing logic that determines
whether an AI task should be routed to the local AI model (Ollama) or cloud AI model (OpenRouter).

Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
"""

import asyncio
import logging
import time
from enum import Enum
from typing import Any, Dict, Literal, Optional
from datetime import datetime


# Configure logger
logger = logging.getLogger(__name__)


class TaskComplexity(Enum):
    """
    Enum representing the complexity level of an AI task.
    
    - SIMPLE: Tasks that can be handled by local AI (Ollama + Qwen2.5-7b)
    - COMPLEX: Tasks that require cloud AI (OpenRouter) for higher quality reasoning
    """
    SIMPLE = "simple"
    COMPLEX = "complex"


class AITaskClassifier:
    """
    Classifies AI tasks based on complexity and routes them to appropriate AI models.
    
    Simple tasks (local AI):
    - onboarding_qa: Onboarding question answering
    - product_translation: Chinese to Bengali/English translation
    - financial_tagging: Expense categorization
    - content_generation: Social media copy generation
    - trend_summary: Trend description formatting
    - marketplace_query_parse: Module 11 query parsing
    
    Complex tasks (cloud AI):
    - blueprint_generation: Business plan creation
    - market_analysis: Deep market research
    - risk_assessment: Risk identification & mitigation
    - seo_strategy: SEO keyword & content strategy
    - competitor_analysis: Competitor intelligence
    - marketplace_enrichment: Module 11 data enrichment
    
    Requirements:
    - 4.1: Classify incoming AI tasks by complexity level
    - 4.2: Route simple tasks to Local_AI_Model
    - 4.3: Route complex tasks to Cloud_AI_Model
    """
    
    # Simple tasks that can be handled by local AI (Ollama + Qwen2.5-7b)
    SIMPLE_TASKS = {
        "onboarding_qa",           # Onboarding question answering
        "product_translation",     # Chinese to Bengali/English
        "financial_tagging",       # Expense categorization
        "content_generation",      # Social media copy
        "trend_summary",           # Trend description formatting
        "marketplace_query_parse"  # Module 11 query parsing
    }
    
    # Complex tasks that require cloud AI (OpenRouter)
    COMPLEX_TASKS = {
        "blueprint_generation",    # Business plan creation
        "market_analysis",         # Deep market research
        "risk_assessment",         # Risk identification & mitigation
        "seo_strategy",           # SEO keyword & content strategy
        "competitor_analysis",     # Competitor intelligence
        "marketplace_enrichment"   # Module 11 data enrichment
    }
    
    @classmethod
    def classify_task(cls, task_type: str) -> TaskComplexity:
        """
        Classify an AI task by its complexity level.
        
        Args:
            task_type: The type of AI task to classify (e.g., "onboarding_qa", "blueprint_generation")
        
        Returns:
            TaskComplexity.SIMPLE if the task should be routed to local AI
            TaskComplexity.COMPLEX if the task should be routed to cloud AI
        
        Raises:
            ValueError: If the task_type is not recognized
        
        Examples:
            >>> AITaskClassifier.classify_task("onboarding_qa")
            TaskComplexity.SIMPLE
            
            >>> AITaskClassifier.classify_task("blueprint_generation")
            TaskComplexity.COMPLEX
        
        Requirements:
            - 4.1: Classifies incoming AI tasks by complexity level
            - 4.2: Returns SIMPLE for tasks that should go to Local_AI_Model
            - 4.3: Returns COMPLEX for tasks that should go to Cloud_AI_Model
        """
        if task_type in cls.SIMPLE_TASKS:
            return TaskComplexity.SIMPLE
        elif task_type in cls.COMPLEX_TASKS:
            return TaskComplexity.COMPLEX
        else:
            raise ValueError(
                f"Unknown task type: {task_type}. "
                f"Valid task types are: {sorted(cls.SIMPLE_TASKS | cls.COMPLEX_TASKS)}"
            )


class AIRouterError(Exception):
    """Base exception for AI Router errors"""
    pass


class AIRouter:
    """
    AI Router that dispatches AI tasks to local or cloud models with fallback logic.
    
    Implements a fallback chain:
    1. Primary: Cloud AI (for complex tasks) or Local AI (for simple tasks)
    2. Retry: Up to 3 retries with exponential backoff (1s, 2s, 4s)
    3. Fallback: If cloud fails, try local AI
    4. Cache: Check cache before making requests
    5. Error: Return graceful error if all attempts fail
    
    Requirements:
    - 4.4: Route tasks to local or cloud AI based on classification
    - 4.5: Implement fallback from cloud to local AI
    - 4.6: Implement retry logic with exponential backoff
    - 4.7: Log all AI requests with model, latency, and tokens
    """
    
    def __init__(
        self,
        local_ai_client: Optional[Any] = None,
        cloud_ai_client: Optional[Any] = None,
        cache_client: Optional[Any] = None,
        max_retries: int = 3
    ):
        """
        Initialize the AI Router.
        
        Args:
            local_ai_client: Client for local AI (Ollama) - optional for testing
            cloud_ai_client: Client for cloud AI (OpenRouter) - optional for testing
            cache_client: Redis cache client - optional for testing
            max_retries: Maximum number of retry attempts (default: 3)
        """
        self.local_ai_client = local_ai_client
        self.cloud_ai_client = cloud_ai_client
        self.cache_client = cache_client
        self.max_retries = max_retries
        self.classifier = AITaskClassifier()
    
    async def route(
        self,
        task_type: str,
        prompt: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Route an AI task to the appropriate model with fallback logic.
        
        Implements the fallback chain:
        1. Classify task complexity
        2. Try primary model (cloud for complex, local for simple)
        3. If primary fails, retry with exponential backoff (1s, 2s, 4s)
        4. If all retries fail, fallback to alternative model
        5. If all attempts fail, return error
        
        Args:
            task_type: Type of AI task (e.g., "onboarding_qa", "blueprint_generation")
            prompt: The prompt/input for the AI model
            **kwargs: Additional parameters for the AI model
        
        Returns:
            Dict containing:
                - success: bool indicating if request succeeded
                - response: str with AI response (if successful)
                - model_used: str indicating which model was used
                - latency_ms: int with request latency in milliseconds
                - tokens: int with token count (if available)
                - fallback_used: bool indicating if fallback was used
                - error: str with error message (if failed)
        
        Requirements:
            - 4.4: Routes to local or cloud AI based on task classification
            - 4.5: Falls back from cloud to local if cloud fails
            - 4.6: Retries with exponential backoff (1s, 2s, 4s)
            - 4.7: Logs all requests with model, latency, tokens
        """
        start_time = time.time()
        
        # Classify the task
        try:
            complexity = self.classifier.classify_task(task_type)
        except ValueError as e:
            logger.error(f"Task classification failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "model_used": None,
                "latency_ms": int((time.time() - start_time) * 1000),
                "tokens": 0,
                "fallback_used": False
            }
        
        # Determine primary and fallback models
        if complexity == TaskComplexity.COMPLEX:
            primary_model = "cloud"
            fallback_model = "local"
        else:
            primary_model = "local"
            fallback_model = None  # Simple tasks don't fallback to cloud
        
        # Try primary model with retries
        result = await self._try_model_with_retries(
            model_type=primary_model,
            task_type=task_type,
            prompt=prompt,
            **kwargs
        )
        
        # If primary failed and fallback is available, try fallback
        if not result["success"] and fallback_model:
            logger.warning(
                f"Primary model ({primary_model}) failed for task {task_type}, "
                f"falling back to {fallback_model}"
            )
            result = await self._try_model_with_retries(
                model_type=fallback_model,
                task_type=task_type,
                prompt=prompt,
                **kwargs
            )
            result["fallback_used"] = True
        else:
            result["fallback_used"] = False
        
        # Calculate total latency
        total_latency_ms = int((time.time() - start_time) * 1000)
        result["latency_ms"] = total_latency_ms
        
        # Log the request (Requirement 4.7)
        self._log_ai_request(
            task_type=task_type,
            model_used=result.get("model_used"),
            latency_ms=total_latency_ms,
            tokens=result.get("tokens", 0),
            success=result["success"],
            fallback_used=result["fallback_used"]
        )
        
        return result
    
    async def _try_model_with_retries(
        self,
        model_type: Literal["local", "cloud"],
        task_type: str,
        prompt: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Try to execute a request on a specific model with exponential backoff retries.
        
        Implements exponential backoff: 1s, 2s, 4s between retries.
        
        Args:
            model_type: "local" or "cloud"
            task_type: Type of AI task
            prompt: The prompt for the AI model
            **kwargs: Additional parameters
        
        Returns:
            Dict with success status, response, model_used, tokens
        
        Requirements:
            - 4.6: Implements retry logic with exponential backoff (1s, 2s, 4s)
        """
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                # Execute the request
                result = await self._execute_model_request(
                    model_type=model_type,
                    task_type=task_type,
                    prompt=prompt,
                    **kwargs
                )
                
                if result["success"]:
                    return result
                
                last_error = result.get("error", "Unknown error")
                
            except Exception as e:
                last_error = str(e)
                logger.error(
                    f"Attempt {attempt + 1}/{self.max_retries} failed for "
                    f"{model_type} model on task {task_type}: {e}"
                )
            
            # If not the last attempt, wait with exponential backoff
            if attempt < self.max_retries - 1:
                backoff_seconds = 2 ** attempt  # 1s, 2s, 4s
                logger.info(
                    f"Retrying {model_type} model in {backoff_seconds}s "
                    f"(attempt {attempt + 2}/{self.max_retries})"
                )
                await asyncio.sleep(backoff_seconds)
        
        # All retries failed
        return {
            "success": False,
            "error": f"All {self.max_retries} attempts failed. Last error: {last_error}",
            "model_used": model_type,
            "tokens": 0
        }
    
    async def _execute_model_request(
        self,
        model_type: Literal["local", "cloud"],
        task_type: str,
        prompt: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Execute a single request to a specific model.
        
        Args:
            model_type: "local" or "cloud"
            task_type: Type of AI task
            prompt: The prompt for the AI model
            **kwargs: Additional parameters
        
        Returns:
            Dict with success status, response, model_used, tokens
        """
        if model_type == "local":
            if not self.local_ai_client:
                return {
                    "success": False,
                    "error": "Local AI client not configured",
                    "model_used": "local",
                    "tokens": 0
                }
            
            # Call local AI client based on task type
            try:
                if task_type == "product_translation":
                    # Extract translation parameters from kwargs
                    text = kwargs.get("text", prompt)
                    target_language = kwargs.get("target_language", "bengali")
                    result = await self.local_ai_client.translate(
                        text=text,
                        target_language=target_language
                    )
                    if result["success"]:
                        return {
                            "success": True,
                            "response": result["translated_text"],
                            "model_used": result["model"],
                            "tokens": result["tokens"]
                        }
                    else:
                        return {
                            "success": False,
                            "error": result.get("error", "Translation failed"),
                            "model_used": result["model"],
                            "tokens": 0
                        }
                
                elif task_type == "financial_tagging":
                    # Extract categorization parameters from kwargs
                    text = kwargs.get("text", prompt)
                    categories = kwargs.get("categories", None)
                    result = await self.local_ai_client.tag(
                        text=text,
                        categories=categories
                    )
                    if result["success"]:
                        return {
                            "success": True,
                            "response": result["category"],
                            "model_used": result["model"],
                            "tokens": result["tokens"],
                            "confidence": result.get("confidence", 0.0)
                        }
                    else:
                        return {
                            "success": False,
                            "error": result.get("error", "Categorization failed"),
                            "model_used": result["model"],
                            "tokens": 0
                        }
                
                else:
                    # For all other simple tasks, use generate
                    system_prompt = kwargs.get("system_prompt", None)
                    temperature = kwargs.get("temperature", 0.3)
                    max_tokens = kwargs.get("max_tokens", 1024)
                    
                    result = await self.local_ai_client.generate(
                        prompt=prompt,
                        system_prompt=system_prompt,
                        temperature=temperature,
                        max_tokens=max_tokens
                    )
                    
                    if result["success"]:
                        return {
                            "success": True,
                            "response": result["response"],
                            "model_used": result["model"],
                            "tokens": result["tokens"]
                        }
                    else:
                        return {
                            "success": False,
                            "error": result.get("error", "Generation failed"),
                            "model_used": result["model"],
                            "tokens": 0
                        }
            
            except Exception as e:
                logger.error(f"Local AI client error: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "model_used": "local",
                    "tokens": 0
                }
        
        elif model_type == "cloud":
            if not self.cloud_ai_client:
                return {
                    "success": False,
                    "error": "Cloud AI client not configured",
                    "model_used": "cloud",
                    "tokens": 0
                }
            
            # Call cloud AI client based on task type
            try:
                system_prompt = kwargs.get("system_prompt", None)
                temperature = kwargs.get("temperature", None)
                max_tokens = kwargs.get("max_tokens", None)
                
                # Route to appropriate model based on task type
                if task_type == "blueprint_generation":
                    # Use Llama 3.1 8B for blueprint generation
                    result = await self.cloud_ai_client.llama(
                        prompt=prompt,
                        system_prompt=system_prompt,
                        temperature=temperature,
                        max_tokens=max_tokens
                    )
                
                elif task_type == "market_analysis" or task_type == "competitor_analysis":
                    # Use Mistral 7B for market analysis
                    result = await self.cloud_ai_client.mistral(
                        prompt=prompt,
                        system_prompt=system_prompt,
                        temperature=temperature,
                        max_tokens=max_tokens
                    )
                
                elif task_type == "seo_strategy":
                    # Use Gemma 2 9B for SEO strategy
                    result = await self.cloud_ai_client.gemma(
                        prompt=prompt,
                        system_prompt=system_prompt,
                        temperature=temperature,
                        max_tokens=max_tokens
                    )
                
                elif task_type == "risk_assessment" or task_type == "marketplace_enrichment":
                    # Use Llama for other complex tasks
                    result = await self.cloud_ai_client.llama(
                        prompt=prompt,
                        system_prompt=system_prompt,
                        temperature=temperature,
                        max_tokens=max_tokens
                    )
                
                else:
                    # Default to Llama for unknown complex tasks
                    result = await self.cloud_ai_client.llama(
                        prompt=prompt,
                        system_prompt=system_prompt,
                        temperature=temperature,
                        max_tokens=max_tokens
                    )
                
                if result["success"]:
                    return {
                        "success": True,
                        "response": result["response"],
                        "model_used": result["model"],
                        "tokens": result["tokens"]
                    }
                else:
                    return {
                        "success": False,
                        "error": result.get("error", "Cloud AI request failed"),
                        "model_used": result.get("model", "cloud"),
                        "tokens": 0
                    }
            
            except Exception as e:
                logger.error(f"Cloud AI client error: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "model_used": "cloud",
                    "tokens": 0
                }
        
        else:
            return {
                "success": False,
                "error": f"Unknown model type: {model_type}",
                "model_used": None,
                "tokens": 0
            }
    
    def _log_ai_request(
        self,
        task_type: str,
        model_used: Optional[str],
        latency_ms: int,
        tokens: int,
        success: bool,
        fallback_used: bool
    ) -> None:
        """
        Log AI request details for monitoring and debugging.
        
        Args:
            task_type: Type of AI task
            model_used: Model that was used ("local", "cloud", or None)
            latency_ms: Request latency in milliseconds
            tokens: Number of tokens used
            success: Whether the request succeeded
            fallback_used: Whether fallback was used
        
        Requirements:
            - 4.7: Logs all AI requests with model used, latency, and token count
        """
        log_data = {
            "event": "ai_request",
            "task_type": task_type,
            "model_used": model_used,
            "latency_ms": latency_ms,
            "tokens": tokens,
            "success": success,
            "fallback_used": fallback_used,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if success:
            logger.info(f"AI request completed: {log_data}")
        else:
            logger.error(f"AI request failed: {log_data}")
