# 📧 临时邮箱生成器 - 详细设置流程指南

## 🚀 快速导航

| 服务 | 功能 | 直达链接 |
|------|------|----------|
| **Cloudflare Dashboard** | 域名管理、API Token、Workers | [dash.cloudflare.com](https://dash.cloudflare.com/) |
| **Cloudflare API Tokens** | 创建API访问令牌 | [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) |
| **Cloudflare Workers** | 邮件处理脚本部署 | [dash.cloudflare.com/workers](https://dash.cloudflare.com/workers) |
| **UniCloud 控制台** | 云函数部署和管理 | [unicloud.dcloud.net.cn](https://unicloud.dcloud.net.cn/) |
| **UniCloud 腾讯云** | 腾讯云版本控制台 | [console.cloud.tencent.com/tcb](https://console.cloud.tencent.com/tcb) |
| **UniCloud 阿里云** | 阿里云版本控制台 | [fcnext.console.aliyun.com](https://fcnext.console.aliyun.com/) |

## 📋 系统架构概览

```
用户界面 (前端)
    ↓ HTTP 请求
UniCloud 云函数 (API层)
    ↓ Cloudflare API 调用
Cloudflare Email Routing (邮件路由)
    ↓ 邮件转发
Cloudflare Workers (邮件处理)
    ↓ 数据回传
UniCloud 数据库 (邮件存储)
```

## ⚡ 快速开始流程

### 前置要求检查清单

- [ ] 拥有一个域名
- [ ] 域名已转移到 Cloudflare（或 NS 指向 Cloudflare）
- [ ] Cloudflare 账号（免费版即可）
- [ ] UniCloud 账号（推荐腾讯云版本）

---

## 🎯 第一步：Cloudflare 设置（15分钟）

### 1.1 域名配置
1. **登录 Cloudflare** → [dashboard](https://dash.cloudflare.com/)
2. **添加站点** → 输入你的域名 → 选择免费计划
3. **修改域名服务器** → 将你的域名 NS 记录改为 Cloudflare 提供的

### 1.2 获取必要信息

#### 获取 Zone ID
1. 在 Cloudflare 首页选择你的域名
2. 右侧边栏找到 **Zone ID**
3. 复制保存（格式：`1234567890abcdef1234567890abcdef`）

#### 创建 API Token
1. **直达链接** → [API Tokens 页面](https://dash.cloudflare.com/profile/api-tokens)
2. 点击 **"Create Token"**
3. 选择 **"Custom token"**
4. 配置权限：
   ```
   Token name: EmailGenerator-API-Token
   
   Permissions:
   ✅ Zone | Zone | Read
   ✅ Zone | Email Routing Rules | Edit  
   ✅ Zone | Zone Settings | Edit
   ✅ Account | Cloudflare Workers:Script | Edit
   
   Account Resources: 
   ✅ Include | All accounts
   
   Zone Resources:
   ✅ Include | Specific zone | [选择你的域名]
   ```
5. 点击 **"Continue to summary"** → **"Create Token"**
6. **重要：复制并安全保存生成的 Token**

### 1.3 启用邮件路由
1. 在域名管理页面，左侧点击 **"Email"** → **"Email Routing"**
2. 点击 **"Enable Email Routing"**
3. 系统会自动添加必要的 MX 记录
4. 等待 DNS 记录生效（通常2-10分钟）

### 1.4 创建 Worker
1. **直达链接** → [Workers & Pages](https://dash.cloudflare.com/workers)
2. 点击 **"Create application"** → **"Create Worker"**
3. Worker 名称：`email-processor`（记住这个名称）
4. 点击 **"Deploy"**
5. 进入编辑模式，暂时保持默认代码

---

## 🎯 第二步：UniCloud 云函数部署（20分钟）

### 2.1 创建 UniCloud 项目
1. **登录 UniCloud** → [控制台](https://unicloud.dcloud.net.cn/)
2. **创建项目** → 选择 **"腾讯云"** 版本（推荐）
3. 项目名称：`temp-email-generator`
4. **重要：记录项目的云函数访问域名**
   - 格式类似：`https://你的项目ID.dev-hz.cloudbasefunction.cn`

### 2.2 部署云函数（共5个）

#### 🔧 配置模板
先准备配置信息，后面每个云函数都会用到：
```javascript
const config = {
  cloudflare: {
    api_token: "你的_CLOUDFLARE_API_TOKEN",    // 第一步获取的 Token
    zone_id: "你的_ZONE_ID",                  // 第一步获取的 Zone ID  
    domain: "你的域名.com"                    // 你的实际域名
  },
  workers: {
    worker_name: "email-processor",           // 第一步创建的 Worker 名称
    worker_route: "你的域名.com",             // 你的实际域名
    use_worker_first: true
  }
};
```

#### 📦 依赖包配置
每个需要 HTTP 请求的云函数都需要安装 axios：

创建 `package.json`：
```json
{
  "name": "temp-email-function",
  "version": "1.0.0",
  "dependencies": {
    "axios": "^1.6.0"
  }
}
```

#### 🚀 部署具体云函数

##### 1️⃣ generate-email（邮箱生成）
1. UniCloud 控制台 → **"云函数"** → **"新建云函数"**
2. 函数名：`generate-email`
3. 复制 `uniCloud/cloudfunctions/generate-email/index.js` 内容
4. **替换配置信息**（使用上面的配置模板）
5. 添加 `package.json` 依赖
6. **上传并部署**

##### 2️⃣ GET_cloudflare_edukg_email（查看邮件）
1. 函数名：`GET_cloudflare_edukg_email`
2. 复制对应 `index.js` 内容
3. 替换配置信息
4. 添加依赖并部署

##### 3️⃣ POST_cloudflare_edukg_email（接收邮件）
1. 函数名：`POST_cloudflare_edukg_email`
2. 复制对应 `index.js` 内容
3. 这个函数主要处理数据库操作，无需配置 Cloudflare 信息
4. 部署

##### 4️⃣ Delete_edu_cloudfare（删除邮箱）
1. 函数名：`Delete_edu_cloudfare`
2. 复制对应 `index.js` 内容
3. 替换配置信息
4. 添加依赖并部署

##### 5️⃣ GET_all_temp_emails（获取所有邮箱）
1. 函数名：`GET_all_temp_emails`
2. 复制对应 `index.js` 内容
3. 替换配置信息
4. 添加依赖并部署

### 2.3 创建数据库集合
1. UniCloud 控制台 → **"云数据库"** → **"集合管理"**
2. 创建集合：
   - `temp_emails` - 存储临时邮箱记录
   - `cloudflare_edukg_email` - 存储邮件内容

---

## 🎯 第三步：配置 Cloudflare Worker（10分钟）

### 3.1 更新 Worker 代码
1. 回到 [Workers 控制台](https://dash.cloudflare.com/workers)
2. 选择之前创建的 `email-processor`
3. 点击 **"Edit code"**
4. 删除默认代码，复制 `cloudfare-workers后端/workers.js` 的全部内容
5. **重要：修改云函数 URL**
   
   找到这一行：
   ```javascript
   const cloudFunctionUrl = '云函数链接POST_cloudflare_edukg_email';
   ```
   
   替换为：
   ```javascript
   const cloudFunctionUrl = 'https://你的项目ID.dev-hz.cloudbasefunction.cn/POST_cloudflare_edukg_email';
   ```

6. 点击 **"Save and Deploy"**

### 3.2 绑定邮件路由
这一步通常会通过云函数自动完成，但可以手动验证：
1. Cloudflare Dashboard → 你的域名 → **"Email"** → **"Email Routing"**  
2. 查看 **"Routing Rules"** 是否有规则生成
3. 如果没有，通过前端生成一个邮箱会自动创建

---

## 🎯 第四步：前端部署（5分钟）

### 4.1 修改前端配置
编辑 `前端/script.js`，找到所有云函数 URL 并替换：

```javascript
// 查找这些行并替换
const generateUrl = '云函数链接generate-email';
const getEmailUrl = '云函数链接GET_cloudflare_edukg_email';  
const deleteUrl = '云函数链接Delete_edu_cloudfare';

// 替换为
const baseUrl = 'https://你的项目ID.dev-hz.cloudbasefunction.cn';
const generateUrl = `${baseUrl}/generate-email`;
const getEmailUrl = `${baseUrl}/GET_cloudflare_edukg_email`;
const deleteUrl = `${baseUrl}/Delete_edu_cloudfare`;
```

### 4.2 部署选项

#### 选项A：使用 GitHub Pages
1. 将 `前端` 目录内容推送到 GitHub 仓库
2. 启用 GitHub Pages
3. 访问 `https://用户名.github.io/仓库名`

#### 选项B：使用 Vercel
1. 连接 GitHub 仓库到 [Vercel](https://vercel.com)
2. 构建命令留空
3. 输出目录：`前端`

#### 选项C：使用 Netlify  
1. 将 `前端` 目录拖拽到 [Netlify](https://netlify.com)
2. 获得临时域名

#### 选项D：自有服务器
1. 将 `前端` 目录内容上传到 Web 服务器
2. 确保支持静态文件访问

---

## 🎯 第五步：测试验证（5分钟）

### 5.1 功能测试清单

- [ ] **生成邮箱测试**
  1. 打开前端页面
  2. 点击"生成新的临时邮箱"
  3. 验证是否成功生成邮箱地址

- [ ] **邮件接收测试**  
  1. 使用其他邮箱（如 Gmail）发送测试邮件到生成的临时邮箱
  2. 等待 1-2 分钟
  3. 点击"查看邮件"验证是否收到

- [ ] **邮件查看测试**
  1. 确认邮件内容正确显示
  2. 测试 HTML 邮件和纯文本邮件

- [ ] **删除功能测试**
  1. 点击"清除邮箱"
  2. 确认邮箱和相关邮件被删除

### 5.2 故障排查

#### 生成邮箱失败
1. 检查浏览器控制台是否有错误
2. 验证云函数 URL 是否正确
3. 确认 Cloudflare API Token 权限
4. 检查 Zone ID 是否匹配

#### 收不到邮件
1. 确认 MX 记录已生效（使用 `nslookup -type=mx 你的域名.com`）
2. 检查垃圾邮件文件夹
3. 查看 Cloudflare Workers 日志
4. 确认邮件路由规则已创建

#### 邮件内容显示异常
1. 检查 Worker 到云函数的网络连接
2. 查看云函数执行日志
3. 验证数据库集合是否正确创建

---

## 🔧 高级配置（可选）

### 自定义域名配置
如果想使用自定义域名访问前端：

1. **添加 DNS 记录**
   ```
   Type: CNAME
   Name: email (或其他子域名)
   Target: 你的托管平台域名
   ```

2. **更新 CORS 配置**
   在所有云函数中更新允许的域名：
   ```javascript
   'Access-Control-Allow-Origin': 'https://email.你的域名.com'
   ```

### 邮箱域名自定义
如果想使用子域名作为邮箱后缀（如 `@temp.你的域名.com`）：

1. **添加子域名 MX 记录**
2. **修改云函数配置中的 domain 字段**
3. **重新部署相关云函数**

---

## 📱 小程序版本

项目还包含微信小程序版本，部署步骤：

1. 使用微信开发者工具打开项目
2. 配置云函数环境 ID
3. 上传云函数代码
4. 提交审核发布

小程序版本的优势：
- 更好的移动端体验
- 微信生态集成
- 离线使用支持

---

## 🛡️ 安全和维护

### 安全建议
- 定期轮换 Cloudflare API Token
- 监控异常 API 调用
- 设置合理的访问频率限制
- 定期清理过期邮件数据

### 监控建议
- 监控云函数执行次数和错误率
- 关注 Cloudflare Workers 日志
- 设置关键指标告警

### 成本控制
- Cloudflare：免费版足够个人使用
- UniCloud：按调用次数计费，建议设置预算告警
- 域名：按年付费

---

## 🆘 常见问题解答

### Q: 邮箱生成后立即失效？
A: 可能是 API Token 权限不足或者 Zone ID 错误，检查第一步的配置。

### Q: 邮件延迟很久才收到？
A: 这是正常现象，Cloudflare 邮件路由通常有 1-5 分钟延迟。

### Q: 可以收到但无法查看邮件内容？
A: 检查 POST_cloudflare_edukg_email 云函数是否正常执行，以及数据库集合是否创建。

### Q: 支持哪些邮件格式？
A: 支持纯文本和 HTML 格式邮件，包括附件（附件会被忽略）。

### Q: 有并发限制吗？
A: Cloudflare Workers 免费版每天 100,000 次请求，UniCloud 有相应的免费额度。

---

## 📞 技术支持

如果遇到问题：

1. **查看日志** - 先检查浏览器控制台和云函数日志
2. **参考文档** - 重新检查配置步骤
3. **社区求助** - 在 GitHub Issues 中提问
4. **联系开发者** - 通过项目中的微信二维码

---

**🎉 恭喜！你已经成功部署了临时邮箱生成器！**

现在可以：
- 生成无限量的临时邮箱
- 实时接收和查看邮件
- 管理和删除邮箱
- 保护真实邮箱隐私

享受你的临时邮箱服务吧！ 📧✨