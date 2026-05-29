"""
Integration tests for LocalAI client with AI Router

Tests the integration between LocalAI client and AI Router to ensure
proper task routing and execution.

Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.core.local_ai import LocalAI
from app.core.ai_router import AIRouter


class TestLocalAIRouterIntegration:
    """Test suite for LocalAI and AIRouter integration"""
    
    @pytest.mark.asyncio
    async def test_router_uses_local_ai_for_onboarding_qa(self):
        """Test that router uses LocalAI for onboarding Q&A tasks"""
        local_ai = LocalAI()
        router = AIRouter(local_ai_client=local_ai)
        
        # Mock the LocalAI generate method
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "You should start with market research",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(local_ai.client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await router.route(
                task_type="onboarding_qa",
                prompt="What should I do first when starting a business?"
            )
        
        assert result["success"] is True
        assert "market research" in result["response"].lower()
        assert result["model_used"] == "qwen2.5:7b"
        assert result["fallback_used"] is False
    
    @pytest.mark.asyncio
    async def test_router_uses_local_ai_for_translation(self):
        """Test that router uses LocalAI for product translation tasks"""
        local_ai = LocalAI()
        router = AIRouter(local_ai_client=local_ai)
        
        # Mock the LocalAI generate method (used by translate)
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "ওয়্যারলেস ইয়ারফোন",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(local_ai.client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await router.route(
                task_type="product_translation",
                prompt="无线耳机",
                text="无线耳机",
                target_language="bengali"
            )
        
        assert result["success"] is True
        assert result["model_used"] == "qwen2.5:7b"
        assert result["fallback_used"] is False
    
    @pytest.mark.asyncio
    async def test_router_uses_local_ai_for_financial_tagging(self):
        """Test that router uses LocalAI for financial tagging tasks"""
        local_ai = LocalAI()
        router = AIRouter(local_ai_client=local_ai)
        
        # Mock the LocalAI generate method (used by tag)
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "rent",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(local_ai.client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await router.route(
                task_type="financial_tagging",
                prompt="Paid office rent for January",
                text="Paid office rent for January"
            )
        
        assert result["success"] is True
        assert result["response"] == "rent"
        assert result["model_used"] == "qwen2.5:7b"
        assert result["fallback_used"] is False
    
    @pytest.mark.asyncio
    async def test_router_uses_local_ai_for_content_generation(self):
        """Test that router uses LocalAI for content generation tasks"""
        local_ai = LocalAI()
        router = AIRouter(local_ai_client=local_ai)
        
        # Mock the LocalAI generate method
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "নতুন পণ্য এসেছে! আজই অর্ডার করুন।",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(local_ai.client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await router.route(
                task_type="content_generation",
                prompt="Generate a Bengali social media post for wireless earbuds"
            )
        
        assert result["success"] is True
        assert len(result["response"]) > 0
        assert result["model_used"] == "qwen2.5:7b"
        assert result["fallback_used"] is False
    
    @pytest.mark.asyncio
    async def test_router_respects_timeout(self):
        """Test that router respects LocalAI timeout settings"""
        local_ai = LocalAI(timeout=2)
        router = AIRouter(local_ai_client=local_ai)
        
        # Mock a timeout
        import httpx
        with patch.object(local_ai.client, 'post', new_callable=AsyncMock, side_effect=httpx.TimeoutException("Timeout")):
            result = await router.route(
                task_type="onboarding_qa",
                prompt="Test prompt"
            )
        
        assert result["success"] is False
        assert "timed out" in result["error"].lower()
    
    @pytest.mark.asyncio
    async def test_router_tracks_latency(self):
        """Test that router tracks request latency correctly"""
        local_ai = LocalAI()
        router = AIRouter(local_ai_client=local_ai)
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "Test response",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(local_ai.client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await router.route(
                task_type="onboarding_qa",
                prompt="Test prompt"
            )
        
        assert "latency_ms" in result
        assert isinstance(result["latency_ms"], int)
        assert result["latency_ms"] >= 0
    
    @pytest.mark.asyncio
    async def test_router_handles_local_ai_errors_gracefully(self):
        """Test that router handles LocalAI errors gracefully"""
        local_ai = LocalAI()
        router = AIRouter(local_ai_client=local_ai)
        
        # Mock a connection error
        import httpx
        with patch.object(local_ai.client, 'post', new_callable=AsyncMock, side_effect=httpx.ConnectError("Connection failed")):
            result = await router.route(
                task_type="onboarding_qa",
                prompt="Test prompt"
            )
        
        assert result["success"] is False
        assert "error" in result
        assert result["model_used"] == "local"


class TestLocalAIClientConfiguration:
    """Test suite for LocalAI client configuration"""
    
    def test_local_ai_default_configuration(self):
        """Test LocalAI client uses correct default configuration"""
        client = LocalAI()
        
        assert client.base_url == "http://localhost:11434"
        assert client.model == "qwen2.5:7b"
        assert client.timeout == 2
    
    def test_local_ai_custom_configuration(self):
        """Test LocalAI client accepts custom configuration"""
        client = LocalAI(
            base_url="http://custom-host:8080",
            model="custom-model:latest",
            timeout=5
        )
        
        assert client.base_url == "http://custom-host:8080"
        assert client.model == "custom-model:latest"
        assert client.timeout == 5
    
    @pytest.mark.asyncio
    async def test_router_can_use_custom_local_ai_config(self):
        """Test that router can use LocalAI with custom configuration"""
        local_ai = LocalAI(
            base_url="http://custom-ollama:11434",
            model="custom-qwen:7b",
            timeout=3
        )
        router = AIRouter(local_ai_client=local_ai)
        
        assert router.local_ai_client.base_url == "http://custom-ollama:11434"
        assert router.local_ai_client.model == "custom-qwen:7b"
        assert router.local_ai_client.timeout == 3
