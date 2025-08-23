# API Documentation - Supabase Edge Functions

This document describes the API endpoints provided by the Supabase Edge Functions for the eduEmail-cloudflare project.

## Base URL

```
https://your-project.supabase.co/functions/v1/
```

## Authentication

All endpoints require the following headers:

```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
  'apikey': 'YOUR_SUPABASE_ANON_KEY'
}
```

## Endpoints

### 1. Generate Email

**Endpoint:** `POST /generate-email`

**Description:** Generates a new temporary email address and creates the corresponding Cloudflare email route.

**Request Body:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "email": "abc12345@yourdomain.com",
  "message": "临时邮箱创建成功",
  "note": "邮箱路由已创建，邮件将使用Worker方式处理",
  "cloudflareResult": {
    "success": true,
    "message": "Worker路由创建成功",
    "routeId": "route-id-123",
    "pattern": "abc12345@yourdomain.com",
    "worker": "email-parser"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message details",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Get Email

**Endpoint:** `POST /get-cloudflare-email`

**Description:** Retrieves the latest email for a specific temporary email address.

**Request Body:**
```json
{
  "email": "abc12345@yourdomain.com"
}
```

**Response (with email):**
```json
{
  "success": true,
  "message": "成功获取邮件",
  "email": "abc12345@yourdomain.com",
  "data": {
    "id": "uuid-123",
    "from": "sender@example.com",
    "to": "abc12345@yourdomain.com",
    "subject": "Test Email",
    "content": {
      "text": "Plain text content",
      "html": "<p>HTML content</p>",
      "raw": "Raw email content"
    },
    "hasHtml": true,
    "receivedAt": "2024-01-01T00:00:00.000Z",
    "createTime": 1704067200000
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Response (no email):**
```json
{
  "success": true,
  "message": "暂无邮件",
  "email": "abc12345@yourdomain.com",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "debug": {
    "totalRecords": 0,
    "queriedEmail": "abc12345@yourdomain.com",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Delete Temp Email

**Endpoint:** `POST /delete-temp-email`

**Description:** Deletes a temporary email address, including Cloudflare routes and all associated email data.

**Request Body:**
```json
{
  "email": "abc12345@yourdomain.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "邮箱删除完成，共处理 5 项数据",
  "email": "abc12345@yourdomain.com",
  "details": {
    "cloudflare": {
      "success": true,
      "message": "成功删除 1/1 个路由规则",
      "deletedCount": 1
    },
    "emailData": {
      "success": true,
      "message": "成功删除 3 条邮件记录",
      "deletedCount": 3
    },
    "tempEmails": {
      "success": true,
      "message": "成功标记 1 条临时邮箱记录为已删除",
      "deletedCount": 1
    }
  },
  "summary": {
    "totalProcessed": 5,
    "cloudflareRoutes": 1,
    "emailRecords": 3,
    "tempEmailRecords": 1
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 4. Get All Temp Emails

**Endpoint:** `POST /get-all-temp-emails`

**Description:** Retrieves all temporary email addresses with their statistics.

**Request Body:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "message": "成功获取 3 个临时邮箱",
  "emails": [
    {
      "id": "route-id-1",
      "email": "abc12345@yourdomain.com",
      "pattern": "abc12345@yourdomain.com",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "emailCount": 2,
      "workerName": "email-parser",
      "enabled": true,
      "deleted": false
    },
    {
      "id": "route-id-2",
      "email": "xyz67890@yourdomain.com",
      "pattern": "xyz67890@yourdomain.com",
      "createdAt": "2024-01-01T01:00:00.000Z",
      "emailCount": 0,
      "workerName": "email-parser",
      "enabled": true,
      "deleted": false
    }
  ],
  "summary": {
    "totalEmails": 3,
    "totalEmailMessages": 5,
    "activeEmails": 2,
    "deletedEmails": 1
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 5. Post Cloudflare Email (Internal)

**Endpoint:** `POST /post-cloudflare-email`

**Description:** Internal endpoint called by Cloudflare Workers to store incoming emails. This endpoint is typically not called directly by the frontend.

**Request Body:**
```json
{
  "emailInfo": {
    "from": "sender@example.com",
    "to": "abc12345@yourdomain.com",
    "subject": "Test Email",
    "date": "2024-01-01T00:00:00.000Z",
    "hasHtml": true
  },
  "emailContent": {
    "text": "Plain text content",
    "html": "<p>HTML content</p>",
    "raw": "Raw email content"
  },
  "workerInfo": {
    "version": "1.0.0",
    "source": "cloudflare-workers-email-parser"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "邮件保存成功",
  "insertedId": "uuid-123",
  "stats": {
    "insertedId": "uuid-123",
    "emailFrom": "sender@example.com",
    "emailTo": "abc12345@yourdomain.com",
    "subject": "Test Email",
    "contentType": "html",
    "textLength": 17,
    "htmlLength": 20,
    "processingTime": 150
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Handling

### Standard Error Response Format

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Detailed error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (missing parameters, invalid format)
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (RLS policy violation)
- `500` - Internal Server Error

### Common Error Types

1. **Missing Parameters**
   ```json
   {
     "success": false,
     "error": "缺少邮箱地址参数"
   }
   ```

2. **Cloudflare API Errors**
   ```json
   {
     "success": false,
     "error": "Cloudflare API错误: 401 - Invalid API Token"
   }
   ```

3. **Database Errors**
   ```json
   {
     "success": false,
     "error": "Database connection failed"
   }
   ```

## Rate Limiting

Supabase applies automatic rate limiting based on your plan:
- **Free tier**: 500,000 Edge Function invocations per month
- **Pro tier**: 2,000,000 Edge Function invocations per month

## CORS Configuration

All endpoints include CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

## Environment Variables

The Edge Functions require these environment variables:

```env
# Supabase (automatically provided)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare (set via supabase secrets)
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_DOMAIN=your-domain.com
CLOUDFLARE_WORKER_NAME=your-worker-name
CLOUDFLARE_WORKER_ROUTE=your-domain.com
```

## SDK Usage Examples

### JavaScript/TypeScript

```javascript
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

async function generateEmail() {
  const response = await fetch(`${supabaseUrl}/functions/v1/generate-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey
    },
    body: JSON.stringify({})
  });
  
  const data = await response.json();
  return data;
}

async function getEmails(email) {
  const response = await fetch(`${supabaseUrl}/functions/v1/get-cloudflare-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey
    },
    body: JSON.stringify({ email })
  });
  
  const data = await response.json();
  return data;
}
```

### curl Examples

```bash
# Generate email
curl -X POST https://your-project.supabase.co/functions/v1/generate-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -H "apikey: your-anon-key" \
  -d '{}'

# Get emails
curl -X POST https://your-project.supabase.co/functions/v1/get-cloudflare-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -H "apikey: your-anon-key" \
  -d '{"email": "abc12345@yourdomain.com"}'

# Delete email
curl -X POST https://your-project.supabase.co/functions/v1/delete-temp-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -H "apikey: your-anon-key" \
  -d '{"email": "abc12345@yourdomain.com"}'
```

## Monitoring and Debugging

### Logs
View function logs in Supabase Dashboard:
1. Go to **Edge Functions**
2. Click on function name
3. View **Logs** tab

### Metrics
Monitor function performance:
- Invocation count
- Success rate
- Average execution time
- Error rate

### Database Queries
Monitor database activity in **Reports > Database** section.

This API provides a complete backend for the temporary email functionality with proper error handling, monitoring, and security features.