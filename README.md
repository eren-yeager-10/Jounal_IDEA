# Gemini Reflections — Intelligent AI Journaling, Emotional Cartography, Time-Capsule & Ephemeral Letters

[![Google Cloud Run](https://img.shields.io/badge/Deployed%20on-Google%20Cloud%20Run-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![Firebase Firestore](https://img.shields.io/badge/Database-Cloud%20Firestore-FFA611?logo=firebase&logoColor=white)](https://firebase.google.com/)
[![Gemini 3.6 Flash](https://img.shields.io/badge/Model-Gemini%203.6%20Flash-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![Next.js 15 App Router](https://img.shields.io/badge/Framework-Next.js%2015%20(App%20Router)-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**Gemini Reflections** is a full-stack, authenticated mindfulness and introspection application. Built with Next.js 15 App Router, Google Cloud Firestore, and Gemini models via the `@google/genai` TypeScript SDK, it helps users explore their stream-of-consciousness thoughts, track emotional patterns longitudinally, compose time-gated letters to their future selves, and share one-time, burn-after-reading secret letters.

---

## 🌟 Table of Contents
1. [Core Features & Architecture](#-core-features--architecture)
2. [What We Built & How It Works](#-what-we-built--how-it-works)
3. [Agentic Threat Modeling & Security Posture](#-agentic-threat-modeling--security-posture)
4. [Third-Party Integrations & SDKs](#-third-party-integrations--sdks)
5. [Step-by-Step Google Cloud Run Deployment](#-step-by-step-google-cloud-run-deployment)
6. [Firestore Security Rules Configuration](#-firestore-security-rules-configuration)
7. [Comprehensive Functional Test Suite](#-comprehensive-functional-test-suite)
8. [Local Development Setup](#-local-development-setup)

---

## 🚀 Core Features & Architecture

```
                                      ┌────────────────────────────────────────────────────────┐
                                      │                      Client (UI)                       │
                                      │  - Next.js 15 App Router + Tailwind CSS + Lucide Icons │
                                      │  - Firebase Auth (Google Federated Sign-In)           │
                                      │  - Stream-of-Consciousness Editor                     │
                                      │  - Interactive Recharts Visualizations                 │
                                      └─────────────┬───────────────────────────┬──────────────┘
                                                    │                           │
                                         Firestore  │                           │ HTTPS Proxy
                                       (SDK Direct) │                           │ (/api/*)
                                                    ▼                           ▼
                     ┌──────────────────────────────────────┐   ┌───────────────────────────────────────┐
                     │          Cloud Firestore             │   │       Next.js API Route Handlers      │
                     │  - `/users/{uid}/entries/{id}`       │   │  - `/api/gemini/reflect`              │
                     │  - `/users/{uid}/letters/{id}`       │   │  - `/api/gemini/patterns`             │
                     │  - `/sharedLetters/{id}` (Burnable)  │   │  - `/api/letters/generate`            │
                     │  - Strict Security Rules Enforced    │   │  - `/api/letters/open` (Atomic Burn)  │
                     └──────────────────────────────────────┘   └───────────────────┬───────────────────┘
                                                                                    │
                                                                                    │ Server-Side Secret
                                                                                    ▼
                                                                ┌───────────────────────────────────────┐
                                                                │        Google Gemini API SDK          │
                                                                │  - Primary: gemini-3.6-flash          │
                                                                │  - Fallback Ladder & Resilient Chain  │
                                                                │  - Structured Schema JSON Extraction  │
                                                                └───────────────────────────────────────┘
```

### 1. ✍️ Stream-of-Consciousness Journal & Multi-Turn AI Introspection
- **Dual-Pane Reflective Workspace**: Real-time writing canvas with dynamic tagging, word counts, auto-save state, and structured history search.
- **Three Core Reflection Modes**:
  - **Deep Reflection**: Empathetic, psychologically grounded analysis uncovering latent themes and offering two introspective follow-up questions.
  - **Executive Summary**: Structured 3-point breakdown (Core Theme, Emotional Trajectory, Actionable Insights).
  - **Creative Brainstorming**: Expansive reframing and actionable exploration avenues.
- **Multi-Turn Contextual Dialogue**: Continue the thread with Gemini in an interactive conversation that remembers the current reflection context.
- **Resilient AI Fallback Ladder**: Automatically retries across `gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash` for high availability.

### 2. 🗺️ Emotional Cartography & Subconscious Patterns Dashboard
- **Structured AI Cartography**: Every saved reflection is analyzed with strict JSON schema parsing into emotional valence (-1.0 to +1.0), mood tags, primary subconscious themes, and relational figures.
- **Longitudinal Trend Analytics**:
  - **Emotional Trajectory Chart**: Interactive time-series area visualization (Recharts) mapping mood shifts over time.
  - **Subconscious Motif Frequency**: Ranked frequency distribution of recurring cognitive patterns and loop flags.
  - **Relational Map**: Frequency counter tracking people mentioned across reflections.

### 3. ⏳ "Write to Future Me" (Time-Gated Letters)
- **AI-Assisted Future Letter Drafting**: Prompts Gemini to synthesize the user's current vulnerabilities, aspirations, and advice into a warm letter addressed to their future self.
- **Time-Gated Vault**: Sealed letters are stored under `/users/{uid}/letters/{id}` with scheduled delivery dates (*1 Month*, *3 Months*, *6 Months*, *1 Year*, or custom date).
- **Client Delivery Gating**: Letters remain securely locked until the delivery milestone date is reached, opening with an animated deckle-paper interface.

### 4. ✉️ "Seal & Send" (One-Time Burn-After-Reading Letters)
- **Public Ephemeral Letter Creation**: Generate a standalone, shareable link (`/letter/[id]`) for a trusted friend or confidant.
- **Zero Exposure of Private Data**: Stored in a decoupled top-level `/sharedLetters` collection with no link to the author's private journal entries or user identity.
- **Atomic One-Time Read Guarantee**: Uses an atomic Firestore transaction (`runTransaction`) in `/api/letters/open` to ensure that content is read and immediately marked `opened: true` in a single operation. Any subsequent visit or reload permanently hides the text and displays a consumed wax-seal burn state.

---

## 🛠️ What We Built & How It Works

| Feature / Module | Implementation Details | How It Works |
| :--- | :--- | :--- |
| **Authentication** | Firebase Auth (Google Federated Identity) | Popup-based OAuth eliminates handling/storing passwords in custom code. Provides an isolated `uid` context across all views. |
| **Data Persistence** | Cloud Firestore | User documents reside strictly under `/users/{uid}/entries` and `/users/{uid}/letters`. Direct data sanitizer (`stripUndefined`) ensures zero database driver crashes. |
| **Server-Side AI Proxy** | Next.js API Routes (`/api/gemini/*`) | Keeps `GEMINI_API_KEY` hidden server-side. Never exposes keys to browser network tab. Integrates `generateContentWithFallback` to handle status codes `503`, `429`, or `404`. |
| **Structured Output Extraction** | Gemini JSON Mode & Schema Parsing | Enforces clean JSON output for emotional valence, themes, and relational maps with fallback string parsing. |
| **One-Time Consumption Engine** | Atomic Firestore Transactions | Server endpoint `/api/letters/open` reads document state and transitions `opened` to `true` atomically, preventing race conditions or replay attacks. |

---

## 🛡️ Agentic Threat Modeling & Security Posture

Before building and deploying the application, we mapped all attack surfaces across the **5 Threat Zones**:

| Threat Zone | Identified Scenario / Risk | Countermeasure Implemented |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious prompt injection in journal entries or oversized payloads | Strict schema validation, null-safe payload destructuring, length limits, and text escaping. |
| **Planning & Reasoning** | Prompt hijacking or system instruction bypass via user reflections | Rigid delimiter tagging (`[Journal Entry Context]`), role isolation, and dedicated system prompt anchors. |
| **Tool Execution & Secrets** | SSRF or unauthorized API credential exposure in frontend bundles | `GEMINI_API_KEY` remains strictly server-side; client communicates solely via secured `/api/` proxy routes. |
| **Memory & State** | Cross-user data leakage or unauthorized document access in Firestore | Strict owner-bound Firestore security rules (`request.auth.uid == userId`); `/sharedLetters` collection forbids listing/discovery (`allow list: if false`). |
| **Inter-System Comm** | Gemini API downtime, quota exhaustion (`429`), or transient `503` errors | Automated Resilient Fallback Ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`). |

---

## 📦 Third-Party Integrations & SDKs

1. **Google Gen AI TypeScript SDK (`@google/genai`)**:
   - Model execution, structured JSON mode parsing, and multi-turn conversational reflection.
2. **Firebase Web SDK (`firebase/app`, `firebase/auth`, `firebase/firestore`)**:
   - Client-side Google authentication and low-latency real-time document listeners.
3. **Recharts**:
   - Dynamic SVG rendering for emotional valence trends and motif charts.
4. **Lucide React**:
   - Lightweight, accessible iconography across all navigation and interactive components.
5. **Tailwind CSS v4 & Motion**:
   - Polished responsive layouts, micro-interactions, and deckle-paper envelope opening animations.

---

## 🚢 Step-by-Step Google Cloud Run Deployment

Follow these steps to build, secure, and deploy the application to Google Cloud Run.

### Step 1: GCP Project & Service Initialization
```bash
# Set your target Google Cloud Project ID
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

### Step 2: Secret Manager Configuration
Store your Gemini API Key in Google Cloud Secret Manager and grant read access to the Cloud Run runtime service account:

```bash
# 1. Create the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your Gemini API key value
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Retrieve your GCP Project Number
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

# 4. Grant the Cloud Run compute service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 3: Provision Cloud Firestore Database
```bash
# Create Firestore in Native Mode (e.g., in us-central1 or asia-southeast1)
gcloud firestore databases create --location=us-central1 --type=firestore-native
```

### Step 4: Deploy Container to Google Cloud Run
```bash
# Deploy from source using Cloud Build and Cloud Run
gcloud run deploy gemini-reflections \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### Step 5: Apply Mandatory Campaign Labeling
Apply the required campaign label to register the service for challenge verification:

```bash
gcloud run services update gemini-reflections \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🔒 Firestore Security Rules Configuration

Deploy the following production rules in `firestore.rules` to enforce owner isolation and protect one-time read resources:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User-isolated private journal reflections and time-gated letters
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /letters/{letterId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Ephemeral Sealed Letters (Burn After Reading)
    // Listing/querying is strictly denied to prevent discovery.
    // Document creation and atomic one-time consumption (transition to opened=true) are strictly validated.
    match /sharedLetters/{letterId} {
      allow list, delete: if false;
      allow get: if true;
      allow create: if request.resource.data.keys().hasAll(['id', 'content', 'teaser', 'opened', 'createdAt'])
                    && request.resource.data.opened == false
                    && request.resource.data.content is string
                    && request.resource.data.id == letterId;
      allow update: if resource.data.opened == false
                    && request.resource.data.opened == true;
    }
  }
}
```

Deploy the rules via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 🧪 Comprehensive Functional Test Suite

Every user interaction that can be seen or triggered in the application has a corresponding test case below:

### TC-01: Landing Page & Unauthenticated State
- **Action**: Open the root URL (`/`) in an unauthenticated or incognito browser.
- **Expected Outcome**: The landing page renders with the hero title, "Sign In with Google" button, privacy highlights, and feature overview. No private dashboard data is accessible.

### TC-02: Google Federated Authentication
- **Action**: Click the "Sign In with Google" button (`#google-sign-in-btn`).
- **Expected Outcome**: The Google OAuth popup opens. Upon successful authentication, Firebase Auth transitions smoothly to the private workspace, populating the user's avatar and email.

### TC-03: Journal Writing & Tag Management
- **Action**:
  1. Type a title in `#entry-title-input` (e.g. *"Reflections on Project Architecture"*).
  2. Type thoughts into `#journal-content-textarea`.
  3. Type `growth` into `#entry-tag-input` and press **Enter**.
- **Expected Outcome**: Real-time word count updates, tag badge appears, and the title updates in the header.

### TC-04: Deep AI Reflection Mode (Gemini 3.6 Flash)
- **Action**: Ensure the "Reflect" mode is active and click "Generate Deep Reflection" (`#generate-ai-btn`).
- **Expected Outcome**:
  - Loading spinner and "Gemini Thinking..." status appear.
  - Server proxies the request through the fallback ladder.
  - Empathetic analysis is rendered in Markdown with two introspective inquiry questions.
  - The entry and interaction are saved to Firestore.

### TC-05: Executive Summary & Brainstorming Modes
- **Action**: Switch between the "Summarize" and "Brainstorm" mode pills and generate responses.
- **Expected Outcome**: Gemini generates structured summaries or creative perspectives matching the selected mode.

### TC-06: Multi-Turn Conversation Thread
- **Action**: Type a follow-up inquiry into `#multi-turn-reply-input` and click `#send-reply-btn`.
- **Expected Outcome**: The user message is appended to the dialogue thread, Gemini answers in context, and the conversation is saved to Firestore.

### TC-07: Emotional Cartography & Longitudinal Patterns
- **Action**: Click the **"Patterns"** tab in the top navigation.
- **Expected Outcome**:
  - *Under 5 entries*: Progress indicator displays number of entries needed.
  - *5+ entries*: Interactive Recharts area visualization displays emotional valence timeline (-1.0 to +1.0), recurring motif frequencies, and relational circles.

### TC-08: Time-Gated Letter Creation ("Write to Future Me")
- **Action**:
  1. Open a journal entry and click **"Write to Future Me"**.
  2. Select a milestone (e.g., *1 Month*) and click **"Generate Letter"**.
  3. Review the AI-generated letter and click **"Seal Letter for [Date]"**.
- **Expected Outcome**: Letter is sealed in `/users/{uid}/letters/{id}` and visible in the **"Letters"** tab with a locked wax seal until the delivery date.

### TC-09: One-Time Burn-After-Reading ("Seal & Send")
- **Action**:
  1. In the journal editor, click **"Seal & Send"**.
  2. Customize the teaser quote and click **"Seal & Generate Link"**.
  3. Copy the resulting `/letter/[id]` URL and open it in an incognito window.
  4. Click the wax seal to break it and unfold the letter.
  5. Refresh the page or open the link again.
- **Expected Outcome**:
  - First visit: Letter unlocks and displays content.
  - Second visit/reload: Displays consumed state (*"This Letter Has Burned — Opened and consumed. Words vanished from storage forever."*).

### TC-10: Search, Tag Filtering, & Entry Switching
- **Action**: Type in the sidebar search box and click a tag filter pill. Click a past reflection item.
- **Expected Outcome**: History sidebar filters dynamically, and clicking an item reloads its full title, content, tags, and multi-turn chat history.

### TC-11: Entry Deletion & Data Cleanup
- **Action**: Hover over a past entry in the sidebar and click the trash icon. Confirm deletion.
- **Expected Outcome**: Entry is permanently removed from Firestore and the sidebar list.

### TC-12: Sign Out & Session Teardown
- **Action**: Click the sign out button in the top navigation bar.
- **Expected Outcome**: Firebase Auth terminates the session, all in-memory user state is wiped, and the user returns to the landing page.

---

## 💻 Local Development Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/YOUR_USERNAME/gemini-reflections.git
cd gemini-reflections
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
# Gemini API Key (Server-Only Secret)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
