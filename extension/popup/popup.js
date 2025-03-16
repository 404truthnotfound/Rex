/**
 * REX: AI Memory Enhancement System
 * Popup script - handles user interactions in the popup interface
 */

// DOM Elements
const enableToggle = document.getElementById('enable-toggle');
const statusIcon = document.getElementById('status-icon');
const statusText = document.getElementById('status-text');
const updateBtn = document.getElementById('update-btn');
const viewMemoriesBtn = document.getElementById('view-memories-btn');
const conversationCount = document.getElementById('conversation-count');
const lastUpdated = document.getElementById('last-updated');
const settingsBtn = document.getElementById('settings-btn');

// State
let state = {
  isEnabled: true,
  lastUpdateTimestamp: null,
  conversationCount: 0
};

/**
 * Initialize the popup
 */
function init() {
  console.log('REX: Initializing popup');
  
  // Load state from storage
  loadState();
  
  // Set up event listeners
  setupEventListeners();
}

/**
 * Load state from storage
 */
function loadState() {
  chrome.storage.local.get(['rexState', 'conversations'], (result) => {
    if (result.rexState) {
      state = { ...state, ...result.rexState };
    }
    
    // Update conversation count
    if (result.conversations) {
      state.conversationCount = result.conversations.length;
    }
    
    // Update UI based on state
    updateUI();
  });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Enable/disable toggle
  enableToggle.addEventListener('change', (event) => {
    state.isEnabled = event.target.checked;
    saveState();
    updateUI();
    
    // Notify background script of state change
    chrome.runtime.sendMessage({
      type: 'STATE_CHANGED',
      state: { isEnabled: state.isEnabled }
    });
  });
  
  // Update summaries button
  updateBtn.addEventListener('click', () => {
    updateBtn.disabled = true;
    updateBtn.textContent = 'Updating...';
    
    // Trigger conversation extraction in all AI platform tabs
    chrome.runtime.sendMessage({ type: 'UPDATE_ALL_CONVERSATIONS' }, (response) => {
      setTimeout(() => {
        updateBtn.disabled = false;
        updateBtn.innerHTML = '<span class="icon">↻</span> Update Summaries';
        
        // Refresh state after update
        loadState();
      }, 2000);
    });
  });
  
  // View memories button
  viewMemoriesBtn.addEventListener('click', () => {
    // Open memories page in a new tab
    chrome.tabs.create({ url: chrome.runtime.getURL('memories/memories.html') });
  });
  
  // Settings button
  settingsBtn.addEventListener('click', () => {
    // Open settings page in a new tab
    chrome.tabs.create({ url: chrome.runtime.getURL('settings/settings.html') });
  });
}

/**
 * Update UI based on state
 */
function updateUI() {
  // Update toggle
  enableToggle.checked = state.isEnabled;
  
  // Update status indicator
  if (state.isEnabled) {
    statusIcon.className = 'active';
    statusText.textContent = 'Active';
  } else {
    statusIcon.className = 'inactive';
    statusText.textContent = 'Inactive';
  }
  
  // Update conversation count
  conversationCount.textContent = state.conversationCount;
  
  // Update last updated timestamp
  if (state.lastUpdateTimestamp) {
    const date = new Date(state.lastUpdateTimestamp);
    lastUpdated.textContent = formatDate(date);
  } else {
    lastUpdated.textContent = 'Never';
  }
}

/**
 * Save state to storage
 */
function saveState() {
  chrome.storage.local.set({ rexState: state }, () => {
    console.log('REX: State saved');
  });
}

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  
  // If less than a day, show relative time
  if (diff < 24 * 60 * 60 * 1000) {
    if (diff < 60 * 1000) {
      return 'Just now';
    } else if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
  }
  
  // Otherwise, show date
  return date.toLocaleDateString();
}

// Initialize when the popup is loaded
document.addEventListener('DOMContentLoaded', init);
