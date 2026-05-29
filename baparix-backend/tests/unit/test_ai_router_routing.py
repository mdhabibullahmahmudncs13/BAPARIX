"""
Unit tests for AIRouter class

Tests the AIRouter class that implements routing, fallback logic,
retry with exponential backoff, and logging.

Requirements: 4.4, 4.5, 4.6, 4.7
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch, call
from app.core.ai_router import AIRouter, AITaskClassifier, TaskComplexity


class MockLocalAIClient:
    """Mock local AI client for testing"""
    
    def __init__(self, should_fail: bool = False, response: str = "Local AI response"):
        self.should_fail = should_fail
        self.response = response
        self.call_count = 0
    
    async def generate(self, prompt: str, **kwargs):
        self.call_count += 1
        if self.should_fail:
            raise Exception("Local AI failed")
        return {
            "success": True,
            "response": self.response,
            "tokens": 100
        }


class MockCloudAIClient:
    """Mock cloud AI client for testing"""
    
    def __init__(self, should_fail: bool = False, response: str = "Cloud AI response"):
        self.should_fail = should_fail
        self.response = response
        self.call_count = 0
    
    async def generate(self, prompt: str, **kwargs):
        self.call_count += 1
        if self.should_fail:
            raise Exception("Cloud AI failed")
        return {
            "success": True,
            "response": self.response,
            "tokens": 200
        }


class TestAIRouterInitialization:
    """Test AIRouter initialization"""
    
    def test_router_initialization_with_clients(self):
        """Test that router initializes with provided clients"""
        local_client = MockLocalAIClient()
        cloud_client = MockCloudAIClient()
        
        router = AIRouter(
            local_ai_client=local_client,
            cloud_ai_client=cloud_client
        )
        
        assert router.local_ai_client == local_client
        assert router.cloud_ai_client == cloud_client
        assert router.max_retries == 3
        assert isinstance(router.classifier, AITaskClassifier)
    
    def test_router_initialization_without_clients(self):
        """Test that router initializes without clients (for testing)"""
        router = AIRouter()
        
        assert router.local_ai_client is None
        assert router.cloud_ai_client is None
        assert router.max_retries == 3
    
    def test_router_initialization_custom_max_retries(self):
        """Test that router accepts custom max_retries"""
        router = AIRouter(max_retries=5)
        
        assert router.max_retries == 5


class TestAIRouterSimpleTaskRouting:
    """Test routing of simple tasks to local AI"""
    
    @pytest.mark.asyncio
    async def test_route_simple_task_to_local_ai(self):
        """Test that simple tasks are routed to local AI (Requirement 4.4)"""
        local_client = MockLocalAIClient()
        cloud_client = MockCloudAIClient()
        
        router = AIRouter(
            local_ai_client=local_client,
            cloud_ai_client=cloud_client
        )
        
        # Mock the _execute_model_request to return success
        async def mock_execute(model_type, task_type, prompt, **kwargs):
            if model_type == "local":
                return {
                    "success": True,
                    "response": "Local AI response",
                    "model_used": "local",
                    "tokens": 100
                }
            return {"success": False, "error": "Wrong model", "model_used": model_type, "tokens": 0}
        
        router._execute_model_request = mock_execute
        
        result = await router.route(
            task_type="onboarding_qa",
            prompt="What is your business idea?"
        )
        
        assert result["success"] is True
        assert result["model_used"] == "local"
        assert result["fallback_used"] is False
        assert "latency_ms" in result
    
    @pytest.mark.asyncio
    async def test_route_all_simple_tasks_to_local(self):
        """Test that all simple task types route to local AI"""
        simple_tasks = [
            "onboarding_qa",
            "product_translation",
            "financial_tagging",
            "content_generation",
            "trend_summary",
            "marketplace_query_parse"
        ]
        
        for task_type in simple_tasks:
            router = AIRouter()
            
            async def mock_execute(model_type, task_type, prompt, **kwargs):
                return {
                    "success": True,
                    "response": f"Response for {task_type}",
                    "model_used": model_type,
                    "tokens": 100
                }
            
            router._execute_model_request = mock_execute
            
            result = await router.route(task_type=task_type, prompt="Test prompt")
            
            assert result["success"] is True
            assert result["model_used"] == "local", f"Task {task_type} should route to local"


class TestAIRouterComplexTaskRouting:
    """Test routing of complex tasks to cloud AI"""
    
    @pytest.mark.asyncio
    async def test_route_complex_task_to_cloud_ai(self):
        """Test that complex tasks are routed to cloud AI (Requirement 4.4)"""
        local_client = MockLocalAIClient()
        cloud_client = MockCloudAIClient()
        
        router = AIRouter(
            local_ai_client=local_client,
            cloud_ai_client=cloud_client
        )
        
        async def mock_execute(model_type, task_type, prompt, **kwargs):
            if model_type == "cloud":
                return {
                    "success": True,
                    "response": "Cloud AI response",
                    "model_used": "cloud",
                    "tokens": 200
                }
            return {"success": False, "error": "Wrong model", "model_used": model_type, "tokens": 0}
        
        router._execute_model_request = mock_execute
        
        result = await router.route(
            task_type="blueprint_generation",
            prompt="Generate a business plan"
        )
        
        assert result["success"] is True
        assert result["model_used"] == "cloud"
        assert result["fallback_used"] is False
    
    @pytest.mark.asyncio
    async def test_route_all_complex_tasks_to_cloud(self):
        """Test that all complex task types route to cloud AI"""
        complex_tasks = [
            "blueprint_generation",
            "market_analysis",
            "risk_assessment",
            "seo_strategy",
            "competitor_analysis",
            "marketplace_enrichment"
        ]
        
        for task_type in complex_tasks:
            router = AIRouter()
            
            async def mock_execute(model_type, task_type, prompt, **kwargs):
                return {
                    "success": True,
                    "response": f"Response for {task_type}",
                    "model_used": model_type,
                    "tokens": 200
                }
            
            router._execute_model_request = mock_execute
            
            result = await router.route(task_type=task_type, prompt="Test prompt")
            
            assert result["success"] is True
            assert result["model_used"] == "cloud", f"Task {task_type} should route to cloud"


class TestAIRouterFallbackLogic:
    """Test fallback from cloud to local AI"""
    
    @pytest.mark.asyncio
    async def test_fallback_from_cloud_to_local_on_failure(self):
        """Test that router falls back to local AI when cloud fails (Requirement 4.5)"""
        router = AIRouter()
        
        call_sequence = []
        
        async def mock_execute(model_type, task_type, prompt, **kwargs):
            call_sequence.append(model_type)
            
            if model_type == "cloud":
                # Cloud fails
                return {
                    "success": False,
                    "error": "Cloud AI unavailable",
                    "model_used": "cloud",
                    "tokens": 0
                }
            elif model_type == "local":
                # Local succeeds
                return {
                    "success": True,
                    "response": "Local AI fallback response",
                    "model_used": "local",
                    "tokens": 100
                }
        
        router._execute_model_request = mock_execute
        router.max_retries = 1  # Reduce retries for faster test
        
        result = await router.route(
            task_type="blueprint_generation",  # Complex task
            prompt="Generate a business plan"
        )
        
        assert result["success"] is True
        assert result["model_used"] == "local"
        assert result["fallback_used"] is True
        assert "cloud" in call_sequence
        assert "local" in call_sequence
    
    @pytest.mark.asyncio
    async def test_no_fallback_for_simple_tasks(self):
        """Test that simple tasks don't fallback to cloud when local fails"""
        router = AIRouter()
        
        async def mock_execute(model_type, task_type, prompt, **kwargs):
            # Always fail
            return {
                "success": False,
                "error": f"{model_type} AI failed",
                "model_used": model_type,
                "tokens": 0
            }
        
        router._execute_model_request = mock_execute
        router.max_retries = 1
        
        result = await router.route(
            task_type="onboarding_qa",  # Simple task
            prompt="What is your business?"
        )
        
        assert result["success"] is False
        assert result["fallback_used"] is False
        assert result["model_used"] == "local"


