// Supabase Edge Function: get-all-temp-emails
// File: supabase/functions/get-all-temp-emails/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Configuration
const config = {
  cloudflare: {
    domain: Deno.env.get('CLOUDFLARE_DOMAIN') || 'your-domain.com',
    apiToken: Deno.env.get('CLOUDFLARE_API_TOKEN'),
    zoneId: Deno.env.get('CLOUDFLARE_ZONE_ID')
  }
};

// Cloudflare API class
class CloudflareAPI {
  constructor() {
    this.apiToken = config.cloudflare.apiToken;
    this.zoneId = config.cloudflare.zoneId;
    this.domain = config.cloudflare.domain;
    this.baseURL = 'https://api.cloudflare.com/client/v4';
  }

  async getAllEmailRoutes() {
    const url = `${this.baseURL}/zones/${this.zoneId}/workers/routes`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(`获取邮箱路由失败: ${JSON.stringify(data.errors)}`);
    }

    return data.result || [];
  }

  filterTempEmailRoutes(rules) {
    return rules.filter(rule => {
      // 筛选包含域名的临时邮箱规则
      const pattern = rule.pattern || '';
      return pattern.includes(this.domain) && 
             pattern.includes('@') && 
             rule.script; // 确保有关联的Worker
    });
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Supabase Edge Function: get-all-temp-emails 开始执行 ===');
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('开始从Cloudflare获取所有临时邮箱...');

    // Create Cloudflare API instance
    const cloudflareAPI = new CloudflareAPI();

    // Get all email routes
    const allRoutes = await cloudflareAPI.getAllEmailRoutes();
    console.log(`获取到 ${allRoutes.length} 个路由规则`);

    // Filter temporary email routes
    const tempRoutes = cloudflareAPI.filterTempEmailRoutes(allRoutes);
    console.log(`筛选出 ${tempRoutes.length} 个临时邮箱路由`);

    // Convert to email list format with stats
    const emailsWithStats = [];

    for (const rule of tempRoutes) {
      // Extract email from pattern
      const email = rule.pattern || '未知邮箱';

      try {
        // Query email count for this email address
        const { count: emailCount } = await supabase
          .from('cloudflare_edukg_email')
          .select('*', { count: 'exact', head: true })
          .eq('email_to', email);

        // Get records from temp_emails table if available
        const { data: tempEmailRecord } = await supabase
          .from('temp_emails')
          .select('*')
          .eq('email', email)
          .single();

        emailsWithStats.push({
          id: rule.id,
          email: email,
          pattern: rule.pattern,
          createdAt: rule.created_on || tempEmailRecord?.created_at,
          emailCount: emailCount || 0,
          workerName: rule.script || '未知Worker',
          enabled: rule.enabled,
          deleted: tempEmailRecord?.deleted || false
        });

        console.log(`邮箱 ${email} 有 ${emailCount || 0} 封邮件`);
      } catch (error) {
        console.error(`查询邮箱 ${email} 的邮件数量失败:`, error);
        
        // Add with default values if query fails
        emailsWithStats.push({
          id: rule.id,
          email: email,
          pattern: rule.pattern,
          createdAt: rule.created_on,
          emailCount: 0,
          workerName: rule.script || '未知Worker',
          enabled: rule.enabled,
          deleted: false,
          error: '查询失败'
        });
      }
    }

    // Sort by creation date (newest first)
    emailsWithStats.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const responseData = {
      success: true,
      message: `成功获取 ${emailsWithStats.length} 个临时邮箱`,
      emails: emailsWithStats,
      summary: {
        totalEmails: emailsWithStats.length,
        totalEmailMessages: emailsWithStats.reduce((sum, email) => sum + email.emailCount, 0),
        activeEmails: emailsWithStats.filter(email => !email.deleted).length,
        deletedEmails: emailsWithStats.filter(email => email.deleted).length
      },
      timestamp: new Date().toISOString()
    };

    console.log('=== Edge Function 执行成功 ===');
    console.log(`返回 ${emailsWithStats.length} 个邮箱记录`);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

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
    })
  }
})