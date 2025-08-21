// Supabase Edge Function: get-cloudflare-email
// File: supabase/functions/get-cloudflare-email/index.ts

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
    console.log('=== Supabase Edge Function: get-cloudflare-email 开始执行 ===');
    
    // Parse request body
    const requestData = await req.json();
    console.log('请求参数:', JSON.stringify(requestData, null, 2));

    const { email } = requestData;

    if (!email) {
      throw new Error('缺少邮箱地址参数');
    }

    console.log('查询邮箱:', email);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First check total record count for debugging
    console.log('=== 开始数据库调试 ===');
    const { count: totalCount } = await supabase
      .from('cloudflare_edukg_email')
      .select('*', { count: 'exact', head: true });

    console.log('数据库总记录数:', totalCount);

    // Get sample data for debugging
    const { data: sampleData } = await supabase
      .from('cloudflare_edukg_email')
      .select('*')
      .limit(3);

    console.log('数据库样本数据:', JSON.stringify(sampleData, null, 2));

    // Query emails for this specific address
    const { data: allEmailData } = await supabase
      .from('cloudflare_edukg_email')
      .select('*')
      .eq('email_to', email);

    console.log(`邮箱 ${email} 的所有记录数:`, allEmailData?.length || 0);
    console.log(`邮箱 ${email} 的所有记录:`, JSON.stringify(allEmailData, null, 2));

    // Get the latest email for this address
    const { data: latestEmails, error: queryError } = await supabase
      .from('cloudflare_edukg_email')
      .select('*')
      .eq('email_to', email)
      .order('create_time', { ascending: false })
      .limit(1);

    if (queryError) {
      console.error('查询失败:', queryError);
      throw queryError;
    }

    let responseData;

    if (!latestEmails || latestEmails.length === 0) {
      console.log('❌ 未找到邮件');
      responseData = {
        success: false,
        message: '暂时没有收到邮件',
        email: email,
        data: null,
        debug: {
          totalRecords: totalCount,
          queriedEmail: email,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      const emailData = latestEmails[0];
      console.log('✅ 找到邮件:', JSON.stringify(emailData, null, 2));

      responseData = {
        success: true,
        message: '成功获取邮件',
        email: email,
        data: {
          id: emailData.id,
          from: emailData.email_from,
          to: emailData.email_to,
          subject: emailData.subject,
          content: {
            text: emailData.email_content_text,
            html: emailData.email_content_html,
            raw: emailData.raw_content
          },
          hasHtml: emailData.has_html,
          receivedAt: emailData.processed_at,
          createTime: emailData.create_time
        },
        timestamp: new Date().toISOString()
      };
    }

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