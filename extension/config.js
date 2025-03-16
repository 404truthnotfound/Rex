/**
 * REX: AI Chat History & Memory Enhancement
 * Configuration
 */

const REX_CONFIG = {
  // API endpoint for the REX backend
  apiEndpoint: 'http://localhost:8000',
  
  // Analytics endpoint (set to null to disable)
  analyticsEndpoint: 'https://us-central1-rexai-2c417.cloudfunctions.net/trackEvent', // Firebase function URL
  
  // Firebase configuration
  firebaseConfig: {
    projectId: 'rexai-2c417',
    databaseURL: 'https://rexai-2c417-default-rtdb.asia-southeast1.firebasedatabase.app'
  },
  
  // Default settings
  defaultSettings: {
    enabled: true,
    platforms: ['CLAUDE', 'CHATGPT', 'GEMINI'],
    autoExtract: true,
    privacyMode: false,
    analyticsEnabled: false // Opt-out by default for privacy
  }
};

// Export the configuration
if (typeof module !== 'undefined') {
  module.exports = REX_CONFIG;
}
