/**
 * REX: Advanced AI Memory Enhancement System
 * API communication utilities
 */

// Import configuration
const API_ENDPOINT = REX_CONFIG.apiEndpoint;

/**
 * API utilities for communicating with the REX backend
 */
const RexAPI = {
  /**
   * Process a conversation with context awareness
   * @param {string} userId - User identifier
   * @param {string} sessionId - Session identifier
   * @param {string} userInput - User input text
   * @param {Array} conversationHistory - Conversation history
   * @returns {Promise<object>} - Response from the API
   */
  async processConversation(userId, sessionId, userInput, conversationHistory = []) {
    try {
      const response = await fetch(`${API_ENDPOINT}/api/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          user_input: userInput,
          conversation_history: conversationHistory
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('REX API Error:', error);
      return { error: error.message };
    }
  },
  
  /**
   * Trigger memory recall
   * @param {string} userId - User identifier
   * @param {string} triggerPhrase - Trigger phrase
   * @param {object} context - Additional context
   * @returns {Promise<object>} - Response from the API
   */
  async triggerMemory(userId, triggerPhrase, context = {}) {
    try {
      const response = await fetch(`${API_ENDPOINT}/api/memory/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          trigger_phrase: triggerPhrase,
          context
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('REX API Error:', error);
      return { error: error.message };
    }
  },
  
  /**
   * Get user memories
   * @param {string} userId - User identifier
   * @param {string} category - Optional category filter
   * @param {number} limit - Maximum number of memories to retrieve
   * @returns {Promise<object>} - Response from the API
   */
  async getUserMemories(userId, category = null, limit = 10) {
    try {
      let url = `${API_ENDPOINT}/api/memory/${userId}`;
      
      // Add query parameters if provided
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (limit) params.append('limit', limit.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('REX API Error:', error);
      return { error: error.message };
    }
  },
  
  /**
   * Get available memory categories
   * @returns {Promise<object>} - Response from the API
   */
  async getMemoryCategories() {
    try {
      const response = await fetch(`${API_ENDPOINT}/api/memory/categories`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('REX API Error:', error);
      return { error: error.message };
    }
  }
};

// Make API available globally
window.RexAPI = RexAPI;