class TestAIRouterRetryLogic:
    """Test retry logic with exponential backoff"""
    
    @pytest.mark.asyncio
    async def test_retry_with_exponential_backoff(self):
        """Test that router retries with exponential backoff (Requirement 4.6)"""
        router = AIRouter(max_retries=3)
        
        attempt_times = []
        
        async def mock_execute(model_type, task_type, prompt, **kwargs):
            attempt_times.append(asyncio.get_event_loop().time())
            # Always fail
            return {
                "success": False,
                "error": "Temporary failure",
                "model_used": model_type,
                "tokens": 0
            }
        
        router._execute_model_request = mock_execute
        
        result = await router.route(
            task_type="onboarding_qa",
            prompt="Test prompt"
        )
        
        assert result["success"] is False
        assert len(attempt_times) == 3  # 3 attempts
        
        # Check exponential backoff timing (approximately 1s, 2s between attempts)
        # We allow some tolerance for test execution time
        if len(attempt_times) >= 2:
            time_diff_1 = attempt_times[1] - attempt_times[0]
            assert 0.9 < time_diff_1 < 1.5, f"First backoff should be ~1s, got {time_diff_1}s"
        
        if len(attempt_times) >= 3:
            time_diff_2 = attempt_times[2] - attempt_times[1]
            assert 1.9 < time_diff_2 < 2.5, f"Second backoff should be ~2s, got {time_diff_2}s"
    
    @pytest.mark.asyncio
    async def test_retry_stops_on_success(self):
        """Test that retry stops when request succeeds"""
        router = AIRouter(max_retries=3)
        
        attempt_count = 0
        
        async def mock_execute(model_type, task_type, prompt, **kwargs):
            nonlocal attempt_count
            attempt_count += 1
            
            if attempt_count == 2:
                # Succeed on second attempt
                return {
                    "success": True,
                    "response": "Success on retry",
                    "model_used": model_type,
                    "tokens": 100
                }
            else:
                # Fail on first attempt
                return {
                    "success": False,
                    "error": "Temporary failure",
                    "model_used": model_type,
                    "tokens": 0
                }
        
        router._execute_model_request = mock_execute
        
        result = await router.route(
            task_type="onboarding_qa",
            prompt="Test prompt"
        )
        
        assert result["success"] is True
        assert attempt_count == 2  # Should stop after success
    
    @pytest.mark.asyncio
    async def test_max_retries_respected(self):
        """Test that router respects max_retries setting"""
        router = AIRouter(max_retries=2)
        
        attempt_count = 0
        
        async def mock_execute(model_type, task_type, prompt, **kwargs):
            nonlocal attempt_count
            attempt_count += 1
            return {
                "success": False,
                "error": "Always fails",
                "model_used": model_type,
                "tokens": 0
            }
        
        router._execute_model_request = mock_execute
        
        result = await router.route(
            task_type="onboarding_qa",
            prompt="Test prompt"
        )
        
        assert result["success"] is False
        assert attempt_count == 2  # Should only try max_retries times


