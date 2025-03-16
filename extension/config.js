/**
 * REX: Advanced AI Memory Enhancement System
 * Configuration
 */

const REX_CONFIG = {
  // API endpoint for the REX backend
  apiEndpoint: 'http://localhost:8000',
  
  // Default settings
  defaultSettings: {
    enabled: true,
    platforms: ['CLAUDE', 'CHATGPT', 'GEMINI'],
    autoExtract: true,
    privacyMode: false
  }
};

// Export the configuration
if (typeof module !== 'undefined') {
  module.exports = REX_CONFIG;
}
