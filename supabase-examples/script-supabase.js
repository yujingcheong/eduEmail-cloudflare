// Updated Frontend script.js for Supabase integration
// Replace the existing cloud function URLs with Supabase Edge Function URLs

// Configuration - Update these with your Supabase project details
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-supabase-anon-key'
};

// Supabase Edge Function URLs
const API_ENDPOINTS = {
    generateEmail: `${SUPABASE_CONFIG.url}/functions/v1/generate-email`,
    getEmail: `${SUPABASE_CONFIG.url}/functions/v1/get-cloudflare-email`,
    getAllEmails: `${SUPABASE_CONFIG.url}/functions/v1/get-all-temp-emails`,
    deleteEmail: `${SUPABASE_CONFIG.url}/functions/v1/delete-temp-email`
};

// Common headers for Supabase requests
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
    'apikey': SUPABASE_CONFIG.anonKey
});

// Global variable to store current generated email
let currentEmail = null;

async function generateEmail() {
    const btn = document.getElementById('generateBtn');
    const btnText = document.getElementById('btnText');
    const emailDisplay = document.getElementById('emailDisplay');
    const emailContent = document.getElementById('emailContent');
    const status = document.getElementById('status');

    console.log('=== 前端开始生成邮箱 (Supabase) ===');
    console.log('当前邮箱:', currentEmail);

    // Disable button and show loading state
    btn.disabled = true;
    btnText.innerHTML = '<span class="loading"></span>生成中...';

    // Clear previous display content
    try {
        status.style.display = 'none';
        emailDisplay.classList.remove('show');

        if (emailContent) {
            emailContent.classList.remove('show');
        }

        const emailAddressElement = document.getElementById('emailAddress');
        if (emailAddressElement) {
            emailAddressElement.textContent = '';
        }

        // Clear old email data
        currentEmail = null;
        localStorage.removeItem('tempEmail');
        localStorage.removeItem('tempEmailCreatedAt');

        console.log('已清除旧邮箱数据，准备生成新邮箱');
    } catch (clearError) {
        console.error('清除旧数据时出错:', clearError);
    }

    try {
        console.log('准备发送请求到Supabase Edge Function...');
        const requestBody = {};
        console.log('请求体:', JSON.stringify(requestBody, null, 2));

        // Call Supabase Edge Function
        const response = await fetch(API_ENDPOINTS.generateEmail, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(requestBody)
        });

        console.log('响应状态:', response.status);
        console.log('响应头:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP错误响应:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('Supabase响应:', JSON.stringify(result, null, 2));

        if (result.success) {
            const generatedEmail = result.email;
            currentEmail = generatedEmail;

            // Save to localStorage
            localStorage.setItem('tempEmail', generatedEmail);
            localStorage.setItem('tempEmailCreatedAt', Date.now().toString());

            // Display the email
            const emailAddressElement = document.getElementById('emailAddress');
            if (emailAddressElement) {
                emailAddressElement.textContent = generatedEmail;
            }

            emailDisplay.classList.add('show');
            console.log('✅ 邮箱生成成功:', generatedEmail);

            // Show success status
            showStatus('success', result.message || '邮箱生成成功！');

            // Start checking for emails
            setTimeout(() => {
                checkForEmails();
            }, 2000);

        } else {
            throw new Error(result.error || '生成邮箱失败');
        }

    } catch (error) {
        console.error('生成邮箱失败:', error);
        showStatus('error', `生成失败: ${error.message}`);
    } finally {
        // Restore button state
        btn.disabled = false;
        btnText.textContent = '生成新邮箱';
    }
}

async function checkForEmails() {
    if (!currentEmail) {
        console.log('没有当前邮箱，停止检查邮件');
        return;
    }

    console.log('=== 检查邮件 (Supabase) ===');
    console.log('检查邮箱:', currentEmail);

    try {
        const requestBody = { email: currentEmail };
        console.log('请求体:', JSON.stringify(requestBody, null, 2));

        // Call Supabase Edge Function
        const response = await fetch(API_ENDPOINTS.getEmail, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('检查邮件HTTP错误:', errorText);
            return;
        }

        const result = await response.json();
        console.log('邮件检查响应:', JSON.stringify(result, null, 2));

        if (result.success && result.data) {
            console.log('✅ 收到新邮件!');
            displayEmail(result.data);
        } else {
            console.log('暂无新邮件');
            // Continue checking after 5 seconds
            setTimeout(() => {
                checkForEmails();
            }, 5000);
        }

    } catch (error) {
        console.error('检查邮件失败:', error);
        // Continue checking after 10 seconds even if there's an error
        setTimeout(() => {
            checkForEmails();
        }, 10000);
    }
}

function displayEmail(emailData) {
    console.log('显示邮件:', emailData);

    const emailContent = document.getElementById('emailContent');
    if (!emailContent) {
        console.error('emailContent元素未找到');
        return;
    }

    // Update email info
    document.getElementById('emailFrom').textContent = emailData.from || '未知发件人';
    document.getElementById('emailSubject').textContent = emailData.subject || '无主题';
    document.getElementById('emailTime').textContent = formatDateTime(emailData.receivedAt);

    // Display email content
    const emailBody = document.getElementById('emailBody');
    if (emailData.content.html && emailData.hasHtml) {
        emailBody.innerHTML = emailData.content.html;
    } else if (emailData.content.text) {
        emailBody.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(emailData.content.text)}</pre>`;
    } else {
        emailBody.innerHTML = '<p style="color: #999;">邮件内容为空</p>';
    }

    // Show email content
    emailContent.classList.add('show');
    
    // Stop checking for more emails
    console.log('已显示邮件，停止检查');
}

// Utility functions (keep existing ones)
function formatDateTime(dateString) {
    if (!dateString) return '未知时间';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (error) {
        console.error('时间格式化失败:', error);
        return dateString;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showStatus(type, message) {
    const status = document.getElementById('status');
    status.className = `status ${type}`;
    status.textContent = message;
    status.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }
}

function copyEmail() {
    if (currentEmail) {
        navigator.clipboard.writeText(currentEmail).then(() => {
            showStatus('success', '邮箱地址已复制到剪贴板！');
        }).catch(err => {
            console.error('复制失败:', err);
            showStatus('error', '复制失败，请手动复制');
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，初始化Supabase配置');
    console.log('Supabase URL:', SUPABASE_CONFIG.url);
    
    // Check if there's a stored email
    const storedEmail = localStorage.getItem('tempEmail');
    if (storedEmail) {
        currentEmail = storedEmail;
        const emailAddressElement = document.getElementById('emailAddress');
        if (emailAddressElement) {
            emailAddressElement.textContent = storedEmail;
        }
        document.getElementById('emailDisplay').classList.add('show');
        console.log('恢复存储的邮箱:', storedEmail);
    }
});