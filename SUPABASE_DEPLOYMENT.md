# Supabase Migration Deployment Guide

## Overview

This guide walks you through deploying the migrated version of eduEmail-cloudflare that uses Supabase Edge Functions instead of UniCloud.

## Prerequisites

Before starting, ensure you have:
- A Cloudflare account with a domain
- A Supabase account
- Node.js and npm installed
- Supabase CLI installed (`npm install -g supabase`)

## Step 1: Set Up Supabase Project

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project name (e.g., "eduEmail-cloudflare")
5. Enter a secure database password
6. Select a region close to your users
7. Click "Create new project"

### 1.2 Get Project Configuration

1. Once your project is ready, go to **Settings > API**
2. Note down these values:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep this secret!)

## Step 2: Set Up Database Schema

### 2.1 Run Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `supabase/migrations/001_initial_schema.sql`
5. Paste and execute the SQL

This will create:
- `temp_emails` table
- `cloudflare_edukg_email` table
- Proper indexes for performance
- Row Level Security policies

### 2.2 Verify Tables

Go to **Table Editor** and confirm both tables are created with the correct schema.

## Step 3: Deploy Edge Functions

### 3.1 Install Supabase CLI

```bash
npm install -g supabase
```

### 3.2 Link to Your Project

```bash
cd your-project-directory
supabase link --project-ref your-project-id
```

### 3.3 Set Environment Variables

Create a `.env` file in your project root:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ZONE_ID=your-cloudflare-zone-id
CLOUDFLARE_DOMAIN=your-domain.com
CLOUDFLARE_WORKER_NAME=your-worker-name
CLOUDFLARE_WORKER_ROUTE=your-domain.com
```

### 3.4 Deploy Edge Functions

Deploy all functions at once:

```bash
supabase functions deploy
```

Or deploy individually:

```bash
supabase functions deploy generate-email
supabase functions deploy post-cloudflare-email
supabase functions deploy get-cloudflare-email
supabase functions deploy get-all-temp-emails
supabase functions deploy delete-temp-email
```

### 3.5 Set Function Secrets

Set your environment variables as secrets:

```bash
supabase secrets set CLOUDFLARE_API_TOKEN=your-token
supabase secrets set CLOUDFLARE_ZONE_ID=your-zone-id
supabase secrets set CLOUDFLARE_DOMAIN=your-domain.com
supabase secrets set CLOUDFLARE_WORKER_NAME=your-worker-name
supabase secrets set CLOUDFLARE_WORKER_ROUTE=your-domain.com
```

## Step 4: Configure Frontend

### 4.1 Update Frontend Configuration

Edit `前端/script.js` and update the Supabase configuration:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',  // Your Project URL
    anonKey: 'your-actual-anon-key'           // Your Anon Key
};
```

### 4.2 Test Frontend Locally

1. Open `前端/index.html` in a web browser
2. Open Developer Tools (F12) and check the Console
3. You should see: "临时邮箱生成器已加载 - 使用Supabase Edge Functions"

## Step 5: Configure Cloudflare (If Not Already Done)

### 5.1 Cloudflare Email Routing

1. In Cloudflare Dashboard, go to **Email > Email Routing**
2. Enable Email Routing for your domain
3. Note: The Edge Functions will create routes dynamically

### 5.2 Cloudflare Workers (If Using)

Make sure your email parsing Worker is deployed and working.

## Step 6: Testing

### 6.1 Test Email Generation

1. Open your frontend application
2. Click "生成新的临时邮箱"
3. Check browser console for any errors
4. Verify email is generated and displayed

### 6.2 Test Email Reception

1. Send a test email to the generated address
2. Wait a moment for processing
3. Click the email refresh/check button
4. Verify email content is displayed

### 6.3 Test Email Deletion

1. With a generated email, click the delete button
2. Confirm deletion in the dialog
3. Verify the email and its data are removed

## Step 7: Monitor and Debug

### 7.1 Supabase Logs

Monitor Edge Function logs in Supabase Dashboard:
1. Go to **Edge Functions**
2. Click on a function name
3. View logs and invocations

### 7.2 Database Monitoring

Check database activity:
1. Go to **Reports > Database**
2. Monitor query performance and errors

### 7.3 Common Issues

**CORS Errors:**
- Add your domain to allowed origins in Supabase Dashboard

**Authentication Errors:**
- Verify your Anon Key is correct
- Check RLS policies in database

**Function Timeout:**
- Increase timeout in function settings if needed

**Cloudflare API Errors:**
- Verify API token has correct permissions
- Check zone ID is correct

## Step 8: Production Deployment

### 8.1 Domain Setup

If deploying to a custom domain:
1. Update CORS settings in Supabase
2. Configure your web server to serve the frontend files

### 8.2 Security Considerations

- Never expose Service Role Key in frontend code
- Use HTTPS for production
- Configure proper RLS policies for your use case
- Monitor usage and set appropriate rate limits

## Troubleshooting

### Common Error Messages

1. **"Missing SUPABASE_URL environment variable"**
   - Set the environment variables in Supabase Functions settings

2. **"Invalid API response"**
   - Check function logs in Supabase dashboard
   - Verify Cloudflare API credentials

3. **"Database connection failed"**
   - Verify database is accessible
   - Check RLS policies

### Getting Help

1. Check Supabase documentation: https://supabase.com/docs
2. Cloudflare Workers docs: https://developers.cloudflare.com/workers/
3. Check function logs in Supabase Dashboard
4. Test endpoints directly using curl or Postman

## Migration Benefits

After migration, you'll have:
- ✅ Modern TypeScript/Deno runtime
- ✅ Better error handling and logging
- ✅ PostgreSQL with proper indexing
- ✅ Real-time capabilities (future enhancement)
- ✅ Better monitoring and observability
- ✅ More predictable pricing

The migration is now complete! Your eduEmail-cloudflare application is running on modern Supabase infrastructure.