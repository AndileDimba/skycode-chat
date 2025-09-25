### SAFE•Miner Chat (Angular 17 + Firebase)

Real-time 1:1 chat with a WhatsApp‑style UI using Angular 17, Tailwind, and Firebase Auth/Firestore. Current build supports stable thread IDs, live messaging, read receipts, auto‑scroll, contact search, and guarded subscriptions to prevent cross‑chat leakage.

#### Highlights
- Real‑time threads/messages with live updates and auto‑scroll
- WhatsApp‑inspired, responsive UI built with Tailwind
- Deterministic thread IDs: sorted UIDs prevent collisions
- Read receipts, delivery state, last‑message previews
- Robust UX: guarded loads, clear error states, keyboard shortcuts
- Modular Angular architecture (services + child components)

---

### Quick start

- Install and run
  - `npm install`
  - `npm start`  # opens http://localhost:4200
- Environment config
  - Add Firebase config to `src/environments/environment.ts` (request values from maintainer)

#### App commands/shortcuts (in UI)
- Search contacts in sidebar
- Click a contact to open/create a thread
- Enter to send, Shift+Enter for newline
- Esc to clear the composer

---

### Features (mapping to requirements)

1) Real‑time conversation flow
- Firestore listeners stream messages immediately
- Auto‑scroll to last message on send/receive; day separators

2) Stable threading
- `threadId = sort([uidA, uidB]).join('_')`
- Prevents cross‑chat leakage and ensures idempotent thread creation

3) Read/delivery states
- Sent → Delivered → Read indicators
- Mark‑as‑read on thread focus

4) Contact list and previews
- Sidebar with users, last message text, relative time
- Online badge heuristic from recent activity

5) Resilient UX
- Guards for undefined UIDs and permissions
- Clear inline errors and retry-friendly flows

6) Architecture and styling
- Services: Auth, Users, Chat (single responsibility)
- Signals/RxJS for reactive state
- Tailwind utilities + small theme tokens

---

### Demo scenarios with expected outcomes

Start a new chat
- Steps:
  - Sign in as User A and User B (two browsers)
  - User A selects User B and sends "Hello"
- Expected:
  - Thread appears, auto‑scrolls; User B receives instantly; read indicator updates when opened

Read receipts
- Steps:
  - A sends two messages; B opens thread
- Expected:
  - Messages flip to "read" for A shortly after B views

Thread stability
- Steps:
  - Switch among 3 contacts and send messages
- Expected:
  - Each thread shows only its own history; no mixing

Slow network
- Steps:
  - Throttle network in DevTools; send a message
- Expected:
  - Temporary "sending" state, resolves to delivered when back online

---

### Architecture

Clean Angular structure with Firebase backend

- Domain models
  - User, Thread, Message (TypeScript interfaces)
  - Enums: MessageStatus, UserStatus

- Services (single responsibility)
  - AuthService: login/logout, current user state
  - UserService: contact directory, profile management
  - ChatService: thread creation, message streaming, read receipts

- Components (modular UI)
  - ChatPageComponent: main container, contact selection
  - MessageListComponent: scrollable thread view
  - MessageBubbleComponent: individual message rendering
  - ChatInputComponent: composer with keyboard handling

- State management
  - Angular Signals for reactive UI updates
  - RxJS streams for Firestore listeners
  - Guarded subscriptions prevent memory leaks

Design decisions
- Deterministic thread IDs prevent duplicate conversations
- Append-only messages with separate read tracking
- Optimistic UI updates with error rollback
- Tailwind-first styling with minimal custom CSS

---

### Project structure
- src/
  - app/
    - components/
      - chat-page/
        - chat-page.component.ts
        - chat-page.component.html
        - chat-page.component.css
      - auth/
      - shared/
    - services/
      - auth.service.ts
      - chat.service.ts
      - user.service.ts
    - models/
      - user.interface.ts
      - thread.interface.ts
      - message.interface.ts
    - guards/
  - environments/
    - environment.ts
  - styles.css

---

### Testing and validation

- Local testing
  - `npm test` runs unit tests
  - Two-browser manual testing for real-time features
  
- Edge cases validated
  - Network interruptions and reconnection
  - Concurrent message sending
  - Thread switching without state leakage
  - Permission errors and auth state changes

---

### Known behaviors and limitations

- Group chats not implemented (1:1 conversations only)
- Message history pagination not yet enabled for very long threads
- Typing indicators and message reactions are planned features
- File attachments require additional Firebase Storage setup

Future enhancements
- Multi-participant group conversations
- File/image sharing with previews
- Message search and thread archiving
- Push notifications for background messages
- Offline message queuing and sync