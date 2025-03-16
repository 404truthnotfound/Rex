/**
 * REX: Advanced AI Memory Enhancement System
 * Content script - runs on AI platform pages
 */

// Platform-specific selectors for DOM elements
const PLATFORM_SELECTORS = {
  CLAUDE: {
    inputSelector: 'div[contenteditable="true"]',
    conversationSelector: '.claude-container',
    messageSelector: '.message',
    userMessageSelector: '.message.user',
    aiMessageSelector: '.message.assistant',
    submitButtonSelector: 'button[type="submit"]'
  },
  CHATGPT: {
    inputSelector: 'textarea[data-id="root"]',
    conversationSelector: '.flex.flex-col.items-center.text-sm',
    messageSelector: '.group.w-full',
    userMessageSelector: '.group.w-full.text-token-text-primary',
    aiMessageSelector: '.markdown',
    submitButtonSelector: 'button.absolute.p-1'
  },
  GEMINI: {
    inputSelector: 'textarea[aria-label="Input"]',
    conversationSelector: '.conversation-container',
    messageSelector: '.message',
    userMessageSelector: '.user-message',
    aiMessageSelector: '.model-response',
    submitButtonSelector: 'button[aria-label="Send message"]'
  }
};

// State
let state = {
  platform: null,
  isEnabled: true,
  inputElement: null,
  pendingContextInjection: null,
  userId: null,
  sessionId: null
};

/**
 * Initialize the content script
 */
function init() {
  console.log('REX: Content script initialized');
  
  // Get or generate user ID and session ID
  initializeIds();
  
  // Detect platform
  detectPlatform();
  
  // Set up listeners
  setupListeners();
  
  // Set up input monitoring
  setupInputMonitoring();
}

/**
 * Initialize user and session IDs
 */
function initializeIds() {
  chrome.storage.local.get(['userId'], (result) => {
    if (result.userId) {
      state.userId = result.userId;
    } else {
      // Generate a new user ID
      state.userId = 'user_' + Math.random().toString(36).substring(2, 15);
      chrome.storage.local.set({ userId: state.userId });
    }
    
    // Always generate a new session ID for each page load
    state.sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
  });
}

/**
 * Detect which AI platform we're on
 */
function detectPlatform() {
  chrome.runtime.sendMessage({ type: 'DETECT_PLATFORM' }, (response) => {
    if (response && response.platform) {
      state.platform = response.platform;
      console.log(`REX: Detected platform - ${state.platform}`);
      
      // Find input element
      findInputElement();
    }
  });
}

/**
 * Find the input element based on platform
 */
function findInputElement() {
  if (!state.platform || !PLATFORM_SELECTORS[state.platform]) {
    return;
  }
  
  const selector = PLATFORM_SELECTORS[state.platform].inputSelector;
  state.inputElement = document.querySelector(selector);
  
  if (!state.inputElement) {
    // Input element not found, try again later
    setTimeout(findInputElement, 1000);
  } else {
    console.log('REX: Input element found');
  }
}

/**
 * Set up event listeners
 */
function setupListeners() {
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('REX: Content script received message', message);
    
    if (message.type === 'PLATFORM_DETECTED') {
      state.platform = message.platform;
      findInputElement();
      sendResponse({ success: true });
    }
    else if (message.type === 'EXTRACT_CONVERSATION') {
      extractConversation().then(conversation => {
        if (conversation) {
          chrome.runtime.sendMessage({
            type: 'STORE_CONVERSATION',
            conversation
          });
        }
      });
      sendResponse({ success: true });
    }
    else if (message.type === 'INJECT_CONTEXT') {
      injectContext(message.context, message.topic, message.triggerType);
      sendResponse({ success: true });
    }
    
    return true; // Keep the message channel open for async response
  });
}

/**
 * Set up monitoring of input element for activation triggers
 */
