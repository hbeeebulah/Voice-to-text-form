# Production Deployment Guide: VoxForm AI

This guide walks you through deploying **VoxForm AI** as a live, secure production web application.

---

## 🔒 Crucial Prerequisite: HTTPS & Microphone Access

Modern web browsers (Google Chrome, Apple Safari, Microsoft Edge, Mozilla Firefox) require an **HTTPS (SSL/TLS)** connection to grant access to the user's microphone via the `navigator.mediaDevices.getUserMedia` API (with the only exception being `http://localhost`).

> **Good news:** When deploying to **Render**, **Railway**, **Vercel**, or **Fly.io**, an SSL certificate (`https://`) is automatically provisioned and managed for your domain for free.

---

## 🚀 Option 1: Deploy to Render (Recommended - Fastest & Free)

Render allows you to deploy the full-stack application (frontend + backend + persistent storage) from your GitHub repository.

### Steps:
1. Push your project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of VoxForm AI"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** ➔ **Web Service**.
3. Connect your GitHub repository.
4. Render will auto-detect the configuration, or configure it with:
   - **Environment:** `Node`
   - **Build Command:** `npm run install:all && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. In the **Environment Variables** section, add:
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: Your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - *(Optional)* `MONGODB_URI` or `DATABASE_URL` if connecting to MongoDB Atlas or Supabase PostgreSQL.
6. Click **Deploy Web Service**.
7. Once finished, Render gives you a live URL like `https://voxform-ai.onrender.com`.

---

## 🚂 Option 2: Deploy to Railway

Railway offers seamless zero-configuration deployments with built-in database plugins.

### Steps:
1. Go to [Railway.app](https://railway.app/) and create a new project.
2. Select **Deploy from GitHub repo** and choose your repository.
3. In **Variables**, add:
   - `GEMINI_API_KEY`: `your_key_here`
   - `NODE_ENV`: `production`
   - `PORT`: Railway will automatically provide this, but our app defaults to it gracefully.
4. *(Optional)* Click **New** ➔ **Database** ➔ **Add PostgreSQL** or **Add MongoDB**. Railway will automatically populate `DATABASE_URL` or `MONGODB_URI`, which our backend automatically detects and connects to!
5. In **Settings**, generate a domain (e.g., `voxform.up.railway.app`).

---

## 🐳 Option 3: Deploy with Docker (Any VPS, DigitalOcean, AWS EC2, Hetzner)

The project includes a multi-stage `Dockerfile` and `docker-compose.yml`.

### On your server:
1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/voxform-ai.git
   cd voxform-ai
   ```
2. Create an environment file:
   ```bash
   echo "GEMINI_API_KEY=your_gemini_api_key_here" > server/.env
   ```
3. Build and run with Docker Compose:
   ```bash
   docker compose up -d --build
   ```
4. Configure Nginx with SSL (Let's Encrypt / Certbot) as a reverse proxy to `http://localhost:5000`:
   ```nginx
   server {
       server_name forms.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           client_max_body_size 50M;
       }
   }
   ```
5. Install SSL certificate:
   ```bash
   sudo certbot --nginx -d forms.yourdomain.com
   ```

---

## 🗄️ Production Database Configuration

By default, VoxForm AI stores data in atomic, persistent JSON files in `server/data/`. For large-scale production workloads with thousands of respondents:

### Using MongoDB Atlas:
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Get the connection string: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/voxform?retryWrites=true&w=majority`
3. Add `MONGODB_URI` to your deployment environment variables.

### Using Supabase or Neon (PostgreSQL):
1. Create a free database on [Supabase](https://supabase.com/) or [Neon](https://neon.tech/).
2. Copy the PostgreSQL connection URI.
3. Add `DATABASE_URL` to your deployment environment variables.

---

## ✅ Deployment Verification Checklist

- [ ] Web application loads over `https://`
- [ ] Voice dictation button requests browser microphone permissions cleanly
- [ ] Speech recording wave visualizer responds to voice input
- [ ] Transcribed text populates form field with disfluencies removed and proper punctuation
- [ ] Responses save to database and display immediately in Creator Analytics
- [ ] CSV and JSON exports download cleanly
