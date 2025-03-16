/**
 * REX: Advanced AI Memory Enhancement System
 * Background script - handles core extension functionality
 */

// Import configuration and API utilities
importScripts('../config.js', '../api.js');

// Constants
const PLATFORMS = {
  CLAUDE: {
    urlPattern: /anthropic\.com|claude\.ai/,
    name: 'Claude'
  },
  CHATGPT: {
    urlPattern: /chat\.openai\.com/,
    name: 'ChatGPT'
  },
  GEMINI: {
    urlPattern: /gemini\.google\.com/,
    name: 'Gemini'
  }
};

const ACTIVATION_TRIGGERS = [
  {
    pattern: /REX,\s+recall\s+(.+)/i,
    type: 'recall',
    extractTopic: (match) => match[1].trim()
  },
  {
    pattern: /REX,\s+remember\s+our\s+discussion\s+about\s+(.+)/i,
    type: 'remember_discussion',
    extractTopic: (match) => match[1].trim()
  },
  {
    pattern: /REX,\s+what\s+did\s+we\s+say\s+about\s+(.+)/i,
    type: 'what_did_we_say',
    extractTopic: (match) => match[1].trim()
  },
  {
    pattern: /REX,\s+update\s+on\s+(.+)/i,
    type: 'project_update',
    extractTopic: (match) => match[1].trim()
  }
];

// State
let state = {
  isEnabled: true,
  lastUpdateTimestamp: null,
  activeTabId: null,
  activePlatform: null
};

/**
 * Initialize the extension
 */
function init() {
  console.log('REX: Initializing background script');
  
  // Load state from storage
  chrome.storage.local.get(['rexState'], (result) => {
    if (result.rexState) {
      state = { ...state, ...result.rexState };
    }
    console.log('REX: State loaded', state);
  });
  
  // Set up listeners
  setupListeners();
}

/**
 * Set up event listeners
 */
function setupListeners() {
  // Listen for messages from content scripts
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('REX: Received message', message);
    
    if (message.type === 'DETECT_PLATFORM') {
      const platform = detectPlatform(sender.tab.url);
      sendResponse({ platform });
    }
    else if (message.type === 'ACTIVATION_DETECTED') {
      handleActivationTrigger(message.trigger, message.text, sender.tab.id);
      sendResponse({ success: true });
    }
    else if (message.type === 'EXTRACT_CONVERSATION') {
      // This will be handled by the content script
      sendResponse({ success: true });
    }
    else if (message.type === 'STORE_CONVERSATION') {
      storeConversation(message.conversation);
      sendResponse({ success: true });
    }
    
    return true; // Keep the message channel open for async response
  });
  
  // Listen for tab updates to detect active AI platforms
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
      const platform = detectPlatform(tab.url);
      if (platform) {
        state.activeTabId = tabId;
        state.activePlatform = platform;
        
        // Notify content script that we're on a supported platform
        chrome.tabs.sendMessage(tabId, { 
          type: 'PLATFORM_DETECTED',
          platform 
        });
      }
    }
  });
  
  // Listen for tab activation
  chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      const platform = detectPlatform(tab.url);
      if (platform) {
        state.activeTabId = activeInfo.tabId;
        state.activePlatform = platform;
      }
    });
  });
}

/**
 * Detect which AI platform is being used based on URL
 * @param {string} url - The URL to check
 * @returns {string|null} - Platform name or null if not recognized
 */
function detectPlatform(url) {
  for (const [key, platform] of Object.entries(PLATFORMS)) {
    if (platform.urlPattern.test(url)) {
      return key;
    }
  }
  return null;
}

/**
 * Handle activation trigger detected in user input
 * @param {string} triggerType - Type of trigger detected
 * @param {string} text - Full text of the user input
 * @param {number} tabId - ID of the tab where trigger was detected
 */
async function handleActivationTrigger(triggerType, text, tabId) {
  console.log(`REX: Activation trigger detected - ${triggerType}`);
  
  // Extract topic from the trigger text
  let topic = '';
  for (const trigger of ACTIVATION_TRIGGERS) {
    if (trigger.type === triggerType) {
      const match = text.match(trigger.pattern);
      if (match) {
        topic = trigger.extractTopic(match);
        break;
      }
    }
  }
  
  if (!topic) {
    console.error('REX: Could not extract topic from trigger');
    return;
  }
  
  // Generate a unique user ID (in a real app, this would be persistent)
  const userId = await getUserId();
  
  // Call the API to trigger memory recall
  const apiResponse = await RexAPI.triggerMemory(userId, text, {
    triggerType,
    topic,
    platform: state.activePlatform
  });
  
  if (apiResponse.error) {
    console.error('REX: API error when triggering memory', apiResponse.error);
    // Fall back to local storage if API fails
    const context = await retrieveContext(topic, triggerType);
    
    if (!context) {
      console.log('REX: No relevant context found for topic', topic);
      return;
    }
    
    // Send context to content script for injection
    chrome.tabs.sendMessage(tabId, {
      type: 'INJECT_CONTEXT',
      context,
      topic,
      triggerType
    });
    return;
  }
  
  // Send recalled memory to content script for injection
  chrome.tabs.sendMessage(tabId, {
    type: 'INJECT_CONTEXT',
    context: apiResponse.recalled_memory,
    topic,
    triggerType
  });
}

