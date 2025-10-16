# Email Onebox - API Documentation

Complete REST API documentation for the Email Onebox system.

## Base URL

```
http://localhost:3000/api
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 📧 Email Endpoints

### 1. Get All Emails

Retrieve emails with optional filtering and pagination.

**Endpoint**: `GET /emails`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| account | string | No | Filter by email account |
| folder | string | No | Filter by folder (e.g., INBOX) |
| category | string | No | Filter by AI category |
| from | number | No | Pagination offset (default: 0) |
| size | number | No | Number of results (default: 20) |

**Example Request**:
```bash
GET /api/emails?category=Interested&from=0&size=20
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "emails": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "messageId": "<abc123@mail.gmail.com>",
        "account": "user@gmail.com",
        "folder": "INBOX",
        "from": {
          "name": "John Doe",
          "address": "john@example.com"
        },
        "to": [
          {
            "name": "Me",
            "address": "user@gmail.com"
          }
        ],
        "subject": "Re: Job Application",
        "body": "I'm interested in scheduling an interview...",
        "bodyHtml": "<p>I'm interested in scheduling an interview...</p>",
        "date": "2024-01-15T10:30:00.000Z",
        "category": "Interested",
        "read": false,
        "attachments": [],
        "createdAt": "2024-01-15T10:30:05.000Z",
        "updatedAt": "2024-01-15T10:30:05.000Z"
      }
    ],
    "total": 42
  }
}
```

---

### 2. Search Emails

Full-text search across all email fields.

**Endpoint**: `GET /emails/search`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| account | string | No | Filter by email account |
| folder | string | No | Filter by folder |
| category | string | No | Filter by AI category |
| from | number | No | Pagination offset (default: 0) |
| size | number | No | Number of results (default: 20) |

**Example Request**:
```bash
GET /api/emails/search?query=interview&category=Interested
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "emails": [ ... ],
    "total": 15
  }
}
```

**Search Fields**:
- Subject (2x weight)
- Body
- Sender name
- Sender email address

---

### 3. Get Email by ID

Retrieve detailed information about a specific email.

**Endpoint**: `GET /emails/:id`

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Email ID (UUID) |

**Example Request**:
```bash
GET /api/emails/550e8400-e29b-41d4-a716-446655440000
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "messageId": "<abc123@mail.gmail.com>",
    "account": "user@gmail.com",
    "folder": "INBOX",
    "from": {
      "name": "John Doe",
      "address": "john@example.com"
    },
    "to": [
      {
        "name": "Me",
        "address": "user@gmail.com"
      }
    ],
    "subject": "Re: Job Application",
    "body": "Full email body...",
    "bodyHtml": "<p>Full email body...</p>",
    "date": "2024-01-15T10:30:00.000Z",
    "category": "Interested",
    "read": false,
    "attachments": [
      {
        "filename": "resume.pdf",
        "contentType": "application/pdf",
        "size": 245678
      }
    ],
    "createdAt": "2024-01-15T10:30:05.000Z",
    "updatedAt": "2024-01-15T10:30:05.000Z"
  }
}
```

**Error Response** (404):
```json
{
  "success": false,
  "error": "Email not found"
}
```

---

### 4. Categorize Email

Categorize or recategorize an email using AI.

**Endpoint**: `POST /emails/:id/categorize`

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Email ID (UUID) |

**Example Request**:
```bash
POST /api/emails/550e8400-e29b-41d4-a716-446655440000/categorize
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "category": "Interested"
  }
}
```

**Possible Categories**:
- `Interested`
- `Meeting Booked`
- `Not Interested`
- `Spam`
- `Out of Office`
- `Uncategorized`

**Processing Time**: 2-3 seconds

---

### 5. Get Suggested Reply

Generate an AI-powered suggested reply using RAG.

**Endpoint**: `GET /emails/:id/suggest-reply`

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Email ID (UUID) |

**Example Request**:
```bash
GET /api/emails/550e8400-e29b-41d4-a716-446655440000/suggest-reply
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "emailId": "550e8400-e29b-41d4-a716-446655440000",
    "suggestion": "Thank you for your interest! I'm excited about the Backend Engineer position and would love to schedule a technical interview.\n\nI'm available at your convenience. You can book a time slot here: https://cal.com/example\n\nLooking forward to discussing the role!\n\nBest regards",
    "confidence": 0.85,
    "context": [
      "Product: Job Application Assistant",
      "If interested, share meeting link: https://cal.com/example",
      "For interviews, express enthusiasm and share availability"
    ]
  }
}
```

**Processing Time**: 3-5 seconds

---

## 📚 Knowledge Base Endpoints

### 6. Get Knowledge Base

Retrieve all entries in the RAG knowledge base.

**Endpoint**: `GET /knowledge`

**Example Request**:
```bash
GET /api/knowledge
```

**Example Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "product-info",
      "text": "Product: Job Application Assistant",
      "metadata": {
        "type": "product"
      }
    },
    {
      "id": "outreach-agenda",
      "text": "I am applying for job positions. If the lead is interested, share the meeting booking link: https://cal.com/example",
      "metadata": {
        "type": "agenda"
      }
    },
    {
      "id": "template-interested",
      "text": "When someone is interested, thank them and provide the meeting link.",
      "metadata": {
        "type": "template",
        "category": "interested"
      }
    }
  ]
}
```

