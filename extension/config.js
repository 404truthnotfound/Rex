/**
 * REX: AI Chat History & Memory Enhancement
 * Configuration
 */

const REX_CONFIG = {
  // API endpoint for the REX backend
  apiEndpoint: 'http://localhost:8000',
  
  // Analytics endpoint (set to null to disable)
  analyticsEndpoint: null, // Change to your analytics server URL if you want to enable
  
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
