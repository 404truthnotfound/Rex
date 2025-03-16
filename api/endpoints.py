"""
API endpoints for REX
Defines the REST API interface for interacting with the system
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, List, Any, Optional
import logging

from models.conversation import ConversationInput, ConversationResponse
from memory_system.memory_manager import MemoryManager
from conversation_manager.context_manager import ContextManager

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api", tags=["REX API"])

def get_memory_manager():
    """Dependency to get memory manager instance"""
    # In a real app, this would be a singleton or dependency injection
    from app import memory_manager
    return memory_manager

def get_context_manager():
    """Dependency to get context manager instance"""
    # In a real app, this would be a singleton or dependency injection
    from app import context_manager
    return context_manager

@router.post("/conversation", response_model=ConversationResponse)
async def process_conversation(
    input_data: ConversationInput,
    context_manager: ContextManager = Depends(get_context_manager)
):
    """
    Process a conversation input and return a response with context awareness
    """
    try:
        response = context_manager.process_conversation(
            user_id=input_data.user_id,
            session_id=input_data.session_id,
            user_input=input_data.user_input,
            conversation_history=input_data.conversation_history
        )
        return response
    except Exception as e:
        logger.error(f"Error processing conversation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/memory/trigger")
async def memory_trigger(
    user_id: str,
    trigger_phrase: str = Body(...),
    context: Optional[Dict[str, Any]] = Body({}),
    memory_manager: MemoryManager = Depends(get_memory_manager)
):
    """
    Endpoint to explicitly trigger memory recall
    """
    try:
        recalled_memory = memory_manager.process_memory_trigger(
            user_id=user_id,
            trigger_phrase=trigger_phrase,
            context=context or {}
        )
        return {"recalled_memory": recalled_memory}
    except Exception as e:
        logger.error(f"Error processing memory trigger: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/memory/categories")
async def get_memory_categories():
    """
    Get available memory categories
    """
    from models.memory import MemoryCategory
    return {
        "categories": [category.value for category in MemoryCategory]
    }

@router.get("/memory/{user_id}")
async def get_user_memories(
    user_id: str,
    category: Optional[str] = None,
    limit: int = 10,
    memory_manager: MemoryManager = Depends(get_memory_manager)
):
    """
    Get memories for a specific user
    """
    try:
        if user_id not in memory_manager.memory_store:
            return {"memories": []}
            
        if category:
            if category not in memory_manager.memory_store[user_id]:
                raise HTTPException(status_code=404, detail=f"Category {category} not found")
                
            memories = memory_manager.memory_store[user_id][category][:limit]
            return {"memories": [memory.to_dict() for memory in memories]}
        else:
            # Return memories from all categories
            all_memories = []
            for cat in memory_manager.memory_store[user_id]:
                all_memories.extend(memory_manager.memory_store[user_id][cat])
            
            # Sort by timestamp (newest first) and limit
            sorted_memories = sorted(
                all_memories, 
                key=lambda x: x.timestamp, 
                reverse=True
            )[:limit]
            
            return {"memories": [memory.to_dict() for memory in sorted_memories]}
    except Exception as e:
        logger.error(f"Error retrieving memories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