function setupInputMonitoring() {
  // Use MutationObserver to detect when input element is added to the DOM
  const observer = new MutationObserver((mutations) => {
    if (!state.inputElement) {
      findInputElement();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Monitor input events on the document to catch all input
  document.addEventListener('input', (event) => {
    if (!state.inputElement || !state.isEnabled) {
      return;
    }
    
    // Check if the event target is our input element
    if (event.target === state.inputElement) {
      checkForActivationTrigger(event.target.value || event.target.textContent);
    }
  });
}

/**
 * Check if text contains an activation trigger
 * @param {string} text - Text to check for triggers
 */
function checkForActivationTrigger(text) {
  if (!text) {
    return;
  }
  
  const triggers = [
    { pattern: /REX,\s+recall\s+(.+)/i, type: 'recall' },
    { pattern: /REX,\s+remember\s+our\s+discussion\s+about\s+(.+)/i, type: 'remember_discussion' },
    { pattern: /REX,\s+what\s+did\s+we\s+say\s+about\s+(.+)/i, type: 'what_did_we_say' },
    { pattern: /REX,\s+update\s+on\s+(.+)/i, type: 'project_update' }
  ];
  
  for (const trigger of triggers) {
    if (trigger.pattern.test(text)) {
      // Activation trigger detected
      chrome.runtime.sendMessage({
        type: 'ACTIVATION_DETECTED',
        trigger: trigger.type,
        text: text,
        userId: state.userId,
        sessionId: state.sessionId
      });
      break;
    }
  }
}

/**
 * Extract the current conversation
 * @returns {Promise<object>} - Conversation object
 */
async function extractConversation() {
  if (!state.platform || !PLATFORM_SELECTORS[state.platform]) {
    console.error('REX: Cannot extract conversation - platform not detected');
    return null;
  }
  
  const selectors = PLATFORM_SELECTORS[state.platform];
  const conversationElement = document.querySelector(selectors.conversationSelector);
  
  if (!conversationElement) {
    console.error('REX: Cannot extract conversation - conversation element not found');
    return null;
  }
  
  // Extract all messages
  const messageElements = conversationElement.querySelectorAll(selectors.messageSelector);
  const messages = [];
  
  for (const element of messageElements) {
    const isUser = element.matches(selectors.userMessageSelector);
    const role = isUser ? 'user' : 'assistant';
    const content = element.textContent.trim();
    
    if (content) {
      messages.push({
        role,
        content
      });
    }
  }
  
  if (messages.length === 0) {
    console.log('REX: No messages found in conversation');
    return null;
  }
  
  // Generate full text for analysis
  const fullText = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
  
  // Generate a title
  const title = await generateTitle(fullText);
  
  // Extract conversation ID from URL if possible
  const platformId = extractPlatformSpecificId();
  
  // Create conversation object
  const conversation = {
    id: platformId || generateId(),
    platform: state.platform,
    title,
    timestamp: new Date().toISOString(),
    messages,
    fullText,
    url: window.location.href,
    userId: state.userId,
    sessionId: state.sessionId
  };
  
  // Send conversation to API for processing
  try {
    await RexAPI.processConversation(
      state.userId,
      state.sessionId,
      '', // No user input for this call
      messages
    );
    console.log('REX: Conversation sent to API');
  } catch (error) {
    console.error('REX: Error sending conversation to API', error);
  }
  
  return conversation;
}

/**
 * Generate a title for the conversation
 * @param {string} fullText - Full conversation text
 * @returns {string} - Generated title
 */
async function generateTitle(fullText) {
  // Simple title generation - use first few words of first message
  const firstMessage = fullText.split('\n\n')[0];
  if (!firstMessage) {
    return 'Untitled Conversation';
  }
  
  // Remove "User: " prefix
  const content = firstMessage.replace(/^User:\s+/, '');
  
  // Take first 5-7 words
  const words = content.split(' ');
  const titleWords = words.slice(0, Math.min(words.length, 6));
  let title = titleWords.join(' ');
  
  // Add ellipsis if truncated
  if (words.length > 6) {
    title += '...';
  }
  
  return title;
}

/**
 * Generate a unique ID for the conversation
 * @returns {string} - Unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Extract platform-specific ID from URL
 * @returns {string} - Platform-specific ID or empty string
 */
function extractPlatformSpecificId() {
  const url = window.location.href;
  
  // Extract based on platform
  if (state.platform === 'CLAUDE') {
    const match = url.match(/conversation\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : '';
  }
  else if (state.platform === 'CHATGPT') {
    const match = url.match(/c\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : '';
  }
  else if (state.platform === 'GEMINI') {
    const match = url.match(/([a-zA-Z0-9-]+)$/);
    return match ? match[1] : '';
  }
  
  return '';
}

/**
 * Inject context into the conversation
 * @param {object} context - Context to inject
 * @param {string} topic - Topic that triggered the context
 * @param {string} triggerType - Type of trigger
 */
function injectContext(context, topic, triggerType) {
  if (!state.inputElement || !context) {
    console.error('REX: Cannot inject context - input element not found or context is empty');
    return;
  }
  
  // Get current input value
  const currentInput = state.inputElement.value || state.inputElement.textContent || '';
  
  // Create context prefix
  let contextPrefix = '';
  
  switch (triggerType) {
    case 'recall':
      contextPrefix = `Here's what I know about ${topic}:\n\n${context.text}\n\n`;
      break;
    case 'remember_discussion':
      contextPrefix = `Regarding our discussion about ${topic}:\n\n${context.text}\n\n`;
      break;
    case 'what_did_we_say':
      contextPrefix = `Here's what we said about ${topic}:\n\n${context.text}\n\n`;
      break;
    case 'project_update':
      contextPrefix = `Update on ${topic}:\n\n${context.text}\n\n`;
      break;
    default:
      contextPrefix = `Context about ${topic}:\n\n${context.text}\n\n`;
  }
  
  // Replace the trigger phrase with the context
  const triggerPatterns = [
    new RegExp(`REX,\\s+recall\\s+${escapeRegExp(topic)}`, 'i'),
    new RegExp(`REX,\\s+remember\\s+our\\s+discussion\\s+about\\s+${escapeRegExp(topic)}`, 'i'),
    new RegExp(`REX,\\s+what\\s+did\\s+we\\s+say\\s+about\\s+${escapeRegExp(topic)}`, 'i'),
    new RegExp(`REX,\\s+update\\s+on\\s+${escapeRegExp(topic)}`, 'i')
  ];
  
  let newInput = currentInput;
  for (const pattern of triggerPatterns) {
    if (pattern.test(newInput)) {
      newInput = newInput.replace(pattern, contextPrefix);
      break;
    }
  }
  
  // Set the new input value
  if (state.inputElement.tagName.toLowerCase() === 'textarea') {
    state.inputElement.value = newInput;
  } else {
    state.inputElement.textContent = newInput;
  }
  
  // Dispatch input event to trigger any listeners
  const inputEvent = new Event('input', { bubbles: true });
  state.inputElement.dispatchEvent(inputEvent);
}

/**
 * Escape special characters in string for use in RegExp
 * @param {string} string - String to escape
 * @returns {string} - Escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Initialize when the page is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export functions for testing
if (typeof module !== 'undefined') {
  module.exports = {
    checkForActivationTrigger,
    extractConversation,
    injectContext
  };
}
