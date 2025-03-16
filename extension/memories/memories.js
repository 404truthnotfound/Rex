/**
 * REX: Advanced AI Memory Enhancement System
 * Memories page script - handles displaying and managing stored memories
 */

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const platformFilter = document.getElementById('platform-filter');
const categoryFilter = document.getElementById('category-filter');
const sortBy = document.getElementById('sort-by');
const totalCount = document.getElementById('total-count');
const topicsCount = document.getElementById('topics-count');
const peopleCount = document.getElementById('people-count');
const thingsCount = document.getElementById('things-count');
const projectsCount = document.getElementById('projects-count');
const memoriesList = document.getElementById('memories-list');
const memoryDetails = document.getElementById('memory-details');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const backBtn = document.getElementById('back-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const deleteConfirmation = document.getElementById('delete-confirmation');
const cancelDelete = document.getElementById('cancel-delete');
const confirmDelete = document.getElementById('confirm-delete');

// State
let state = {
  conversations: [],
  filteredConversations: [],
  selectedConversation: null,
  pendingDeleteId: null,
  searchQuery: '',
  platformFilter: 'all',
  categoryFilter: 'all',
  sortOrder: 'date-desc'
};

/**
 * Initialize the memories page
 */
function init() {
  console.log('REX: Initializing memories page');
  
  // Load conversations from storage
  loadConversations();
  
  // Set up event listeners
  setupEventListeners();
}

/**
 * Load conversations from storage
 */
function loadConversations() {
  chrome.storage.local.get(['conversations'], (result) => {
    if (result.conversations) {
      state.conversations = result.conversations;
      state.filteredConversations = [...state.conversations];
      
      // Apply current filters and sort
      applyFilters();
      
      // Update stats
      updateStats();
    } else {
      showEmptyState();
    }
  });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Search
  searchInput.addEventListener('input', () => {
    state.searchQuery = searchInput.value.trim().toLowerCase();
    applyFilters();
  });
  
  searchBtn.addEventListener('click', () => {
    state.searchQuery = searchInput.value.trim().toLowerCase();
    applyFilters();
  });
  
  // Filters
  platformFilter.addEventListener('change', () => {
    state.platformFilter = platformFilter.value;
    applyFilters();
  });
  
  categoryFilter.addEventListener('change', () => {
    state.categoryFilter = categoryFilter.value;
    applyFilters();
  });
  
  sortBy.addEventListener('change', () => {
    state.sortOrder = sortBy.value;
    applyFilters();
  });
  
  // Export button
  exportBtn.addEventListener('click', exportMemories);
  
  // Import button
  importBtn.addEventListener('click', () => {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    // Handle file selection
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        importMemories(file);
      }
    });
    
    // Trigger file selection dialog
    fileInput.click();
  });
  
  // Back button
  backBtn.addEventListener('click', () => {
    // Close the memories page and return to popup
    window.close();
  });
  
  // Clear all button
  clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all memories? This action cannot be undone.')) {
      clearAllMemories();
    }
  });
  
  // Delete confirmation
  cancelDelete.addEventListener('click', () => {
    deleteConfirmation.classList.remove('show');
    state.pendingDeleteId = null;
  });
  
  confirmDelete.addEventListener('click', () => {
    if (state.pendingDeleteId) {
      deleteMemory(state.pendingDeleteId);
      deleteConfirmation.classList.remove('show');
      state.pendingDeleteId = null;
    }
  });
}

/**
 * Apply filters and sort to conversations
 */
