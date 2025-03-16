# Firebase Deployment Guide

This guide will help you deploy the REX analytics backend to Firebase.

## Prerequisites

- Node.js version 18 or higher
- Firebase CLI installed (`npm install -g firebase-tools`)

## Deployment Steps

1. **Login to Firebase**:
   ```bash
   firebase login
   ```

2. **Initialize Firebase** (if not already done):
   ```bash
   firebase init
   ```
   - Select "Functions" when prompted
   - Select your Firebase project "rexai-2c417"
   - Choose JavaScript
   - Say "No" to ESLint
   - Say "Yes" to installing dependencies

3. **Deploy Functions**:
   ```bash
   firebase deploy --only functions
   ```

4. **Verify Deployment**:
   After deployment, Firebase will provide you with function URLs. The URLs should look like:
   - `https://us-central1-rexai-2c417.cloudfunctions.net/trackEvent`
   - `https://us-central1-rexai-2c417.cloudfunctions.net/getDashboardData`

5. **Test the Functions**:
   - Send a test event to the trackEvent function:
     ```bash
     curl -X POST https://us-central1-rexai-2c417.cloudfunctions.net/trackEvent \
       -H "Content-Type: application/json" \
       -d '{"event":"test_event","installationId":"test123"}'
     ```
   - Check the dashboard data:
     ```bash
     curl https://us-central1-rexai-2c417.cloudfunctions.net/getDashboardData
     ```

## Alternative Deployment Methods

If you can't install Node.js 18+, you can use one of these alternatives:

### Option 1: Use Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/rexai-2c417/overview)
2. Navigate to "Functions" in the left sidebar
3. Click "Add Function" or "Get Started with Functions"
4. Follow the guided setup
5. Copy and paste the code from `index.js` into the editor
6. Deploy the function

### Option 2: Use GitHub Actions

1. Create a GitHub Actions workflow for Firebase deployment
2. The workflow will run in a Node.js 18+ environment
3. Set up Firebase credentials as GitHub secrets
4. Push to GitHub to trigger the deployment

## Troubleshooting

- **CORS Issues**: If you encounter CORS errors, make sure your Firebase function is properly configured with CORS headers
- **Authentication Errors**: Ensure you're logged in with the correct Firebase account
- **Deployment Failures**: Check the Firebase CLI output for specific error messages
