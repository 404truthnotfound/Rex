/**
 * REX: Advanced AI Memory Enhancement System
 * Settings page script - handles user preferences
 */

// DOM Elements
const settingsForm = document.getElementById('settings-form');
const autoUpdate = document.getElementById('auto-update');
const maxConversations = document.getElementById('max-conversations');
const contextLength = document.getElementById('context-length');
const encryptData = document.getElementById('encrypt-data');
const encryptionPasswordContainer = document.getElementById('encryption-password-container');
const encryptionPassword = document.getElementById('encryption-password');
const togglePasswordVisibility = document.getElementById('toggle-password-visibility');
const autoDelete = document.getElementById('auto-delete');
const customTrigger = document.getElementById('custom-trigger');
const activationPhrasesContainer = document.getElementById('activation-phrases-container');
const addPhraseBtn = document.getElementById('add-phrase-btn');
const platformCheckboxes = document.querySelectorAll('input[name="platforms"]');
const injectionMethod = document.getElementById('injection-method');
const debugMode = document.getElementById('debug-mode');
const storageLocation = document.getElementById('storage-location');
const resetBtn = document.getElementById('reset-btn');
const saveBtn = document.getElementById('save-btn');
const backBtn = document.getElementById('back-btn');
const analyticsEnabled = document.getElementById('analyticsEnabled');
const shareCrashReports = document.getElementById('shareCrashReports');
const shareUsageStatistics = document.getElementById('shareUsageStatistics');

// Default settings
const defaultSettings = {
  general: {
    autoUpdate: false,
    maxConversations: 100,
    contextLength: 2000
  },
  privacy: {
    encryptData: false,
    encryptionPassword: '',
    autoDelete: 0 // 0 = never delete
  },
  activation: {
    customTrigger: 'REX',
    activationPhrases: [
      'recall [topic]',
      'remember our discussion about [topic]',
      'what did we say about [topic]',
      'update on [project]'
    ]
  },
  platforms: {
    enabled: ['CLAUDE', 'CHATGPT', 'GEMINI'],
    injectionMethod: 'prepend'
  },
  advanced: {
    debugMode: false,
    storageLocation: 'local'
  },
  analytics: {
    analyticsEnabled: false,
    shareCrashReports: false,
    shareUsageStatistics: false
  }
};

// Current settings
let currentSettings = { ...defaultSettings };

/**
 * Initialize the settings page
 */
function init() {
  console.log('REX: Initializing settings page');
  
  // Load settings from storage
  loadSettings();
  
  // Set up event listeners
  setupEventListeners();
  
  // Track settings page view
  if (window.RexAnalytics) {
    RexAnalytics.trackEvent('settings_page_viewed');
  }
}

/**
 * Load settings from storage
 */
function loadSettings() {
  // Determine storage location
  const storageArea = chrome.storage.local;
  
  storageArea.get(['rexSettings', 'analyticsSettings'], (result) => {
    if (result.rexSettings) {
      currentSettings = { ...defaultSettings, ...result.rexSettings };
    }
    
    if (result.analyticsSettings) {
      currentSettings.analytics = result.analyticsSettings;
    }
    
    // Update UI with loaded settings
    updateUI();
  });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Encrypt data toggle
  encryptData.addEventListener('change', (event) => {
    encryptionPasswordContainer.style.display = event.target.checked ? 'flex' : 'none';
  });
  
  // Toggle password visibility
  togglePasswordVisibility.addEventListener('click', () => {
    if (encryptionPassword.type === 'password') {
      encryptionPassword.type = 'text';
      togglePasswordVisibility.textContent = '🔒';
    } else {
      encryptionPassword.type = 'password';
      togglePasswordVisibility.textContent = '👁️';
    }
  });
  
  // Add activation phrase
  addPhraseBtn.addEventListener('click', () => {
    addActivationPhrase();
  });
  
  // Reset button
  resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      resetSettings();
    }
  });
  
  // Save button
  saveBtn.addEventListener('click', () => {
    saveSettings();
  });
  
  // Back button
  backBtn.addEventListener('click', () => {
    // Check if there are unsaved changes
    if (hasUnsavedChanges()) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        window.close();
      }
    } else {
      window.close();
    }
  });
  
  // Analytics settings
  analyticsEnabled.addEventListener('change', () => {
    if (analyticsEnabled.checked) {
      shareCrashReports.disabled = false;
      shareUsageStatistics.disabled = false;
    } else {
      shareCrashReports.disabled = true;
      shareUsageStatistics.disabled = true;
    }
  });
}

