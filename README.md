# VoxForm — Intelligent Voice-First Form Studio

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**VoxForm** is a modern, full-stack customizable form builder and public responder web application designed to eliminate the friction of typing long responses. Powered by an integrated **Voice-to-Text Speech Engine**, VoxForm allows respondents to speak naturally while automatically polishing their words into clear, formatted text.

Creators can build native forms, **import existing Google Forms in 1 click**, customize visual themes, share branded **short links**, generate real **scannable QR codes**, collaborate with other team members with role-based access, and inspect **real-time response analytics**.

---

## 📑 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [How Everything Works: Feature Deep Dive](#-how-everything-works-feature-deep-dive)
  - [1. Multimodal Voice-to-Text Dictation](#1-multimodal-voice-to-text-dictation)
  - [2. Form Builder Studio & Question Engine](#2-form-builder-studio--question-engine)
  - [3. 1-Click Transition / Import from Google Forms](#3-1-click-transition--import-from-google-forms)
  - [4. Dynamic Short Links & Real Scannable QR Codes](#4-dynamic-short-links--real-scannable-qr-codes)
  - [5. Collaborators & Multi-User Access ("Add Users")](#5-collaborators--multi-user-access-add-users)
  - [6. Account Authentication & Geometric Headshot System](#6-account-authentication--geometric-headshot-system)
  - [7. Response Analytics & Reporting Dashboard](#7-response-analytics--reporting-dashboard)
  - [8. Curated Themes & Visual Styling Engine](#8-curated-themes--visual-styling-engine)
- [Project Directory Structure](#-project-directory-structure)
- [REST API Reference](#-rest-api-reference)
- [Getting Started & Local Development](#-getting-started--local-development)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Application](#running-the-application)
- [Production Deployment](#-production-deployment)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🏗 Architectural Overview

VoxForm is built as a unified client-server architecture:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             VOXFORM ECOSYSTEM                               │
└─────────────────────────────────────────────────────────────────────────────┘

       CREATOR WORKSPACE                               RESPONDER WORKSPACE
  ┌─────────────────────────┐                     ┌─────────────────────────┐
  │ • Forms Dashboard       │                     │ • Public Form URL       │
  │ • Form Builder Studio   │                     │ • Audio Recording Mic   │
  │ • Theme Customizer      │                     │ • Soundwave Visualizer  │
  │ • Collaborator Manager  │                     │ • Auto-Polished Dictate │
  │ • Response Analytics    │                     │ • Submission Receipts   │
  └────────────┬────────────┘                     └────────────┬────────────┘
               │                                               │
               ▼                                               ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                    FRONTEND CLIENT (React 19 + Vite)                    │
  │   Tailwind CSS • Lucide Icons • Web Audio API • Canvas • QRCode SVG     │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       │ HTTP / REST / Multipart
                                       ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                     BACKEND SERVER (Express 5 + Node)                   │
  │   Auth (JWT + bcrypt) • Multer Audio/Image Uploads • CORS Middleware    │
  └───────┬────────────────────────────┬────────────────────────────┬───────┘
          │                            │                            │
          ▼                            ▼                            ▼
┌──────────────────┐         ┌───────────────────┐        ┌──────────────────┐
│  VOICE AI ENGINE │         │ GOOGLE FORM SYNC  │        │  UNIVERSAL DB    │
│  Multimodal Audio│         │ 1-Click Parser    │        │  Persistent JSON │
│  Speech Cleanup  │         │ Automated Import  │        │  MongoDB Adapter │
│  Browser Fallback│         │ 2-Way Sync Engine │        │  PostgreSQL Adapt│
└──────────────────┘         └───────────────────┘        └──────────────────┘
```

---

## 🔍 How Everything Works: Feature Deep Dive

### 1. Multimodal Voice-to-Text Dictation

Traditional mobile and desktop forms suffer from high abandonment rates because typing extensive open-ended answers is tedious. VoxForm solves this directly at the input level:

- **Targeted Voice Enablement**: Voice-to-text dictation is specifically attached to open-ended fields (**Short Answer** and **Paragraph**). Creators can toggle voice on or off per question.
- **In-Browser Audio Recording**:
  - Responders tap the microphone button on any voice-enabled question.
  - The browser requests microphone permission via `navigator.mediaDevices.getUserMedia`.
  - Captures audio cleanly using the native HTML5 `MediaRecorder` API with echo cancellation and background noise suppression.
- **Live Canvas Soundwave Visualizer**:
  - The Web Audio API `AudioContext` connects an `AnalyserNode` to the live microphone input stream.
  - An HTML5 `<canvas>` continuously renders dynamic frequency waveforms in real-time as the responder speaks, providing immediate visual feedback that speech is being received.
- **Elapsed Recording Timer & Controls**:
  - Displays formatted elapsed time with a visual recording indicator.
  - Respondents can cancel or finish recording with a single click.
- **Neural Speech Polishing**:
  - When the recording stops, the audio blob is sent to `/api/transcribe`.
  - The backend Speech Engine transcribes the audio, automatically removes verbal disfluencies (*"um"*, *"uh"*, *"like"*, repeated words, stuttering), adds natural sentence casing and punctuation, and formats numerical data or lists.
- **Append vs. Replace Option**:
  - If a respondent dictates into a field that already contains text, a prompt asks whether to **Append** the new spoken text to the existing response or **Replace** it entirely.
- **Offline / Web Speech Fallback**:
  - If no external API key is configured or the responder is offline, VoxForm gracefully activates the browser's native `webkitSpeechRecognition` / `SpeechRecognition` API so voice input continues to function seamlessly.

---

### 2. Form Builder Studio & Question Engine

The Form Builder provides an intuitive, real-time editing studio for creating and structuring forms:

- **Interactive Card Canvas**: Clean card layout where creators can edit the form title, description, and cover image.
- **Cover Banner Customizer**: Upload custom banner images or select from high-resolution curated backgrounds with live preview and removal options.
- **Supported Question Types**:
  1. **Short Answer**: Single-line text input with optional Voice-to-Text.
  2. **Paragraph**: Multi-line textarea for extensive answers with optional Voice-to-Text.
  3. **Multiple Choice**: Single-choice radio options with dynamic option addition, removal, and reordering.
  4. **Checkboxes**: Multi-select options allowing respondents to choose one or more answers.
  5. **Dropdown**: Compact select menu ideal for long option lists (e.g., countries, categories).
  6. **Linear Scale**: Configurable scale (from 0 or 1 up to 3 to 10) with custom labels for the minimum and maximum ends (e.g., *1 = Poor*, *5 = Excellent*).
- **Question Actions**:
  - **Reorder**: Move questions up or down using tactile arrow controls or drag handles.
  - **Duplicate**: Clone any question with all its configuration and options intact.
  - **Delete**: Remove questions safely with protection against deleting the final remaining question.
  - **Required Toggle**: Enforce mandatory questions with automatic client-side validation and smooth scrolling.
- **Form Submission Settings**:
  - **Accept Responses Toggle**: Instantly open or close the form to public submissions.
  - **Closed Form Message**: Configure custom text shown to visitors when the form is closed.
  - **Thank-You Message**: Customize the confirmation message displayed upon successful submission.
- **Debounced Cloud Autosave**:
  - Form edits are automatically saved to the backend with a 750ms debounce.
  - An animated status indicator in the top navigation informs the creator (*"Saving..."* ➔ *"Saved"*).

---

### 3. 1-Click Transition / Import from Google Forms

VoxForm provides an automated bridge for creators migrating from Google Forms:

- **How Creators Use It**:
  1. On the **Forms Dashboard**, click **Import from Google Form** (accessible in the header and in the empty workspace view).
  2. Paste any public Google Form URL:
     - Public responder links: `https://docs.google.com/forms/d/e/.../viewform`
     - Creator edit links: `https://docs.google.com/forms/d/.../edit` (automatically normalized to public viewform links)
     - Shortened links: `https://forms.gle/...` (automatically followed via HTTP redirects)
  3. Click **Build My VoxForm**.
- **Under the Hood (`googleFormsIntegrationService.js`)**:
  - The server fetches the public Google Form HTML and extracts the embedded `FB_PUBLIC_LOAD_DATA_` JSON structure.
  - Automatically parses the form title, description, and every question.
  - Converts Google question type codes into native VoxForm questions:
    - Code 0 ➔ Short Answer (Voice-to-Text enabled)
    - Code 1 ➔ Paragraph (Voice-to-Text enabled)
    - Code 2 ➔ Multiple Choice (options mapped)
    - Code 3 ➔ Dropdown (options mapped)
    - Code 4 ➔ Checkboxes (options mapped)
    - Code 5 ➔ Linear Scale (min, max, and labels mapped)
  - Maps Google internal `entry.<id>` identifiers and stores them in the form's `googleFormConfig`.
  - Instantly loads the newly created form in the Form Builder Studio, ready to edit, customize, and share.
- **Optional 2-Way Response Syncing**:
  - When a responder submits a voice response on VoxForm, the server maps the answers back to the original Google `entry.<id>` parameters and can forward the submission to the Google Form's `/formResponse` endpoint, keeping your original Google Sheets synced.

---

### 4. Dynamic Short Links & Real Scannable QR Codes

Every form comes with multi-channel distribution tools built right into the **Share Modal**:

- **Custom Short Links**:
  - Each form automatically receives a URL-friendly slug based on its title and UUID (e.g., `/s/customer-feedback-1a2b3c`).
  - Creators can customize their short link slug at any time.
  - Supported routing formats:
    - Direct responder path: `https://your-domain.com/#form/:formId`
    - Branded short path: `https://your-domain.com/s/:slug` (or `/f/:slug`)
- **Responsive Copy Links**:
  - One-click copy buttons for both the full URL and the short link.
  - Includes instant visual copy confirmation toasts with fallback to textarea selection for legacy browser support.
- **Real Scannable QR Code Generator**:
  - Built using the `qrcode` library to generate true high-density QR matrices directly in the browser.
  - Encodes the full live URL so that anyone scanning the code with a smartphone camera is routed directly to the form responder.
  - Includes a **Download QR Code** button that exports a high-resolution PNG image with proper white padding, perfect for print materials, flyers, slide decks, and physical event badges.

---

### 5. Collaborators & Multi-User Access ("Add Users")

VoxForm supports multi-user collaboration so teams can co-manage forms:

- **Live VoxForm Account Verification**:
  - When adding a collaborator by email, the system verifies via `GET /api/forms/check-user?email=...` that the user has an active VoxForm account.
  - Displays instant visual verification status (user found vs. user not registered).
- **Role-Based Access Control**:
  - **Editor**: Can modify form title, description, questions, settings, themes, and review incoming responses.
  - **Viewer**: Read-only permissions to review questions and inspect analytics.
- **Multi-Tenant Dashboard Filtering**:
  - The Forms Dashboard provides quick tabs:
    - **All Forms**: Everything the user owns or collaborates on.
    - **My Forms**: Forms created directly by the user.
    - **Shared with Me**: Forms where the user was invited as an Editor or Viewer.
  - Collaborators can view and edit shared forms without affecting other private forms in each user's account.

---

### 6. Account Authentication & Geometric Headshot System

User management is designed to be clean, distraction-free, and secure:

- **Standard Email & Password Authentication**:
  - Full registration and login system with passwords securely hashed with `bcryptjs` (salt rounds: 10).
  - Sessions are managed with standard JSON Web Tokens (JWT) stored in secure browser local storage.
  - Input validation, error alerts, and password visibility toggles.
- **Geometric / Abstract Headshot Customizer**:
  - Replaces generic human avatars with creative, non-facial geometric art presets (gradient triangles, hexagonal energy nodes, colorful dynamic polygons).
  - Users can select their favorite geometric avatar or **upload their own custom profile photo** directly via the avatar selector.
- **Clean Dashboard Onboarding (Zero-State)**:
  - When a user creates a new account, their dashboard starts completely clean with zero default forms.
  - Features an intuitive 3-step guide and prominent actions: **Create New Form**, **Import from Google Form**, and **Start from Template**.
- **Functional Navigation & Sign Out**:
  - Top navigation bar has all non-functional placeholder links removed.
  - The **Sign Out** button cleanly destroys the local session token, clears user state, and redirects the user back to the public Landing Page.
  - Includes a **Back to Main Page** button for creators to return to the landing overview.

---

### 7. Response Analytics & Reporting Dashboard

The **Response Analytics** tab transforms raw submissions into actionable insights:

- **Summary Metric Cards**:
  - **Total Responses**: Real-time submission counter.
  - **Voice Dictation Adoption Rate**: Percentage of submissions where respondents used voice dictation.
  - **Latest Response Timestamp**: Dynamic formatted date of the most recent submission.
- **Visual Question Breakdowns**:
  - **Multiple Choice & Dropdowns**: Interactive horizontal bar charts showing selection counts and percentages.
  - **Checkboxes**: Multi-select distribution charts tracking overall option frequency.
  - **Linear Scale**: Computed average score (e.g., *4.6 / 5.0*) alongside a score distribution histogram.
  - **Short Answer & Paragraph**: Response stream with a dedicated **Voice Dictated** badge for spoken answers.
- **Individual Submission Inspector**:
  - Browse responses one-by-one with submission timestamps and complete answer records.
- **1-Click Data Exports**:
  - **Export to CSV**: Formatted spreadsheet file ready for Excel, Google Sheets, or data pipelines (`/api/forms/:id/export/csv`).
  - **Export to JSON**: Structured JSON array containing full response metadata (`/api/forms/:id/export/json`).

---

### 8. Curated Themes & Visual Styling Engine

Creators can style their forms to match their brand identity through the **Theme Customizer**:

- **4 Curated Visual Themes**:
  - **Modern Minimalist**: Crisp geometry, clean slate tones, subtle borders.
  - **Vibrant Gradient**: Bold indigo and violet gradients with glowing focus rings.
  - **Warm Pastel**: Approachable amber, cream, and rose tones.
  - **Dark Executive**: Deep slate and dark mode styling with emerald accents.
- **Color Palettes**: 8 curated color swatches + custom HEX color picker.
- **Typography Pairings**: Independent header and body font selections (Inter, Roboto, Plus Jakarta Sans, Playfair Display, Space Grotesk, Lora).
- **Card Roundness & Button Styling**: Configurable corner radius options for cards and buttons.

---

## 📂 Project Directory Structure

```
Voice-to-text-form/
├── client/                          # React Frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── analytics/           # Response Analytics & visualization
│   │   │   │   └── ResponseAnalytics.jsx
│   │   │   ├── auth/                # Auth modal, profile menu & geometric avatars
│   │   │   │   ├── AuthModal.jsx
│   │   │   │   ├── AvatarSelector.jsx
│   │   │   │   └── UserProfileMenu.jsx
│   │   │   ├── builder/             # Form Builder Studio & Question cards
│   │   │   │   ├── FormBuilder.jsx
│   │   │   │   └── QuestionCard.jsx
│   │   │   ├── collaborators/       # Add Users & collaboration modal
│   │   │   │   └── AddUsersModal.jsx
│   │   │   ├── common/              # Navbar, Share Modal, QR generator, Header modal
│   │   │   │   ├── ApiKeyModal.jsx
│   │   │   │   ├── HeaderImageModal.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── ShareModal.jsx
│   │   │   ├── dashboard/           # Creator Forms Dashboard & Google import modal
│   │   │   │   └── FormsDashboard.jsx
│   │   │   ├── landing/             # Public Landing Page & feature showcase
│   │   │   │   └── LandingPage.jsx
│   │   │   ├── responder/           # Public Form Responder & Voice Dictation
│   │   │   │   ├── AudioVoiceInput.jsx
│   │   │   │   └── FormResponder.jsx
│   │   │   └── theme/               # Theme & color customization panel
│   │   │       └── ThemeCustomizer.jsx
│   │   ├── services/
│   │   │   └── api.js               # Frontend API client and HTTP helpers
│   │   ├── App.jsx                  # Main application router and state coordinator
│   │   ├── index.css                # Global Tailwind CSS styles
│   │   └── main.jsx                 # React root entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Node.js & Express Backend
│   ├── src/
│   │   ├── db/
│   │   │   └── index.js             # Universal Data Access Layer (JSON/Mongo/Postgres)
│   │   ├── middleware/              # JWT auth and file upload middlewares
│   │   ├── routes/
│   │   │   ├── adminRoutes.js       # Admin / Owner analytics routes
│   │   │   ├── authRoutes.js        # User registration, login, profile updates
│   │   │   ├── formRoutes.js        # Forms CRUD, collaborators, imports, exports
│   │   │   └── transcribeRoutes.js  # Voice AI audio upload and transcription
│   │   ├── services/
│   │   │   ├── googleFormsIntegrationService.js # Google Forms parser & sync
│   │   │   └── transcriptionService.js          # Speech AI processing & cleanup
│   │   └── index.js                 # Express server bootstrap
│   ├── data/                        # Persistent local JSON data files (forms, users)
│   ├── uploads/                     # Uploaded images and media
│   ├── .env.example
│   └── package.json
│
├── DEPLOYMENT.md                    # Detailed production deployment guide
├── run-dev.js                       # Cross-platform concurrent dev runner
├── package.json                     # Root orchestrator package.json
└── README.md                        # Project documentation
```

---

## 📡 REST API Reference

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user account with email, name, password, and avatar | No |
| `POST` | `/api/auth/login` | Authenticate with email & password, returns JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user's profile | Yes (Bearer JWT) |
| `PUT` | `/api/auth/profile` | Update user name or avatar (geometric preset or uploaded image) | Yes (Bearer JWT) |

### Forms Management (`/api/forms`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/forms` | List all accessible forms (owned + collaborated) | Optional |
| `GET` | `/api/forms/:id` | Fetch complete form definition by ID | No (Public) |
| `GET` | `/api/forms/slug/:slug` | Fetch form definition by custom short link slug | No (Public) |
| `POST` | `/api/forms` | Create a new blank or template form | Optional |
| `PUT` | `/api/forms/:id` | Update form questions, settings, or theme | Optional |
| `DELETE` | `/api/forms/:id` | Delete a form and its responses | Yes |
| `POST` | `/api/forms/:id/duplicate` | Duplicate an existing form | Optional |
| `POST` | `/api/forms/:id/slug` | Update custom short link slug | Optional |

### Google Forms 1-Click Import (`/api/forms/google-addon`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/forms/google-addon/import-url` | Parse any public Google Form URL, convert questions, enable voice, and save | Optional |

### Collaborators / Add Users (`/api/forms/:id/collaborators`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/forms/check-user?email=:email` | Verify if an email belongs to an existing VoxForm user | Optional |
| `GET` | `/api/forms/:id/collaborators` | List collaborators for a form | Optional |
| `POST` | `/api/forms/:id/collaborators` | Add a verified user as an Editor or Viewer | Optional |
| `PUT` | `/api/forms/:id/collaborators/:userId` | Update collaborator role (`editor` / `viewer`) | Optional |
| `DELETE` | `/api/forms/:id/collaborators/:userId` | Remove a collaborator's access to the form | Optional |

### Responses & Submissions (`/api/forms/:id`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/forms/:id/submit` | Submit a completed form response | No (Public) |
| `GET` | `/api/forms/:id/responses` | List all responses and computed analytics for a form | Optional |
| `GET` | `/api/forms/:id/export/csv` | Download responses as a formatted CSV file | Optional |
| `GET` | `/api/forms/:id/export/json` | Download responses as structured JSON | Optional |

### Voice Transcription & File Uploads

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/transcribe` | Upload an audio blob (multipart/form-data) for AI speech cleanup | No |
| `GET` | `/api/transcribe/status` | Check if server Voice AI API key is configured | No |
| `POST` | `/api/forms/upload` | Upload an image or file attachment (multipart/form-data) | Optional |

---

## 🚀 Getting Started & Local Development

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

Clone the repository and install all dependencies:

```bash
# Clone the repository
git clone https://github.com/your-username/Voice-to-text-form.git
cd Voice-to-text-form

# Install dependencies for both root, client, and server
npm run install:all
```

### Environment Configuration

Create a `.env` file in the `server` directory:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your settings:

```env
# Server Port
PORT=5000

# Voice AI Speech Engine Key (optional for development; browser Web Speech fallback is included)
VOICE_AI_API_KEY=your_voice_ai_key_here

# JWT Secret for user session tokens
JWT_SECRET=voxform_super_secret_jwt_key_2026

# Optional External Database (defaults to persistent JSON storage in server/data/)
# MONGODB_URI=mongodb://localhost:27017/voxform
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/voxform
```

### Running the Application

You can launch both the frontend and backend concurrently using the built-in development runner:

```bash
npm run dev
```

Or run each service individually in separate terminal sessions:

```bash
# Terminal 1: Backend Server (runs on http://localhost:5000)
npm run dev:server

# Terminal 2: Frontend Client with Vite HMR (runs on http://localhost:5173)
npm run dev:client
```

Open your browser to:
- **Client Application**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api/transcribe/status`

---

## 🚢 Production Deployment

For full deployment instructions, see the dedicated [DEPLOYMENT.md](./DEPLOYMENT.md) guide.

### Key Production Requirements:
1. **HTTPS (SSL/TLS)**: Modern web browsers strictly require HTTPS to access the microphone API (`navigator.mediaDevices.getUserMedia`). Deploying to platforms like Render, Railway, Vercel, or Fly.io automatically provides free SSL certificates.
2. **Production Build**:
   ```bash
   # Build the production Vite bundle
   npm run build

   # Start the production server (serves API and compiled client)
   npm start
   ```

### Docker Deployment

Run the containerized stack with Docker Compose:

```bash
docker compose up -d --build
```

---

## ❓ Troubleshooting & FAQs

#### 1. The microphone button does not activate or shows "Microphone access denied"
- **Cause**: The browser blocked microphone permissions or the connection is not secure.
- **Fix**:
  - In your browser's address bar, click the camera/lock icon and grant **Microphone** permission.
  - In production, ensure the site is served over **`https://`**. Browsers disallow audio capture on unencrypted `http://` (with the exception of `http://localhost`).

#### 2. How does speech transcription work without an API key?
- VoxForm includes a seamless dual-engine architecture:
  - If `VOICE_AI_API_KEY` is present in `server/.env`, audio is processed by the backend Neural AI model for enhanced punctuation, filler word removal, and capitalization.
  - If no key is configured, VoxForm automatically activates the client's built-in browser Web Speech API (`webkitSpeechRecognition`), ensuring voice dictation works out-of-the-box in Chrome, Edge, and Safari without any external setup.

#### 3. Why did a Google Form import fail?
- Ensure the Google Form is **public** and does not have *"Restrict to users in your organization"* or *"Requires Google sign-in to view"* checked in its settings.
- Both responder links (`/viewform`) and edit links (`/edit`) are supported.

#### 4. Where is form and user data stored?
- By default, VoxForm uses a zero-configuration persistent JSON file store located at `server/data/forms.json` and `server/data/users.json`.
- For enterprise or scalable deployments, simply provide `MONGODB_URI` or `DATABASE_URL` (PostgreSQL) in `server/.env`, and the application automatically switches to the database adapter.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
