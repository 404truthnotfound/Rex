"""
Configuration loader for REX
Handles loading and validating configuration settings
"""
import os
import json
import logging
from typing import Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)

DEFAULT_CONFIG = {
    "memory_recall_limit": 5,
    "context_memory_limit": 3,
    "embedding_model": "all-MiniLM-L6-v2",
    "memory_threshold": 0.7,  # Similarity threshold for memory retrieval
    "max_session_history": 100,  # Maximum number of messages to keep in session history
    "memory_persistence": {
        "enabled": True,
        "storage_type": "file",  # Options: file, redis, database
        "file_path": "data/memories"
    }
}

def load_config(config_path: str = None) -> Dict[str, Any]:
    """
    Load configuration from file or use defaults
    
    Args:
        config_path: Path to configuration file (optional)
        
    Returns:
        Configuration dictionary
    """
    config = DEFAULT_CONFIG.copy()
    
    if config_path and os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                user_config = json.load(f)
                # Update default config with user settings
                config.update(user_config)
            logger.info(f"Loaded configuration from {config_path}")
        except Exception as e:
            logger.error(f"Error loading configuration from {config_path}: {str(e)}")
            logger.info("Using default configuration")
    else:
        logger.info("No configuration file found, using default configuration")
        
        # If memory persistence is enabled, ensure directory exists
        if config["memory_persistence"]["enabled"] and config["memory_persistence"]["storage_type"] == "file":
            os.makedirs(config["memory_persistence"]["file_path"], exist_ok=True)
    
    return config

def save_config(config: Dict[str, Any], config_path: str) -> bool:
    """
    Save configuration to file
    
    Args:
        config: Configuration dictionary
        config_path: Path to save configuration file
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(config_path), exist_ok=True)
        
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        logger.info(f"Saved configuration to {config_path}")
        return True
    except Exception as e:
        logger.error(f"Error saving configuration to {config_path}: {str(e)}")
        return False
