# OfferGo 智能求职助手 🎯

一站式求职管家：简历 AI 优化 + 模拟面试对练 + 投递进度看板

## 项目结构

```
offer-go/
├── server/                         # 后端服务（Node.js + Express）
│   ├── src/
│   │   ├── index.js                # 入口：Express 启动 + DB 同步
│   │   ├── config/db.js            # MySQL + Sequelize 配置
│   │   ├── models/                 # 数据模型
│   │   │   ├── User.js             # 用户 + 求职意向
│   │   │   ├── Resume.js           # 结构化简历
│   │   │   ├── InterviewRecord.js  # 面试记录与评价
│   │   │   └── ApplicationTracker.js # 投递追踪
│   │   ├── routes/                 # API 路由
│   │   │   ├── user.js             # 登录 / 意向设置
│   │   │   ├── resume.js           # 简历保存 / JD 匹配分析
│   │   │   ├── interview.js        # 面试启动 / SSE 流式对话 / 评分
│   │   │   └── application.js      # 看板 CRUD / 拖拽状态更新
│   │   ├── services/
│   │   │   └── llmService.js       # LLM 通用封装（OpenAI 兼容格式）
│   │   └── prompts/
│   │       ├── resumeMatch.js      # 简历匹配 Prompt（JSON 输出）
│   │       └── mockInterview.js    # 面试角色设定 + 追问 + 评分 Prompt
│   ├── .env                        # 环境变量（API Key + DB 配置）
│   └── package.json
│
├── client/                         # 前端（Vue 3 + Vite + Pinia）
│   ├── src/
│   │   ├── main.js                 # 入口：Pinia + Router + uni 兼容层
│   │   ├── App.vue                 # 根组件 + 底部 Tabbar
│   │   ├── router/index.js         # Vue Router 路由配置
│   │   ├── api/request.js          # Fetch 封装（后续换 uni.request）
│   │   ├── store/
│   │   │   ├── user.js             # 用户状态 + 登录
│   │   │   └── stats.js            # 投递统计数据
│   │   ├── utils/uni.js            # uni-app 兼容层（H5 下模拟 uni API）
│   │   └── pages/
│   │       ├── index/index.vue     # 首页工作台（倒计时/统计/雷达图）
│   │       ├── resume/index.vue    # 简历编辑 + JD 匹配分析
│   │       ├── interview/
│   │       │   ├── index.vue       # 面试类型选择
│   │       │   └── chat.vue        # AI 对话界面（SSE 流式）
│   │       ├── kanban/index.vue    # 六列投递看板
│   │       ├── question/
│   │       │   ├── index.vue       # 分类题库 + 复盘列表
│   │       │   └── detail.vue      # 面试复盘报告
│   │       └── profile/index.vue   # 个人中心 / 意向设置
│   ├── vite.config.js              # Vite 配置 + API 代理
│   └── package.json
│
└── README.md
```

## 快速启动

### 1. 后端

```bash
cd server
# 修改 .env 中的数据库密码和 LLM API Key
npm install
npm run dev    # http://localhost:3000
```

### 2. 前端

```bash
cd client
npm install
npm run dev    # http://localhost:5173
```

## 功能页面

| 页面 | 功能 | 涉及 API |
|------|------|----------|
| 🏠 首页工作台 | 秋招倒计时、投递统计、能力雷达图、快捷入口、面经推荐 | GET /api/application/stats/:userId |
| 📝 简历匹配室 | 简历编辑保存 + JD 粘贴 AI 匹配分析（百分比打分+关键词建议+STAR 润色） | POST /api/resume/save, POST /api/resume/analyze |
| 🎤 AI 模拟面试 | 技术面/HR面/压力面三选一，气泡对话，SSE 流式逐字输出，AI 追问机制 | POST /api/interview/start, GET /api/interview/chat(sse) |
| 📋 投递看板 | 六列 Trello 式看板，新增卡片，左右拖拽改变状态，长按删除 | GET /api/application/kanban, PUT /api/application/:id/stage |
| 📚 题库复盘 | 前端/算法/HR 四类题库展开查看，面试历史列表 + 评分报告 + 对话回顾 | GET /api/interview/detail/:sessionId |
| 👤 个人中心 | 求职意向设置（岗位/城市/薪资/技术栈），缓存清理 | PUT /api/user/:id/preference |

## 技术要点

### LLM 集成（后端）
- **通用封装** (`llmService.js`)：支持 OpenAI 格式的 API（智谱 GLM-4 / Kimi / 通义千问）
- **简历匹配 Prompt**：要求 AI 输出结构化 JSON（matchScore / matchedKeywords / missingKeywords / 建议）
- **面试 Prompt**：角色设定（系统角色）+ 多轮追问 + 结束评分
- **SSE 流式对话**：`GET /api/interview/chat` 使用 `text/event-stream` 逐字推送

### 前端架构
- **uni 兼容层** (`utils/uni.js`)：在 H5 环境下模拟 `uni.navigateTo`、`uni.showToast`、`uni.getSystemInfoSync` 等 API
- **Vite 代理**：`/api` 请求代到后端 `localhost:3000`，调用 `/api/interview/chat` 时直连 SSE
- **Canvas 雷达图**：纯 Canvas 2D 绘制六维能力雷达图
- **Tabbar**：底部四按钮导航（工作台/看板/题库/我的），非主页自动隐藏

## 迁移到微信小程序

1. 安装 `@dcloudio/uni-app` + `@dcloudio/vite-plugin-uni`（管理 `vue3` dist-tag）
2. 将 `utils/uni.js` 替换为 `import { ... } from '@dcloudio/uni-app'`
3. 将 `api/request.js` 的 `fetch()` 替换为 `uni.request()`
4. 将 `router/index.js` 的路由替换为 `pages.json` 的 `pages` 配置
5. 页面文件结构无需改动（pages/ 目录结构已兼容 uniapp）

## API 接口速查

| Method | URL | 说明 |
|--------|-----|------|
| POST | /api/user/login | 微信登录/注册 |
| GET | /api/user/:id | 获取用户信息 |
| PUT | /api/user/:id/preference | 更新求职意向 |
| POST | /api/resume/save | 保存简历 |
| GET | /api/resume/:userId | 获取简历 |
| POST | /api/resume/analyze | JD 匹配分析（LLM） |
| POST | /api/interview/start | 启动面试会话 |
| GET | /api/interview/chat | SSE 流式对话 |
| POST | /api/interview/end | 结束面试+评分 |
| GET | /api/interview/history/:userId | 面试历史列表 |
| GET | /api/interview/detail/:sessionId | 面试详情 |
| POST | /api/application | 新增投递 |
| GET | /api/application/kanban/:userId | 看板数据（按阶段分组） |
| PUT | /api/application/:id/stage | 更新投递阶段 |
| DELETE | /api/application/:id | 删除投递 |
| GET | /api/application/stats/:userId | 统计数据 |

---

> 💡 **下一步**：配置 `.env` 中的 LLM API Key 和 MySQL 连接，启动后端即可体验完整 AI 功能。