function applyFilters() {
  // Start with all conversations
  let filtered = [...state.conversations];
  
  // Apply search query
  if (state.searchQuery) {
    filtered = filtered.filter(conversation => {
      // Search in title and full text
      if (conversation.title.toLowerCase().includes(state.searchQuery) ||
          conversation.full_text.toLowerCase().includes(state.searchQuery)) {
        return true;
      }
      
      // Search in summary categories
      const summary = conversation.summary;
      if (summary) {
        // Check topics
        if (summary.topics && summary.topics.some(topic => 
          topic.toLowerCase().includes(state.searchQuery))) {
          return true;
        }
        
        // Check people
        if (summary.people && summary.people.some(person => 
          person.toLowerCase().includes(state.searchQuery))) {
          return true;
        }
        
        // Check things
        if (summary.things && summary.things.some(thing => 
          thing.toLowerCase().includes(state.searchQuery))) {
          return true;
        }
        
        // Check projects
        if (summary.projects && summary.projects.some(project => 
          project.toLowerCase().includes(state.searchQuery))) {
          return true;
        }
      }
      
      return false;
    });
  }
  
  // Apply platform filter
  if (state.platformFilter !== 'all') {
    filtered = filtered.filter(conversation => 
      conversation.platform === state.platformFilter);
  }
  
  // Apply category filter
  if (state.categoryFilter !== 'all') {
    filtered = filtered.filter(conversation => {
      const summary = conversation.summary;
      if (!summary) return false;
      
      switch (state.categoryFilter) {
        case 'topics':
          return summary.topics && summary.topics.length > 0;
        case 'people':
          return summary.people && summary.people.length > 0;
        case 'things':
          return summary.things && summary.things.length > 0;
        case 'projects':
          return summary.projects && summary.projects.length > 0;
        default:
          return true;
      }
    });
  }
  
  // Apply sort
  filtered.sort((a, b) => {
    switch (state.sortOrder) {
      case 'date-desc':
        return new Date(b.timestamp) - new Date(a.timestamp);
      case 'date-asc':
        return new Date(a.timestamp) - new Date(b.timestamp);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
  
  // Update state and render
  state.filteredConversations = filtered;
  renderMemoriesList();
}

/**
 * Render the memories list
 */
function renderMemoriesList() {
  // Clear the list
  memoriesList.innerHTML = '';
  
  if (state.filteredConversations.length === 0) {
    // Show empty state
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = '<p>No memories found matching your filters.</p>';
    memoriesList.appendChild(emptyState);
    return;
  }
  
  // Render each conversation
  state.filteredConversations.forEach(conversation => {
    const memoryItem = document.createElement('div');
    memoryItem.className = 'memory-item';
    if (state.selectedConversation && state.selectedConversation.id === conversation.id) {
      memoryItem.classList.add('active');
    }
    
    const date = new Date(conversation.timestamp);
    
    memoryItem.innerHTML = `
      <div class="memory-title">${conversation.title}</div>
      <div class="memory-meta">
        <span class="memory-date">${formatDate(date)}</span>
        <span class="memory-platform ${conversation.platform}">${getPlatformName(conversation.platform)}</span>
      </div>
    `;
    
    // Add click event to show details
    memoryItem.addEventListener('click', () => {
      selectConversation(conversation);
    });
    
    memoriesList.appendChild(memoryItem);
  });
}

/**
 * Select a conversation to show details
 * @param {object} conversation - The conversation to select
 */
function selectConversation(conversation) {
  state.selectedConversation = conversation;
  
  // Update active class in list
  const items = memoriesList.querySelectorAll('.memory-item');
  items.forEach(item => {
    item.classList.remove('active');
    if (item.querySelector('.memory-title').textContent === conversation.title) {
      item.classList.add('active');
    }
  });
  
  // Render details
  renderConversationDetails(conversation);
}

/**
 * Render conversation details
 * @param {object} conversation - The conversation to render
 */
function renderConversationDetails(conversation) {
  const date = new Date(conversation.timestamp);
  
  // Create details HTML
  let detailsHtml = `
    <div class="memory-header">
      <h2>${conversation.title}</h2>
      <div class="memory-info">
        <span>Platform: ${getPlatformName(conversation.platform)}</span>
        <span>Date: ${date.toLocaleString()}</span>
      </div>
      <div class="memory-actions">
        <button id="copy-btn" class="secondary-btn">
          <span class="icon">📋</span> Copy
        </button>
        <button id="delete-btn" class="danger-btn">
          <span class="icon">🗑️</span> Delete
        </button>
      </div>
    </div>
  `;
  
  // Add summary section if available
  if (conversation.summary) {
    detailsHtml += `<div class="memory-summary">`;
    
    // Topics
    if (conversation.summary.topics && conversation.summary.topics.length > 0) {
      detailsHtml += `
        <div class="summary-category">
          <h4>Topics</h4>
          <div class="summary-items">
            ${conversation.summary.topics.map(topic => 
              `<span class="summary-item">${topic}</span>`).join('')}
          </div>
        </div>
      `;
    }
    
    // People
    if (conversation.summary.people && conversation.summary.people.length > 0) {
      detailsHtml += `
        <div class="summary-category">
          <h4>People</h4>
          <div class="summary-items">
            ${conversation.summary.people.map(person => 
              `<span class="summary-item">${person}</span>`).join('')}
          </div>
        </div>
      `;
    }
    
    // Things
    if (conversation.summary.things && conversation.summary.things.length > 0) {
      detailsHtml += `
        <div class="summary-category">
          <h4>Things</h4>
          <div class="summary-items">
            ${conversation.summary.things.map(thing => 
              `<span class="summary-item">${thing}</span>`).join('')}
          </div>
        </div>
      `;
    }
    
    // Projects
    if (conversation.summary.projects && conversation.summary.projects.length > 0) {
      detailsHtml += `
        <div class="summary-category">
          <h4>Projects</h4>
          <div class="summary-items">
            ${conversation.summary.projects.map(project => 
              `<span class="summary-item">${project}</span>`).join('')}
          </div>
        </div>
      `;
    }
    
    detailsHtml += `</div>`;
  }
  
  // Add full text
  detailsHtml += `
    <div class="memory-content">
      <h3>Full Conversation</h3>
      <div class="memory-full-text">${conversation.full_text}</div>
    </div>
  `;
  
  // Set the HTML
  memoryDetails.innerHTML = detailsHtml;
  
  // Add event listeners for buttons
  const copyBtn = memoryDetails.querySelector('#copy-btn');
  const deleteBtn = memoryDetails.querySelector('#delete-btn');
  
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(conversation.full_text)
      .then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = '<span class="icon">📋</span> Copy';
        }, 2000);
      });
  });
  
  deleteBtn.addEventListener('click', () => {
    // Show delete confirmation
    state.pendingDeleteId = conversation.id;
    deleteConfirmation.classList.add('show');
  });
}

