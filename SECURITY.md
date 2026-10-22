# Security Architecture & Backend Limitations Report

## 1. System Overview & Trust Boundary

This application is built strictly as a **client-only Firebase web application** using:
- **Firebase Authentication** (Email/Password)
- **Cloud Firestore Client SDK** (Direct connections from React)
- **Firestore Security Rules** (`firestore.rules`)

There is **no custom backend server, Express API, ASP.NET service, SQL database, or Cloud Functions**.

All security guarantees, role authorizations, and data validation rules are enforced exclusively at the database layer through Cloud Firestore Security Rules.

---

## 2. Roles & Permissions Matrix

| Capability | Team Member | Admin | Enforcing Security Rule |
| :--- | :---: | :---: | :--- |
| **Authenticate / Sign In** | Yes | Yes | `request.auth != null` |
| **Read Active Transactions** | Yes | Yes | `isActiveUser()` |
| **Read Soft-Deleted Transactions** | No | Yes | `isAdmin()` |
| **Create Transactions (Credit/Debit)** | Yes | Yes | `isActiveUser() && request.resource.data.createdBy == request.auth.uid` |
| **Edit Existing Transactions** | **DENIED** | Yes | `isAdmin() && createdBy/createdAt immutable` |
| **Delete Existing Transactions** | **DENIED** | Yes (Soft) | `isAdmin() && isDeleted == true` |
| **Read Audit History & Diffs** | **DENIED** | Yes | `isAdmin()` |
| **Modify Company Settings / Opening Balance** | **DENIED** | Yes | `isAdmin()` |
| **Promote User to Admin** | **DENIED** | Yes | `isAdmin()` |
| **Deactivate Member Account** | **DENIED** | Yes | `isAdmin()` |

---

## 3. Explaining Requirements That Cannot Be Implemented Securely Without Trusted Backend Code

As mandated by secure engineering standards, the following aspects **cannot be made 100% tamper-proof or fully automated without trusted server-side code (Cloud Functions or a backend service)**:

### A. Limits of Client-Originated Audit Log Integrity
- **The Challenge**: The application writes audit log records in the same atomic `writeBatch` as transaction operations.
- **Why Client-Only Has Limits**:
  - Firestore Security Rules enforce that `/auditLogs/{id}` documents are strictly **append-only** (`allow update, delete: if false`).
  - However, because the audit document payload is prepared in the client's browser, a technically sophisticated team member could inspect the network traffic, bypass the React UI, and craft a direct Firestore SDK call using a manipulated `newValues` or `summary` payload.
  - Furthermore, while rules can mandate that `auditLogs` is written alongside transactions, rules cannot prevent a client from omitting subtle metadata details unless strict schema checks are exhaustively matched in Firestore rules.
- **Server-Side Solution**: In enterprise deployments with Cloud Functions, audit logs should be written by an automated `functions.firestore.document('transactions/{id}').onWrite(...)` trigger. Because Cloud Functions run in a trusted Google-managed environment, client tampering is impossible.

### B. Secure Account Provisioning Without Logging Out Admin
- **The Challenge**: Creating new team member accounts directly inside the frontend web app.
- **Why Client-Only Has Limits**:
  - The Firebase Client JavaScript SDK only provides `createUserWithEmailAndPassword()`. Calling this method in a web browser **automatically logs out the current user and signs in as the newly created user**.
  - The Firebase Admin SDK (which allows `admin.auth().createUser(...)` without session switching) requires a service account private key. Exposing this private key in client-side React code would allow any user to take full control of the entire Firebase project.
- **Architecture Solution**: As documented, team member accounts must be provisioned through the **Firebase Authentication Console**, and their role is assigned in the Firestore `users` collection. In a production environment with Cloud Functions, an HTTPS Callable function using the Admin SDK would handle this seamlessly.

### C. Large-Scale Concurrent Aggregation
- **The Challenge**: Calculating all-time closing balance across hundreds of thousands of transactions.
- **Why Client-Only Has Limits**:
  - The frontend dynamically calculates balances using integer paise arithmetic across active Firestore transactions.
  - If a company accumulates tens of thousands of transactions, reading all documents on every dashboard load increases Firestore read costs and client memory usage.
- **Server-Side Solution**: Cloud Functions or Firestore Count/Sum Aggregation queries, or an event-driven ledger accumulator trigger, would maintain running balances on the server with transactional isolation.

---

## 4. Firestore Security Rules Verification Checklist

| Test Scenario | Expected Outcome | Verification Rule |
| :--- | :--- | :--- |
| Unauthenticated user attempts to read `/transactions` | ❌ **DENIED** | `allow read: if isActiveUser()` |
| Team Member attempts to update an existing transaction | ❌ **DENIED** | `allow update: if isAdmin()` |
| Team Member attempts to hard-delete a transaction | ❌ **DENIED** | `allow delete: if false` |
| User attempts to create a transaction with negative amount | ❌ **DENIED** | `request.resource.data.amount > 0` |
| User attempts to create transaction with another user's UID | ❌ **DENIED** | `request.resource.data.createdBy == request.auth.uid` |
| User attempts to promote self to `ADMIN` | ❌ **DENIED** | `request.resource.data.role == 'TEAM_MEMBER' \|\| isAdmin()` |
| Deactivated member (`isActive: false`) attempts read/write | ❌ **DENIED** | `getUserDoc().isActive == true` |
| Non-admin attempts to read `/auditLogs` | ❌ **DENIED** | `allow read: if isAdmin()` |
| Any user attempts to modify or delete an audit log | ❌ **DENIED** | `allow update, delete: if false` |
