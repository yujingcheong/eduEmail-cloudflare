# UniCloud to Supabase Migration Guide

## Overview

This guide outlines the changes required to migrate the eduEmail-cloudflare project from UniCloud to Supabase. The migration involves replacing the backend database and cloud functions while maintaining the same functionality.

## Current Architecture vs Supabase Architecture

### Current (UniCloud)
```
Frontend → UniCloud Cloud Functions → UniCloud Database (NoSQL)
                ↓
        Cloudflare Workers → Email Routing
```

### Target (Supabase) 
```
Frontend → Supabase Edge Functions → Supabase Database (PostgreSQL)
                ↓
        Cloudflare Workers → Email Routing
```

## Key Changes Required

### 1. Database Schema Migration

**Current UniCloud Collections:**
- `temp_emails` - Stores temporary email records
- `cloudflare_edukg_email` - Stores email content and metadata

**New Supabase Tables:**

```sql
-- temp_emails table
CREATE TABLE temp_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at BIGINT NOT NULL,
    deleted BOOLEAN DEFAULT FALSE,
    created_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- cloudflare_edukg_email table  
CREATE TABLE cloudflare_edukg_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_from TEXT NOT NULL,
    email_to TEXT NOT NULL,
    subject TEXT,
    email_content_text TEXT,
    email_content_html TEXT,
    raw_content TEXT,
    email_type TEXT DEFAULT 'text',
    has_html BOOLEAN DEFAULT FALSE,
    has_text BOOLEAN DEFAULT TRUE,
    text_length INTEGER DEFAULT 0,
    html_length INTEGER DEFAULT 0,
    create_time BIGINT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    worker_info JSONB,
    created_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_temp_emails_email ON temp_emails(email);
CREATE INDEX idx_temp_emails_created_at ON temp_emails(created_at);
CREATE INDEX idx_cloudflare_email_to ON cloudflare_edukg_email(email_to);
CREATE INDEX idx_cloudflare_email_processed_at ON cloudflare_edukg_email(processed_at DESC);
```

### 2. Cloud Functions Migration

**Current UniCloud Functions → Supabase Edge Functions:**

1. `generate-email` → `generate-email`
2. `POST_cloudflare_edukg_email` → `post-cloudflare-email`
3. `GET_cloudflare_edukg_email` → `get-cloudflare-email`
4. `GET_all_temp_emails` → `get-all-temp-emails`
5. `Delete_edu_cloudfare` → `delete-temp-email`

### 3. Code Changes Required

#### A. Database Operations

**Before (UniCloud):**
```javascript
const db = uniCloud.database();
const result = await db.collection('temp_emails').add({
    email: tempEmail,
    createdAt: Date.now(),
    deleted: false
});
```

**After (Supabase):**
```javascript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { data, error } = await supabase
    .from('temp_emails')
    .insert({
        email: tempEmail,
        created_at: Date.now(),
        deleted: false
    });
```

#### B. Query Operations

**Before (UniCloud):**
```javascript
const result = await collection
    .where({
        emailTo: email
    })
    .orderBy('createTime', 'desc')
    .limit(1)
    .get();
```

**After (Supabase):**
```javascript
const { data, error } = await supabase
    .from('cloudflare_edukg_email')
    .select('*')
    .eq('email_to', email)
    .order('create_time', { ascending: false })
    .limit(1);
```

#### C. Authentication & Environment Variables

**Environment Variables needed:**
```bash
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For Edge Functions
```

### 4. Edge Functions Implementation

**Example: generate-email function**

```typescript
// supabase/functions/generate-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate random email name
    const emailName = generateRandomEmailName();
    const tempEmail = `${emailName}@${config.cloudflare.domain}`;

    // Create Cloudflare email route (same as before)
    const cloudflare = new CloudflareAPI();
    const cloudflareResult = await cloudflare.createEmailRoute(tempEmail);

    // Save to Supabase database
    const { data, error } = await supabase
      .from('temp_emails')
      .insert({
        email: tempEmail,
        created_at: Date.now(),
        deleted: false
      });

    if (error) throw error;

    const responseData = {
      success: true,
      email: tempEmail,
      message: '临时邮箱创建成功',
      note: '邮箱路由已创建，邮件将使用Worker方式处理'
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

### 5. Frontend Changes

**Before (UniCloud):**
```javascript
const response = await fetch('云函数链接generate-email', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({})
});
```

**After (Supabase):**
```javascript
const response = await fetch('https://your-project.supabase.co/functions/v1/generate-email', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({})
});
```

### 6. Configuration Changes

#### A. Supabase Project Setup
1. Create new Supabase project
2. Run database migration scripts
3. Deploy Edge Functions
4. Configure Row Level Security (RLS) policies if needed

#### B. Environment Configuration
Update all configuration files with Supabase URLs and keys:

```javascript
// config.js
const config = {
    supabase: {
        url: 'https://your-project.supabase.co',
        anonKey: 'your-anon-key'
    },
    cloudflare: {
        // Keep existing Cloudflare config
        domain: 'your-domain.com',
        apiToken: 'your-api-token',
        zoneId: 'your-zone-id'
    }
};
```

### 7. Migration Steps

1. **Setup Supabase Project**
   - Create account and project
   - Note down project URL and API keys

2. **Database Migration**
   - Run SQL scripts to create tables
   - Migrate existing data if needed

3. **Deploy Edge Functions**
   - Convert each UniCloud function to Supabase Edge Function
   - Test function deployments

4. **Update Frontend**
   - Replace API endpoints
   - Update authentication logic

5. **Test Migration**
   - Verify all functionality works
   - Test email generation and retrieval

6. **Update Documentation**
   - Update README.md with new setup instructions
   - Document new environment variables

### 8. Benefits of Migration

1. **Better Performance**: PostgreSQL with indexed queries
2. **Real-time Features**: Built-in real-time subscriptions
3. **Better Scaling**: Managed PostgreSQL with connection pooling
4. **Modern Stack**: TypeScript support in Edge Functions
5. **Cost Efficiency**: More predictable pricing model
6. **Better Developer Experience**: Rich dashboard and monitoring

### 9. Potential Challenges

1. **Learning Curve**: Different API patterns
2. **Data Migration**: NoSQL to SQL conversion
3. **Function Rewrite**: Different runtime environment
4. **Testing**: Need to thoroughly test all endpoints
5. **Debugging**: Different logging and error handling

### 10. Estimated Migration Time

- Database setup and migration: 2-4 hours
- Edge Functions development: 8-12 hours  
- Frontend updates: 4-6 hours
- Testing and debugging: 6-8 hours
- **Total: 20-30 hours**

## Conclusion

Migrating from UniCloud to Supabase will modernize the tech stack and provide better scalability and developer experience. The main changes involve database operations, function runtime, and frontend API calls, while maintaining the same core functionality and user experience.