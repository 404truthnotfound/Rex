const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});

admin.initializeApp();
const db = admin.firestore();

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
        eventData.timestamp = admin.firestore.FieldValue.serverTimestamp();
      } else {
        // Convert string timestamp to Firestore timestamp
        eventData.timestamp = admin.firestore.Timestamp.fromDate(new Date(eventData.timestamp));
      }

      // Add event to Firestore
      await db.collection('events').add(eventData);

      // Update installation record
      await db.collection('installations')
        .doc(eventData.installationId)
        .set({
          lastSeen: admin.firestore.FieldValue.serverTimestamp(),
          platform: eventData.platform || 'unknown',
          events: admin.firestore.FieldValue.increment(1)
        }, { merge: true });

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
      const installationsSnapshot = await db.collection('installations').get();
      const installationsCount = installationsSnapshot.size;

      // Get events count
      const eventsSnapshot = await db.collection('events').get();
      const eventsCount = eventsSnapshot.size;

      // Get events by type
      const eventTypesSnapshot = await db.collection('events')
        .select('event')
        .get();
      
      const eventTypes = {};
      eventTypesSnapshot.forEach(doc => {
        const event = doc.data().event;
        eventTypes[event] = (eventTypes[event] || 0) + 1;
      });

      // Get platforms
      const platformsSnapshot = await db.collection('installations')
        .select('platform')
        .get();
      
      const platforms = {};
      platformsSnapshot.forEach(doc => {
        const platform = doc.data().platform || 'unknown';
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
