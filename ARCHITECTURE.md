# Write Master 项目架构与优化方案

## 📋 项目概览

**项目名称**: Write Master (ycwrite.online)
**核心功能**: AI科普文章自动化写作平台
**技术栈**: Next.js 15 + React 19 + Anthropic Claude API + Gemini API (配图)
**部署状态**: 已上线 https://www.ycwrite.online/

---

## 🏗️ 当前架构

### 1. 前端架构 (Next.js App Router)

```
ycwrite-web/
├── app/
│   ├── page.tsx           # 主页面（表单 → 生成中 → 结果）
│   ├── layout.tsx         # 全局布局
│   ├── globals.css        # 全局样式
│   └── api/
│       └── generate/      # API路由：文章生成
├── lib/
│   └── prompts.ts         # 提示词配置
└── package.json
```

**当前页面流程**:
1. **表单页** (`FormView`): 输入主题、选择受众/长度、可选观点
2. **生成中页** (`GeneratingView`): 实时显示5个阶段进度 + 流式写作预览
3. **结果页** (`ResultView`): iframe预览 + 下载HTML按钮
4. **错误页** (`ErrorView`): 错误提示 + 重试

### 2. 后端架构 (Skill + API)

```
write-master/
├── SKILL.md               # Skill定义文件
├── scripts/
│   ├── config_loader.py   # 配置加载
│   ├── markdown_to_html.py # Markdown转HTML
│   └── progress_tracker.py # 进度追踪
├── references/
│   ├── outline-templates.md    # 大纲模板
│   ├── writing-styles.md       # 写作风格
│   ├── research-guide.md       # 调研指南
│   ├── gemini-setup.md         # Gemini配图配置
│   └── image-prompts-guide.md  # 配图提示词指南
└── assets/
    └── styles.css         # 文章排版样式
```

**核心工作流**:
1. **主题调研** → 使用Claude搜索相关资料
2. **大纲生成** → 根据模板生成结构化大纲
3. **正文写作** → 流式输出Markdown内容
4. **配图生成** → 调用Gemini API生成插图
5. **富文本排版** → 转换为带样式的HTML

---

## 🎯 优化目标

### 核心需求
1. **前端界面优化**: 采用新设计的极简学术美学界面（Layout Architecture.md）
2. **功能增强**:
   - 历史记录管理
   - 多视图切换（思考流/研究报告/成品文章）
   - 实时编辑能力
   - 更好的内容展示

---

## 🚀 新架构设计

### 1. 前端界面重构

#### 1.1 布局结构
```
┌─────────────────────────────────────────────────┐
│  侧边栏 (20%)        │  主内容区 (80%)          │
│  ┌──────────────┐    │  ┌──────────────────┐   │
│  │ WRITEMASTER  │    │  │ 顶部导航栏       │   │
│  │ Logo + 副标题│    │  │ (元数据+按钮)    │   │
│  ├──────────────┤    │  ├──────────────────┤   │
│  │ 历史记录     │    │  │                  │   │
│  │ - 文章1 ✓   │    │  │  编辑器工作区    │   │
│  │ - 文章2     │    │  │  (白色卡片)      │   │
│  │ - 文章3     │    │  │                  │   │
│  ├──────────────┤    │  │  [文章内容]      │   │
│  │ v1.0.2      │    │  │                  │   │
│  │ GPT-4 Turbo │    │  └──────────────────┘   │
│  └──────────────┘    │                          │
└─────────────────────────────────────────────────┘
```

#### 1.2 视图模式
- **思考流**: 显示生成过程的思考链（调研笔记、大纲草稿等）
- **研究报告**: 显示结构化的研究资料和引用来源
- **成品文章**: 最终排版好的文章（当前的ResultView）

#### 1.3 新增功能
- **历史记录**:
  - 本地存储（localStorage）保存最近10篇文章
  - 显示标题、字数、生成时间
  - 点击切换查看
- **一键复制**: 复制Markdown或HTML格式
- **实时编辑**: 在成品文章视图中支持简单编辑

### 2. 数据流设计

```
用户输入 → API请求 → Claude生成 → 流式返回 → 前端渲染
                                    ↓
                              保存到历史记录
                                    ↓
                              支持多视图切换
```

#### 2.1 数据结构
```typescript
interface Article {
  id: string                    // 唯一ID
  title: string                 // 标题
  topic: string                 // 原始主题
  audience: string              // 目标受众
  length: 'short' | 'medium' | 'long'
  viewpoint?: string            // 核心观点

  // 生成内容
  researchNotes?: string        // 调研笔记（思考流）
  outline?: string              // 大纲（研究报告）
  markdown: string              // Markdown正文
  html: string                  // HTML成品

  // 元数据
  wordCount: number             // 字数
  imageCount: number            // 配图数
  createdAt: number             // 生成时间戳
  status: 'generating' | 'done' | 'error'
}
```

### 3. 技术实现方案

