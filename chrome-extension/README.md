# VoxForm Voice-to-Text for Google Forms (Chrome Extension)

This folder (`chrome-extension/`) contains the installable **Manifest V3 Chrome Extension** that automatically injects a **"🎙️ Dictate with VoxForm"** button directly into every Short Answer and Paragraph field on **any Google Form** (`https://docs.google.com/forms/*`).

---

## How to Install & Test in Chrome / Edge / Brave (Takes 30 Seconds)

1. Open Chrome and go to:
   `chrome://extensions`
2. Turn on **Developer mode** (the toggle switch in the top-right corner).
3. Click **Load unpacked** (top-left button).
4. Select the **`chrome-extension`** folder inside your project:
   `C:\Users\DELL\Voice-to-text-form\chrome-extension`
5. Click the **VoxForm Extension icon** in your browser toolbar to set your VoxForm Server URL (defaults to `https://voice-to-text-form.onrender.com`, or set it to `http://localhost:5000` when testing locally).
6. Open **any Google Form responder page** (`https://docs.google.com/forms/d/e/.../viewform`):
   - Every Short Answer and Paragraph box will now have a **🎙️ Dictate with VoxForm** button!
   - Click it, speak your answer, and click **Done** — your spoken words are transcribed, cleaned of filler words, and inserted natively into Google Forms (with a 1-click **Undo** button).