class TestAIRouterLogging:
    """Test AI request logging"""
    
    @pytest.mark.asyncio
    async def test_log_successful_request(self):
        """Test that successful requests are logged (Requirement 4.7)"""
        router = AIRouter()
        
        async def mock_execute(model_type, task_type, prompt, **kwargs):
            return {
                "success": True,
                "response": "Success",
                "model_used": model_type,
                "tokens": 150
            }
        
        router._execute_model_request = mock_execute
        
        with patch('app.core.ai_router.logger') as mock_logger:
            result = await router.route(
                task_type="onboarding_qa",
                prompt="Test prompt"
            )
            
            # Check that logger.info was called for successful request
            assert mock_logger.info.called
            
            # Get the log call
            log_call = mock_logger.info.call_args[0][0]
            assert "AI request completed" in log_call
            assert "onboarding_qa" in str(log_call)
    
    @pytest.mark.asyncio
    async def test_log_failed_request(self):
        """Test that failed requests are logged with error level"""
        router = AIRouter(max_retries=1)
        
        async def mock_execute(model_type, task_type, prompt, **kwargs):
            return {
                "success": False,
                "error": "Request failed",
                "model_used": model_type,
                "tokens": 0
            }
        
        router._execute_model_request = mock_execute
        
        with patch('app.core.ai_router.logger') as mock_logger:
            result = await router.route(
                task_type="onboarding_qa",
                prompt="Test prompt"
            )
            
            # Check that logger.error was called for failed request
            assert mock_logger.error.called
            
            # Get the log call
            log_call = mock_logger.error.call_args[0][0]
            assert "AI request failed" in log_call
    
    @pytest.mark.asyncio
    async def test_log_contains_required_fields(self):
        """Test that logs contain model, latency, and tokens (Requirement 4.7)"""
        router = AIRouter()
        
        async def mock_execute(model_type, task_type, prompt, **kwargs):
            return {
                "success": True,
                "response": "Success",
                "model_used": "local",
                "tokens": 125
            }
        
        router._execute_model_request = mock_execute
        
        with patch('app.core.ai_router.logger') as mock_logger:
            result = await router.route(
                task_type="onboarding_qa",
                prompt="Test prompt"
            )
            
            # Get the log data
            log_call = str(mock_logger.info.call_args[0][0])
            
            # Verify required fields are present
            assert "model_used" in log_call
            assert "latency_ms" in log_call
            assert "tokens" in log_call
            assert "task_type" in log_call


