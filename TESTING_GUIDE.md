# Testing Guide for Supabase Migration

This guide provides comprehensive testing procedures to verify that all functionality works correctly after the migration from UniCloud to Supabase.

## Pre-Testing Checklist

Before running tests, ensure:
- [ ] Supabase project is set up and database schema is deployed
- [ ] All 5 Edge Functions are deployed to Supabase
- [ ] Environment variables are configured
- [ ] Frontend configuration is updated with your Supabase project details
- [ ] Cloudflare Workers and Email Routing are configured

## Test Environment Setup

### 1. Browser Setup
- Open Chrome/Firefox with Developer Tools (F12)
- Go to Console tab to monitor logs
- Disable cache (in Network tab) for accurate testing

### 2. Test Data Preparation
- Have an external email account ready to send test emails
- Prepare different types of email content (plain text, HTML, attachments)

## Test 1: Email Generation Function

### Test Objective
Verify that temporary emails can be generated successfully.

### Test Steps
1. Open your frontend application
2. Click "生成新的临时邮箱" button
3. Monitor browser console for logs

### Expected Results
- ✅ Button shows loading state during generation
- ✅ Console shows: "临时邮箱生成器已加载 - 使用Supabase Edge Functions"
- ✅ Console shows Supabase API calls
- ✅ New email address is displayed
- ✅ Email format is correct (8 random chars + @yourdomain.com)
- ✅ Email is saved to localStorage
- ✅ Success message is displayed

### Verify in Supabase
1. Go to Supabase Dashboard > Table Editor
2. Check `temp_emails` table
3. Verify new record is created with correct data

### Common Issues
- **Generation fails**: Check Cloudflare API credentials
- **No database record**: Check Edge Function logs
- **CORS errors**: Verify Supabase CORS settings

## Test 2: Email Reception and Storage

### Test Objective
Verify that incoming emails are properly processed and stored.

### Test Steps
1. Generate a temporary email (from Test 1)
2. Send a test email to the generated address from an external account
3. Include both plain text and HTML content
4. Wait 1-2 minutes for processing

### Email Content to Test
- **Subject**: "Test Email - Supabase Migration"
- **Text content**: "This is a test email to verify Supabase functionality."
- **HTML content**: `<p>This is <strong>HTML</strong> content.</p>`

### Verify Processing
1. Check Cloudflare Workers logs
2. Monitor Supabase Edge Function logs for `post-cloudflare-email`
3. Check `cloudflare_edukg_email` table in Supabase

### Expected Results
- ✅ Email is processed by Cloudflare Worker
- ✅ `post-cloudflare-email` function is triggered
- ✅ Email data is stored in `cloudflare_edukg_email` table
- ✅ All email fields are populated correctly:
  - `email_from`: sender address
  - `email_to`: generated temporary email
  - `subject`: email subject
  - `email_content_text`: plain text content
  - `email_content_html`: HTML content (if present)
  - `has_html`: true if HTML content exists
  - `create_time`: timestamp
  - `processed_at`: processing timestamp

## Test 3: Email Retrieval Function

### Test Objective
Verify that emails can be retrieved and displayed in the frontend.

### Test Steps
1. With the temporary email from previous tests
2. Click refresh or check email button in frontend
3. Monitor API calls and responses

### Expected Results
- ✅ `get-cloudflare-email` function is called
- ✅ Latest email is retrieved from database
- ✅ Email content is displayed in frontend:
  - Sender information
  - Subject line
  - Message content (text/HTML)
  - Timestamp
- ✅ HTML content is properly rendered if present
- ✅ No email message if no emails exist

### Test Edge Cases
1. **No emails**: Should show "暂无邮件" message
2. **Multiple emails**: Should show the latest email
3. **Large emails**: Test with emails containing lots of text

## Test 4: Email Deletion Function

### Test Objective
Verify that emails and temporary email addresses can be deleted.

### Test Steps
1. Generate and use a temporary email with received messages
2. Click the delete/clear button
3. Confirm deletion in the dialog
4. Monitor the deletion process

### Expected Results
- ✅ Confirmation dialog appears
- ✅ `delete-temp-email` function is called
- ✅ Cloudflare email routes are deleted
- ✅ Email records are removed from `cloudflare_edukg_email` table
- ✅ Temporary email is marked as deleted in `temp_emails` table
- ✅ Success message is displayed
- ✅ Frontend clears the email display

### Verify Deletion
1. Check Cloudflare Dashboard > Workers > Routes (route should be removed)
2. Check Supabase `cloudflare_edukg_email` table (records should be deleted)
3. Check Supabase `temp_emails` table (deleted field should be true)

