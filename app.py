"""
REX: Enhanced Memory & Contextual Awareness System
Main application entry point
"""
import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging

from memory_system.memory_manager import MemoryManager
from conversation_manager.context_manager import ContextManager
from models.conversation import ConversationInput, ConversationResponse
from utils.config_loader import load_config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="REX",
    description="Enhanced Memory & Contextual Awareness System",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load configuration
config = load_config()

# Initialize core components
memory_manager = MemoryManager(config)
context_manager = ContextManager(memory_manager, config)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "REX API is running"}

@app.post("/conversation", response_model=ConversationResponse)
async def process_conversation(input_data: ConversationInput):
    """
    Process a conversation input and return a response with context awareness
    """
    try:
        # Log incoming request
        logger.info(f"Received conversation input: {input_data.user_input[:50]}...")
        
        # Process the conversation with context awareness
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

@app.post("/memory/trigger")
async def memory_trigger(user_id: str, trigger_phrase: str, context: Optional[Dict[str, Any]] = None):
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

if __name__ == "__main__":
    logger.info("Starting REX API")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
