// Supabase Edge Function: generate-email
// File: supabase/functions/generate-email/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Dynamically generate allowed origins
const ALLOWED_ORIGINS = [
  'https://turbo-barnacle-g44x77pvj5x9f9ggp-5500.app.github.dev',
  'http://localhost:5500',
  'https://localhost:5500'
];

function getCorsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': 
      origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin'
  };
}

// Configuration (move to environment variables)
const config = {
  cloudflare: {
    domain: Deno.env.get('CLOUDFLARE_DOMAIN') || 'your-domain.com',
    apiToken: Deno.env.get('CLOUDFLARE_API_TOKEN'),
    zoneId: Deno.env.get('CLOUDFLARE_ZONE_ID'),
    workerName: Deno.env.get('CLOUDFLARE_WORKER_NAME') || 'email-parser',
    workerRoute: Deno.env.get('CLOUDFLARE_WORKER_ROUTE') || 'your-domain.com'
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
    try {
      this.validateConfig();
      console.log('使用 Worker 方式创建邮箱路由...');
      return await this.createWorkerRoute(email);
    } catch (error) {
      console.error('创建邮箱路由失败:', error);
      throw error;
    }
  }

  validateConfig() {
    if (!this.apiToken) {
      throw new Error('Cloudflare API Token 未配置');
    }
    if (!this.zoneId) {
      throw new Error('Cloudflare Zone ID 未配置');
    }
    console.log('Cloudflare 配置验证通过');
  }

  async createWorkerRoute(email) {
    const routePattern = `${email}`;
    const workerName = config.cloudflare.workerName;
    
    console.log('创建 Worker 路由:', routePattern, '→', workerName);

    const url = `${this.baseURL}/zones/${this.zoneId}/workers/routes`;
    const routeData = {
      pattern: routePattern,
      script: workerName
    };

    console.log('Worker 路由请求数据:', JSON.stringify(routeData, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(routeData)
    });

    const responseData = await response.json();
    console.log('Cloudflare API 响应:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      throw new Error(`Cloudflare API错误: ${response.status} - ${JSON.stringify(responseData)}`);
    }

    if (!responseData.success) {
      throw new Error(`Worker路由创建失败: ${JSON.stringify(responseData.errors)}`);
    }

    return {
      success: true,
      message: 'Worker路由创建成功',
      routeId: responseData.result?.id,
      pattern: routePattern,
      worker: workerName
    };
  }
}

serve(async (req) => {
  // Get the origin from the request
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
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
    console.log('保存邮箱到Supabase数据库...');
    const { data, error } = await supabase
      .from('temp_emails')
      .insert({
        email: tempEmail,
        created_at: Date.now(),
        deleted: false
      })
      .select();

    if (error) {
      console.error('数据库保存失败:', error);
      // Don't throw error if email route was created successfully
      console.log('邮箱路由已创建，继续返回成功响应');
    } else {
      console.log('数据库保存成功:', data);
    }

    const responseData = {
      success: true,
      email: tempEmail,
      message: '临时邮箱创建成功',
      note: '邮箱路由已创建，邮件将使用Worker方式处理',
      cloudflareResult: cloudflareResult
    };

    console.log('=== Edge Function 执行成功 ===');

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('=== Edge Function 执行失败 ===');
    console.error('错误详情:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || '服务器内部错误',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Example front-end function to call the Edge Function
export async function generateEmail() {
  try {
    console.log('=== 开始生成邮箱 ===');
    
    const response = await fetch(
      'https://awnryunuwuwdqvrtlpam.supabase.co/functions/v1/generate-email', 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    );

    console.log('响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('错误响应内容:', errorText);
      throw new Error(`HTTP错误 ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    console.log('生成邮箱响应:', data);

    if (!data.success) {
      throw new Error(data.error || '邮箱生成失败');
    }

    return data; 

  } catch (error) {
    console.error('=== 前端执行失败 ===');
    console.error('错误详情:', error);
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);

    // 详细的错误处理
    let userFriendlyMessage = '网络连接失败，请检查网络或稍后重试';
    
    if (error.message.includes('Failed to fetch')) {
      userFriendlyMessage = '无法连接到服务器，请检查网络连接';
    } else if (error.message.includes('HTTP错误')) {
      userFriendlyMessage = '服务器返回错误，请稍后重试';
    }

    // 可以在这里添加更多具体的错误类型处理

    throw { 
      email: null, 
      timestamp: Date.now(), 
      success: false, 
      error: userFriendlyMessage 
    };
  }
}