## Test 5: Get All Temp Emails Function

### Test Objective
Verify the function that lists all temporary emails (if implemented in frontend).

### Test Steps
1. Generate multiple temporary emails
2. Send emails to some of them
3. Call the get-all-temp-emails endpoint

### Expected Results
- ✅ All temporary emails are listed
- ✅ Email counts are accurate
- ✅ Creation timestamps are correct
- ✅ Active/deleted status is accurate

## Test 6: Error Handling

### Test Objective
Verify proper error handling for various failure scenarios.

### Test Scenarios

#### 6.1 Network Errors
- Disable internet connection temporarily
- Try to generate email
- Expected: Proper error message displayed

#### 6.2 Invalid Configuration
- Temporarily modify frontend config with wrong URL
- Try to use the application
- Expected: Authentication or connection errors

#### 6.3 Database Errors
- Temporarily revoke database permissions
- Try to generate email
- Expected: Database error handling

#### 6.4 Cloudflare API Errors
- Use invalid Cloudflare API token
- Try to generate email
- Expected: Cloudflare API error handling

## Test 7: Performance Testing

### Test Objective
Verify acceptable performance under normal usage.

### Test Steps
1. Generate multiple emails in sequence
2. Send multiple emails to the same address
3. Delete emails and check response times

### Performance Metrics
- Email generation: < 5 seconds
- Email retrieval: < 2 seconds
- Email deletion: < 10 seconds (includes Cloudflare API calls)

## Test 8: Frontend Responsiveness

### Test Objective
Verify the frontend works on different devices and screen sizes.

### Test Steps
1. Test on desktop browser
2. Test on mobile browser
3. Test with different screen orientations

### Expected Results
- ✅ Layout adapts to screen size
- ✅ Buttons are touchable on mobile
- ✅ Text is readable on all devices
- ✅ All functionality works on mobile

## Test 9: Data Integrity

### Test Objective
Verify data consistency across all operations.

### Test Steps
1. Generate email and verify database record
2. Receive email and verify content integrity
3. Check that HTML/text content is preserved
4. Verify timestamps are accurate
5. Delete email and verify complete cleanup

## Test 10: Load Testing (Optional)

### Test Objective
Verify system stability under load.

### Test Steps
1. Generate multiple emails rapidly
2. Send multiple emails simultaneously
3. Monitor Supabase dashboard for performance metrics

### Tools
- Use browser DevTools Network tab
- Monitor Supabase Dashboard > Reports
- Check Edge Function invocation counts

## Test Results Documentation

### Test Report Template

```
Test Date: YYYY-MM-DD
Tester: [Name]
Environment: [Production/Staging]

| Test | Status | Notes |
|------|--------|-------|
| Email Generation | ✅/❌ | [Details] |
| Email Reception | ✅/❌ | [Details] |
| Email Retrieval | ✅/❌ | [Details] |
| Email Deletion | ✅/❌ | [Details] |
| Error Handling | ✅/❌ | [Details] |
| Performance | ✅/❌ | [Details] |
| Mobile Support | ✅/❌ | [Details] |

Overall Status: ✅ PASS / ❌ FAIL

Issues Found:
1. [Issue description and resolution]
2. [Issue description and resolution]

Recommendations:
1. [Recommendation]
2. [Recommendation]
```

## Troubleshooting Common Test Failures

### Email Generation Fails
1. Check Supabase Edge Function logs
2. Verify Cloudflare API credentials
3. Check environment variables
4. Verify Cloudflare Zone ID

### Email Reception Fails  
1. Check Cloudflare Workers logs
2. Verify email routing is enabled
3. Check Worker script is deployed
4. Verify `post-cloudflare-email` function logs

### Email Retrieval Shows Wrong Data
1. Check database records directly
2. Verify table schema matches expectations
3. Check for timezone issues
4. Verify RLS policies allow access

### Deletion Doesn't Work
1. Check Cloudflare API permissions
2. Verify database delete permissions
3. Check Edge Function logs for errors
4. Verify proper error handling

## Post-Testing Checklist

After successful testing:
- [ ] Document any configuration changes needed
- [ ] Update monitoring and alerting
- [ ] Prepare production deployment
- [ ] Train users on any UI changes
- [ ] Set up regular health checks

## Continuous Testing

Set up automated testing:
1. Create automated test scripts
2. Set up monitoring alerts
3. Regular health checks
4. Performance monitoring

The migration is successful when all tests pass consistently!