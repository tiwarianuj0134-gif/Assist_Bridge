# Vercel Deployment - Complete Setup Guide

## **Step 1: Prepare Your Projects**

### Frontend Setup
```bash
cd your-project-folder
npm run build  # Test build locally
```

### Backend Setup
```bash
cd backend
npm run build  # Compile TypeScript
```

---

## **Step 2: Vercel Deployment - Frontend**

### A. Connect GitHub Repo
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select root folder (not backend folder)

### B. Build Settings
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### C. Environment Variables (Add in Vercel Dashboard)
```
VITE_API_BASE_URL = https://your-backend-api.vercel.app/api/v1
VITE_WEB3_RPC_URL = https://sepolia.infura.io/v3/YOUR_INFURA_KEY
VITE_OPENAI_API_KEY = sk-your-key
VITE_WALLET_CONNECT_ID = your-id
```

### D. Deploy
Click "Deploy"

---

## **Step 3: Backend Deployment**

### Option A: Deploy Backend Separately (Recommended)
1. Create separate GitHub repo for backend OR use monorepo
2. Create new Vercel project for backend
3. Set root directory to `backend/`

### Option B: Use Vercel Serverless Functions
1. Create `api/` folder in root:
```
api/
  index.ts (your express app)
vercel.json
```

---

## **Step 4: MongoDB Atlas Setup**

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Add to Vercel env: `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname`

---

## **Step 5: Update CORS Settings**

Edit `backend/src/server.ts`:
```typescript
app.use(cors({
  origin: [
    'https://your-frontend-domain.vercel.app',
    'https://www.your-frontend-domain.com',
    'http://localhost:5173',  // Keep for local testing
    'http://localhost:5174',
  ],
  credentials: true
}));
```

---

## **Step 6: API Endpoints**

Update `src/services/api.ts` (already configured):
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// All API calls use VITE_API_BASE_URL
const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});
```

---

## **Step 7: Important Environment Variables Needed**

### Frontend (.env.production)
```
VITE_API_BASE_URL=https://backend-api.vercel.app/api/v1
VITE_WEB3_RPC_URL=https://sepolia.infura.io/v3/KEY
VITE_OPENAI_API_KEY=sk-...
VITE_WALLET_CONNECT_ID=...
VITE_CONTRACT_ADDRESS=0x...
VITE_NETWORK_ID=11155111
```

### Backend (.env.production)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
PORT=3000
NODE_ENV=production
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-domain.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password
```

---

## **Step 8: Important Checklist**

- [ ] All API URLs use environment variables
- [ ] CORS origins updated for production domains
- [ ] MongoDB connection string added to Vercel
- [ ] All API keys added to Vercel dashboard
- [ ] JWT_SECRET is strong (min 32 characters)
- [ ] Database migrations run on production
- [ ] File uploads configured (AWS S3 or alternative)
- [ ] Email service configured
- [ ] Web3 RPC endpoint configured
- [ ] Admin panel access restricted

---

## **Step 9: Vercel Dashboard Environment Variables**

Go to Project Settings → Environment Variables and add:

### For Frontend Project
```
VITE_API_BASE_URL = (your backend URL)
VITE_WEB3_RPC_URL = (RPC endpoint)
VITE_OPENAI_API_KEY = (your key)
```

### For Backend Project
```
MONGODB_URI = (your connection string)
JWT_SECRET = (strong secret)
OPENAI_API_KEY = (your key)
FRONTEND_URL = (your frontend domain)
NODE_ENV = production
```

---

## **Step 10: Security Settings**

1. **Enable Production Branch Protection**
   - Settings → Git → Production Branch: main
   
2. **Add Environment Protection**
   - Mark sensitive variables as "Sensitive" in Vercel

3. **Enable HTTPS** (automatic on Vercel)

4. **Rate Limiting** - Add to backend:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

---

## **Step 11: Testing**

1. Test frontend: `https://your-app.vercel.app`
2. Test API: `curl https://your-api.vercel.app/api/v1/auth/status`
3. Check logs in Vercel dashboard
4. Monitor errors with Sentry (optional)

---

## **Step 12: Custom Domain**

1. Go to Vercel → Project Settings → Domains
2. Add custom domain
3. Update DNS records:
   ```
   CNAME yourdomain.com verify-asdf.vercel.app
   ```

---

## **Troubleshooting**

| Issue | Solution |
|-------|----------|
| CORS errors | Update CORS origins in server.ts |
| API 502 errors | Check MongoDB connection string |
| Environment vars not loading | Redeploy after adding variables |
| Build fails | Run `npm run build` locally to test |
| Database connection timeout | Whitelist Vercel IPs in MongoDB |

---

## **Quick Deployment Commands**

```bash
# Test build locally
npm run build
npm run build:backend

# Deploy to Vercel via CLI
npm i -g vercel
vercel deploy --prod

# Check status
vercel logs
```

---

## **Important Links to Get Started**

1. **MongoDB Atlas:** https://cloud.mongodb.com
2. **OpenAI API Keys:** https://platform.openai.com/api-keys
3. **Infura RPC:** https://infura.io
4. **Vercel Dashboard:** https://vercel.com/dashboard
5. **Vercel Docs:** https://vercel.com/docs

---

**Your Frontend URL:** https://your-app.vercel.app
**Your Backend URL:** https://your-api.vercel.app/api/v1

