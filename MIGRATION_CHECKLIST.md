# Migration Checklist: UniCloud → Supabase

Use this checklist to ensure you've completed all steps for migrating from UniCloud to Supabase.

## 📋 Pre-Migration Checklist

- [ ] **Backup existing data** from UniCloud (if applicable)
- [ ] **Document current configuration** (Cloudflare settings, domain setup)
- [ ] **Ensure Cloudflare Workers are working** and processing emails correctly
- [ ] **Create Supabase account** at [supabase.com](https://supabase.com)
- [ ] **Install Supabase CLI**: `npm install -g supabase`

## 🗄️ Database Setup

- [ ] **Create new Supabase project**
  - [ ] Choose appropriate region
  - [ ] Set secure database password
  - [ ] Note project URL and API keys
- [ ] **Run database migration**
  - [ ] Execute `supabase/migrations/001_initial_schema.sql`
  - [ ] Verify tables created: `temp_emails`, `cloudflare_edukg_email`
  - [ ] Check indexes are created
  - [ ] Verify RLS policies are active

## 🚀 Edge Functions Deployment

- [ ] **Link project to Supabase**: `supabase link --project-ref your-project-id`
- [ ] **Set environment secrets**:
  ```bash
  supabase secrets set CLOUDFLARE_API_TOKEN=your-token
  supabase secrets set CLOUDFLARE_ZONE_ID=your-zone-id
  supabase secrets set CLOUDFLARE_DOMAIN=your-domain.com
  supabase secrets set CLOUDFLARE_WORKER_NAME=your-worker-name
  supabase secrets set CLOUDFLARE_WORKER_ROUTE=your-domain.com
  ```
- [ ] **Deploy all Edge Functions**: `supabase functions deploy`
- [ ] **Verify functions are deployed**:
  - [ ] `generate-email`
  - [ ] `post-cloudflare-email`
  - [ ] `get-cloudflare-email`
  - [ ] `get-all-temp-emails`
  - [ ] `delete-temp-email`

## 🖥️ Frontend Configuration

- [ ] **Update frontend configuration** in `前端/script.js`:
  ```javascript
  const SUPABASE_CONFIG = {
      url: 'https://your-project.supabase.co',
      anonKey: 'your-actual-anon-key'
  };
  ```
- [ ] **Test frontend locally**
  - [ ] Open `前端/index.html` in browser
  - [ ] Check console for configuration logs
  - [ ] Verify no CORS errors

## 🔧 Cloudflare Configuration (Update if needed)

- [ ] **Update Cloudflare Worker** (if required)
  - [ ] Ensure Worker posts to new Supabase endpoint
  - [ ] Update endpoint URL to: `https://your-project.supabase.co/functions/v1/post-cloudflare-email`
  - [ ] Add Supabase authentication headers
- [ ] **Verify email routing** is still active
- [ ] **Test Worker functionality** with a test email

## 🧪 Testing Phase

### Basic Functionality Tests
- [ ] **Test email generation**
  - [ ] Click "生成新的临时邮箱"
  - [ ] Verify email address is generated
  - [ ] Check console for successful API calls
  - [ ] Verify database record in Supabase
- [ ] **Test email reception**
  - [ ] Send test email to generated address
  - [ ] Wait 1-2 minutes for processing
  - [ ] Check Cloudflare Worker logs
  - [ ] Verify email stored in database
- [ ] **Test email retrieval**
  - [ ] Click refresh/check email button
  - [ ] Verify email content displays correctly
  - [ ] Check both text and HTML content
- [ ] **Test email deletion**
  - [ ] Click delete button
  - [ ] Confirm deletion in dialog
  - [ ] Verify Cloudflare route is removed
  - [ ] Check database records are cleaned up

### Error Handling Tests
- [ ] **Test with invalid configuration**
- [ ] **Test network error scenarios**
- [ ] **Test with no emails received**
- [ ] **Test with multiple emails**

## 📊 Monitoring Setup

- [ ] **Set up Supabase monitoring**
  - [ ] Check Edge Functions dashboard
  - [ ] Review database performance metrics
  - [ ] Set up error alerting (if needed)
- [ ] **Monitor Cloudflare**
  - [ ] Check Worker execution logs
  - [ ] Monitor email routing status
  - [ ] Verify API usage is within limits

## 🚀 Production Deployment

- [ ] **Domain configuration** (if using custom domain)
  - [ ] Update CORS settings in Supabase
  - [ ] Configure web server for frontend
  - [ ] Set up HTTPS certificates
- [ ] **Security review**
  - [ ] Verify RLS policies are appropriate
  - [ ] Check API key security
  - [ ] Review environment variable exposure
- [ ] **Performance optimization**
  - [ ] Check function cold start times
  - [ ] Monitor database query performance
  - [ ] Set appropriate timeout values

## 📝 Documentation Updates

- [ ] **Update internal documentation** with new endpoints
- [ ] **Train team members** on new architecture
- [ ] **Document troubleshooting procedures**
- [ ] **Create rollback plan** (if needed)

## ✅ Post-Migration Verification

- [ ] **Full end-to-end test** of all functionality
- [ ] **Performance comparison** with old system
- [ ] **Monitor for 24-48 hours** after deployment
- [ ] **User feedback collection** and issue resolution
- [ ] **Cleanup old UniCloud resources** (when confident)

## 🎉 Migration Complete!

When all items are checked:
- [ ] **Announce migration completion** to team/users
- [ ] **Monitor system health** for first week
- [ ] **Collect and address feedback**
- [ ] **Document lessons learned**
- [ ] **Celebrate successful migration!** 🎊

---

## 🆘 If Something Goes Wrong

### Quick Rollback Options
1. **Frontend only**: Revert `前端/script.js` to use old UniCloud endpoints
2. **Worker update**: Update Cloudflare Worker to post to old UniCloud endpoint
3. **Full rollback**: Re-enable old UniCloud functions and revert frontend

### Getting Help
- Check [TESTING_GUIDE.md](TESTING_GUIDE.md) for debugging steps
- Review Supabase Edge Function logs
- Check Cloudflare Worker logs
- Refer to [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for endpoint details

### Support Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- Project GitHub Issues for community support

**Remember**: Take your time with each step and test thoroughly before moving to the next phase!