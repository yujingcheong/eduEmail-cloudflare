# ⚡ 快速设置检查清单

## 📝 设置前准备

- [ ] 拥有一个域名
- [ ] 域名已添加到 Cloudflare
- [ ] 准备好 30-45 分钟时间

## 🔗 重要链接（在新标签页打开）

| 服务 | 链接 | 用途 |
|------|------|------|
| Cloudflare Dashboard | [dash.cloudflare.com](https://dash.cloudflare.com/) | 主控制面板 |
| API Tokens 创建 | [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) | 创建访问令牌 |
| Workers 管理 | [dash.cloudflare.com/workers](https://dash.cloudflare.com/workers) | 部署邮件处理脚本 |
| UniCloud 控制台 | [unicloud.dcloud.net.cn](https://unicloud.dcloud.net.cn/) | 云函数管理 |

## ⏱️ 按时间顺序设置

### 第1步：Cloudflare 基础设置 (15分钟)
- [ ] 获取 Zone ID（在域名管理页面右侧）
- [ ] 创建 API Token（权限：Zone读取、邮件路由编辑、Workers编辑）
- [ ] 启用 Email Routing（添加 MX 记录）
- [ ] 创建 Worker（名称：email-processor）

### 第2步：UniCloud 云函数 (20分钟)
- [ ] 创建项目（推荐腾讯云版本）
- [ ] 记录云函数访问域名
- [ ] 部署 5 个云函数：
  - [ ] generate-email
  - [ ] GET_cloudflare_edukg_email  
  - [ ] POST_cloudflare_edukg_email
  - [ ] Delete_edu_cloudfare
  - [ ] GET_all_temp_emails
- [ ] 创建数据库集合：temp_emails、cloudflare_edukg_email

### 第3步：配置连接 (10分钟)
- [ ] 更新 Worker 代码（修改云函数 URL）
- [ ] 更新前端配置（修改云函数 URL）
- [ ] 部署前端到托管平台

### 第4步：功能测试 (5分钟)
- [ ] 生成测试邮箱
- [ ] 发送测试邮件
- [ ] 验证邮件接收
- [ ] 测试删除功能

## 🔧 必需配置信息

### Cloudflare 信息
```
API Token: cf_token_xxxxxxxxxxxx
Zone ID: 32位字符串
域名: example.com
Worker名称: email-processor
```

### UniCloud 信息
```
项目域名: https://项目ID.dev-hz.cloudbasefunction.cn
数据库集合: temp_emails, cloudflare_edukg_email
```

## 🚨 常见错误预防

- ❌ **API Token 权限不足** → 确保包含所有必需权限
- ❌ **Zone ID 错误** → 从正确的域名页面复制
- ❌ **MX 记录未生效** → 等待 DNS 传播（2-10分钟）
- ❌ **云函数 URL 错误** → 检查项目域名格式
- ❌ **CORS 错误** → 确认前端域名在允许列表中

## 📞 获取帮助

如果遇到问题：
1. 查看 [详细设置指南](./SETUP_GUIDE.md)
2. 检查浏览器控制台错误
3. 查看云函数执行日志
4. 在 GitHub Issues 提问

---

**💡 提示：建议先完整阅读 [详细设置流程](./SETUP_GUIDE.md)，再开始实际操作。**