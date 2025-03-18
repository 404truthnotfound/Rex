"""
Memory Manager for REX
Handles storage, retrieval, and organization of memory categories
"""
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

from models.memory import Memory, MemoryCategory
from utils.text_processing import extract_entities, extract_keywords

logger = logging.getLogger(__name__)

class MemoryManager:
    """
    Manages the memory system for REX
    Handles storage, retrieval, and organization of memories across different categories
    """
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the memory manager with configuration"""
        self.config = config
        self.memory_store = {}  # User-based memory storage
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.memory_triggers = {
            "recall": self._handle_recall_trigger,
            "remember": self._handle_remember_trigger,
            "what did we say about": self._handle_what_did_we_say_trigger,
            "update on": self._handle_update_trigger
        }
        logger.info("Memory Manager initialized")
    
    def store_memory(self, user_id: str, memory: Memory) -> str:
        """
        Store a new memory in the appropriate category
        
        Args:
            user_id: Unique identifier for the user
            memory: Memory object to store
            
        Returns:
            memory_id: Unique identifier for the stored memory
        """
        # Initialize user memory store if it doesn't exist
        if user_id not in self.memory_store:
            self.memory_store[user_id] = {
                category.value: [] for category in MemoryCategory
            }
        
        # Generate memory embedding
        memory.embedding = self._generate_embedding(memory.content)
        
        # Add timestamp if not provided
        if not memory.timestamp:
            memory.timestamp = datetime.now().isoformat()
        
        # Store memory in appropriate category
        self.memory_store[user_id][memory.category.value].append(memory)
        
        logger.info(f"Stored memory for user {user_id} in category {memory.category.value}")
        return memory.id
    
    def retrieve_memories(self, 
                         user_id: str, 
                         query: str, 
                         categories: Optional[List[MemoryCategory]] = None,
                         limit: int = 5) -> List[Memory]:
        """
        Retrieve relevant memories based on query and categories
        
        Args:
            user_id: Unique identifier for the user
            query: Query text to search for relevant memories
            categories: List of memory categories to search in (optional)
            limit: Maximum number of memories to return
            
        Returns:
            List of relevant Memory objects
        """
        if user_id not in self.memory_store:
            logger.info(f"No memories found for user {user_id}")
            return []
        
        # Generate query embedding
        query_embedding = self._generate_embedding(query)
        
        # Determine which categories to search
        search_categories = [cat.value for cat in categories] if categories else list(self.memory_store[user_id].keys())
        
        # Collect all memories from specified categories
        all_memories = []
        for category in search_categories:
            all_memories.extend(self.memory_store[user_id].get(category, []))
        
        if not all_memories:
            return []
        
        # Calculate similarity scores
        similarities = []
        for memory in all_memories:
            if memory.embedding is not None:
                similarity = cosine_similarity(
                    [query_embedding], 
                    [memory.embedding]
                )[0][0]
                similarities.append((memory, similarity))
        
        # Sort by similarity and return top results
        sorted_memories = sorted(similarities, key=lambda x: x[1], reverse=True)
        return [memory for memory, _ in sorted_memories[:limit]]
    
    def process_memory_trigger(self, 
                              user_id: str, 
                              trigger_phrase: str, 
                              context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a memory trigger phrase and return relevant memories
        
        Args:
            user_id: Unique identifier for the user
            trigger_phrase: The trigger phrase used (e.g., "REX, recall...")
            context: Additional context for the trigger
            
        Returns:
            Dictionary containing recalled memories and related information
        """
        # Extract the trigger type and topic
        trigger_parts = trigger_phrase.split("REX, ", 1)
        if len(trigger_parts) < 2:
            logger.warning(f"Invalid trigger phrase format: {trigger_phrase}")
            return {"error": "Invalid trigger phrase format"}
        
        trigger_content = trigger_parts[1]
        
        # Identify which trigger type was used
        for trigger_key, handler in self.memory_triggers.items():
            if trigger_content.lower().startswith(trigger_key):
                topic = trigger_content[len(trigger_key):].strip()
                return handler(user_id, topic, context)
        
        # Default handling if no specific trigger matched
        return self._default_memory_retrieval(user_id, trigger_content, context)
    
    def extract_and_store_memories(self, 
                                  user_id: str, 
                                  text: str, 
                                  context: Dict[str, Any]) -> List[str]:
        """
        Extract potential memories from text and store them
        
        Args:
            user_id: Unique identifier for the user
            text: Text to extract memories from
            context: Additional context for memory extraction
            
        Returns:
            List of memory IDs that were stored
        """
        memory_ids = []
        
        # Extract entities and categorize them
        entities = extract_entities(text)
        
        # Process people entities
        if entities.get('people'):
            for person in entities['people']:
                memory = Memory(
                    category=MemoryCategory.PEOPLE,
                    content=f"Person: {person}",
                    source=context.get('source', 'conversation'),
                    metadata={"extracted_from": text[:100] + "..."}
                )
                memory_id = self.store_memory(user_id, memory)
                memory_ids.append(memory_id)
        
        # Process topic entities
        if entities.get('topics'):
            for topic in entities['topics']:
                memory = Memory(
                    category=MemoryCategory.TOPICS,
                    content=f"Topic: {topic}",
                    source=context.get('source', 'conversation'),
                    metadata={"extracted_from": text[:100] + "..."}
                )
                memory_id = self.store_memory(user_id, memory)
                memory_ids.append(memory_id)
        
        # Process preferences (if detected)
        preferences = self._extract_preferences(text)
        for pref in preferences:
            memory = Memory(
                category=MemoryCategory.PREFERENCES,
                content=f"Preference: {pref}",
                source=context.get('source', 'conversation'),
                metadata={"extracted_from": text[:100] + "..."}
            )
            memory_id = self.store_memory(user_id, memory)
            memory_ids.append(memory_id)
        
        return memory_ids
    
    def _generate_embedding(self, text: str) -> np.ndarray:
        """Generate embedding vector for text"""
        try:
            return self.embedding_model.encode(text)
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            return np.zeros(384)  # Default embedding size for the model
    
    def _extract_preferences(self, text: str) -> List[str]:
        """Extract user preferences from text"""
        # Simple keyword-based preference extraction
        # In a production system, this would use more sophisticated NLP
        preference_indicators = [
            "prefer", "like", "don't like", "dislike", 
            "want", "need", "require", "must have"
        ]
        
        preferences = []
        for indicator in preference_indicators:
            if indicator in text.lower():
                # Find the sentence containing the preference
                sentences = text.split('.')
                for sentence in sentences:
                    if indicator in sentence.lower():
                        preferences.append(sentence.strip())
        
        return preferences
    
    # Memory trigger handlers
    def _handle_recall_trigger(self, user_id: str, topic: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle 'recall' memory trigger"""
        memories = self.retrieve_memories(
            user_id=user_id,
            query=topic,
            limit=self.config.get("memory_recall_limit", 3)
        )
        return {
            "topic": topic,  # Preserve the original case of the topic
            "memories": [memory.to_dict() for memory in memories],
            "trigger_type": "recall"
        }
    
    def _handle_remember_trigger(self, user_id: str, topic: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle 'remember our discussion about' memory trigger"""
        # This specifically targets conversation history
        memories = self.retrieve_memories(
            user_id=user_id,
            query=f"discussion about {topic}",
            categories=[MemoryCategory.TIMELINE],
            limit=self.config.get("memory_recall_limit", 3)
        )
        return {
            "topic": topic,  # Preserve the original case of the topic
            "memories": [memory.to_dict() for memory in memories],
            "trigger_type": "remember_discussion"
        }
    
    def _handle_what_did_we_say_trigger(self, user_id: str, topic: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle 'what did we say about' memory trigger"""
        # Similar to remember but with different phrasing
        memories = self.retrieve_memories(
            user_id=user_id,
            query=topic,
            limit=self.config.get("memory_recall_limit", 3)
        )
        return {
            "topic": topic,  # Preserve the original case of the topic
            "memories": [memory.to_dict() for memory in memories],
            "trigger_type": "what_did_we_say"
        }
    
    def _handle_update_trigger(self, user_id: str, project: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle 'update on' memory trigger for projects"""
        memories = self.retrieve_memories(
            user_id=user_id,
            query=project,
            categories=[MemoryCategory.PROJECTS],
            limit=self.config.get("memory_recall_limit", 5)
        )
        return {
            "project": project,  # Preserve the original case of the project name
            "memories": [memory.to_dict() for memory in memories],
            "trigger_type": "project_update"
        }
    
    def _default_memory_retrieval(self, user_id: str, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Default memory retrieval when no specific trigger matches"""
        memories = self.retrieve_memories(
            user_id=user_id,
            query=query,
            limit=self.config.get("memory_recall_limit", 3)
        )
        return {
            "query": query,
            "memories": [memory.to_dict() for memory in memories],
            "trigger_type": "general"
        }
