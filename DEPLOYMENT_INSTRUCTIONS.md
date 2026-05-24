# 🚀 AgentForge Deployment Instructions

## Quick Deploy to Render & Vercel

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy Backend to Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: agentforge-api
   - **Root Directory**: `apps/api`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

5. Add Environment Variables (use your actual values from `.env` file):
   ```
   DATABASE_URL=<your_neon_database_url>
   NEON_JWT_SECRET=<your_neon_auth_url>
   SECRET_KEY=<generate_random_32_char_string>
   GROQ_API_KEY=<your_groq_key>
   GROQ_MODEL=llama-3.3-70b-versatile
   GEMINI_API_KEY=<your_gemini_key>
   GEMINI_MODEL=gemini-2.5-flash
   REDIS_URL=redis://localhost:6379
   APP_ENV=production
   CORS_ORIGINS=["https://your-app.vercel.app"]
   ```

6. Click "Create Web Service"

### Step 3: Deploy Frontend to Vercel

**Option A: Using Vercel CLI**
```bash
npm install -g vercel
cd apps/web
vercel --prod
```

**Option B: Using Vercel Dashboard**
1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   - `VITE_API_URL` = `https://your-service.onrender.com`
6. Click "Deploy"

### Step 4: Update CORS

After Vercel deployment:
1. Get your Vercel URL
2. Update `CORS_ORIGINS` in Render environment variables
3. Redeploy backend

### Step 5: Test

- Backend: `https://your-service.onrender.com/health`
- Frontend: `https://your-app.vercel.app`

---

## 📝 Important Notes

- **Never commit `.env` files** - they contain sensitive data
- **Use environment variables** in Render/Vercel dashboards
- **Copy values from your local `.env`** file to deployment platforms
- **Generate a new SECRET_KEY** for production:
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```

---

## 🔐 Security Checklist

- [ ] `.env` files are in `.gitignore`
- [ ] No API keys in documentation files
- [ ] Environment variables set in Render dashboard
- [ ] Environment variables set in Vercel dashboard
- [ ] New SECRET_KEY generated for production
- [ ] CORS properly configured

---

## 🐛 Troubleshooting

### Build Fails
- Check all dependencies are in `requirements.txt`
- Verify Python version in `runtime.txt`

### Database Connection Fails
- Ensure Neon database is not paused
- Verify DATABASE_URL is correct

### CORS Errors
- Update CORS_ORIGINS with your actual Vercel URL
- Redeploy backend after updating

---

**For detailed instructions, see the README files in the repository.**
