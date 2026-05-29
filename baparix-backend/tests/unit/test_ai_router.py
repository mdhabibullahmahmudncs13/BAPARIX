"""
Unit tests for AI Router module

Tests the AITaskClassifier class that determines whether AI tasks
should be routed to local AI (Ollama) or cloud AI (OpenRouter).

Requirements: 4.1, 4.2, 4.3
"""

import pytest
from app.core.ai_router import AITaskClassifier, TaskComplexity


class TestAITaskClassifier:
    """Test suite for AITaskClassifier"""
    
    def test_classify_simple_task_onboarding_qa(self):
        """Test that onboarding_qa is classified as SIMPLE"""
        result = AITaskClassifier.classify_task("onboarding_qa")
        assert result == TaskComplexity.SIMPLE
    
    def test_classify_simple_task_product_translation(self):
        """Test that product_translation is classified as SIMPLE"""
        result = AITaskClassifier.classify_task("product_translation")
        assert result == TaskComplexity.SIMPLE
    
    def test_classify_simple_task_financial_tagging(self):
        """Test that financial_tagging is classified as SIMPLE"""
        result = AITaskClassifier.classify_task("financial_tagging")
        assert result == TaskComplexity.SIMPLE
    
    def test_classify_simple_task_content_generation(self):
        """Test that content_generation is classified as SIMPLE"""
        result = AITaskClassifier.classify_task("content_generation")
        assert result == TaskComplexity.SIMPLE
    
    def test_classify_simple_task_trend_summary(self):
        """Test that trend_summary is classified as SIMPLE"""
        result = AITaskClassifier.classify_task("trend_summary")
        assert result == TaskComplexity.SIMPLE
    
    def test_classify_simple_task_marketplace_query_parse(self):
        """Test that marketplace_query_parse is classified as SIMPLE"""
        result = AITaskClassifier.classify_task("marketplace_query_parse")
        assert result == TaskComplexity.SIMPLE
    
    def test_classify_complex_task_blueprint_generation(self):
        """Test that blueprint_generation is classified as COMPLEX"""
        result = AITaskClassifier.classify_task("blueprint_generation")
        assert result == TaskComplexity.COMPLEX
    
    def test_classify_complex_task_market_analysis(self):
        """Test that market_analysis is classified as COMPLEX"""
        result = AITaskClassifier.classify_task("market_analysis")
        assert result == TaskComplexity.COMPLEX
    
    def test_classify_complex_task_risk_assessment(self):
        """Test that risk_assessment is classified as COMPLEX"""
        result = AITaskClassifier.classify_task("risk_assessment")
        assert result == TaskComplexity.COMPLEX
    
    def test_classify_complex_task_seo_strategy(self):
        """Test that seo_strategy is classified as COMPLEX"""
        result = AITaskClassifier.classify_task("seo_strategy")
        assert result == TaskComplexity.COMPLEX
    
    def test_classify_complex_task_competitor_analysis(self):
        """Test that competitor_analysis is classified as COMPLEX"""
        result = AITaskClassifier.classify_task("competitor_analysis")
        assert result == TaskComplexity.COMPLEX
    
    def test_classify_complex_task_marketplace_enrichment(self):
        """Test that marketplace_enrichment is classified as COMPLEX"""
        result = AITaskClassifier.classify_task("marketplace_enrichment")
        assert result == TaskComplexity.COMPLEX
    
    def test_classify_unknown_task_raises_error(self):
        """Test that unknown task types raise ValueError"""
        with pytest.raises(ValueError) as exc_info:
            AITaskClassifier.classify_task("unknown_task_type")
        
        assert "Unknown task type: unknown_task_type" in str(exc_info.value)
        assert "Valid task types are:" in str(exc_info.value)
    
    def test_classify_empty_string_raises_error(self):
        """Test that empty string task type raises ValueError"""
        with pytest.raises(ValueError) as exc_info:
            AITaskClassifier.classify_task("")
        
        assert "Unknown task type:" in str(exc_info.value)
    
    def test_all_simple_tasks_defined(self):
        """Test that all expected simple tasks are defined"""
        expected_simple_tasks = {
            "onboarding_qa",
            "product_translation",
            "financial_tagging",
            "content_generation",
            "trend_summary",
            "marketplace_query_parse"
        }
        assert AITaskClassifier.SIMPLE_TASKS == expected_simple_tasks
    
    def test_all_complex_tasks_defined(self):
        """Test that all expected complex tasks are defined"""
        expected_complex_tasks = {
            "blueprint_generation",
            "market_analysis",
            "risk_assessment",
            "seo_strategy",
            "competitor_analysis",
            "marketplace_enrichment"
        }
        assert AITaskClassifier.COMPLEX_TASKS == expected_complex_tasks
    
    def test_no_overlap_between_simple_and_complex(self):
        """Test that there is no overlap between simple and complex task sets"""
        overlap = AITaskClassifier.SIMPLE_TASKS & AITaskClassifier.COMPLEX_TASKS
        assert len(overlap) == 0, f"Found overlapping tasks: {overlap}"
    
    def test_task_complexity_enum_values(self):
        """Test that TaskComplexity enum has correct values"""
        assert TaskComplexity.SIMPLE.value == "simple"
        assert TaskComplexity.COMPLEX.value == "complex"
    
    def test_classify_task_is_case_sensitive(self):
        """Test that task classification is case-sensitive"""
        with pytest.raises(ValueError):
            AITaskClassifier.classify_task("ONBOARDING_QA")
        
        with pytest.raises(ValueError):
            AITaskClassifier.classify_task("Blueprint_Generation")


class TestTaskComplexityEnum:
    """Test suite for TaskComplexity enum"""
    
    def test_enum_has_two_values(self):
        """Test that TaskComplexity enum has exactly two values"""
        assert len(TaskComplexity) == 2
    
    def test_enum_members(self):
        """Test that TaskComplexity has SIMPLE and COMPLEX members"""
        assert hasattr(TaskComplexity, "SIMPLE")
        assert hasattr(TaskComplexity, "COMPLEX")
    
    def test_enum_comparison(self):
        """Test that enum values can be compared"""
        assert TaskComplexity.SIMPLE == TaskComplexity.SIMPLE
        assert TaskComplexity.COMPLEX == TaskComplexity.COMPLEX
        assert TaskComplexity.SIMPLE != TaskComplexity.COMPLEX
