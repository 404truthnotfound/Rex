/**
 * REX: AI Chat History & Memory Enhancement
 * Simple privacy-focused analytics
 */

const RexAnalytics = {
  /**
   * Initialize analytics
   */
  init() {
    this.setupListeners();
    this.trackEvent('extension_installed');
  },

  /**
   * Set up event listeners
   */
  setupListeners() {
    // Listen for extension activation
    chrome.runtime.onStartup.addListener(() => {
      this.trackEvent('extension_startup');
    });
  },

  /**
   * Track an event
   * @param {string} eventName - Name of the event
   * @param {object} eventData - Additional event data
   */
  trackEvent(eventName, eventData = {}) {
    // Get installation ID (anonymous)
    this.getInstallationId().then(installationId => {
      // Create event object
      const event = {
        event: eventName,
        timestamp: new Date().toISOString(),
        installationId,
        platform: this.getPlatform(),
        ...eventData
      };

      // Store event locally
      this.storeEventLocally(event);

      // Send to analytics endpoint if user has opted in
      this.getAnalyticsSettings().then(settings => {
        if (settings.analyticsEnabled) {
          this.sendEventToServer(event);
        }
      });
    });
  },

  /**
   * Get or create anonymous installation ID
   * @returns {Promise<string>} Installation ID
   */
  getInstallationId() {
    return new Promise(resolve => {
      chrome.storage.local.get(['installationId'], (result) => {
        if (result.installationId) {
          resolve(result.installationId);
        } else {
          // Generate a new anonymous ID
          const newId = 'rex_' + Math.random().toString(36).substring(2, 15);
          chrome.storage.local.set({ installationId: newId });
          resolve(newId);
        }
      });
    });
  },

  /**
   * Get analytics settings
   * @returns {Promise<object>} Analytics settings
   */
  getAnalyticsSettings() {
    return new Promise(resolve => {
      chrome.storage.local.get(['analyticsSettings'], (result) => {
        if (result.analyticsSettings) {
          resolve(result.analyticsSettings);
        } else {
          // Default settings (opt-out by default for privacy)
          const defaultSettings = {
            analyticsEnabled: false,
            shareCrashReports: false,
            shareUsageStatistics: false
          };
          chrome.storage.local.set({ analyticsSettings: defaultSettings });
          resolve(defaultSettings);
        }
      });
    });
  },

  /**
   * Store event locally
   * @param {object} event - Event to store
   */
  storeEventLocally(event) {
    chrome.storage.local.get(['analyticsEvents'], (result) => {
      const events = result.analyticsEvents || [];
      events.push(event);
      
      // Limit to 1000 events to prevent storage issues
      const limitedEvents = events.slice(-1000);
      
      chrome.storage.local.set({ analyticsEvents: limitedEvents });
    });
  },

  /**
   * Send event to analytics server
   * @param {object} event - Event to send
   */
  sendEventToServer(event) {
    // Only send if the server endpoint is configured
    if (!REX_CONFIG.analyticsEndpoint) {
      return;
    }

    // Send the event
    fetch(REX_CONFIG.analyticsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    }).catch(error => {
      console.error('REX Analytics: Error sending event', error);
    });
  },

  /**
   * Get platform information
   * @returns {string} Platform name
   */
  getPlatform() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Firefox')) {
      return 'firefox';
    } else if (userAgent.includes('Chrome')) {
      return 'chrome';
    } else if (userAgent.includes('Safari')) {
      return 'safari';
    } else if (userAgent.includes('Edge')) {
      return 'edge';
    } else {
      return 'unknown';
    }
  }
};

// Make analytics available globally
window.RexAnalytics = RexAnalytics;
