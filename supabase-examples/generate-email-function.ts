// Supabase Edge Function: generate-email
// File: supabase/functions/generate-email/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Configuration (move to environment variables)
const config = {
  cloudflare: {
    domain: Deno.env.get('CLOUDFLARE_DOMAIN') || 'your-domain.com',
    apiToken: Deno.env.get('CLOUDFLARE_API_TOKEN'),
    zoneId: Deno.env.get('CLOUDFLARE_ZONE_ID'),
    workerName: 'email-parser'
  }
};

// Generate random email name
function generateRandomEmailName() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Cloudflare API class
class CloudflareAPI {
  constructor() {
    this.apiToken = config.cloudflare.apiToken;
    this.zoneId = config.cloudflare.zoneId;
    this.baseURL = 'https://api.cloudflare.com/client/v4';
  }

  async createEmailRoute(email) {
    const payload = {
      name: `temp-${Date.now()}`,
      enabled: true,
      matchers: [
        {
          type: 'literal',
          field: 'to',
          value: email
        }
      ],
      actions: [
        {
          type: 'worker',
          value: [config.cloudflare.workerName]
        }
      ],
      priority: 0
    };

    const response = await fetch(
      `${this.baseURL}/zones/${this.zoneId}/email/routing/rules`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Cloudflare API错误: ${JSON.stringify(data.errors)}`);
    }

    return data.result;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Supabase Edge Function: generate-email 开始执行 ===');
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate random email name
    const emailName = generateRandomEmailName();
    const tempEmail = `${emailName}@${config.cloudflare.domain}`;
    console.log('生成的临时邮箱:', tempEmail);

    // Create Cloudflare email route
    console.log('开始创建Cloudflare邮箱路由...');
    const cloudflare = new CloudflareAPI();
    const cloudflareResult = await cloudflare.createEmailRoute(tempEmail);
    console.log('Cloudflare邮箱路由创建成功:', cloudflareResult);

    // Save to Supabase database
    console.log('开始保存到Supabase数据库...');
    const { data: dbResult, error: dbError } = await supabase
      .from('temp_emails')
      .insert({
        email: tempEmail,
        created_at: Date.now(),
        deleted: false
      })
      .select();

    if (dbError) {
      console.error('数据库保存失败:', dbError);
      throw dbError;
    }

    console.log('数据库保存成功:', dbResult);

    const responseData = {
      success: true,
      email: tempEmail,
      message: '临时邮箱创建成功',
      note: '邮箱路由已创建，邮件将使用Worker方式处理'
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