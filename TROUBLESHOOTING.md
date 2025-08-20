# 🔧 故障排查指南

## 🚨 常见问题快速解决

### 问题1：无法生成邮箱地址

#### 症状
- 点击"生成邮箱"按钮后出现错误
- 前端显示"生成失败"

#### 解决步骤
1. **检查浏览器控制台**
   - 按 F12 打开开发者工具
   - 查看 Console 和 Network 标签页的错误信息

2. **验证云函数配置**
   - 确认 `generate-email` 云函数已部署
   - 检查前端 `script.js` 中的云函数 URL 是否正确

3. **检查 Cloudflare 配置**
   ```javascript
   // 云函数中的配置是否正确
   const config = {
     cloudflare: {
       api_token: "你的实际Token",  // ❌ 不能是占位符
       zone_id: "你的实际ZoneID",   // ❌ 不能是占位符
       domain: "你的实际域名"       // ❌ 不能是占位符
     }
   };
   ```

4. **测试 API Token 权限**
   - 在浏览器访问：`https://api.cloudflare.com/client/v4/zones/你的ZoneID`
   - 请求头添加：`Authorization: Bearer 你的Token`
   - 应该返回域名信息而不是错误

---

### 问题2：生成成功但收不到邮件

#### 症状
- 邮箱地址成功生成
- 外部发送邮件但收不到

#### 解决步骤
1. **检查 MX 记录**
   ```bash
   # 在命令行测试 DNS 记录
   nslookup -type=mx 你的域名.com
   
   # 应该看到类似输出：
   # 你的域名.com mail exchanger = 10 route1.mx.cloudflare.net.
   # 你的域名.com mail exchanger = 20 route2.mx.cloudflare.net.
   ```

2. **验证邮件路由规则**
   - 登录 Cloudflare Dashboard
   - 域名 → Email → Email Routing → Routing Rules
   - 确认有对应的路由规则生成

3. **检查 Worker 状态**
   - Cloudflare Dashboard → Workers & Pages
   - 点击 `email-processor` → Logs
   - 查看是否有邮件处理日志

4. **发送方检查**
   - 确认发送方不在黑名单
   - 检查发送方的垃圾邮件文件夹
   - 尝试从不同邮件服务商发送

---

### 问题3：收到邮件但无法查看内容

#### 症状
- 邮件成功接收（Worker 有日志）
- 前端查看邮件时显示"无邮件"或错误

#### 解决步骤
1. **检查数据存储**
   - UniCloud 控制台 → 云数据库
   - 查看 `cloudflare_edukg_email` 集合是否有数据

2. **验证 Worker 回调**
   - 检查 Worker 代码中的云函数 URL
   ```javascript
   const cloudFunctionUrl = 'https://你的项目ID.dev-hz.cloudbasefunction.cn/POST_cloudflare_edukg_email';
   ```

3. **查看云函数日志**
   - UniCloud 控制台 → 云函数 → POST_cloudflare_edukg_email
   - 查看执行日志，确认是否有数据写入

4. **测试查询功能**
   - 直接在 UniCloud 控制台测试 `GET_cloudflare_edukg_email` 云函数
   - 使用测试参数：`{"email": "生成的邮箱地址"}`

---

### 问题4：删除邮箱失败

#### 症状
- 点击"清除邮箱"后出现错误
- 邮箱地址仍然显示

#### 解决步骤
1. **检查删除云函数**
   - 确认 `Delete_edu_cloudfare` 云函数已部署
   - 验证配置信息正确

2. **检查 API 权限**
   - 确认 API Token 有 "Email Routing Rules:Edit" 权限
   - 测试删除权限：
   ```bash
   curl -X DELETE "https://api.cloudflare.com/client/v4/zones/ZoneID/email/routing/rules/规则ID" \
   -H "Authorization: Bearer 你的Token"
   ```

3. **手动清理**
   - Cloudflare Dashboard → Email → Email Routing → Routing Rules
   - 手动删除对应的路由规则
   - UniCloud 控制台 → 云数据库 → 删除对应记录

---

## 🔍 调试技巧

### 1. 启用详细日志
在云函数中添加更多 console.log：
```javascript
console.log('=== 调试信息 ===');
console.log('输入参数:', JSON.stringify(event, null, 2));
console.log('配置信息:', JSON.stringify(config, null, 2));
```

### 2. 逐步测试
```javascript
// 测试 API 连接
const testResponse = await axios.get(`${this.baseURL}/zones/${this.zoneId}`, {
  headers: { 'Authorization': `Bearer ${this.apiToken}` }
});
console.log('API 测试结果:', testResponse.data);
```

### 3. 使用 Postman 测试
直接测试云函数接口：
- URL: `https://你的项目域名.dev-hz.cloudbasefunction.cn/generate-email`
- Method: POST
- Body: `{"email": "test@你的域名.com"}`

---

## 📊 状态码说明

| 状态码 | 含义 | 常见原因 |
|--------|------|----------|
| 200 | 成功 | 正常执行 |
| 401 | 认证失败 | API Token 错误或过期 |
| 403 | 权限不足 | API Token 权限不够 |
| 404 | 资源不存在 | Zone ID 错误或云函数不存在 |
| 422 | 参数错误 | 请求格式错误或参数无效 |
| 429 | 频率限制 | API 调用过于频繁 |
| 500 | 服务器错误 | 代码错误或服务异常 |

---

## 🆘 获取更多帮助

1. **查看详细日志**
   - Cloudflare Workers 日志
   - UniCloud 云函数日志
   - 浏览器开发者工具

2. **社区求助**
   - [GitHub Issues](https://github.com/yujingcheong/eduEmail-cloudflare/issues)
   - 提供详细的错误信息和配置信息

3. **联系开发者**
   - 微信扫描项目中的二维码
   - 提供具体的错误截图和日志

---

**💡 小贴士：90% 的问题都是配置错误导致的，请仔细检查每一步的配置信息！**