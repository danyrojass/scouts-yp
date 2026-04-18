# Project Overview
I can help you prepare a comprehensive explanation of this project. Let me first gather more information about the project structure and implementation details.Let me compile a comprehensive overview of your project for you:
## **Project Summary: Scouts YP**
### **What It Is**
Scouts YP is a **Youth Program Management application** built for the Scout organization. It's designed to manage beneficiaries (scouts) across different age levels (Lobato, etc.), organized into groups and sets, while tracking their activities and engagement.
### **Technology Stack**
- **Framework:** Angular 20.1.0 (standalone components, modern standalone routing)
- **Language:** TypeScript 5.8.2
- **State Management:** RxJS 7.8.0 with Angular signals for reactive state
- **Backend:** Firebase (Authentication + Firestore database)
- **Package Manager:** npm
- **Testing:** Jasmine/Karma unit tests
- **Build Tool:** Angular CLI 20.1.5

### **Key Architecture & Implementation**
**Frontend Architecture:**
- **Standalone Components:** Uses Angular's latest standalone component approach (no NgModules)
- **Feature-Based Structure:** Organized into logical feature modules (auth, users, groups, sets, activities)
- **Lazy Loading:** Routes are lazily loaded using Angular's `loadChildren` for code splitting
- **Route Guards:** Protected routes using for authentication `authGuard`

**Authentication & Data:**
- **Firebase Auth:** Email/password authentication with registration and login capabilities
- **Firestore Database:** User profiles and related data stored in Firestore
- **Reactive State:** Auth service uses RxJS observables and Angular signals for managing user state
- **Auto-sync:** User data automatically synchronizes from Firestore when auth state changes

**Data Models:**
- **User:** Has properties like name, email, type (BENEFICIARIO), level (LOBATO), groupId, setId, dateOfBirth
- **User Types & Levels:** Differentiate scout categories

### **Project Structure**
```
src/app/
├── auth/                    # Authentication module
│   ├── components/          # Login/Register components
│   ├── services/            # AuthService (handles Firebase auth)
│   └── auth.guard.ts        # Route protection guard
├── users/                   # User management
│   ├── components/          # User list, detail, form
│   ├── models/              # User data models
│   ├── services/            # UserService
│   └── users.routes.ts      # Feature routing
├── dashboard/               # Main dashboard view
├── groups/                  # Scout groups management
├── sets/                    # Scout sets (sub-groups)
├── activities/              # Activity tracking
└── shared/                  # Shared utilities & navigation
```

### **Key Features**
1. **Authentication:** Register and login with email/password
2. **User Management:** Create, view, and manage scout profiles
3. **Organization:** Manage groups and sets
4. **Activity Tracking:** Track youth program activities
5. **Protected Routes:** All feature routes require authentication

### **How to Explain This to Claude**
You can now tell Claude:
- The project scope and purpose (youth program management)
- The tech stack (Angular + Firebase)
- The modern architecture approach (standalone components, lazy-loaded features)
- The data flow (Firebase-backed reactive services)
- The module organization (feature-based with auth protection)