# 🚀 Deployment Guide - PitGPT

## Deploy to Netlify (Free & Easy)

### Option 1: Deploy via Netlify Dashboard

1. **Build the project locally first:**
   ```bash
   cd pitgpt---toyota-gr-cup-ai-engineer
   npm install
   npm run build
   ```

2. **Go to Netlify:**
   - Visit: https://app.netlify.com
   - Sign up/Login (free account)

3. **Drag & Drop Deploy:**
   - Drag the `dist` folder to Netlify dashboard
   - Your site will be live in seconds!

### Option 2: Deploy via Git (Recommended)

1. **Push to GitHub** (already done ✅)

2. **Connect to Netlify:**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub
   - Select repository: `builde7b0b/PitGPT`

3. **Configure build settings:**
   - **Base directory:** `pitgpt---toyota-gr-cup-ai-engineer`
   - **Build command:** `npm run build`
   - **Publish directory:** `pitgpt---toyota-gr-cup-ai-engineer/dist`
   - **Node version:** 18

4. **Environment variables** (if needed):
   - `VITE_OPENAI_API_KEY` = (optional - for AI features)

5. **Deploy!**
   - Netlify will automatically build and deploy
   - Get a free URL like: `pitgpt-xyz.netlify.app`

### Option 3: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
cd pitgpt---toyota-gr-cup-ai-engineer
npm run build

# Deploy
netlify deploy --prod
```

## Alternative: Vercel (Also Free)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd pitgpt---toyota-gr-cup-ai-engineer
   vercel
   ```

3. **Or connect GitHub repo:**
   - Go to https://vercel.com
   - Import GitHub repository
   - Auto-detects Vite/React

## Alternative: GitHub Pages

1. **Update `vite.config.ts`** base path:
   ```ts
   base: '/PitGPT/'
   ```

2. **Deploy:**
   ```bash
   npm run build
   # Push dist folder to gh-pages branch
   ```

## Post-Deployment

- ✅ Your app will be live at a free URL
- ✅ Updates automatically on git push (with Git deployment)
- ✅ Free SSL certificate
- ✅ Custom domain support (optional)

**Recommended: Netlify** - Easiest and most reliable for React/Vite apps!

