# InfoTreeTech: Private Company Finance Manager

A complete, production-grade Private Company Finance Management Web Application built strictly with **React 19, Vite, Tailwind CSS, Lucide React, Firebase Authentication, and Cloud Firestore** for **InfoTreeTech**.

Designed for enterprise accounting with **direct Firebase Client SDK data access**, zero custom backend code, and strict database-level security enforced by **Firestore Security Rules**.

---

## Key Features

- **Strict Client-to-Firebase Architecture**: Zero custom backend services, Express APIs, or ASP.NET dependencies.
- **Decimal-Safe Financial Arithmetic**: All additions, subtractions, and balance derivations operate using **integer paise** ($1\text{ Rupee} = 100\text{ Paise}$) to prevent floating-point binary inaccuracies.
- **Dynamic Ledger Formula**:
  $$\text{Closing Balance} = \text{Opening Balance} + \text{Total Credits} - \text{Total Debits}$$
- **Role-Based Access Control (RBAC)**:
  - **ADMIN**: Full ledger visibility, add/edit/soft-delete transactions, manage company opening balance baseline, view append-only audit trail diffs, and manage team account status.
  - **TEAM MEMBER**: Authenticate, record credit and debit vouchers, filter and search transactions, view running balances. Strictly barred from editing/deleting transactions, changing settings, or elevating privileges.
- **Comprehensive Transaction Register**: Searchable, sortable, and filterable by date range, month, year, transaction classification, contact, and payment rail.
- **Rich Reporting**: Monthly and yearly financial reconciliation reports with payment rail breakdowns and UTF-8 BOM CSV exports.
- **Soft Deletion & Audit Trail**: Preserves financial audit history with diff tracking for modifications.

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 (Vite 8 build system) |
| **Styling** | Tailwind CSS v4 |
| **Icons** | Lucide React |
| **Authentication** | Firebase Authentication (Email/Password, Local Persistence) |
| **Database** | Cloud Firestore (Client SDK direct access) |
| **Security Layer** | Firestore Security Rules (`firestore.rules`) |
| **Hosting** | Firebase Hosting (`firebase.json`, Single Page Application rewrites) |

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+ or v24+ recommended)
- A Firebase project created in the [Firebase Console](https://console.firebase.google.com/)

### 2. Installation
Clone or navigate to the project directory:
```bash
npm install
```

### 3. Environment Variables Setup
Copy the example environment file:
```bash
cp .env.example .env
```
Open `.env` and fill in your Firebase Web App credentials:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

> **Note on Preview / Demo Mode**: If Firebase credentials are not yet configured in `.env`, InfoTreeTech automatically runs in **Interactive Preview Mode** with pre-seeded demo records and a persona switcher (Admin vs Team Member) so all UI workflows can be evaluated immediately.

### 4. Running the Dev Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## Initial Admin Account Setup & Provisioning

Because the application has no custom backend, user self-registration is permanently disabled to maintain company privacy. Follow these steps to initialize the company owner account:

### Step 1: Create the User in Firebase Authentication
1. Go to the **Firebase Console &gt; Authentication &gt; Users**.
2. Click **Add user**.
3. Enter your administrative email (e.g. `admin@yourcompany.in`) and a secure password.
4. Copy the generated **User UID** (e.g., `8f9b2c3d4e5f...`).

### Step 2: Assign Admin Privileges in Firestore
1. Navigate to **Cloud Firestore &gt; Data**.
2. If the `users` collection does not exist, click **Start collection** and name it `users`.
3. Set the **Document ID** to the exact **User UID** copied from Step 1.
4. Add the following fields:
   ```json
   {
     "uid": "YOUR_USER_UID",
     "displayName": "Company Director",
     "email": "admin@yourcompany.in",
     "role": "ADMIN",
     "isActive": true,
     "createdAt": "2026-10-22T10:00:00Z"
   }
   ```
5. Save the document. You can now log into InfoTreeTech as an Administrator!

### Step 3: Add Team Members
1. Add their email and password in **Authentication &gt; Add user**.
2. In the `users` collection, create a document with their UID and set `"role": "TEAM_MEMBER"`.

---

## Deploying Firestore Security Rules & Indexes

To apply the database security rules and compound indexes to your live Firebase project:

1. Install the Firebase CLI if you haven't already:
   ```bash
   npm install -g firebase-tools
   ```
2. Log into Firebase:
   ```bash
   firebase login
   ```
3. Link your project ID:
   ```bash
   firebase use your-project-id
   ```
4. Deploy rules and indexes:
   ```bash
   firebase deploy --only firestore
   ```

---

## Deploying to Firebase Hosting

To build and deploy the application for production:
```bash
# 1. Build optimized bundle
npm run build

# 2. Deploy hosting
firebase deploy --only hosting
```
The site will be live at `https://your-project-id.web.app`.

---

## Security & Architecture Constraints

For a full technical analysis of client-only Firebase architecture and disclosures regarding **client-originated audit log limits**, see [SECURITY.md](file:///d:/gowtham/expence%20tracker/SECURITY.md).