/**
 * Retrieve relevant context based on topic and trigger type
 * @param {string} topic - The topic to search for
 * @param {string} triggerType - Type of trigger (recall, remember_discussion, etc.)
 * @returns {object|null} - Context object or null if none found
 */
async function retrieveContext(topic, triggerType) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['conversations'], (result) => {
      if (!result.conversations || result.conversations.length === 0) {
        resolve(null);
        return;
      }
      
      // Search for relevant conversations
      const relevantConversations = result.conversations.filter(conversation => {
        // Check if topic appears in full text
        if (conversation.full_text.toLowerCase().includes(topic.toLowerCase())) {
          return true;
        }
        
        // Check if topic appears in summary categories
        const summary = conversation.summary;
        if (summary) {
          // Check topics
          if (summary.topics && summary.topics.some(t => 
            t.toLowerCase().includes(topic.toLowerCase()))) {
            return true;
          }
          
          // Check people
          if (summary.people && summary.people.some(p => 
            p.toLowerCase().includes(topic.toLowerCase()))) {
            return true;
          }
          
          // Check things
          if (summary.things && summary.things.some(t => 
            t.toLowerCase().includes(topic.toLowerCase()))) {
            return true;
          }
          
          // Check projects
          if (summary.projects && summary.projects.some(p => 
            p.toLowerCase().includes(topic.toLowerCase()))) {
            return true;
          }
        }
        
        return false;
      });
      
      if (relevantConversations.length === 0) {
        resolve(null);
        return;
      }
      
      // Sort by relevance and recency
      // For now, just sort by timestamp (most recent first)
      relevantConversations.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      // Take the most relevant conversation
      const mostRelevant = relevantConversations[0];
      
      // Extract the most relevant section
      // In a real implementation, this would use more sophisticated text extraction
      const contextExtract = extractRelevantSection(mostRelevant.full_text, topic);
      
      resolve({
        text: contextExtract,
        source: mostRelevant.title,
        timestamp: mostRelevant.timestamp,
        platform: mostRelevant.platform
      });
    });
  });
}

/**
 * Extract the most relevant section of text containing the topic
 * @param {string} fullText - The full conversation text
 * @param {string} topic - The topic to search for
 * @returns {string} - Extracted relevant section
 */
function extractRelevantSection(fullText, topic) {
  // Simple implementation - find paragraph containing the topic
  const paragraphs = fullText.split('\n\n');
  
  for (const paragraph of paragraphs) {
    if (paragraph.toLowerCase().includes(topic.toLowerCase())) {
      return paragraph;
    }
  }
  
  // If no paragraph contains the topic, return a section around the first occurrence
  const topicIndex = fullText.toLowerCase().indexOf(topic.toLowerCase());
  if (topicIndex >= 0) {
    // Extract 500 characters before and after the topic
    const start = Math.max(0, topicIndex - 500);
    const end = Math.min(fullText.length, topicIndex + topic.length + 500);
    return fullText.substring(start, end);
  }
  
  // Fallback - return the first 1000 characters
  return fullText.substring(0, 1000);
}

/**
 * Store a conversation in local storage and send to API
 * @param {object} conversation - Conversation object to store
 */
async function storeConversation(conversation) {
  console.log('REX: Storing conversation', conversation);
  
  // Store locally
  chrome.storage.local.get(['conversations'], (result) => {
    const conversations = result.conversations || [];
    conversations.unshift(conversation);
    
    // Limit to 50 conversations to prevent storage issues
    const limitedConversations = conversations.slice(0, 50);
    
    chrome.storage.local.set({ 
      conversations: limitedConversations,
      lastUpdateTimestamp: Date.now()
    });
  });
  
  // Send to API
  const userId = await getUserId();
  
  try {
    // Process the conversation with the API
    await RexAPI.processConversation(
      userId,
      conversation.id,
      '', // No user input for this call
      conversation.messages
    );
    
    console.log('REX: Conversation sent to API');
  } catch (error) {
    console.error('REX: Error sending conversation to API', error);
  }
}

/**
 * Get or generate a user ID
 * @returns {string} - User ID
 */
async function getUserId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['userId'], (result) => {
      if (result.userId) {
        resolve(result.userId);
      } else {
        // Generate a new user ID
        const newUserId = 'user_' + Math.random().toString(36).substring(2, 15);
        chrome.storage.local.set({ userId: newUserId });
        resolve(newUserId);
      }
    });
  });
}

/**
 * Trigger conversation extraction for all open AI platform tabs
 */
function updateAllConversations() {
  chrome.tabs.query({}, (tabs) => {
    const aiPlatformTabs = tabs.filter(tab => detectPlatform(tab.url));
    
    aiPlatformTabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { 
        type: 'EXTRACT_CONVERSATION'
      });
    });
  });
}

// Initialize when the extension is loaded
init();

// Export functions for testing
if (typeof module !== 'undefined') {
  module.exports = {
    detectPlatform,
    handleActivationTrigger,
    retrieveContext,
    extractRelevantSection,
    storeConversation
  };
}
