// Supabase Edge Function: post-cloudflare-email
// File: supabase/functions/post-cloudflare-email/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Supabase Edge Function: post-cloudflare-email 开始执行 ===');
    
    // Parse request body
    const emailData = await req.json();
    console.log('接收到的邮件数据:', JSON.stringify(emailData, null, 2));

    const { emailInfo, emailContent } = emailData;

    if (!emailInfo || !emailContent) {
      throw new Error('邮件数据格式错误');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Prepare email record for database
    const emailRecord = {
      email_from: emailInfo.from,
      email_to: emailInfo.to,
      subject: emailInfo.subject || '无主题',
      email_content_text: emailContent.text || '',
      email_content_html: emailContent.html || '',
      raw_content: emailContent.raw || '',
      email_type: emailInfo.hasHtml ? 'html' : 'text',
      has_html: emailInfo.hasHtml || false,
      has_text: !!emailContent.text,
      text_length: emailContent.text ? emailContent.text.length : 0,
      html_length: emailContent.html ? emailContent.html.length : 0,
      create_time: Date.now(),
      processed_at: new Date().toISOString(),
      worker_info: emailData.workerInfo || {
        version: '1.0.0',
        source: 'cloudflare-workers-email-parser'
      }
    };

    console.log('准备保存的邮件记录:', JSON.stringify(emailRecord, null, 2));

    // Save to Supabase database
    const { data: result, error: dbError } = await supabase
      .from('cloudflare_edukg_email')
      .insert(emailRecord)
      .select();

    if (dbError) {
      console.error('数据库插入失败:', dbError);
      throw dbError;
    }

    console.log('✅ 邮件保存成功');
    console.log('数据库插入结果:', result);

    // Statistics
    const stats = {
      insertedId: result[0]?.id,
      emailFrom: emailInfo.from,
      emailTo: emailInfo.to,
      subject: emailInfo.subject,
      contentType: emailInfo.hasHtml ? 'html' : 'text',
      textLength: emailContent.text ? emailContent.text.length : 0,
      htmlLength: emailContent.html ? emailContent.html.length : 0,
      processingTime: Date.now() - (emailData.startTime || Date.now())
    };

    const responseData = {
      success: true,
      message: '邮件保存成功',
      insertedId: result[0]?.id,
      stats: stats,
      timestamp: new Date().toISOString()
    };

    console.log('=== Edge Function 执行成功 ===');

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('=== Edge Function 执行失败 ===');
    console.error('错误详情:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || '服务器内部错误'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})