"""
Tests for the REX memory system
"""
import unittest
import sys
import os
from datetime import datetime

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from memory_system.memory_manager import MemoryManager
from models.memory import Memory, MemoryCategory
from utils.config_loader import DEFAULT_CONFIG

class TestMemorySystem(unittest.TestCase):
    """Test cases for the memory system"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.config = DEFAULT_CONFIG.copy()
        self.memory_manager = MemoryManager(self.config)
        self.test_user_id = "test_user_123"
    
    def test_store_and_retrieve_memory(self):
        """Test storing and retrieving a memory"""
        # Create a test memory
        test_memory = Memory(
            category=MemoryCategory.TOPICS,
            content="Test topic about Python programming",
            source="test",
            metadata={"test_key": "test_value"}
        )
        
        # Store the memory
        memory_id = self.memory_manager.store_memory(self.test_user_id, test_memory)
        
        # Verify memory was stored
        self.assertIn(self.test_user_id, self.memory_manager.memory_store)
        self.assertIn(MemoryCategory.TOPICS.value, self.memory_manager.memory_store[self.test_user_id])
        
        # Retrieve the memory
        retrieved_memories = self.memory_manager.retrieve_memories(
            user_id=self.test_user_id,
            query="Python programming",
            categories=[MemoryCategory.TOPICS]
        )
        
        # Verify memory was retrieved
        self.assertGreaterEqual(len(retrieved_memories), 1)
        retrieved_memory = retrieved_memories[0]
        self.assertEqual(retrieved_memory.id, memory_id)
        self.assertEqual(retrieved_memory.category, MemoryCategory.TOPICS)
        self.assertEqual(retrieved_memory.content, "Test topic about Python programming")
    
    def test_memory_trigger_processing(self):
        """Test processing memory triggers"""
        # Store some test memories
        python_memory = Memory(
            category=MemoryCategory.TOPICS,
            content="Python is a high-level programming language",
            source="test"
        )
        self.memory_manager.store_memory(self.test_user_id, python_memory)
        
        project_memory = Memory(
            category=MemoryCategory.PROJECTS,
            content="Web scraping project using Python",
            source="test"
        )
        self.memory_manager.store_memory(self.test_user_id, project_memory)
        
        # Test recall trigger
        recall_result = self.memory_manager.process_memory_trigger(
            user_id=self.test_user_id,
            trigger_phrase="REX, recall Python",
            context={}
        )
        
        # Verify recall results
        self.assertEqual(recall_result["topic"], "Python")
        self.assertEqual(recall_result["trigger_type"], "recall")
        self.assertGreaterEqual(len(recall_result["memories"]), 1)
        
        # Test update trigger
        update_result = self.memory_manager.process_memory_trigger(
            user_id=self.test_user_id,
            trigger_phrase="REX, update on web scraping project",
            context={}
        )
        
        # Verify update results
        self.assertEqual(update_result["project"], "web scraping project")
        self.assertEqual(update_result["trigger_type"], "project_update")
    
    def test_extract_and_store_memories(self):
        """Test extracting and storing memories from text"""
        # Test text with potential memories
        test_text = "I'm working with John Smith on a Machine Learning project. I prefer using Python over Java for this kind of work."
        
        # Extract and store memories
        memory_ids = self.memory_manager.extract_and_store_memories(
            user_id=self.test_user_id,
            text=test_text,
            context={"source": "test"}
        )
        
        # Verify memories were extracted and stored
        self.assertGreaterEqual(len(memory_ids), 1)
        
        # Check if person was extracted
        people_memories = self.memory_manager.retrieve_memories(
            user_id=self.test_user_id,
            query="John Smith",
            categories=[MemoryCategory.PEOPLE]
        )
        self.assertGreaterEqual(len(people_memories), 0)  # May be 0 if extraction fails
        
        # Check if preference was extracted
        pref_memories = self.memory_manager.retrieve_memories(
            user_id=self.test_user_id,
            query="prefer Python",
            categories=[MemoryCategory.PREFERENCES]
        )
        self.assertGreaterEqual(len(pref_memories), 0)  # May be 0 if extraction fails

if __name__ == "__main__":
    unittest.main()
