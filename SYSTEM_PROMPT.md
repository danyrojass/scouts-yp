# Scouts YP — System Context for AI Assistants

## Overview

Scouts YP is a **Youth Program Management** web app for Scout organizations. It manages beneficiaries (scouts) across age levels, organized into **groups** and **sets** (sub-groups/secciones), with activity tracking and a points system.

**Stack:** Angular 20.1 (standalone components) + Firebase (Auth + Firestore) + TypeScript 5.8 + RxJS/Angular Signals.

---

## User Roles & Levels

There are two independent axes on every user:

### UserType (role / permission level)
- `BENEFICIARIO = 'Beneficiario'` — scout member, read-only access to own group/level data
- `DIRIGENTE = 'Dirigente'` — leader, full CRUD permissions across the system

### UserLevel (scout age category)
- `LOBATO`, `SCOUT`, `CAMINANTE`, `ROVER`, `JEFE` (the `JEFE` level is an adult scout level, distinct from the `DIRIGENTE` role)

---

## Data Model (Firestore)

**users/**
- id, name, email, dateOfBirth, type (UserType), level (UserLevel), groupId, setId, createdAt

**groups/**
- id, name, number, city, createdAt

**sets/**
- id, name, type (SetType: Lobato/Scout/Caminante/Rover), groupId, createdAt

**activities/**
- id, name, description, key, level (UserLevel), points, createdAt

**activityCompletions/**
- id, activityId, userId, setId, groupId, earnedPoints, completedAt

---

## Architecture

### Routing (app.routes.ts)
All feature routes are **lazy-loaded** with `authGuard` (checks `user !== null`):
- `/dashboard` — DashboardComponent
- `/users` — list, detail, form, import
- `/groups` — list, detail, form
- `/sets` — list, detail, form
- `/activities` — list, detail, form, complete
- No **role-based** guards exist — any authenticated user can navigate anywhere. UI hides CRUD buttons for `BENEFICIARIO` users.

### Auth (auth.service.ts)
- Email/password via Firebase Auth
- `user` signal + `user$` observable emit the current `User` or null
- Default UserType on registration: `BENEFICIARIO`
- Auth guard redirects to `/login` if `user() === null`

### Permission Pattern (throughout the codebase)
Every CRUD button and sensitive action checks `currentUser()?.type === UserType.DIRIGENTE`:
- **Create/Edit/Delete** buttons hidden for `BENEFICIARIO` in all components
- **Data filtering:** `BENEFICIARIO` users only see sets/activities matching their group/level
- **Navbar** has an `isAdmin` computed signal for future use

### State Management
- **RxJS** for Firestore data streams (services return `Observable<T[]>`)
- **Angular Signals** (`signal()`, `computed()`, `toSignal()`) for reactive UI state
- Services are `inject()`-based (no constructor DI)

---

## Key Files

| Path | Purpose |
|---|---|
| `src/app/users/models/user-type.enum.ts` | UserType enum (BENEFICIARIO, DIRIGENTE) |
| `src/app/users/models/user-level.enum.ts` | UserLevel enum (LOBATO, SCOUT, CAMINANTE, ROVER, JEFE) |
| `src/app/users/models/user.model.ts` | User interface |
| `src/app/auth/services/auth.service.ts` | Firebase auth + user sync |
| `src/app/auth/auth.guard.ts` | Auth route guard |
| `src/app/app.routes.ts` | Root routes with lazy loading |
| `src/app/shared/components/navbar/navbar.component.ts` | Navbar with `isAdmin` signal |

---

## Important Conventions

1. **Standalone components only** — no NgModules anywhere
2. **`inject()`** for DI, never constructor injection
3. **`computed()` / `signal()`** for reactive state, `toSignal()` bridges RxJS → signals
4. **CSS custom** — no framework (Bootstrap, Tailwind, etc.)
5. **Forms** — `FormBuilder` + `ReactiveFormsModule`
6. **Routing** — `NavigationService` wraps Angular Router for centralized nav
7. **Tests** — Jasmine + Karma (`ng test`)

---

## Role-Based UI Rules (current behavior)

| Feature | DIRIGENTE | BENEFICIARIO |
|---|---|---|
| View dashboard | Full stats | Filtered to own group/level |
| View all sections | All in group | Only same type as own set |
| View all activities | All | Only matching their level |
| Create/Edit/Delete | ✅ everywhere | ❌ |
| Complete activities | All activities | Only own group activities |
| Import users (XLSX) | ✅ | ❌ |

---

## Development Commands

- `npm start` — dev server
- `npm run build` — production build (runs `set-env.js` first)
- `npm test` — Jasmine/Karma tests
