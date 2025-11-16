"""
Slack Safety Utilities
Rate limiting and safety checks for Slack auto-responses
"""
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

def check_rate_limit(processed_mentions, slack_user_id, user_name, max_per_hour=10):
    """Check if user exceeded rate limit (default: 10 mentions/hour)"""
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    recent_count = processed_mentions.count_documents({
        "user_id": slack_user_id,
        "processed_at": {"$gte": one_hour_ago}
    })
    
    if recent_count >= max_per_hour:
        logger.warning(f"⚠️ Rate limit: {user_name} exceeded {max_per_hour}/hour")
        return True
    return False

def check_question_length(question, max_length=500):
    """Check if question is too long (default: 500 chars max)"""
    if len(question) > max_length:
        logger.warning(f"⚠️ Question too long: {len(question)} chars")
        return True
    return False

def get_safe_llm_config():
    """Get safe LLM config with token limits (512 tokens = 75% cost savings)"""
    return {'temperature': 0.7, 'max_output_tokens': 512}
