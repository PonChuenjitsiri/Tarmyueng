# Security Guidelines

## 🔐 Secrets Management

This project uses environment variables for all sensitive data. **Never commit secrets to the repository.**

### Development (.env file)
- **Location:** `.env` (gitignored)
- **Usage:** `docker compose -f docker-compose.dev.yml up`
- Contains default dev credentials for local testing only

### Production (.env file)
- **Location:** `.env` on your deployment server (NOT in git)
- **Usage:** `docker compose up -d --build`
- Must contain real, secure credentials

### What MUST be in your `.env`
```
JWT_SECRET=your-long-random-secret
SENDER_PASSWORD=your-gmail-app-password
EASYSLIP_API_KEY=your-easyslip-key
POSTGRES_PASSWORD=your-strong-password
MINIO_SECRET_KEY=your-strong-password
```

## ✅ Safe to Commit
- `appsettings.json` - contains only default/placeholder values
- `.env.example` - template showing required variables (no real values)
- All source code
- Configuration files (Dockerfile, docker-compose.yml)
- Documentation

## ❌ Never Commit
- `.env` - contains real secrets
- `.env.production`
- `.env.production.local`
- Any `appsettings.Production.json`
- Database backups
- Log files

## 🔑 Important Secrets to Change Before Deployment

1. **JWT_SECRET** - Change in `.env`
2. **Database Password** - Change in `.env` (POSTGRES_PASSWORD)
3. **MinIO Secret Key** - Change in `.env` (MINIO_SECRET_KEY)
4. **Gmail App Password** - Set in `.env` (SENDER_PASSWORD)
5. **EasySlip API Key** - Set in `.env` (EASYSLIP_API_KEY)

## 🚀 Cloudflare Tunnel Setup

When using Cloudflare Tunnel (`config.yml`):
- The tunnel credentials file is created in `~/.cloudflared/`
- Never commit this file to git
- It's specific to your machine/account

## 📋 Pre-Deployment Checklist

Before deploying to production:
- [ ] `.env` is in `.gitignore`
- [ ] All secrets are in `.env` (not in code)
- [ ] `.env.example` has no real values
- [ ] appsettings.json uses placeholders
- [ ] CORS is set to your production domain
- [ ] JWT_SECRET is strong and random
- [ ] Database password is strong
- [ ] Email credentials are correct

## 🔗 Related Files
- `.gitignore` - Defines what not to commit
- `.env.example` - Template for required variables
- `appsettings.json` - Default config (safe to commit)
- `.cloudflared/config.yml` - Local Cloudflare tunnel config (not committed)
