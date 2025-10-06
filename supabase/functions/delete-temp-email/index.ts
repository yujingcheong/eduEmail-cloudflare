// Supabase Edge Function: delete-temp-email
// File: supabase/functions/delete-temp-email/index.ts

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
    apiToken: Deno.env.get('CLOUDFLARE_API_TOKEN'),
    zoneId: Deno.env.get('CLOUDFLARE_ZONE_ID'),
    domain: Deno.env.get('CLOUDFLARE_DOMAIN') || 'your-domain.com'
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

  async deleteEmailRoutes(email) {
    console.log('=== 开始删除Cloudflare邮箱路由 ===');
    console.log('目标邮箱:', email);

    try {
      // Get all worker routes to find the matching pattern
      const listResponse = await fetch(
        `${this.baseURL}/zones/${this.zoneId}/workers/routes`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const listData = await listResponse.json();

      if (!listResponse.ok || !listData.success) {
        throw new Error(`获取Worker路由列表失败: ${JSON.stringify(listData.errors)}`);
      }

      console.log('获取到的路由规则总数:', listData.result.length);

      // Find matching routes (pattern should contain the email)
      const matchingRoutes = listData.result.filter(route => {
        return route.pattern && route.pattern.includes(email);
      });

      console.log('找到匹配的路由规则数:', matchingRoutes.length);
      console.log('匹配的路由规则:', JSON.stringify(matchingRoutes, null, 2));

      if (matchingRoutes.length === 0) {
        console.log('未找到该邮箱的Worker路由规则');
        return {
          success: true,
          message: '未找到该邮箱的Worker路由规则',
          deletedCount: 0
        };
      }

      // Delete all matching routes
      const deleteResults = [];
      for (const route of matchingRoutes) {
        console.log(`删除Worker路由规则 ID: ${route.id}`);
        
        try {
          const deleteResponse = await fetch(
            `${this.baseURL}/zones/${this.zoneId}/workers/routes/${route.id}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          const deleteData = await deleteResponse.json();

          if (!deleteResponse.ok || !deleteData.success) {
            console.error(`删除路由规则 ${route.id} 失败:`, deleteData.errors);
            throw new Error(`删除路由规则失败: ${JSON.stringify(deleteData.errors)}`);
          }

          console.log(`✅ 路由规则 ${route.id} 删除成功`);
          deleteResults.push({ id: route.id, success: true });
        } catch (error) {
          console.error(`删除路由规则 ${route.id} 失败:`, error);
          deleteResults.push({ id: route.id, success: false, error: error.message });
        }
      }

      const successCount = deleteResults.filter(r => r.success).length;
      
      return {
        success: successCount > 0,
        message: `成功删除 ${successCount}/${matchingRoutes.length} 个路由规则`,
        deletedCount: successCount,
        results: deleteResults
      };

    } catch (error) {
      console.error('删除Cloudflare路由失败:', error);
      throw error;
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Supabase Edge Function: delete-temp-email 开始执行 ===');
    
    // Parse request body
    const requestData = await req.json();
    console.log('请求参数:', JSON.stringify(requestData, null, 2));

    const { email } = requestData;

    if (!email) {
      throw new Error('缺少邮箱地址参数');
    }

    console.log('删除邮箱:', email);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Delete results tracking
    const deleteResults = {
      cloudflare: { success: false, message: '', deletedCount: 0 },
      emailData: { success: false, message: '', deletedCount: 0 },
      tempEmails: { success: false, message: '', deletedCount: 0 }
    };

    // 1. Delete Cloudflare email routes
    console.log('=== 步骤1: 删除Cloudflare邮箱路由 ===');
    try {
      const cloudflare = new CloudflareAPI();
      const cloudflareResult = await cloudflare.deleteEmailRoutes(email);
      deleteResults.cloudflare = {
        success: cloudflareResult.success,
        message: cloudflareResult.message,
        deletedCount: cloudflareResult.deletedCount || 0
      };
      console.log('Cloudflare删除结果:', deleteResults.cloudflare);
    } catch (cloudflareError) {
      console.error('删除Cloudflare路由失败:', cloudflareError);
      deleteResults.cloudflare = {
        success: false,
        message: `Cloudflare删除失败: ${cloudflareError.message}`,
        deletedCount: 0
      };
    }

    // 2. Delete email data from cloudflare_edukg_email table
    console.log('=== 步骤2: 删除邮件数据 ===');
    try {
      const { count: beforeCount } = await supabase
        .from('cloudflare_edukg_email')
        .select('*', { count: 'exact', head: true })
        .eq('email_to', email);

      console.log(`删除前该邮箱有 ${beforeCount || 0} 条邮件记录`);

      const { error: deleteError } = await supabase
        .from('cloudflare_edukg_email')
        .delete()
        .eq('email_to', email);

      if (deleteError) {
        throw deleteError;
      }

      deleteResults.emailData = {
        success: true,
        message: `成功删除 ${beforeCount || 0} 条邮件记录`,
        deletedCount: beforeCount || 0
      };
      console.log('邮件数据删除结果:', deleteResults.emailData);
    } catch (emailError) {
      console.error('删除邮件数据失败:', emailError);
      deleteResults.emailData = {
        success: false,
        message: `邮件数据删除失败: ${emailError.message}`,
        deletedCount: 0
      };
    }

    // 3. Mark temp email as deleted
    console.log('=== 步骤3: 标记临时邮箱为已删除 ===');
    try {
      const { data: updateData, error: updateError } = await supabase
        .from('temp_emails')
        .update({ deleted: true })
        .eq('email', email)
        .select();

      if (updateError) {
        throw updateError;
      }

      deleteResults.tempEmails = {
        success: true,
        message: `成功标记 ${updateData?.length || 0} 条临时邮箱记录为已删除`,
        deletedCount: updateData?.length || 0
      };
      console.log('临时邮箱标记结果:', deleteResults.tempEmails);
    } catch (tempError) {
      console.error('标记临时邮箱失败:', tempError);
      deleteResults.tempEmails = {
        success: false,
        message: `临时邮箱标记失败: ${tempError.message}`,
        deletedCount: 0
      };
    }

    // Calculate overall success
    const overallSuccess = deleteResults.cloudflare.success || 
                          deleteResults.emailData.success || 
                          deleteResults.tempEmails.success;

    const totalDeleted = deleteResults.cloudflare.deletedCount + 
                       deleteResults.emailData.deletedCount + 
                       deleteResults.tempEmails.deletedCount;

    const responseData = {
      success: overallSuccess,
      message: overallSuccess ? 
        `邮箱删除完成，共处理 ${totalDeleted} 项数据` : 
        '邮箱删除失败',
      email: email,
      details: deleteResults,
      summary: {
        totalProcessed: totalDeleted,
        cloudflareRoutes: deleteResults.cloudflare.deletedCount,
        emailRecords: deleteResults.emailData.deletedCount,
        tempEmailRecords: deleteResults.tempEmails.deletedCount
      },
      timestamp: new Date().toISOString()
    };

    console.log('=== 删除操作完成 ===');
    console.log('最终结果:', JSON.stringify(responseData, null, 2));

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