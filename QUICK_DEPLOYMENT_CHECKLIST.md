# 🚀 VERCEL DEPLOYMENT - QUICK CHECKLIST

## **BEFORE YOU START:**
- [ ] All source code committed to GitHub
- [ ] No `.env` files committed (add to .gitignore)
- [ ] All API keys and secrets are NOT in code
- [ ] Locally tested: `npm run dev` works perfectly

---

## **STEP 1: Create MongoDB Database (5 minutes)**
- [ ] Go to https://cloud.mongodb.com
- [ ] Sign up / Login
- [ ] Create free cluster
- [ ] Get connection string: `mongodb+srv://username:password@...`
- [ ] Save this securely

---

## **STEP 2: Get Required API Keys (10 minutes)**
- [ ] **OpenAI API Key**: https://platform.openai.com/api-keys
- [ ] **Infura RPC Key**: https://infura.io (for Web3)
- [ ] **WalletConnect ID**: https://cloud.walletconnect.com
- [ ] Save all these securely

---

## **STEP 3: Deploy Backend to Vercel (10 minutes)**
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import GitHub repository
4. **Root Directory**: `backend/`
5. **Build Command**: `npm run build`
6. **Output Directory**: `.` (leave default)
7. **Environment Variables** - Add these:
   ```
   MONGODB_URI = your-mongodb-connection-string
   JWT_SECRET = create-a-random-32-char-string-here
   NODE_ENV = production
   OPENAI_API_KEY = sk-...your-key...
   FRONTEND_URL = https://your-frontend-domain.vercel.app
   ```
8. Click "Deploy"
9. **Copy your backend URL**: e.g., `https://assetbridge-api.vercel.app`

---

## **STEP 4: Deploy Frontend to Vercel (10 minutes)**
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import same GitHub repository
4. **Root Directory**: `.` (or leave blank - root)
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`
7. **Environment Variables** - Add these:
   ```
   VITE_API_BASE_URL = https://your-backend-url/api/v1
   VITE_WEB3_RPC_URL = https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   VITE_OPENAI_API_KEY = sk-...your-key...
   VITE_WALLET_CONNECT_ID = your-wallet-connect-id
   VITE_CONTRACT_ADDRESS = 0x...your-contract-address...
   VITE_NETWORK_ID = 11155111
   ```
8. Click "Deploy"
9. **Copy your frontend URL**: e.g., `https://assetbridge.vercel.app`

---

## **STEP 5: Update Environment Variables (5 minutes)**
- [ ] In **Backend** Vercel Project:
  - [ ] Update `FRONTEND_URL` to your frontend URL
- [ ] In **Frontend** Vercel Project:
  - [ ] Already set `VITE_API_BASE_URL` in step 4

---

## **STEP 6: Whitelist Vercel IPs in MongoDB (5 minutes)**
1. Go to MongoDB Atlas dashboard
2. Network Access
3. Add IP Address
4. Click "Allow access from anywhere" OR add:
   ```
   0.0.0.0/0
   ```
5. This allows Vercel to connect

---

## **STEP 7: Test Everything (10 minutes)**
- [ ] Open frontend URL: `https://your-app.vercel.app`
- [ ] Try to login - check if API calls work
- [ ] Check browser console for errors (F12)
- [ ] Check Vercel Logs:
  - Backend: Project → Logs
  - Frontend: Project → Logs
- [ ] Check MongoDB: Collections have data?

---

## **STEP 8: Setup Custom Domain (Optional)**
If you have a custom domain like `assetbridge.com`:
1. In Vercel → Project Settings → Domains
2. Add your domain
3. Update DNS records (Vercel will show you how)
4. Wait 24-48 hours for DNS propagation

---

## **STEP 9: Enable HTTPS & Security (5 minutes)**
- [ ] HTTPS is automatic on Vercel ✅
- [ ] All API calls use HTTPS ✅
- [ ] Secrets are in environment variables ✅
- [ ] No sensitive data in code ✅

---

## **STEP 10: Monitor & Maintain**
- [ ] Check logs daily for errors
- [ ] Monitor MongoDB usage
- [ ] Monitor API rate limits
- [ ] Backup database monthly
- [ ] Update dependencies quarterly

---

## **🆘 TROUBLESHOOTING**

### Problem: "CORS error in browser console"
**Solution:**
- Check backend `FRONTEND_URL` env variable is correct
- Restart backend deployment
- Clear browser cache (Ctrl+Shift+Delete)

### Problem: "Cannot connect to database"
**Solution:**
- Check `MONGODB_URI` is correct
- MongoDB IP whitelist includes `0.0.0.0/0`
- Try connection string locally first

### Problem: "API returns 502 Bad Gateway"
**Solution:**
- Check backend logs in Vercel
- Verify all environment variables are set
- Redeploy backend

### Problem: ".env file not loading"
**Solution:**
- Use Vercel Dashboard to set env variables (not .env files)
- Env files don't sync to Vercel
- Redeploy after adding variables

### Problem: "Module not found errors"
**Solution:**
- Run `npm install` locally
- Check TypeScript compilation: `npm run build`
- Check all imports are correct

---

## **📋 IMPORTANT CREDENTIALS TO KEEP SAFE**

| Name | Where to Store | Never Share |
|------|----------------|-------------|
| MONGODB_URI | Vercel Env | ✅ Secret |
| JWT_SECRET | Vercel Env | ✅ Secret |
| OpenAI Key | Vercel Env | ✅ Secret |
| API Keys | Vercel Env | ✅ Secret |

---

## **🔗 USEFUL LINKS**

| Service | Link |
|---------|------|
| Vercel Dashboard | https://vercel.com/dashboard |
| MongoDB Atlas | https://cloud.mongodb.com |
| OpenAI API | https://platform.openai.com/api-keys |
| Infura RPC | https://infura.io |
| WalletConnect | https://cloud.walletconnect.com |

---

## **📞 NEED HELP?**

1. Check logs in Vercel Dashboard
2. Read VERCEL_DEPLOYMENT_GUIDE.md (detailed guide)
3. Check error messages carefully
4. Search Vercel docs: https://vercel.com/docs

---

**Status:** Ready to Deploy ✅
**Total Time:** ~1 hour
**Cost:** FREE (with free tier)