/**
 * Update UI with current settings
 */
function updateUI() {
  // General settings
  autoUpdate.checked = currentSettings.general.autoUpdate;
  maxConversations.value = currentSettings.general.maxConversations;
  contextLength.value = currentSettings.general.contextLength;
  
  // Privacy settings
  encryptData.checked = currentSettings.privacy.encryptData;
  encryptionPasswordContainer.style.display = currentSettings.privacy.encryptData ? 'flex' : 'none';
  encryptionPassword.value = currentSettings.privacy.encryptionPassword;
  autoDelete.value = currentSettings.privacy.autoDelete;
  
  // Activation settings
  customTrigger.value = currentSettings.activation.customTrigger;
  
  // Clear existing phrases
  activationPhrasesContainer.innerHTML = '';
  
  // Add phrases
  currentSettings.activation.activationPhrases.forEach(phrase => {
    addActivationPhrase(phrase);
  });
  
  // Platform settings
  platformCheckboxes.forEach(checkbox => {
    checkbox.checked = currentSettings.platforms.enabled.includes(checkbox.value);
  });
  
  injectionMethod.value = currentSettings.platforms.injectionMethod;
  
  // Advanced settings
  debugMode.checked = currentSettings.advanced.debugMode;
  storageLocation.value = currentSettings.advanced.storageLocation;
  
  // Analytics settings
  analyticsEnabled.checked = currentSettings.analytics.analyticsEnabled;
  shareCrashReports.checked = currentSettings.analytics.shareCrashReports;
  shareUsageStatistics.checked = currentSettings.analytics.shareUsageStatistics;
  
  if (!currentSettings.analytics.analyticsEnabled) {
    shareCrashReports.disabled = true;
    shareUsageStatistics.disabled = true;
  }
}

/**
 * Add activation phrase input
 * @param {string} phrase - Optional phrase to populate the input
 */
function addActivationPhrase(phrase = '') {
  const template = document.getElementById('phrase-template');
  const clone = document.importNode(template.content, true);
  
  const input = clone.querySelector('.phrase-input');
  input.value = phrase;
  
  const removeBtn = clone.querySelector('.remove-phrase-btn');
  removeBtn.addEventListener('click', (event) => {
    event.target.closest('.phrase-item').remove();
  });
  
  activationPhrasesContainer.appendChild(clone);
}

/**
 * Reset settings to defaults
 */
function resetSettings() {
  currentSettings = { ...defaultSettings };
  updateUI();
  saveSettings();
}

/**
 * Save settings to storage
 */
function saveSettings() {
  // Gather settings from UI
  const settings = {
    general: {
      autoUpdate: autoUpdate.checked,
      maxConversations: parseInt(maxConversations.value),
      contextLength: parseInt(contextLength.value)
    },
    privacy: {
      encryptData: encryptData.checked,
      encryptionPassword: encryptionPassword.value,
      autoDelete: parseInt(autoDelete.value)
    },
    activation: {
      customTrigger: customTrigger.value,
      activationPhrases: []
    },
    platforms: {
      enabled: [],
      injectionMethod: injectionMethod.value
    },
    advanced: {
      debugMode: debugMode.checked,
      storageLocation: storageLocation.value
    },
    analytics: {
      analyticsEnabled: analyticsEnabled.checked,
      shareCrashReports: shareCrashReports.checked,
      shareUsageStatistics: shareUsageStatistics.checked
    }
  };
  
  // Gather activation phrases
  const phraseInputs = document.querySelectorAll('.phrase-input');
  phraseInputs.forEach(input => {
    if (input.value.trim()) {
      settings.activation.activationPhrases.push(input.value.trim());
    }
  });
  
  // Gather enabled platforms
  platformCheckboxes.forEach(checkbox => {
    if (checkbox.checked) {
      settings.platforms.enabled.push(checkbox.value);
    }
  });
  
  // Validate settings
  if (!validateSettings(settings)) {
    return;
  }
  
  // Determine storage location
  const storageArea = settings.advanced.storageLocation === 'sync' ? chrome.storage.sync : chrome.storage.local;
  
  // Save settings
  storageArea.set({ rexSettings: settings }, () => {
    // Update current settings
    currentSettings = { ...settings };
    
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.textContent = 'Settings saved successfully!';
    
    document.body.appendChild(successMessage);
    
    // Remove message after 3 seconds
    setTimeout(() => {
      successMessage.remove();
    }, 3000);
    
    // Notify background script of settings change
    chrome.runtime.sendMessage({
      type: 'SETTINGS_CHANGED',
      settings: settings
    });
    
    // Track settings change
    if (window.RexAnalytics && analyticsEnabled.checked) {
      RexAnalytics.trackEvent('settings_updated', {
        analytics_enabled: analyticsEnabled.checked
      });
    }
  });
  
  // Save analytics settings
  chrome.storage.local.set({ analyticsSettings: settings.analytics }, () => {
    console.log('Analytics settings saved');
  });
}

