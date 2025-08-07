# Firebase Setup Guide

This guide will help you set up Firebase for the QR-Menu application.

## Prerequisites

- A Google account
- Node.js and npm installed
- This project cloned and dependencies installed

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "qr-menu-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In the Firebase console, click on "Authentication" in the left sidebar
2. Click on the "Get started" button
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

## Step 3: Set up Firestore Database

1. In the Firebase console, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll configure security rules later)
4. Select a location for your database (choose the closest to your users)
5. Click "Done"

## Step 4: Get Firebase Configuration

1. In the Firebase console, click on the gear icon (Settings) and select "Project settings"
2. Scroll down to the "Your apps" section
3. Click on the web icon (`</>`) to add a web app
4. Enter an app nickname (e.g., "QR Menu Web App")
5. Don't check "Also set up Firebase Hosting" (we're using Next.js)
6. Click "Register app"
7. Copy the configuration object that appears

## Step 5: Configure Environment Variables

1. Copy the `env.example` file to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Fill in your Firebase configuration values in `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

## Step 6: Configure Firestore Security Rules

1. In the Firebase console, go to "Firestore Database"
2. Click on the "Rules" tab
3. Replace the default rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Restaurant data access control
    match /restaurants/{restaurantId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.restaurantId == restaurantId;
      
      // Nested collections inherit parent permissions
      match /{document=**} {
        allow read, write: if request.auth != null && 
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.restaurantId == restaurantId;
      }
    }
    
    // Public read access for customer menu (specific paths only)
    match /restaurants/{restaurantId}/products/{productId} {
      allow read: if resource.data.isAvailable == true;
    }
    
    match /restaurants/{restaurantId}/categories/{categoryId} {
      allow read: if resource.data.isVisible == true;
    }
    
    match /restaurants/{restaurantId}/tables/{tableId} {
      allow read: if resource.data.isActive == true;
    }
  }
}
```

4. Click "Publish"

## Step 7: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. You should be redirected to the sign-in page
4. Try creating a new account to test the authentication flow

## Troubleshooting

### Common Issues

1. **"Firebase: Error (auth/configuration-not-found)"**
   - Make sure all environment variables are correctly set in `.env.local`
   - Restart your development server after changing environment variables

2. **"Firebase: Error (auth/invalid-api-key)"**
   - Double-check your `NEXT_PUBLIC_FIREBASE_API_KEY` value

3. **Email verification not working**
   - Check your Firebase Authentication settings
   - Ensure email/password authentication is enabled
   - Check spam folder for verification emails

4. **Firestore permission errors**
   - Make sure you've published the security rules
   - Check that the user document is created during sign-up

### Additional Configuration

For production deployment, you may want to:

1. Set up Firebase Hosting or configure your preferred hosting platform
2. Set up custom domain for authentication
3. Configure email templates for verification and password reset
4. Set up monitoring and analytics

## Next Steps

Once Firebase is configured, you can:

1. Test the authentication flow
2. Create restaurant profiles
3. Set up menu categories and products
4. Generate QR codes for tables
5. Test the customer ordering flow

For more detailed Firebase documentation, visit: https://firebase.google.com/docs