/**
 * Update statistics
 */
function updateStats() {
  // Total count
  totalCount.textContent = state.conversations.length;
  
  // Category counts
  let topics = 0;
  let people = 0;
  let things = 0;
  let projects = 0;
  
  state.conversations.forEach(conversation => {
    if (conversation.summary) {
      if (conversation.summary.topics) {
        topics += conversation.summary.topics.length;
      }
      if (conversation.summary.people) {
        people += conversation.summary.people.length;
      }
      if (conversation.summary.things) {
        things += conversation.summary.things.length;
      }
      if (conversation.summary.projects) {
        projects += conversation.summary.projects.length;
      }
    }
  });
  
  topicsCount.textContent = topics;
  peopleCount.textContent = people;
  thingsCount.textContent = things;
  projectsCount.textContent = projects;
}

/**
 * Show empty state
 */
function showEmptyState() {
  memoriesList.innerHTML = `
    <div class="empty-state">
      <p>No memories found. Try updating your summaries from the popup.</p>
    </div>
  `;
  
  memoryDetails.innerHTML = `
    <div class="empty-state">
      <p>Select a memory to view details</p>
    </div>
  `;
  
  // Update stats
  totalCount.textContent = '0';
  topicsCount.textContent = '0';
  peopleCount.textContent = '0';
  thingsCount.textContent = '0';
  projectsCount.textContent = '0';
}

/**
 * Export memories to a JSON file
 */
function exportMemories() {
  const data = JSON.stringify({
    conversations: state.conversations,
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  }, null, 2);
  
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `rex-memories-${formatDateForFilename(new Date())}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Import memories from a JSON file
 * @param {File} file - The JSON file to import
 */
function importMemories(file) {
  const reader = new FileReader();
  
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      
      if (!data.conversations || !Array.isArray(data.conversations)) {
        alert('Invalid file format. Could not import memories.');
        return;
      }
      
      // Merge with existing conversations
      chrome.storage.local.get(['conversations'], (result) => {
        let existingConversations = result.conversations || [];
        
        // Check for duplicates
        const newConversations = data.conversations.filter(imported => {
          return !existingConversations.some(existing => existing.id === imported.id);
        });
        
        // Combine arrays
        const mergedConversations = [...existingConversations, ...newConversations];
        
        // Update storage
        chrome.storage.local.set({ conversations: mergedConversations }, () => {
          alert(`Successfully imported ${newConversations.length} new memories.`);
          
          // Reload conversations
          state.conversations = mergedConversations;
          state.filteredConversations = [...mergedConversations];
          
          // Apply current filters and sort
          applyFilters();
          
          // Update stats
          updateStats();
        });
      });
    } catch (error) {
      console.error('Import error:', error);
      alert('Error importing memories. Please check the file format.');
    }
  };
  
  reader.readAsText(file);
}

/**
 * Delete a memory
 * @param {string} id - ID of the memory to delete
 */
function deleteMemory(id) {
  // Filter out the memory to delete
  const updatedConversations = state.conversations.filter(
    conversation => conversation.id !== id
  );
  
  // Update storage
  chrome.storage.local.set({ conversations: updatedConversations }, () => {
    // Update state
    state.conversations = updatedConversations;
    state.filteredConversations = state.filteredConversations.filter(
      conversation => conversation.id !== id
    );
    
    // Clear selected conversation if it was deleted
    if (state.selectedConversation && state.selectedConversation.id === id) {
      state.selectedConversation = null;
      memoryDetails.innerHTML = `
        <div class="empty-state">
          <p>Select a memory to view details</p>
        </div>
      `;
    }
    
    // Re-render list
    renderMemoriesList();
    
    // Update stats
    updateStats();
  });
}

/**
 * Clear all memories
 */
function clearAllMemories() {
  // Clear storage
  chrome.storage.local.set({ conversations: [] }, () => {
    // Update state
    state.conversations = [];
    state.filteredConversations = [];
    state.selectedConversation = null;
    
    // Show empty state
    showEmptyState();
  });
}

/**
 * Get platform display name
 * @param {string} platformKey - Platform key
 * @returns {string} - Platform display name
 */
function getPlatformName(platformKey) {
  switch (platformKey) {
    case 'CLAUDE':
      return 'Claude';
    case 'CHATGPT':
      return 'ChatGPT';
    case 'GEMINI':
      return 'Gemini';
    default:
      return platformKey;
  }
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
  
  // If less than a week, show day of week
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }
  
  // Otherwise, show date
  return date.toLocaleDateString();
}

/**
 * Format date for filename
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string for filename
 */
function formatDateForFilename(date) {
  return date.toISOString().split('T')[0];
}

// Initialize when the page is loaded
document.addEventListener('DOMContentLoaded', init);