/**
 * Validate settings
 * @param {object} settings - Settings to validate
 * @returns {boolean} - Whether settings are valid
 */
function validateSettings(settings) {
  // Validate max conversations
  if (settings.general.maxConversations < 0) {
    alert('Maximum stored conversations must be a positive number or 0 (unlimited).');
    return false;
  }
  
  // Validate context length
  if (settings.general.contextLength < 100 || settings.general.contextLength > 10000) {
    alert('Context length must be between 100 and 10000 characters.');
    return false;
  }
  
  // Validate auto delete
  if (settings.privacy.autoDelete < 0 || settings.privacy.autoDelete > 365) {
    alert('Auto-delete days must be between 0 and 365.');
    return false;
  }
  
  // Validate encryption password
  if (settings.privacy.encryptData && !settings.privacy.encryptionPassword) {
    alert('Please provide an encryption password or disable encryption.');
    return false;
  }
  
  // Validate custom trigger
  if (!settings.activation.customTrigger) {
    alert('Custom activation trigger cannot be empty.');
    return false;
  }
  
  // Validate activation phrases
  if (settings.activation.activationPhrases.length === 0) {
    alert('Please add at least one activation phrase.');
    return false;
  }
  
  // Validate enabled platforms
  if (settings.platforms.enabled.length === 0) {
    alert('Please enable at least one platform.');
    return false;
  }
  
  return true;
}

/**
 * Check if there are unsaved changes
 * @returns {boolean} - Whether there are unsaved changes
 */
function hasUnsavedChanges() {
  // Check general settings
  if (autoUpdate.checked !== currentSettings.general.autoUpdate ||
      parseInt(maxConversations.value) !== currentSettings.general.maxConversations ||
      parseInt(contextLength.value) !== currentSettings.general.contextLength) {
    return true;
  }
  
  // Check privacy settings
  if (encryptData.checked !== currentSettings.privacy.encryptData ||
      encryptionPassword.value !== currentSettings.privacy.encryptionPassword ||
      parseInt(autoDelete.value) !== currentSettings.privacy.autoDelete) {
    return true;
  }
  
  // Check activation settings
  if (customTrigger.value !== currentSettings.activation.customTrigger) {
    return true;
  }
  
  // Check activation phrases
  const phraseInputs = document.querySelectorAll('.phrase-input');
  if (phraseInputs.length !== currentSettings.activation.activationPhrases.length) {
    return true;
  }
  
  const phrases = [];
  phraseInputs.forEach(input => {
    if (input.value.trim()) {
      phrases.push(input.value.trim());
    }
  });
  
  for (let i = 0; i < phrases.length; i++) {
    if (phrases[i] !== currentSettings.activation.activationPhrases[i]) {
      return true;
    }
  }
  
  // Check platform settings
  const enabledPlatforms = [];
  platformCheckboxes.forEach(checkbox => {
    if (checkbox.checked) {
      enabledPlatforms.push(checkbox.value);
    }
  });
  
  if (enabledPlatforms.length !== currentSettings.platforms.enabled.length ||
      !enabledPlatforms.every(platform => currentSettings.platforms.enabled.includes(platform))) {
    return true;
  }
  
  if (injectionMethod.value !== currentSettings.platforms.injectionMethod) {
    return true;
  }
  
  // Check advanced settings
  if (debugMode.checked !== currentSettings.advanced.debugMode ||
      storageLocation.value !== currentSettings.advanced.storageLocation) {
    return true;
  }
  
  // Check analytics settings
  if (analyticsEnabled.checked !== currentSettings.analytics.analyticsEnabled ||
      shareCrashReports.checked !== currentSettings.analytics.shareCrashReports ||
      shareUsageStatistics.checked !== currentSettings.analytics.shareUsageStatistics) {
    return true;
  }
  
  return false;
}

// Add CSS for success message
const style = document.createElement('style');
style.textContent = `
  .success-message {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--success-color);
    color: white;
    padding: 10px 20px;
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    z-index: 1000;
  }
`;
document.head.appendChild(style);

// Initialize when the page is loaded
document.addEventListener('DOMContentLoaded', init);
