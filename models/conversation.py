"""
Conversation models for REX
Defines the data structures for conversation input and output
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ConversationInput(BaseModel):
    """
    Input model for conversation processing
    """
    user_id: str = Field(..., description="Unique identifier for the user")
    session_id: str = Field(..., description="Identifier for the current conversation session")
    user_input: str = Field(..., description="The user's input text")
    conversation_history: Optional[List[Dict[str, Any]]] = Field(
        default=None, 
        description="Optional history of the conversation"
    )

class ConversationResponse(BaseModel):
    """
    Response model for conversation processing
    """
    ai_response: str = Field(..., description="The AI's response text")
    used_memories: List[str] = Field(
        default_factory=list,
        description="List of memory IDs used in generating the response"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata about the response"
    )
