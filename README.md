# DEO Muzaffarabad — Legal Case Management System
# ضلعی دفتر تعلیم مظفرآباد — قانونی مقدمات کا نظام

## What This App Does (English)

This app replaces your paper register of legal cases. Instead of writing case details in a physical register and flipping through pages to find court dates, everything is stored digitally. Your clerk can enter new cases, update hearing dates, and the app will remind you before important court dates so nothing is missed.

You (the DEO) can view all your office's legal cases from your iPhone anytime — even when you're in a meeting or traveling. The clerk manages everything from their Android phone. The best part: it works offline too. If the internet is down, the app still works and syncs automatically when the connection comes back.

## یہ ایپ کیا کرتی ہے (Urdu)

یہ ایپ آپ کی قانونی مقدمات کی کاغذی رجسٹر کی جگہ لیتی ہے۔ کاغذ پر کیس کی تفصیلات لکھنے اور پیشی کی تاریخیں ڈھونڈنے کے لیے صفحات پلٹنے کی بجائے، سب کچھ ڈیجیٹل طور پر محفوظ ہوتا ہے۔ آپ کا کلرک نئے کیسز درج کر سکتا ہے، سماعت کی تاریخیں اپ ڈیٹ کر سکتا ہے، اور ایپ آپ کو عدالتی تاریخوں سے پہلے یاد دہانی بھیجے گی تاکہ کوئی تاریخ نہ چھوٹے۔

آپ (ڈی ای او) اپنے آئی فون سے کسی بھی وقت دفتر کے تمام قانونی مقدمات دیکھ سکتے ہیں — چاہے آپ میٹنگ میں ہوں یا سفر میں۔ کلرک اپنے اینڈرائیڈ فون سے سب کچھ منظم کرتا ہے۔ سب سے اچھی بات: یہ بغیر انٹرنیٹ کے بھی کام کرتی ہے۔ اگر انٹرنیٹ بند ہو تو بھی ایپ کام کرتی رہتی ہے اور انٹرنیٹ آنے پر خود بخود ڈیٹا اپ ڈیٹ ہو جاتا ہے۔

## Setup Guide (Follow These Steps One by One)

### Step 1: Generate App Icons

- Open the file `generate-icons.html` in your browser (double-click it)
- Click "Download 192x192" and "Download 512x512" buttons
- Save both files in the `icons` folder as `icon-192.png` and `icon-512.png`

### Step 2: Create Firebase Account (FREE)

- Go to console.firebase.google.com
- Sign in with your Google/Gmail account
- Click "Add project"
- Project name: type `deo-muzaffarabad-legal`
- Turn OFF Google Analytics (not needed)
- Click "Create project"
- Wait for it to finish, then click "Continue"

### Step 3: Set Up Database

- In your Firebase project, click "Build" in the left menu
- Click "Firestore Database"
- Click "Create database"
- Select "Start in test mode" (you'll secure it later)
- Choose location: `asia-south1` (closest to AJK)
- Click "Enable"

### Step 4: Get Your Firebase Settings

- Click the gear icon (⚙) next to "Project Overview" in the left menu
- Click "Project settings"
- Scroll down to "Your apps" section
- Click the web icon (looks like </> )
- App nickname: type `DEO Legal PWA`
- Click "Register app"
- You'll see a code block with `firebaseConfig`. Copy the values.
- Open the file `firebase-config.js` in a text editor (right-click → Open with → Notepad)
- Replace each `REPLACE_WITH_...` text with the matching value from Firebase
- Save the file

### Step 5: Enable Login System

- In Firebase, click "Authentication" in the left menu (under Build)
- Click "Get Started"
- Click "Anonymous"
- Click the toggle to Enable it
- Click "Save"

### Step 6: Set Security Rules

- Go back to "Firestore Database"
- Click the "Rules" tab
- Delete everything and paste this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

- Click "Publish"

### Step 7: Upload to GitHub (Makes Your App Live on the Internet)

- Go to github.com and create an account (or sign in)
- Click the "+" button (top right) → "New repository"
- Repository name: `deo-legal-cases`
- Make sure "Public" is selected
- Click "Create repository"
- Click "uploading an existing file" link
- Drag ALL the files from this folder into the upload area (including the folders: css, js, icons)
- Click "Commit changes"
- Now go to Settings (tab at top of repo) → Pages (left menu)
- Under "Branch", select "main" and click "Save"
- Wait 2-3 minutes. Your app is now live at: `https://YOUR-USERNAME.github.io/deo-legal-cases/`

### Step 8: Install on Clerk's Android Phone

- Open Chrome on the Android phone
- Go to your app URL (from Step 7)
- Chrome will show "Add to Home Screen" banner — tap it
- OR: tap the three dots menu (⋮) → "Add to Home Screen"
- The app icon will appear on the home screen like a regular app

### Step 9: Install on DEO's iPhone

- Open Safari on iPhone
- Go to your app URL
- Tap the Share button (square with arrow)
- Scroll down and tap "Add to Home Screen"
- Tap "Add"

### Step 10: First Time Setup in the App

- Open the app
- You'll see a PIN setup screen
- Set an Admin PIN (6 digits) — this is for the clerk
- Set a Viewer PIN (6 digits) — this is for the DEO (you)
- Remember both PINs!
- The clerk logs in with Admin PIN (can add/edit cases)
- You log in with Viewer PIN (can only view cases)

## Updating the App

When we make changes, you need to:

1. Go to your GitHub repository
2. We will push the changes
3. Wait 2-3 minutes for GitHub Pages to update
4. The app will automatically update next time you open it

## Troubleshooting

### App not loading?

- Check internet connection
- Clear browser cache
- Make sure all files were uploaded to GitHub

### Firebase errors?

- Double-check all values in firebase-config.js match your Firebase project
- Make sure Anonymous auth is enabled
- Make sure Firestore database was created

### PIN not working?

- Try both Admin and Viewer PINs
- If you forget your PIN, clear app data and set up again

### App not installing on phone?

- Android: Use Chrome browser (not other browsers)
- iPhone: Use Safari (not Chrome)
- Make sure you're visiting the https:// URL (not http://)

### Data not syncing between devices?

- Check internet connection on both devices
- Open Settings in the app → tap "Sync Now"
- Make sure Firebase config is correct

## Free Tier Limits (Don't Worry!)

Firebase free tier allows:

- 1 GB storage (you won't use even 1% with 2000 cases)
- 50,000 reads per day (your 2 users will use maybe 200)
- 20,000 writes per day (you'll use maybe 50)

This app will NEVER exceed free limits with 2 users and under 2000 cases.

## Need Help?

Contact your developer for any issues with the app.

---

Built for District Education Office, Muzaffarabad, AJK, Pakistan
