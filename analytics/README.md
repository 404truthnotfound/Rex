# REX Analytics Backend

This is a simple Firebase Functions backend for collecting anonymous usage analytics from the REX extension.

## Setup Instructions

1. **Install Firebase CLI**:
   ```
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```
   firebase login
   ```

3. **Initialize Firebase**:
   ```
   firebase init
   ```
   - Select "Functions" when prompted
   - Select your Firebase project
   - Choose JavaScript
   - Say "No" to ESLint
   - Say "Yes" to installing dependencies

4. **Deploy Functions**:
   ```
   firebase deploy --only functions
   ```

5. **Update Extension Config**:
   After deployment, Firebase will provide you with function URLs. Copy the URL for the `trackEvent` function and update the `analyticsEndpoint` in your extension's `config.js` file.

## Analytics Dashboard

To view your analytics data:

1. Go to the Firebase Console
2. Navigate to your project
3. Go to "Firestore Database"
4. You'll see two collections:
   - `installations`: Records of each unique installation
   - `events`: All tracked events

You can also access the dashboard data programmatically using the `getDashboardData` function.

## Privacy Considerations

- All data collection is opt-in by default
- No personally identifiable information is collected
- Installation IDs are randomly generated and anonymous
- Users can opt out at any time through the extension settings

## Available Events

The analytics system tracks these events:

- `extension_installed`: When the extension is first installed
- `extension_startup`: When the extension starts up
- `memory_trigger_used`: When a user activates a memory recall
- `conversation_stored`: When a conversation is saved
- `settings_page_viewed`: When a user views the settings page
- `settings_updated`: When a user changes settings
- `data_exported`: When a user exports their data
- `data_imported`: When a user imports data
- `data_cleared`: When a user clears all data