#### 3.1 前端组件结构
```
app/
├── page.tsx                    # 主入口（路由控制）
├── components/
│   ├── Sidebar.tsx            # 侧边栏（Logo + 历史记录）
│   ├── TopBar.tsx             # 顶部导航栏（元数据 + 按钮）
│   ├── EditorWorkspace.tsx    # 编辑器工作区
│   ├── ViewSwitcher.tsx       # 视图切换器
│   └── views/
│       ├── ThinkingView.tsx   # 思考流视图
│       ├── ResearchView.tsx   # 研究报告视图
│       └── ArticleView.tsx    # 成品文章视图
├── hooks/
│   ├── useArticleHistory.ts   # 历史记录管理
│   └── useArticleView.ts      # 视图状态管理
└── lib/
    ├── storage.ts             # localStorage封装
    └── types.ts               # TypeScript类型定义
```

#### 3.2 API增强
```typescript
// 新增API端点
POST /api/generate          // 现有：生成文章
GET  /api/articles          // 新增：获取历史记录
GET  /api/articles/:id      // 新增：获取单篇文章
DELETE /api/articles/:id    // 新增：删除文章
PUT  /api/articles/:id      // 新增：更新文章（编辑）
```

#### 3.3 流式数据增强
```typescript
// 现有事件类型
event: stage      // 阶段更新
event: stream     // 流式内容
event: image_start // 配图开始
event: done       // 完成
event: error      // 错误

// 新增事件类型
event: research   // 调研笔记（用于思考流）
event: outline    // 大纲内容（用于研究报告）
```

---

## 📝 实施步骤

### Phase 1: 界面重构（1-2天）
1. ✅ 创建新的HTML静态原型（已完成：index.html）
2. 将静态原型转换为React组件
3. 实现侧边栏 + 主内容区布局
4. 实现响应式设计

### Phase 2: 历史记录功能（1天）
1. 实现localStorage存储逻辑
2. 创建历史记录列表组件
3. 实现文章切换功能
4. 添加删除/清空功能

### Phase 3: 多视图切换（1-2天）
1. 实现视图切换器组件
2. 创建三个视图组件（思考流/研究报告/成品文章）
3. 修改API返回数据结构，包含调研笔记和大纲
4. 实现视图间的数据映射

### Phase 4: 功能增强（1天）
1. 实现一键复制功能（支持Markdown/HTML）
2. 添加简单的编辑功能
3. 优化加载状态和错误处理
4. 性能优化和测试

### Phase 5: 部署上线（0.5天）
1. 测试新功能
2. 更新生产环境
3. 监控和修复bug

---

## 🎨 设计规范

### 颜色系统
```css
/* 主基调 */
--bg-primary: #FFFFFF
--bg-secondary: #F9F9F9
--bg-tertiary: #F0F0F0

/* 品牌色 */
--accent-red: #E63946

/* 文字层级 */
--text-primary: #1A1A1A
--text-secondary: #4A4A4A
--text-tertiary: #999999

/* 圆角 */
--radius-sm: 6px
--radius-md: 12px
--radius-lg: 24px
```

### 字体系统
```css
/* 标题 */
font-family: 'Noto Serif SC', serif;

/* 正文 */
font-family: 'Inter', -apple-system, 'PingFang SC', sans-serif;
```

---

## 🔧 技术栈总结

### 前端
- **框架**: Next.js 15 (App Router)
- **UI库**: React 19
- **样式**: Tailwind CSS + 自定义CSS
- **字体**: Google Fonts (Noto Serif SC + Inter)
- **状态管理**: React Hooks (useState, useCallback, useRef)
- **存储**: localStorage

### 后端
- **API**: Next.js API Routes
- **AI模型**: Anthropic Claude (文本) + Google Gemini (配图)
- **流式传输**: Server-Sent Events (SSE)

### 部署
- **平台**: Vercel / 自建服务器
- **域名**: ycwrite.online

---

## 📊 性能指标

### 当前性能
- 生成时间: 1-3分钟
- 文章质量: 高（基于Claude Sonnet）
- 配图质量: 中等（Gemini生成）

### 优化目标
- 历史记录加载: <100ms
- 视图切换: <50ms
- 界面响应: 60fps

---

## 🚨 注意事项

1. **API密钥安全**: 确保Anthropic和Gemini API密钥不暴露在前端
2. **存储限制**: localStorage有5MB限制，需要定期清理旧记录
3. **图片处理**: Base64内嵌会增加HTML文件大小，考虑压缩
4. **浏览器兼容**: 确保Safari、Chrome、Firefox都能正常使用
5. **移动端适配**: 侧边栏在移动端需要折叠或隐藏

---

## 📚 相关文档

- [Layout Architecture.md](./Layout Architecture.md) - 界面设计规范
- [write-master.skill](./write-master.skill) - Skill定义
- [ycwrite-web/app/page.tsx](./ycwrite-web/app/page.tsx) - 当前实现

---

## 🎯 下一步行动

**立即开始**:
1. 确认架构方案
2. 开始Phase 1界面重构
3. 逐步实现各个功能模块

**需要讨论的问题**:
1. 是否需要用户登录功能？
2. 历史记录是否需要云端同步？
3. 是否需要支持文章分享功能？
4. 是否需要支持导出为PDF/Word格式？
