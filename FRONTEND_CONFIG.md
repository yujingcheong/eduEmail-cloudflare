# Frontend Configuration Guide

## Updating Supabase Configuration

After setting up your Supabase project, you need to update the frontend configuration in `前端/script.js`.

### Step 1: Get Your Supabase Project Details

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings > API**
4. Copy the following values:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 2: Update Frontend Configuration

Open `前端/script.js` and find the `SUPABASE_CONFIG` object at the top of the file:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',  // Replace with your Project URL
    anonKey: 'your-supabase-anon-key'         // Replace with your Anon Key
};
```

Replace the placeholder values with your actual Supabase project details.

### Step 3: Verify Configuration

After updating the configuration:

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Refresh the page
4. You should see logs showing:
   ```
   临时邮箱生成器已加载 - 使用Supabase Edge Functions
   Supabase URL: https://your-project.supabase.co
   API Endpoints: {...}
   ```

### Security Notes

- The **Anon Key** is safe to use in frontend code (it's designed for client-side use)
- The **Service Role Key** should NEVER be used in frontend code (it's for server-side/Edge Functions only)
- Row Level Security (RLS) policies in your Supabase database control access permissions

### Troubleshooting

If you see errors in the console:

1. **CORS errors**: Make sure your domain is added to the allowed origins in Supabase Dashboard > Settings > API
2. **Auth errors**: Verify your Anon Key is correct and not expired
3. **Function errors**: Check that your Edge Functions are deployed and running

### Example Configuration

```javascript
const SUPABASE_CONFIG = {
    url: 'https://abcdefghijk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzg5NzA0MDAsImV4cCI6MTk5NDU0NjQwMH0.example-signature'
};
```