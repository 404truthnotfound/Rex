"""
Context Manager for REX
Handles conversation flow and context integration
"""
from typing import Dict, List, Any, Optional
import logging
import re
from datetime import datetime

from memory_system.memory_manager import MemoryManager
from models.conversation import ConversationInput, ConversationResponse
from models.memory import Memory, MemoryCategory
from utils.text_processing import extract_entities, extract_keywords, detect_memory_triggers

logger = logging.getLogger(__name__)

class ContextManager:
    """
    Manages conversation context and integrates memory system
    Responsible for maintaining conversation flow and seamlessly integrating past context
    """
    
    def __init__(self, memory_manager: MemoryManager, config: Dict[str, Any]):
        """Initialize the context manager with memory manager and configuration"""
        self.memory_manager = memory_manager
        self.config = config
        self.session_contexts = {}  # Store active session contexts
        self.memory_trigger_pattern = re.compile(r"REX,\s+(recall|remember|what did we say about|update on)\s+(.+)", re.IGNORECASE)
        logger.info("Context Manager initialized")
    
    def process_conversation(self, 
                            user_id: str, 
                            session_id: str, 
                            user_input: str, 
                            conversation_history: Optional[List[Dict[str, Any]]] = None) -> ConversationResponse:
        """
        Process a conversation input with context awareness
        
        Args:
            user_id: Unique identifier for the user
            session_id: Identifier for the current conversation session
            user_input: The user's input text
            conversation_history: Optional history of the conversation
            
        Returns:
            ConversationResponse with AI response and metadata
        """
        # Initialize or retrieve session context
        session_context = self._get_session_context(user_id, session_id)
        
        # Update conversation history in session context
        if conversation_history:
            session_context["history"] = conversation_history
        
        # Check for explicit memory triggers
        memory_trigger = self._check_memory_trigger(user_input)
        if memory_trigger:
            trigger_type, topic = memory_trigger
            recalled_memory = self.memory_manager.process_memory_trigger(
                user_id=user_id,
                trigger_phrase=user_input,
                context={"session_id": session_id}
            )
            # Store the memory recall event in timeline
            self._store_memory_recall_event(user_id, trigger_type, topic)
            
            # Generate response based on recalled memory
            response = self._generate_response_with_memory(user_input, recalled_memory, session_context)
        else:
            # Process regular conversation input
            # Extract and store potential memories from user input
            self.memory_manager.extract_and_store_memories(
                user_id=user_id,
                text=user_input,
                context={"session_id": session_id, "source": "user_input"}
            )
            
            # Retrieve relevant memories based on user input
            relevant_memories = self.memory_manager.retrieve_memories(
                user_id=user_id,
                query=user_input,
                limit=self.config.get("context_memory_limit", 3)
            )
            
            # Generate response with context awareness
            response = self._generate_response(user_input, relevant_memories, session_context)
            
            # Store the conversation in timeline memory
            self._store_conversation_memory(user_id, user_input, response.ai_response)
        
        # Update session context with the latest interaction
        session_context["last_interaction"] = {
            "user_input": user_input,
            "ai_response": response.ai_response,
            "timestamp": datetime.now().isoformat()
        }
        
        return response
    
    def _get_session_context(self, user_id: str, session_id: str) -> Dict[str, Any]:
        """Get or initialize session context"""
        context_key = f"{user_id}:{session_id}"
        if context_key not in self.session_contexts:
            self.session_contexts[context_key] = {
                "user_id": user_id,
                "session_id": session_id,
                "start_time": datetime.now().isoformat(),
                "history": [],
                "active_topics": set(),
                "active_projects": set(),
                "identified_preferences": set(),
                "last_interaction": None
            }
        return self.session_contexts[context_key]
    
    def _check_memory_trigger(self, text: str) -> Optional[tuple]:
        """Check if text contains a memory trigger phrase"""
        match = self.memory_trigger_pattern.search(text)
        if match:
            trigger_type = match.group(1).lower()
            topic = match.group(2).strip()
            return (trigger_type, topic)
        return None
    
    def _generate_response(self, 
                          user_input: str, 
                          relevant_memories: List[Memory], 
                          session_context: Dict[str, Any]) -> ConversationResponse:
        """
        Generate a response with context awareness
        
        Args:
            user_input: The user's input text
            relevant_memories: List of relevant memories to incorporate
            session_context: Current session context
            
        Returns:
            ConversationResponse with AI response and metadata
        """
        # In a real implementation, this would call an LLM with the context
        # For this implementation, we'll simulate the response generation
        
        # Extract context from relevant memories
        memory_contexts = []
        for memory in relevant_memories:
            memory_contexts.append(memory.content)
        
        # Build a response that incorporates the context
        # In a real system, this would be handled by an LLM
        if memory_contexts:
            # Simulate a response that seamlessly incorporates memories
            response_text = f"Based on our conversation context, here's a response to: {user_input}\n\n"
            response_text += "This response would seamlessly incorporate relevant context from previous conversations without explicitly mentioning the memory system."
        else:
            response_text = f"Here's a response to: {user_input}\n\n"
            response_text += "This response would be generated without specific prior context, but would still maintain the conversation flow."
        
        return ConversationResponse(
            ai_response=response_text,
            used_memories=[memory.id for memory in relevant_memories],
            metadata={
                "context_quality": "high" if relevant_memories else "standard",
                "memory_count": len(relevant_memories)
            }
        )
    
    def _generate_response_with_memory(self, 
                                      user_input: str, 
                                      recalled_memory: Dict[str, Any], 
                                      session_context: Dict[str, Any]) -> ConversationResponse:
        """
        Generate a response based on explicitly recalled memory
        
        Args:
            user_input: The user's input text
            recalled_memory: The explicitly recalled memory data
            session_context: Current session context
            
        Returns:
            ConversationResponse with AI response and metadata
        """
        # In a real implementation, this would call an LLM with the recalled memory
        # For this implementation, we'll simulate the response generation
        
        topic = recalled_memory.get("topic") or recalled_memory.get("project") or recalled_memory.get("query", "")
        memories = recalled_memory.get("memories", [])
        
        if memories:
            memory_contents = [memory.get("content", "") for memory in memories]
            # Simulate a response that directly addresses the recalled memory
            response_text = f"Here's the information about {topic}:\n\n"
            response_text += "This response would directly address the recalled information without explicitly mentioning the memory system."
        else:
            response_text = f"I don't have specific information about {topic}.\n\n"
            response_text += "This response would acknowledge the lack of specific memory while maintaining conversation flow."
        
        memory_ids = [memory.get("id") for memory in memories if memory.get("id")]
        
        return ConversationResponse(
            ai_response=response_text,
            used_memories=memory_ids,
            metadata={
                "context_quality": "explicit_recall",
                "memory_count": len(memories),
                "recall_topic": topic
            }
        )
    
    def _store_conversation_memory(self, user_id: str, user_input: str, ai_response: str) -> str:
        """Store conversation in timeline memory"""
        memory = Memory(
            category=MemoryCategory.TIMELINE,
            content=f"User: {user_input}\nAI: {ai_response}",
            source="conversation",
            metadata={
                "user_input": user_input,
                "ai_response": ai_response
            }
        )
        return self.memory_manager.store_memory(user_id, memory)
    
    def _store_memory_recall_event(self, user_id: str, trigger_type: str, topic: str) -> str:
        """Store memory recall event in timeline"""
        memory = Memory(
            category=MemoryCategory.TIMELINE,
            content=f"Memory recall event: {trigger_type} about {topic}",
            source="memory_trigger",
            metadata={
                "trigger_type": trigger_type,
                "topic": topic
            }
        )
        return self.memory_manager.store_memory(user_id, memory)
