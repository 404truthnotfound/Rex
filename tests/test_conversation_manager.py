"""
Tests for the REX conversation manager
"""
import unittest
import sys
import os
from datetime import datetime

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from memory_system.memory_manager import MemoryManager
from conversation_manager.context_manager import ContextManager
from models.memory import Memory, MemoryCategory
from models.conversation import ConversationInput, ConversationResponse
from utils.config_loader import DEFAULT_CONFIG

class TestConversationManager(unittest.TestCase):
    """Test cases for the conversation manager"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.config = DEFAULT_CONFIG.copy()
        self.memory_manager = MemoryManager(self.config)
        self.context_manager = ContextManager(self.memory_manager, self.config)
        self.test_user_id = "test_user_123"
        self.test_session_id = "test_session_456"
        
        # Add some test memories
        python_memory = Memory(
            category=MemoryCategory.TOPICS,
            content="Python is a high-level programming language",
            source="test"
        )
        self.memory_manager.store_memory(self.test_user_id, python_memory)
        
        preference_memory = Memory(
            category=MemoryCategory.PREFERENCES,
            content="Preference: I prefer TypeScript over JavaScript and detailed comments",
            source="test"
        )
        self.memory_manager.store_memory(self.test_user_id, preference_memory)
    
    def test_process_conversation(self):
        """Test processing a conversation input"""
        # Process a conversation input
        response = self.context_manager.process_conversation(
            user_id=self.test_user_id,
            session_id=self.test_session_id,
            user_input="Tell me about Python programming"
        )
        
        # Verify response
        self.assertIsInstance(response, ConversationResponse)
        self.assertIsNotNone(response.ai_response)
        
        # Check if session context was created
        context_key = f"{self.test_user_id}:{self.test_session_id}"
        self.assertIn(context_key, self.context_manager.session_contexts)
        
        # Verify last interaction was stored
        session_context = self.context_manager.session_contexts[context_key]
        self.assertEqual(session_context["last_interaction"]["user_input"], "Tell me about Python programming")
    
    def test_memory_trigger_in_conversation(self):
        """Test memory trigger in conversation"""
        # Process a conversation with memory trigger
        response = self.context_manager.process_conversation(
            user_id=self.test_user_id,
            session_id=self.test_session_id,
            user_input="REX, recall Python"
        )
        
        # Verify response
        self.assertIsInstance(response, ConversationResponse)
        self.assertIsNotNone(response.ai_response)
        
        # Check metadata for explicit recall
        self.assertEqual(response.metadata.get("context_quality"), "explicit_recall")
    
    def test_conversation_continuity(self):
        """Test conversation continuity with multiple inputs"""
        # First conversation input
        first_response = self.context_manager.process_conversation(
            user_id=self.test_user_id,
            session_id=self.test_session_id,
            user_input="I'm working on a React application"
        )
        
        # Second conversation input
        second_response = self.context_manager.process_conversation(
            user_id=self.test_user_id,
            session_id=self.test_session_id,
            user_input="What visualization library would work best?"
        )
        
        # Verify responses
        self.assertIsInstance(first_response, ConversationResponse)
        self.assertIsInstance(second_response, ConversationResponse)
        
        # Check if conversation history was maintained
        context_key = f"{self.test_user_id}:{self.test_session_id}"
        session_context = self.context_manager.session_contexts[context_key]
        self.assertEqual(session_context["last_interaction"]["user_input"], "What visualization library would work best?")
        
        # Verify timeline memory was created
        timeline_memories = self.memory_manager.retrieve_memories(
            user_id=self.test_user_id,
            query="React application",
            categories=[MemoryCategory.TIMELINE]
        )
        self.assertGreaterEqual(len(timeline_memories), 1)

if __name__ == "__main__":
    unittest.main()
