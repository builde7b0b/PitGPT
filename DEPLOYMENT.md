# 🚀 Deployment Guide - PitGPT

## Quick Deploy to Netlify (FREE - Recommended)

### Method 1: One-Click Deploy via Netlify Dashboard

1. **Build the project:**
   ```bash
   cd pitgpt---toyota-gr-cup-ai-engineer
   npm install
   npm run build
   ```

2. **Deploy:**
   - Go to: https://app.netlify.com/drop
   - Drag and drop the `dist` folder
   - Your site is live! ✨

### Method 2: Connect GitHub Repository (Best for Updates)

1. **Push code to GitHub** (already done ✅)

2. **Connect to Netlify:**
   - Go to: https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub
   - Select: `builde7b0b/PitGPT`

3. **Build settings:**
   - **Base directory:** `pitgpt---toyota-gr-cup-ai-engineer`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `pitgpt---toyota-gr-cup-ai-engineer/dist`

4. **Environment variables (optional):**
   - `VITE_OPENAI_API_KEY` - For AI strategy features
   - (Not required - rule-based fallback works without it)

5. **Deploy!**
   - Netlify automatically builds on every git push
   - Get free URL: `pitgpt-xyz.netlify.app`

### Method 3: Netlify CLI

```bash
# Install CLI
npm install -g netlify-cli

# Build
cd pitgpt---toyota-gr-cup-ai-engineer
npm run build

# Deploy
cd ..
netlify deploy --prod --dir=pitgpt---toyota-gr-cup-ai-engineer/dist
```

---

## Alternative: Vercel (Also FREE)

### Via Dashboard:
1. Go to: https://vercel.com
2. Import GitHub repository: `builde7b0b/PitGPT`
3. **Root Directory:** `pitgpt---toyota-gr-cup-ai-engineer`
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. Deploy!

### Via CLI:
```bash
cd pitgpt---toyota-gr-cup-ai-engineer
npm install -g vercel
vercel
```

---

## Alternative: GitHub Pages

1. Update `vite.config.ts`:
   ```ts
   base: '/PitGPT/'
   ```

2. Install gh-pages:
   ```bash
   npm install -D gh-pages
   ```

3. Add to `package.json`:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

---

## What's Included

✅ **Optimized production build**
- Code splitting for faster loads
- Minified JavaScript and CSS
- Optimized assets

✅ **Netlify configuration**
- SPA routing support
- Security headers
- Performance caching

✅ **Free hosting**
- Free SSL certificate
- Global CDN
- Custom domain support (optional)

---

## Post-Deployment Checklist

- [ ] Test the live URL
- [ ] Verify telemetry streaming works
- [ ] Check data source panel displays correctly
- [ ] Test driver selection
- [ ] Verify AI strategy recommendations (if API key set)
- [ ] Test on mobile devices

---

**Recommended:** Netlify - Easiest, fastest, and most reliable! 🚀

**Your app will be live in under 5 minutes!**