class TestAIRouterErrorHandling:
    """Test error handling in AIRouter"""
    
    @pytest.mark.asyncio
    async def test_invalid_task_type_returns_error(self):
        """Test that invalid task types return error response"""
        router = AIRouter()
        
        result = await router.route(
            task_type="invalid_task_type",
            prompt="Test prompt"
        )
        
        assert result["success"] is False
        assert "Unknown task type" in result["error"]
        assert result["model_used"] is None
        assert result["fallback_used"] is False
    
    @pytest.mark.asyncio
    async def test_missing_local_client_returns_error(self):
        """Test that missing local client returns error for simple tasks"""
        router = AIRouter(local_ai_client=None)
        
        result = await router.route(
            task_type="onboarding_qa",
            prompt="Test prompt"
        )
        
        assert result["success"] is False
        assert "not configured" in result["error"] or "not yet implemented" in result["error"]
    
    @pytest.mark.asyncio
    async def test_missing_cloud_client_returns_error(self):
        """Test that missing cloud client returns error for complex tasks"""
        router = AIRouter(cloud_ai_client=None)
        
        result = await router.route(
            task_type="blueprint_generation",
            prompt="Test prompt"
        )
        
        assert result["success"] is False
        assert "not configured" in result["error"] or "not yet implemented" in result["error"]


class TestAIRouterResponseFormat:
    """Test that router returns correctly formatted responses"""
    
    @pytest.mark.asyncio
    async def test_successful_response_format(self):
        """Test that successful responses have all required fields"""
        router = AIRouter()
        
        async def mock_execute(model_type, task_type, prompt, **kwargs):
            return {
                "success": True,
                "response": "AI response",
                "model_used": model_type,
                "tokens": 100
            }
        
        router._execute_model_request = mock_execute
        
        result = await router.route(
            task_type="onboarding_qa",
            prompt="Test prompt"
        )
        
        # Check all required fields are present
        assert "success" in result
        assert "model_used" in result
        assert "latency_ms" in result
        assert "tokens" in result
        assert "fallback_used" in result
        
        # Check types
        assert isinstance(result["success"], bool)
        assert isinstance(result["latency_ms"], int)
        assert isinstance(result["tokens"], int)
        assert isinstance(result["fallback_used"], bool)
    
    @pytest.mark.asyncio
    async def test_failed_response_format(self):
        """Test that failed responses have error field"""
        router = AIRouter(max_retries=1)
        
        async def mock_execute(model_type, task_type, prompt, **kwargs):
            return {
                "success": False,
                "error": "Request failed",
                "model_used": model_type,
                "tokens": 0
            }
        
        router._execute_model_request = mock_execute
        
        result = await router.route(
            task_type="onboarding_qa",
            prompt="Test prompt"
        )
        
        assert "success" in result
        assert "error" in result
        assert result["success"] is False
        assert isinstance(result["error"], str)
