const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});

admin.initializeApp({
  databaseURL: 'https://rexai-2c417-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db = admin.database();

/**
 * Track an analytics event
 * HTTP Function that receives analytics events from the REX extension
 */
exports.trackEvent = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
      }

      // Get event data from request
      const eventData = req.body;
      
      // Validate required fields
      if (!eventData.event || !eventData.installationId) {
        return res.status(400).send('Missing required fields');
      }

      // Add timestamp if not provided
      if (!eventData.timestamp) {
        eventData.timestamp = admin.database.ServerValue.TIMESTAMP;
      }

      // Add event to database
      const eventsRef = db.ref('events');
      await eventsRef.push(eventData);

      // Update installation record
      const installationRef = db.ref(`installations/${eventData.installationId}`);
      await installationRef.update({
        lastSeen: admin.database.ServerValue.TIMESTAMP,
        platform: eventData.platform || 'unknown',
        events: admin.database.ServerValue.increment(1)
      });

      // Return success
      return res.status(200).send({ success: true });
    } catch (error) {
      console.error('Error tracking event:', error);
      return res.status(500).send('Internal Server Error');
    }
  });
});

/**
 * Get analytics dashboard data
 * HTTP Function that returns aggregated analytics data
 * Requires authentication (not implemented in this example)
 */
exports.getDashboardData = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // Only allow GET requests
      if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
      }

      // Get installations count
      const installationsSnapshot = await db.ref('installations').once('value');
      const installations = installationsSnapshot.val() || {};
      const installationsCount = Object.keys(installations).length;

      // Get events
      const eventsSnapshot = await db.ref('events').once('value');
      const events = eventsSnapshot.val() || {};
      const eventsCount = Object.keys(events).length;
      
      // Get events by type
      const eventTypes = {};
      Object.values(events).forEach(event => {
        const eventName = event.event;
        eventTypes[eventName] = (eventTypes[eventName] || 0) + 1;
      });

      // Get platforms
      const platforms = {};
      Object.values(installations).forEach(installation => {
        const platform = installation.platform || 'unknown';
        platforms[platform] = (platforms[platform] || 0) + 1;
      });

      // Return dashboard data
      return res.status(200).send({
        installationsCount,
        eventsCount,
        eventTypes,
        platforms
      });
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return res.status(500).send('Internal Server Error');
    }
  });
});
