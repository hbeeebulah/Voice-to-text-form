# VoxForm AI — Intelligent Voice-First Form Studio

**VoxForm AI** is a modern, full-stack customizable form builder and responder web application featuring seamless multimodal voice-to-text dictation powered by an advanced **Neural Voice AI Engine**.

Built with a high-performance **React** frontend (Tailwind CSS, Lucide icons, HTML5 Canvas soundwave visualizer) and a **Node.js / Express** backend paired with a flexible Data Access Layer supporting persistent local JSON storage, **PostgreSQL**, and **MongoDB**.

---

## 🌟 Key Features

### 1. Multimodal Voice-to-Text Dictation
- **Targeted Input Fields**: Automatically equipped on **Short Answer** and **Paragraph** text fields to eliminate the friction of typing long responses.
- **In-Browser Audio Capture**: Uses the native HTML5 `MediaRecorder` API with echo cancellation and noise suppression.
- **Real-time Soundwave Visualizer**: Canvas-based frequency analyzer that reacts dynamically to respondent speech using the Web Audio API.
- **Elapsed Recording Timer**: Formatted timer (`00:08 / 02:00`) with visual recording pulsing badge.
- **Speech Polishing with Neural AI Engine**:
  - Automatically strips speech disfluencies (*"um"*, *"uh"*, *"like"*, *"you know"*, stuttering, or repeated words).
  - Formats natural punctuation, sentence casing, numbers, and bullet points.
  - Aligns contextually with question titles and descriptions.
- **Append or Replace Prompt**: When re-dictating into a field with existing text, respondents can easily choose to append or replace.

### 2. Form Builder Studio
- **Modern Canvas Layout**: Clean card architecture, interactive focus states, and quick-action floating toolbars.
- **Question Reordering**: Seamless drag-and-drop reordering with grip handles plus accessible Up/Down controls.
- **Supported Question Types**:
  - **Short Answer** (voice-enabled)
  - **Paragraph** (voice-enabled)
  - **Multiple Choice** (radio selections with custom option management)
  - **Checkboxes** (multi-select)
  - **Dropdown** (compact menu)
  - **Linear Scale** (configurable min 0-1, max 3-10, with custom min/max labels)
- **Autosaving**: Debounced autosaving of form drafts to the database with instant visual status feedback (*"Saving..."* ➔ *"Saved"*).
- **Template Library**: Pre-built templates (Blank Form, Customer Audio Feedback Survey, Daily Voice Journal, Executive Conference Registration).

### 3. Theme & Design Customizer Panel
- **Curated Visual Themes**:
  - **Modern Minimalist**: Crisp geometry, clean slate tones, and subtle borders.
  - **Vibrant Gradient**: Bold indigo/violet gradients, glowing interactive focus states.
  - **Warm Pastel**: Approachable amber, cream, and rose tones.
  - **Dark Executive**: Slate-900 / dark mode theme with emerald and cyan accents.
- **Accent Color Palettes**: 8 curated color swatches + custom hex color picker.
- **Background Styling**: Cool Slate, Crisp White, Warm Cream, Soft Lavender, Fresh Mint, Midnight Slate.
- **Typography Pairings**: Custom typography pairings for headers (Inter, Plus Jakarta Sans, Playfair Display, Montserrat, Space Grotesk, Roboto) and body text (Inter, Roboto, Lora, Plus Jakarta Sans).

### 4. Public Form Responder Experience
- Applies chosen visual theme, typography, and styling to the public form.
- Real-time progress bar tracking completion percentage.
- Instant client-side validation for required questions with smooth scrolling to the first invalid field.
- Thank-you confirmation screen with submission receipt review and "Submit another response" option.
- Graceful handling of microphone permissions with helpful step-by-step guidance.

### 5. Creator Authentication & Sign in with Google
- **Sign in with Google**:
  - Integrated with official **Google Identity Services (GSI)** for instant, secure sign-in with Google accounts.
  - Form creators can link their Google Account, import their profile photo, and authenticate with 1 click.
  - Flexible setup: works with real Google Cloud OAuth 2.0 Web Client IDs (`GOOGLE_CLIENT_ID`) and includes a convenient 1-click test mode for development.
  - Dedicated **Google OAuth Settings** modal with step-by-step guidance on setting up credentials in Google Cloud Console.
- **Email & Password Authentication**:
  - Full registration and login system with bcrypt password hashing and secure JWT session tokens.
  - Form validation with error alerts, show/hide password toggles, and "Remember me" options.
  - 1-Click Demo Creator Login for instant reviewer testing without filling in credentials.
- **Creator Profile & Ownership**:
  - Dynamic user avatar in top Navbar with Google badge indicator and interactive profile menu.
  - Forms are automatically attributed to their creator's account.
  - Responders can still access and submit public forms (`#form/:id`) seamlessly without requiring login.

### 6. Creator Response Analytics Dashboard
- Metric highlight cards: Total submissions count, Voice dictation adoption percentage, and latest activity timestamp.
- **Summary Charts**:
  - Multiple Choice / Dropdown: Interactive bar distributions with percentage breakdowns.
  - Checkboxes: Selection frequency charts.
  - Linear Scale: Calculated average rating score and score distribution bars.
  - Short Answer & Paragraph: List of responses with a **Voice Dictated** badge.
- **Individual Submission View**: Browse responses one-by-one with timestamp and complete answers.
- **Data Exports**: Instant 1-click **Export to CSV** and **Export to JSON**.

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Running Locally
To launch both the backend server and frontend development server concurrently:
```bash
node run-dev.js
```
Open your browser to:
- **Client Dev Server (Vite HMR):** `http://localhost:5175`
- **Full-Stack Server (Production Build):** `http://localhost:5000`

---

## 🚢 Production Deployment

For full deployment instructions, see the dedicated [DEPLOYMENT.md](./DEPLOYMENT.md) guide.

### 1-Click Deployment (Render / Railway)
1. Push your repository to GitHub.
2. In **Render** or **Railway**, create a new Web Service from your repository.
3. Configure:
   - **Build Command:** `npm run install:all && npm run build`
   - **Start Command:** `npm start`
4. Set your environment variables:
   - `NODE_ENV=production`
   - `VOICE_AI_API_KEY=your_voice_ai_key_here`
5. Deploy! Both frontend and backend are hosted on a single secure `https://` domain with automatic SSL (required for microphone access).

### Docker Deployment
```bash
# Build and run containerized stack
docker compose up -d --build
```

---

## 🔑 Activating Voice AI Speech Engine
 
1. Add your Voice AI key to `server/.env`:
   ```env
   VOICE_AI_API_KEY=your_actual_api_key_here
   ```
2. Or activate it directly from the web application by clicking the **Voice AI** badge in the top navigation bar.

---

## 🔐 Configuring Sign In with Google (OAuth 2.0)

1. Obtain a **Web Client ID** from [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add your application's domain (e.g., `http://localhost:5173` or your production domain) under **Authorized JavaScript origins**.
3. Set your Client ID either:
   - In `server/.env`:
     ```env
     GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
     ```
   - Or directly in the web UI by clicking the **Settings (gear)** icon on the Google Sign-In button or inside the Creator profile menu!
