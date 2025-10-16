# Email Onebox - Deployment & Demo Checklist

## ✅ Pre-Demo Checklist

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] Docker Desktop installed and running
- [ ] OpenAI API key obtained
- [ ] OpenAI account has credits
- [ ] 2 Gmail accounts configured with IMAP
- [ ] App passwords generated for both accounts
- [ ] Slack webhook URL obtained (optional)
- [ ] Webhook.site URL ready (optional)

### Installation
- [ ] Backend dependencies installed (`npm install`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)
- [ ] `.env` file created from `.env.example`
- [ ] All environment variables filled in `.env`
- [ ] Elasticsearch container started (`npm run docker:up`)
- [ ] Elasticsearch is healthy (http://localhost:9200)

### Backend
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Backend starts successfully (`npm run dev`)
- [ ] IMAP connections established (check logs)
- [ ] Emails synced from both accounts
- [ ] IDLE mode activated for both accounts
- [ ] Elasticsearch index created
- [ ] RAG service initialized

### Frontend
- [ ] Frontend builds successfully (`cd frontend && npm run build`)
- [ ] Frontend dev server starts (`npm run dev`)
- [ ] Frontend accessible at http://localhost:5173
- [ ] No console errors in browser

### API Testing
- [ ] Health endpoint responds: GET /api/health
- [ ] Emails endpoint works: GET /api/emails
- [ ] Search endpoint works: GET /api/emails/search?query=test
- [ ] Categorization works: POST /api/emails/{id}/categorize
- [ ] Suggested reply works: GET /api/emails/{id}/suggest-reply
- [ ] Postman collection imported and tested

---

## 🎯 Feature Demonstration Checklist

### Feature 1: Real-Time Email Synchronization
- [ ] Both email accounts connected
- [ ] Last 30 days of emails fetched
- [ ] IDLE mode active (check logs: "IDLE mode started")
- [ ] Send test email to one account
- [ ] Verify email appears in UI within 1 second
- [ ] Check logs show "new email(s) received"
- [ ] No cron jobs running (verify IDLE mode only)

**Demo Script**:
1. Show backend logs with IMAP connections
2. Send test email from phone/another device
3. Watch it appear in real-time in the UI
4. Explain IDLE mode vs polling

---

### Feature 2: Searchable Storage using Elasticsearch
- [ ] Elasticsearch container running
- [ ] Index created with proper mapping
- [ ] Emails indexed in Elasticsearch
- [ ] Search returns results
- [ ] Filters work (account, folder, category)
- [ ] Pagination works

**Demo Script**:
1. Open http://localhost:9200/emails/_search?pretty
2. Show indexed emails in Elasticsearch
3. Use search bar in UI to search "interview"
4. Show instant results
5. Apply category filter
6. Show combined search + filter

**Test Queries**:
```bash
# Show all emails in Elasticsearch
curl http://localhost:9200/emails/_search?pretty

# Count emails
curl http://localhost:9200/emails/_count?pretty

# Search
GET /api/emails/search?query=interview
```

---

### Feature 3: AI-Based Email Categorization
- [ ] OpenAI API key working
- [ ] Emails automatically categorized on sync
- [ ] Manual recategorization works
- [ ] All 5 categories working:
  - [ ] Interested
  - [ ] Meeting Booked
  - [ ] Not Interested
  - [ ] Spam
  - [ ] Out of Office
- [ ] Category badges show in UI

**Demo Script**:
1. Show emails with different categories
2. Click on an email
3. Click "Recategorize" button
4. Wait 2-3 seconds
5. Show new category applied
6. Explain GPT-3.5 categorization logic

**Test Email Subjects** (for different categories):
- "Re: Interested in your proposal" → Interested
- "Meeting confirmed for tomorrow" → Meeting Booked
- "No thanks, not interested" → Not Interested
- "Buy cheap products now!" → Spam
- "Out of office until Monday" → Out of Office

---

### Feature 4: Slack & Webhook Integration
- [ ] Slack webhook configured
- [ ] External webhook configured (webhook.site)
- [ ] Test "Interested" email ready
- [ ] Slack channel accessible
- [ ] Webhook.site page open

**Demo Script**:
1. Open Slack channel in one window
2. Open webhook.site in another window
3. Send or categorize email as "Interested"
4. Show Slack notification appears
5. Show webhook payload in webhook.site
6. Explain automatic triggering

**Slack Notification Check**:
- [ ] Notification appears in Slack
- [ ] Shows sender name and email
- [ ] Shows subject
- [ ] Shows email preview
- [ ] Formatted nicely with blocks

**Webhook Check**:
- [ ] Payload received at webhook.site
- [ ] Contains event type "email.interested"
- [ ] Contains full email details
- [ ] Timestamp included

---

### Feature 5: Frontend Interface
- [ ] UI loads without errors
- [ ] Email list displays correctly
- [ ] Category badges show with colors
- [ ] Sidebar navigation works
- [ ] Search bar functional
- [ ] Email detail view works
- [ ] Attachments display (if any)
- [ ] Responsive design works

**Demo Script**:
1. Show email list with categories
2. Use sidebar to filter by category
3. Use search bar to search
4. Click on email to show detail
5. Show HTML email rendering
6. Show attachment list
7. Demonstrate smooth UX

**UI Elements to Show**:
- [ ] Category color coding (green, blue, red, etc.)
- [ ] Search functionality
- [ ] Filter by category
- [ ] Email preview in list
- [ ] Full email in detail view
- [ ] Action buttons

---

### Feature 6: AI-Powered Suggested Replies (RAG)
- [ ] Vector database initialized
- [ ] Knowledge base loaded
- [ ] Embeddings generated
- [ ] GPT-4 API working
- [ ] Test email ready for reply suggestion

**Demo Script**:
1. Click on an email (preferably "Interested" category)
2. Click "AI Suggest Reply" button
3. Wait 3-5 seconds
4. Show generated reply
5. Show confidence score
6. Show context used
7. Click "Copy" to copy reply
8. Explain RAG architecture

**Best Demo Emails**:
- Interview invitation
- Interest in product/service
- Meeting request
- Follow-up question

**Knowledge Base Check**:
```bash
GET /api/knowledge
```
- [ ] Product info present
- [ ] Outreach agenda present
- [ ] Templates present
- [ ] Custom knowledge can be added

**Add Custom Knowledge Demo**:
```bash
POST /api/knowledge
{
  "text": "Our product helps teams collaborate better",
  "metadata": { "type": "product" }
}
```

---

## 🧪 Postman Demo

### Preparation
- [ ] Postman collection imported
- [ ] Base URL set to http://localhost:3000/api
- [ ] Test email ID ready

### Demo Flow
1. **Health Check**
   ```
   GET /api/health
   ```
   - Show Elasticsearch status
   - Show IMAP connections

2. **Get All Emails**
   ```
   GET /api/emails?from=0&size=5
   ```
   - Show email list
   - Copy an email ID

3. **Get Email by ID**
   ```
   GET /api/emails/{id}
   ```
   - Show full email details

4. **Search Emails**
   ```
   GET /api/emails/search?query=interview
   ```
   - Show search results

5. **Categorize Email**
   ```
   POST /api/emails/{id}/categorize
   ```
   - Show category assigned

6. **Get Suggested Reply**
   ```
   GET /api/emails/{id}/suggest-reply
   ```
   - Show AI-generated reply
   - Show confidence score
   - Show context used

7. **Filter by Category**
   ```
   GET /api/emails?category=Interested
   ```
   - Show filtered results

8. **Get Knowledge Base**
   ```
   GET /api/knowledge
   ```
   - Show knowledge entries

---

## 📊 Performance Demo

### Metrics to Show
- [ ] Email sync latency: < 1 second
- [ ] Search response time: < 100ms
- [ ] AI categorization: 2-3 seconds
- [ ] RAG reply: 3-5 seconds

### How to Demonstrate
1. **Real-time Sync**: Send email, show timestamp in logs vs UI
2. **Search Speed**: Type in search bar, show instant results
3. **AI Speed**: Click categorize, show loading, show result
4. **RAG Speed**: Click suggest reply, show loading, show result

---

## 🎓 Assignment Criteria Demo

### Feature Completion
- [ ] Show all 6 features working
- [ ] Demonstrate each feature individually
- [ ] Show integration between features

### Code Quality
- [ ] Show TypeScript code (type safety)
- [ ] Show modular service architecture
- [ ] Show error handling in logs
- [ ] Show comprehensive logging

### Scalability
- [ ] Explain Elasticsearch horizontal scaling
- [ ] Show batch processing for AI
- [ ] Explain stateless API design
- [ ] Show connection pooling

### Real-Time Performance
- [ ] Demonstrate IDLE mode (no polling)
- [ ] Show < 1 second latency
- [ ] Explain event-driven architecture

### AI Accuracy
- [ ] Show categorization examples
- [ ] Show suggested reply quality
- [ ] Explain context-aware generation

### UX & UI
- [ ] Show modern React interface
- [ ] Demonstrate smooth interactions
- [ ] Show responsive design
- [ ] Explain user flow

---

## 🐛 Troubleshooting During Demo

### If Elasticsearch is down
```bash
npm run docker:down
npm run docker:up
# Wait 30 seconds
curl http://localhost:9200
```

### If IMAP connection fails
- Check `.env` credentials
- Restart backend: Ctrl+C, then `npm run dev`
- Check logs for specific error

### If OpenAI API fails
- Verify API key in `.env`
- Check billing at https://platform.openai.com/account/billing
- Check rate limits

### If Frontend won't load
- Check console for errors
- Restart: Ctrl+C, then `npm run dev`
- Clear browser cache

### If no emails appear
- Wait 30-60 seconds for initial sync
- Check backend logs for errors
- Verify IMAP credentials

---

## 📝 Demo Script (10-Minute Version)

### Minute 1-2: Introduction
- Show project structure
- Explain architecture diagram
- Highlight all 6 features

### Minute 3-4: Backend Demo
- Show backend logs (IMAP connections, IDLE mode)
- Demonstrate Postman API calls
- Show Elasticsearch data

### Minute 5-6: Frontend Demo
- Show email list with categories
- Demonstrate search
- Show filters
- Open email detail

### Minute 7-8: AI Features
- Recategorize an email
- Generate suggested reply
- Explain RAG architecture

### Minute 9: Real-Time Demo
- Send test email
- Show it appear in real-time
- Show Slack notification (if configured)

### Minute 10: Code Quality
- Show TypeScript code
- Explain service architecture
- Show documentation

---

## 🏆 Final Checks Before Demo

### Documentation
- [ ] README.md complete
- [ ] SETUP_GUIDE.md detailed
- [ ] FEATURES.md comprehensive
- [ ] API_DOCUMENTATION.md thorough
- [ ] PROJECT_SUMMARY.md informative

### Code
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Clean code formatting
- [ ] Comments where needed

### Testing
- [ ] All features tested manually
- [ ] Postman collection tested
- [ ] Error scenarios handled
- [ ] Edge cases considered

### Presentation
- [ ] Demo environment ready
- [ ] Test data prepared
- [ ] Backup plan ready
- [ ] Questions anticipated

---

## 🎯 Success Criteria

You'll know you're ready when:
- ✅ All 6 features work flawlessly
- ✅ Real-time sync is instant
- ✅ AI categorization is accurate
- ✅ RAG replies are contextual
- ✅ UI is smooth and responsive
- ✅ API responds quickly
- ✅ Documentation is comprehensive
- ✅ Code is production-ready

---

## 📞 Emergency Contacts

### If something breaks during demo:
1. Check logs: `tail -f combined.log`
2. Restart services
3. Use Postman as backup
4. Show documentation as fallback

### Backup Demo Plan:
1. Show Postman collection
2. Walk through code
3. Explain architecture
4. Show documentation

---

**You're ready to impress! 🚀**

All features implemented, tested, and documented.
Demo environment prepared.
Backup plans in place.
Let's ace this! ✅
