# Email Onebox - Complete Setup Guide

This guide will walk you through setting up the entire Email Onebox system from scratch.

## 📋 Prerequisites Checklist

Before you begin, ensure you have:

- ✅ **Node.js 18+** installed (`node --version`)
- ✅ **npm** installed (`npm --version`)
- ✅ **Docker Desktop** installed and running
- ✅ **OpenAI API Key** (get from https://platform.openai.com/api-keys)
- ✅ **2 Email Accounts** with IMAP access (Gmail recommended)
- ✅ **Slack Webhook URL** (optional, get from https://api.slack.com/messaging/webhooks)

## 🔧 Step 1: Install Dependencies

### Backend Dependencies
```bash
cd /Users/vikaschoudhary/Documents/outboxproject
npm install
```

### Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

## 📧 Step 2: Configure Email Accounts (Gmail)

### Enable IMAP in Gmail
1. Open Gmail
2. Click Settings (gear icon) → See all settings
3. Go to "Forwarding and POP/IMAP" tab
4. Enable IMAP
5. Save Changes

### Generate App Passwords
Since Gmail requires 2FA for app passwords:

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Create App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

3. **Repeat for second email account**

## 🔑 Step 3: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. **Important**: Add credits to your account at https://platform.openai.com/account/billing

## 💬 Step 4: Set Up Slack Webhook (Optional)

1. Go to https://api.slack.com/messaging/webhooks
2. Click "Create your Slack app"
3. Choose "From scratch"
4. Name your app (e.g., "Email Onebox")
5. Select your workspace
6. Go to "Incoming Webhooks"
7. Activate Incoming Webhooks
8. Click "Add New Webhook to Workspace"
9. Choose a channel
10. Copy the webhook URL (starts with `https://hooks.slack.com/services/`)

## 🌐 Step 5: Set Up Webhook.site (Optional)

1. Go to https://webhook.site
2. Copy your unique URL (e.g., `https://webhook.site/abc123...`)
3. This will receive webhook notifications for "Interested" emails

## ⚙️ Step 6: Configure Environment Variables

1. **Copy the example file**
```bash
cp .env.example .env
```

2. **Edit the .env file**
```bash
nano .env
# or use your preferred editor
```

3. **Fill in your credentials**
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Elasticsearch Configuration
ELASTICSEARCH_NODE=http://localhost:9200

# Email Account 1
EMAIL_1_ADDRESS=your-first-email@gmail.com
EMAIL_1_PASSWORD=abcd efgh ijkl mnop
EMAIL_1_IMAP_HOST=imap.gmail.com
EMAIL_1_IMAP_PORT=993

# Email Account 2
EMAIL_2_ADDRESS=your-second-email@gmail.com
EMAIL_2_PASSWORD=wxyz abcd efgh ijkl
EMAIL_2_IMAP_HOST=imap.gmail.com
EMAIL_2_IMAP_PORT=993

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-actual-key-here

# Slack Webhook (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# External Webhook (optional)
EXTERNAL_WEBHOOK_URL=https://webhook.site/your-unique-url

# RAG Configuration
PRODUCT_NAME=Job Application Assistant
OUTREACH_AGENDA=I am applying for job positions. If the lead is interested, share the meeting booking link: https://cal.com/example
```

4. **Save and close** (Ctrl+X, then Y, then Enter in nano)

## 🐳 Step 7: Start Elasticsearch

```bash
npm run docker:up
```

**Wait for Elasticsearch to be ready** (about 30-60 seconds):
```bash
# Check if Elasticsearch is ready
curl http://localhost:9200
```

You should see a JSON response with cluster information.

## 🏗️ Step 8: Build the Backend

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

## 🚀 Step 9: Start the Application

### Option A: Production Mode
```bash
npm start
```

### Option B: Development Mode (with auto-reload)
```bash
npm run dev
```

You should see logs like:
```
info: Starting Email Onebox Server...
info: Elasticsearch index 'emails' created
info: Elasticsearch initialized
info: RAG service initialized
info: Initialized 2 IMAP connections
info: IMAP connected for your-email@gmail.com
info: Fetching recent emails for your-email@gmail.com...
info: IDLE mode started for your-email@gmail.com
info: Server running on port 3000
```

## 🎨 Step 10: Start the Frontend

**In a new terminal window:**

```bash
cd /Users/vikaschoudhary/Documents/outboxproject/frontend
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## 🌟 Step 11: Access the Application

1. **Frontend UI**: http://localhost:5173
2. **Backend API**: http://localhost:3000/api
3. **Elasticsearch**: http://localhost:9200
4. **API Health Check**: http://localhost:3000/api/health

## 🧪 Step 12: Test with Postman

1. **Import the collection**
   - Open Postman
   - Click "Import"
   - Select `postman_collection.json` from the project root
   - Collection will be imported with all endpoints

2. **Test the endpoints**
   ```
   GET http://localhost:3000/api/health
   GET http://localhost:3000/api/emails
   GET http://localhost:3000/api/emails/search?query=test
   ```

3. **Get an email ID from the response and test:**
   ```
   POST http://localhost:3000/api/emails/{id}/categorize
   GET http://localhost:3000/api/emails/{id}/suggest-reply
   ```

## 📊 Step 13: Verify Everything Works

### Check Email Sync
1. Open the frontend at http://localhost:5173
2. You should see emails from both accounts
3. Send a test email to one of your configured accounts
4. Within seconds, it should appear in the UI (real-time sync!)

### Check AI Categorization
1. Click on any email in the list
2. Click "Recategorize" button
3. The email should be categorized (Interested, Spam, etc.)

### Check Search
1. Type a search query in the search bar
2. Press Enter
3. Results should appear instantly

### Check Suggested Replies
1. Click on an email
2. Click "AI Suggest Reply"
3. Wait 3-5 seconds
4. A suggested reply should appear with context

### Check Notifications (if configured)
1. Send an email that mentions "interested" or "interview"
2. Wait for it to sync
3. It should be categorized as "Interested"
4. Check your Slack channel for notification
5. Check webhook.site for the webhook payload

## 🎯 Common Issues & Solutions

### Issue: Elasticsearch won't start
```bash
# Check if port 9200 is in use
lsof -i :9200

# If something is using it, stop it or change the port
# Then restart
npm run docker:down
npm run docker:up
```

### Issue: IMAP connection fails
- **Check credentials**: Ensure email and app password are correct
- **Check IMAP enabled**: Verify IMAP is enabled in Gmail settings
- **Check firewall**: Ensure port 993 is not blocked
- **Check 2FA**: App passwords require 2FA to be enabled

### Issue: OpenAI API errors
- **Invalid API key**: Verify the key starts with `sk-` and is complete
- **No credits**: Add credits at https://platform.openai.com/account/billing
- **Rate limits**: Wait a few minutes if you hit rate limits

### Issue: Frontend shows "No emails found"
- **Wait for sync**: Initial sync takes 30-60 seconds
- **Check backend logs**: Look for errors in the terminal
- **Check Elasticsearch**: Visit http://localhost:9200/emails/_search

### Issue: Port already in use
```bash
# Backend (port 3000)
lsof -i :3000
kill -9 <PID>

# Frontend (port 5173)
lsof -i :5173
kill -9 <PID>

# Elasticsearch (port 9200)
npm run docker:down
npm run docker:up
```

## 📈 Monitoring & Logs

### View Backend Logs
```bash
# Real-time logs
tail -f combined.log

# Error logs only
tail -f error.log
```

### View Elasticsearch Data
```bash
# Get all emails
curl http://localhost:9200/emails/_search?pretty

# Count emails
curl http://localhost:9200/emails/_count?pretty

# Search emails
curl "http://localhost:9200/emails/_search?q=subject:interview&pretty"
```

### Check IMAP Status
```bash
# The backend logs will show:
# - IMAP connected for <email>
# - IDLE mode started for <email>
# - New email(s) received in <email>
```

## 🛑 Stopping the Application

### Stop Backend
Press `Ctrl+C` in the backend terminal

### Stop Frontend
Press `Ctrl+C` in the frontend terminal

### Stop Elasticsearch
```bash
npm run docker:down
```

## 🔄 Restarting After Setup

Once everything is configured, you only need:

```bash
# Terminal 1: Start Elasticsearch (if not running)
npm run docker:up

# Terminal 2: Start Backend
npm start

# Terminal 3: Start Frontend
cd frontend && npm run dev
```

## 📚 Next Steps

1. **Customize RAG Knowledge Base**
   - Add product information via API
   - Add custom reply templates
   - Test suggested replies

2. **Test All Features**
   - Send test emails
   - Try different search queries
   - Test all AI categorization types
   - Verify Slack notifications

3. **Prepare for Demo**
   - Have some test emails ready
   - Prepare Postman collection
   - Test all 6 feature sets

## 🎓 Feature Checklist for Assignment

- ✅ **Feature 1**: Real-time IMAP sync with IDLE mode
- ✅ **Feature 2**: Elasticsearch storage with search
- ✅ **Feature 3**: AI categorization (5 categories)
- ✅ **Feature 4**: Slack & webhook notifications
- ✅ **Feature 5**: Frontend UI with filters
- ✅ **Feature 6**: RAG-powered suggested replies

## 🆘 Getting Help

If you encounter issues:

1. Check the logs: `tail -f combined.log`
2. Verify all services are running
3. Check the troubleshooting section above
4. Ensure all environment variables are set correctly

## 🎉 Success Indicators

You'll know everything is working when:

- ✅ Frontend loads at http://localhost:5173
- ✅ You see emails from both accounts
- ✅ Search returns results
- ✅ AI categorization works
- ✅ Suggested replies generate
- ✅ New emails appear in real-time
- ✅ Slack notifications arrive (if configured)

---

**Congratulations! Your Email Onebox is now fully operational! 🚀**
