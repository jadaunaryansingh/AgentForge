# 🔐 Environment Variables Setup Guide

## For Render (Backend API)

Copy these variable names to Render dashboard and fill in YOUR actual values from your local `.env` file:

```
DATABASE_URL=<copy from your apps/api/.env>
NEON_JWT_SECRET=<copy from your apps/api/.env>
SECRET_KEY=<generate new random string>
GROQ_API_KEY=<copy from your apps/api/.env>
GROQ_MODEL=llama-3.3-70b-versatile
GEMINI_API_KEY=<copy from your apps/api/.env>
GEMINI_MODEL=gemini-2.5-flash
REDIS_URL=redis://localhost:6379
APP_ENV=production
CORS_ORIGINS=["https://your-vercel-url.vercel.app"]
```

## For Vercel (Frontend)

```
VITE_API_URL=https://your-render-service.onrender.com
```

## Generate New SECRET_KEY

Run this command to generate a secure random key:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Important Security Notes

1. **NEVER commit `.env` files** to Git
2. **NEVER put real API keys** in documentation files
3. **Always use environment variables** in deployment platforms
4. **Generate a NEW SECRET_KEY** for production (don't reuse development key)
5. **Rotate API keys** if they are ever exposed

## Where to Find Your Values

- `DATABASE_URL`: From your Neon dashboard
- `NEON_JWT_SECRET`: From your Neon Auth settings
- `GROQ_API_KEY`: From https://console.groq.com
- `GEMINI_API_KEY`: From https://makersuite.google.com/app/apikey

## After Deployment

1. Update `CORS_ORIGINS` with your actual Vercel URL
2. Test the health endpoint
3. Test authentication flow
4. Monitor logs for errors
