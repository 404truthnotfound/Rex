"""
Text processing utilities for REX
Provides functions for entity extraction, keyword analysis, and memory trigger detection
"""
import re
from typing import Dict, List, Any, Set
import logging

logger = logging.getLogger(__name__)

def extract_entities(text: str) -> Dict[str, List[str]]:
    """
    Extract named entities from text
    
    Args:
        text: Input text to extract entities from
        
    Returns:
        Dictionary with entity categories as keys and lists of entities as values
    """
    # In a production system, this would use a proper NER model
    # For this implementation, we'll use simple pattern matching
    
    entities = {
        "people": [],
        "topics": [],
        "things": [],
        "projects": []
    }
    
    # Simple person detection (names with capital letters)
    name_pattern = r'\b[A-Z][a-z]+ [A-Z][a-z]+\b'
    potential_names = re.findall(name_pattern, text)
    entities["people"].extend(potential_names)
    
    # Simple topic detection (look for common topic indicators)
    topic_indicators = ["about", "regarding", "concerning", "on the topic of"]
    for indicator in topic_indicators:
        pattern = f"{indicator} ([A-Za-z0-9 ]+)"
        matches = re.findall(pattern, text, re.IGNORECASE)
        entities["topics"].extend(matches)
    
    # Simple project detection (look for project indicators)
    project_indicators = ["project", "initiative", "task", "assignment"]
    for indicator in project_indicators:
        pattern = f"([A-Za-z0-9 ]+) {indicator}"
        matches = re.findall(pattern, text, re.IGNORECASE)
        entities["projects"].extend(matches)
        
        pattern = f"{indicator} ([A-Za-z0-9 ]+)"
        matches = re.findall(pattern, text, re.IGNORECASE)
        entities["projects"].extend(matches)
    
    # Simple thing detection (products, technologies)
    tech_pattern = r'\b[A-Z][a-zA-Z0-9]+(\.js|\.py|\.NET)?\b'
    potential_tech = re.findall(tech_pattern, text)
    entities["things"].extend(potential_tech)
    
    # Remove duplicates
    for category in entities:
        entities[category] = list(set(entities[category]))
    
    return entities

def extract_keywords(text: str, max_keywords: int = 10) -> List[str]:
    """
    Extract important keywords from text
    
    Args:
        text: Input text to extract keywords from
        max_keywords: Maximum number of keywords to extract
        
    Returns:
        List of extracted keywords
    """
    # In a production system, this would use a proper keyword extraction algorithm
    # For this implementation, we'll use simple frequency-based extraction
    
    # Tokenize and clean text
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    
    # Remove common stopwords
    stopwords = {"the", "and", "is", "in", "to", "a", "of", "for", "with", "on", "at", "from", "by", "about", "as"}
    filtered_words = [word for word in words if word not in stopwords]
    
    # Count word frequencies
    word_counts = {}
    for word in filtered_words:
        word_counts[word] = word_counts.get(word, 0) + 1
    
    # Sort by frequency
    sorted_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)
    
    # Return top keywords
    return [word for word, count in sorted_words[:max_keywords]]

def detect_memory_triggers(text: str) -> Dict[str, Any]:
    """
    Detect memory trigger phrases in text
    
    Args:
        text: Input text to analyze
        
    Returns:
        Dictionary with trigger information if found, empty dict otherwise
    """
    # Check for REX memory triggers
    trigger_pattern = r"REX,\s+(recall|remember|what did we say about|update on)\s+(.+)"
    match = re.search(trigger_pattern, text, re.IGNORECASE)
    
    if match:
        trigger_type = match.group(1).lower()
        topic = match.group(2).strip()
        
        return {
            "trigger_type": trigger_type,
            "topic": topic,
            "full_trigger": match.group(0)
        }
    
    return {}
