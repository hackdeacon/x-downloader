# 🎬 Twitter 视频下载器

一个简单的 Twitter 视频下载工具。

## 📖 工作原理

### 1. 解析 URL
从用户输入的 Twitter 链接中提取 tweet ID：
```
https://twitter.com/用户名/status/123456789
                      ↓
                    提取 123456789
```

### 2. 获取视频信息
调用 Twitter Syndication API：
```bash
GET https://cdn.syndication.twimg.com/tweet-result?id=123456789
```

API 返回推文的 JSON 数据，包含视频 URL、画质、时长等信息。

### 3. 视频下载
通过后端代理获取视频文件，避免 CORS 限制：
```
浏览器 → 我们的 API → Twitter CDN → 返回视频流
```

### 4. 前端展示
- 解析 JSON 数据
- 显示视频预览
- 提供多种画质选择
- 用户点击下载

## 🔑 核心技术

- **Twitter Syndication API** - 公开 API（twimg.com 官方域名）
- **CORS 代理** - 解决跨域问题
- **流式传输** - 边下载边传输
- **备用 API** - fxtwitter.com 作为备选

## ⚖️ API 说明与法律声明

### API 性质
- ✅ **半官方公开接口** - 使用 `twimg.com` 官方域名
- ✅ **无需认证** - 无需 API Key 或登录
- ✅ **官方用途** - 用于推文嵌入，官方推荐方式

### 法律风险
- 🟢 **个人学习** - 风险极低
- 🟢 **开源分享** - 风险低（有保护措施）
- 🟡 **商业使用** - 风险中等（需谨慎）
- 🔴 **批量抓取** - 风险高（可能被封）

### 保护措施
- ✅ MIT License - 法律保护
- ✅ 免责声明 - 责任转移
- ✅ 仅访问公开内容 - 合规使用
- ✅ 非商业用途限制 - 安全使用

### 重要声明
```
本项目仅供学习研究使用
用户需遵守 Twitter 服务条款
下载视频版权归原作者所有
请勿用于商业用途
```

## 📄 许可证

MIT License
