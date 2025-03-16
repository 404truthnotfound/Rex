"""
Memory models for REX
Defines the data structures for memory storage and retrieval
"""
from enum import Enum
from typing import Dict, Any, Optional, List
import uuid
from datetime import datetime
import numpy as np

class MemoryCategory(Enum):
    """Enumeration of memory categories"""
    TOPICS = "topics"
    PEOPLE = "people"
    THINGS = "things"
    PROJECTS = "projects"
    PREFERENCES = "preferences"
    TIMELINE = "timeline"

class Memory:
    """
    Memory data structure for storing and retrieving contextual information
    """
    
    def __init__(self, 
                category: MemoryCategory, 
                content: str, 
                source: str = "conversation",
                metadata: Optional[Dict[str, Any]] = None,
                timestamp: Optional[str] = None,
                embedding: Optional[np.ndarray] = None,
                memory_id: Optional[str] = None):
        """
        Initialize a memory object
        
        Args:
            category: Category of the memory (topics, people, etc.)
            content: The actual content of the memory
            source: Source of the memory (conversation, document, etc.)
            metadata: Additional metadata for the memory
            timestamp: ISO format timestamp (defaults to current time)
            embedding: Vector embedding of the memory content
            memory_id: Unique identifier (defaults to generated UUID)
        """
        self.id = memory_id or str(uuid.uuid4())
        self.category = category
        self.content = content
        self.source = source
        self.metadata = metadata or {}
        self.timestamp = timestamp or datetime.now().isoformat()
        self.embedding = embedding
        self.relevance_score = 0.0  # Used during retrieval
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert memory to dictionary representation"""
        return {
            "id": self.id,
            "category": self.category.value,
            "content": self.content,
            "source": self.source,
            "metadata": self.metadata,
            "timestamp": self.timestamp,
            # Embedding is not included in dict representation
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Memory':
        """Create memory object from dictionary"""
        return cls(
            category=MemoryCategory(data["category"]),
            content=data["content"],
            source=data.get("source", "conversation"),
            metadata=data.get("metadata", {}),
            timestamp=data.get("timestamp"),
            memory_id=data.get("id")
        )
    
    def update_relevance_score(self, score: float) -> None:
        """Update the relevance score for this memory"""
        self.relevance_score = score
