"""
Integration Tests for Cloud AI Client with AI Router

Tests the integration between CloudAI client and AIRouter for complex task routing.

Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.core.cloud_ai import CloudAI
from app.core.ai_router import AIRouter


@pytest.fixture
def mock_cloud_ai_response():
    """Fixture providing a mock cloud AI response"""
    return {
        "success": True,
        "response": "This is a cloud AI generated response.",
        "model": "meta-llama/llama-3.1-8b-instruct:free",
        "latency_ms": 1500,
        "tokens": 150
    }


class TestCloudAIRouterIntegration:
    """Test CloudAI integration with AIRouter"""
    
    @pytest.mark.asyncio
    async def test_blueprint_generation_uses_llama(self, mock_cloud_ai_response):
        """Test that blueprint generation uses Llama model (Requirement 6.2)"""
        # Create mock cloud AI client
        mock_cloud_client = MagicMock()
        mock_cloud_client.llama = AsyncMock(return_value=mock_cloud_ai_response)
        mock_cloud_client.mistral = AsyncMock()
        mock_cloud_client.gemma = AsyncMock()
        
        # Create router with mock client
        router = AIRouter(
            local_ai_client=None,
            cloud_ai_client=mock_cloud_client,
            max_retries=3
        )
        
        # Route a blueprint generation task
        result = await router.route(
            task_type="blueprint_generation",
            prompt="Generate a business model canvas for wireless earbuds",
            system_prompt="You are a business consultant."
        )
        
        # Verify llama was called
        assert result["success"] is True
        assert result["model_used"] == "meta-llama/llama-3.1-8b-instruct:free"
        mock_cloud_client.llama.assert_called_once()
        mock_cloud_client.mistral.assert_not_called()
        mock_cloud_client.gemma.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_market_analysis_uses_mistral(self, mock_cloud_ai_response):
        """Test that market analysis uses Mistral model (Requirement 6.3)"""
        # Update response to reflect Mistral model
        mistral_response = mock_cloud_ai_response.copy()
        mistral_response["model"] = "mistralai/mistral-7b-instruct:free"
        
        # Create mock cloud AI client
        mock_cloud_client = MagicMock()
        mock_cloud_client.llama = AsyncMock()
        mock_cloud_client.mistral = AsyncMock(return_value=mistral_response)
        mock_cloud_client.gemma = AsyncMock()
        
        # Create router with mock client
        router = AIRouter(
            local_ai_client=None,
            cloud_ai_client=mock_cloud_client,
            max_retries=3
        )
        
        # Route a market analysis task
        result = await router.route(
            task_type="market_analysis",
            prompt="Analyze the wireless earbuds market in Bangladesh"
        )
        
        # Verify mistral was called
        assert result["success"] is True
        assert result["model_used"] == "mistralai/mistral-7b-instruct:free"
        mock_cloud_client.mistral.assert_called_once()
        mock_cloud_client.llama.assert_not_called()
        mock_cloud_client.gemma.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_seo_strategy_uses_gemma(self, mock_cloud_ai_response):
        """Test that SEO strategy uses Gemma model (Requirement 6.4)"""
        # Update response to reflect Gemma model
        gemma_response = mock_cloud_ai_response.copy()
        gemma_response["model"] = "google/gemma-2-9b-it:free"
        
        # Create mock cloud AI client
        mock_cloud_client = MagicMock()
        mock_cloud_client.llama = AsyncMock()
        mock_cloud_client.mistral = AsyncMock()
        mock_cloud_client.gemma = AsyncMock(return_value=gemma_response)
        
        # Create router with mock client
        router = AIRouter(
            local_ai_client=None,
            cloud_ai_client=mock_cloud_client,
            max_retries=3
        )
        
        # Route an SEO strategy task
        result = await router.route(
            task_type="seo_strategy",
            prompt="Generate SEO keywords for wireless earbuds"
        )
        
        # Verify gemma was called
        assert result["success"] is True
        assert result["model_used"] == "google/gemma-2-9b-it:free"
        mock_cloud_client.gemma.assert_called_once()
        mock_cloud_client.llama.assert_not_called()
        mock_cloud_client.mistral.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_risk_assessment_uses_llama(self, mock_cloud_ai_response):
        """Test that risk assessment uses Llama model"""
        # Create mock cloud AI client
        mock_cloud_client = MagicMock()
        mock_cloud_client.llama = AsyncMock(return_value=mock_cloud_ai_response)
        mock_cloud_client.mistral = AsyncMock()
        mock_cloud_client.gemma = AsyncMock()
        
        # Create router with mock client
        router = AIRouter(
            local_ai_client=None,
            cloud_ai_client=mock_cloud_client,
            max_retries=3
        )
        
        # Route a risk assessment task
        result = await router.route(
            task_type="risk_assessment",
            prompt="Identify risks for a wireless earbuds business"
        )
        
        # Verify llama was called
        assert result["success"] is True
        mock_cloud_client.llama.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_competitor_analysis_uses_mistral(self, mock_cloud_ai_response):
        """Test that competitor analysis uses Mistral model"""
        # Update response to reflect Mistral model
        mistral_response = mock_cloud_ai_response.copy()
        mistral_response["model"] = "mistralai/mistral-7b-instruct:free"
        
        # Create mock cloud AI client
        mock_cloud_client = MagicMock()
        mock_cloud_client.llama = AsyncMock()
        mock_cloud_client.mistral = AsyncMock(return_value=mistral_response)
        mock_cloud_client.gemma = AsyncMock()
        
        # Create router with mock client
        router = AIRouter(
            local_ai_client=None,
            cloud_ai_client=mock_cloud_client,
            max_retries=3
        )
        
        # Route a competitor analysis task
        result = await router.route(
            task_type="competitor_analysis",
            prompt="Analyze competitors in the wireless earbuds market"
        )
        
        # Verify mistral was called
        assert result["success"] is True
        mock_cloud_client.mistral.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_custom_parameters_passed_through(self, mock_cloud_ai_response):
        """Test that custom parameters are passed through to cloud AI"""
        # Create mock cloud AI client
        mock_cloud_client = MagicMock()
        mock_cloud_client.llama = AsyncMock(return_value=mock_cloud_ai_response)
        
        # Create router with mock client
        router = AIRouter(
            local_ai_client=None,
            cloud_ai_client=mock_cloud_client,
            max_retries=3
        )
        
        # Route with custom parameters
        result = await router.route(
            task_type="blueprint_generation",
            prompt="Test prompt",
            system_prompt="Custom system prompt",
            temperature=0.9,
            max_tokens=3000
        )
        
        # Verify parameters were passed
        assert result["success"] is True
        call_kwargs = mock_cloud_client.llama.call_args[1]
        assert call_kwargs["system_prompt"] == "Custom system prompt"
        assert call_kwargs["temperature"] == 0.9
        assert call_kwargs["max_tokens"] == 3000
    
    @pytest.mark.asyncio
    async def test_cloud_ai_retry_logic_in_router(self):
        """Test that router handles cloud AI retries correctly (Requirement 6.5)"""
        # Create mock cloud AI client that fails then succeeds
        mock_cloud_client = MagicMock()
        mock_cloud_client.llama = AsyncMock(side_effect=[
            {"success": False, "error": "Timeout", "model": "meta-llama/llama-3.1-8b-instruct:free", "tokens": 0},
            {"success": False, "error": "Timeout", "model": "meta-llama/llama-3.1-8b-instruct:free", "tokens": 0},
            {"success": True, "response": "Success", "model": "meta-llama/llama-3.1-8b-instruct:free", "tokens": 100}
        ])
        
        # Create router with mock client
        router = AIRouter(
            local_ai_client=None,
            cloud_ai_client=mock_cloud_client,
            max_retries=3
        )
        
        # Route a task
        result = await router.route(
            task_type="blueprint_generation",
            prompt="Test prompt"
        )
        
        # Verify it succeeded after retries
        assert result["success"] is True
        assert mock_cloud_client.llama.call_count == 3
    
    @pytest.mark.asyncio
    async def test_fallback_to_local_when_cloud_fails(self):
        """Test fallback from cloud to local AI when cloud fails"""
        # Create mock clients
        mock_cloud_client = MagicMock()
        mock_cloud_client.llama = AsyncMock(return_value={
            "success": False,
            "error": "All retries failed",
            "model": "meta-llama/llama-3.1-8b-instruct:free",
            "tokens": 0
        })
        
        mock_local_client = MagicMock()
        mock_local_client.generate = AsyncMock(return_value={
            "success": True,
            "response": "Local AI response",
            "model": "qwen2.5:7b",
            "tokens": 50
        })
        
        # Create router with both clients
        router = AIRouter(
            local_ai_client=mock_local_client,
            cloud_ai_client=mock_cloud_client,
            max_retries=3
        )
        
        # Route a complex task
        result = await router.route(
            task_type="blueprint_generation",
            prompt="Test prompt"
        )
        
        # Verify it fell back to local AI
        assert result["success"] is True
        assert result["fallback_used"] is True
        assert result["model_used"] == "qwen2.5:7b"
        mock_cloud_client.llama.assert_called()
        mock_local_client.generate.assert_called()