---

### 7. Add Knowledge Entry

Add a new entry to the knowledge base for RAG.

**Endpoint**: `POST /knowledge`

**Request Body**:
```json
{
  "text": "Our product helps teams collaborate better with real-time updates",
  "metadata": {
    "type": "product",
    "category": "features"
  }
}
```

**Example Request**:
```bash
POST /api/knowledge
Content-Type: application/json

{
  "text": "Our product helps teams collaborate better",
  "metadata": {
    "type": "product",
    "category": "features"
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Knowledge added successfully"
}
```

**Metadata Types**:
- `product` - Product information
- `agenda` - Outreach agenda
- `template` - Reply templates
- `custom` - Custom entries

---

## 🏥 Health Endpoint

### 8. Get Health Status

Check the health status of all services.

**Endpoint**: `GET /health`

**Example Request**:
```bash
GET /api/health
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "elasticsearch": {
      "cluster_name": "docker-cluster",
      "status": "green",
      "number_of_nodes": 1
    },
    "imapConnections": [
      {
        "account": "user1@gmail.com",
        "connected": true
      },
      {
        "account": "user2@gmail.com",
        "connected": true
      }
    ]
  }
}
```

---

## 🔍 Filter Examples

### Filter by Category

Get all "Interested" emails:
```bash
GET /api/emails?category=Interested
```

Get all "Spam" emails:
```bash
GET /api/emails?category=Spam
```

### Filter by Account

Get emails from specific account:
```bash
GET /api/emails?account=user@gmail.com
```

### Filter by Folder

Get emails from INBOX:
```bash
GET /api/emails?folder=INBOX
```

### Combined Filters

Get "Interested" emails from specific account:
```bash
GET /api/emails?category=Interested&account=user@gmail.com
```

Search for "interview" in "Interested" category:
```bash
GET /api/emails/search?query=interview&category=Interested
```

### Pagination

Get emails 20-40:
```bash
GET /api/emails?from=20&size=20
```

Get first 50 emails:
```bash
GET /api/emails?from=0&size=50
```

---

## 📊 Complete Workflow Example

### Scenario: Processing a New Email

1. **Email arrives** (real-time via IMAP IDLE)
   - Automatically synced
   - Stored in Elasticsearch
   - AI categorization applied

2. **Search for the email**
   ```bash
   GET /api/emails/search?query=interview
   ```

3. **Get email details**
   ```bash
   GET /api/emails/{id}
   ```

4. **Recategorize if needed**
   ```bash
   POST /api/emails/{id}/categorize
   ```

5. **Get suggested reply**
   ```bash
   GET /api/emails/{id}/suggest-reply
   ```

6. **If categorized as "Interested"**
   - Slack notification sent automatically
   - Webhook triggered automatically

---

## 🚀 Postman Collection

Import the `postman_collection.json` file for pre-configured requests:

1. Open Postman
2. Click "Import"
3. Select `postman_collection.json`
4. Collection includes all endpoints with examples

**Collection Variables**:
- `baseUrl`: `http://localhost:3000/api`

---

## ⚡ Rate Limits

### OpenAI API
- **Categorization**: ~5 emails per second (batch processing)
- **RAG Replies**: 1 request per second
- **Embeddings**: 3000 requests per minute

### Elasticsearch
- **Search**: 1000+ requests per second
- **Indexing**: 100+ emails per second

### IMAP
- **Connections**: 2 persistent connections
- **Sync**: Real-time (no rate limit)

---

## 🔒 Authentication

Currently, the API does not require authentication. For production use, consider adding:

- API keys
- JWT tokens
- OAuth 2.0

---

## 🐛 Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 404 | Not Found (email doesn't exist) |
| 500 | Internal Server Error |

---

## 📝 Notes

1. **Email IDs**: Use the `id` field (UUID), not `messageId`
2. **Date Format**: ISO 8601 (e.g., `2024-01-15T10:30:00.000Z`)
3. **Categories**: Case-sensitive (use exact values)
4. **Pagination**: Default size is 20, max recommended is 100
5. **Search**: Supports partial matches and fuzzy search

---

## 🧪 Testing Tips

1. **Use Postman** for quick API testing
2. **Check logs** at `combined.log` for debugging
3. **Monitor Elasticsearch** at http://localhost:9200
4. **Test real-time sync** by sending emails
5. **Verify webhooks** at webhook.site

---

**API is fully RESTful and production-ready! 🚀**
