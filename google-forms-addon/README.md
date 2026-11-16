# VoxForm Voice-to-Text — Google Forms Creator Add-on

This folder contains the official **Google Forms Creator Add-on** (`Code.gs`, `Sidebar.html`, and `appsscript.json`).

It lets any form creator click **"Activate Voice-to-Text"** inside Google Forms to:
1. Automatically read all questions from their Google Form (`Short Answer`, `Paragraph`, `Multiple Choice`, `Checkboxes`, `Dropdown`, and `Linear Scale`).
2. Generate a **Voice-Enabled VoxForm Link & QR Code** that respondents can open on any phone or computer (with zero installation required).
3. Automatically forward every voice response back into the creator's **Google Form Responses tab & Google Sheet** in real time.

---

## How to Install & Test Inside Any Google Form (Takes 60 Seconds)

1. Open your Google Form in the editor (`docs.google.com/forms`).
2. Click the **three dots (`⋮`)** in the top-right corner and select **Script editor** (Apps Script).
3. In the Apps Script editor:
   - Replace the contents of `Code.gs` with [`google-forms-addon/Code.gs`](./Code.gs).
   - Click the **`+` (Add a file) -> HTML**, name it **`Sidebar`** (so it shows as `Sidebar.html`), and paste the contents of [`google-forms-addon/Sidebar.html`](./Sidebar.html).
   - Click **Save** (`Ctrl+S`).
4. Reload your Google Form tab. You will now see the puzzle-piece **Add-ons** icon (or **VoxForm Voice-to-Text** menu):
   - Click **Open Voice-to-Text Sidebar**.
   - Enter your deployed Render URL (e.g. `https://your-app-name.onrender.com`).
   - Click **🎙️ Activate Voice-to-Text**.

---

## How to Publish to the Google Workspace Marketplace (So Anyone Can Install It)

1. Create a standard project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Workspace Marketplace SDK** in APIs & Services.
3. In your Apps Script project settings (**⚙️ Project Settings**), link your Google Cloud Project Number and click **Deploy -> New deployment -> Add-on**.
4. In the Google Workspace Marketplace SDK configuration:
   - Check **Editor Add-on** -> **Forms Add-on**.
   - Paste your Script ID and Deployment Version.
   - Choose **Public** (for everyone) or **Unlisted** (anyone with the link can install).
