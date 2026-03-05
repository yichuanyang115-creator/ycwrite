# 配图提示词设计指南

## 配图风格定位

所有配图统一使用以下风格，保持文章视觉一致性：

**主风格**：现代科技插图风（Tech Illustration）
- 扁平化设计（Flat Design）
- 简洁线条和几何形状
- 科技感配色（见下方配色方案）
- 无过多装饰细节

**配色方案（二选一）**：

方案1 — 深色科技风：
```
背景：#0F172A（深蓝黑）
主色：#6366F1（靛蓝紫）
辅色：#22D3EE（青蓝）
亮色：#F0ABFC（淡紫）
文字/线条：#E2E8F0（浅灰白）
```

方案2 — 浅色明亮风：
```
背景：#F8FAFC（近白）
主色：#3B82F6（明蓝）
辅色：#10B981（绿）
强调：#F59E0B（橙黄）
文字/线条：#1E293B（深灰）
```

---

## 配图类型与提示词模板

### 类型1：概念示意图

**用途**：解释一个抽象概念或定义

**提示词模板**：
```
A clean, modern flat design illustration explaining [概念名称].
Style: minimalist tech illustration with geometric shapes.
Color scheme: [选择方案1或2的颜色].
Show [具体视觉元素描述].
Include simple labels or icons.
No photorealistic elements. No text in Chinese.
White or dark background. High contrast.
16:9 aspect ratio.
```

**示例（解释RAG概念）**：
```
A clean flat design diagram showing RAG (Retrieval-Augmented Generation) workflow.
Three connected stages: a database/knowledge base icon on the left,
a search/retrieval arrow in the middle, and a brain/AI model icon on the right.
Blue and purple color scheme on dark background (#0F172A).
Minimalist geometric style with subtle glow effects.
No realistic textures. Simple connecting arrows between stages.
16:9 aspect ratio.
```

---

### 类型2：工作流程图

**用途**：展示技术的处理步骤或工作流程

**提示词模板**：
```
A flat design flowchart illustration showing [流程名称] process.
[步骤数量] sequential steps shown as connected boxes/circles/icons.
Steps: [步骤1名称] → [步骤2名称] → [步骤3名称].
Color scheme: gradient from [颜色A] to [颜色B].
Clean arrows connecting each step.
Minimalist icons representing each stage.
No text, use only visual symbols and simple icons.
Wide horizontal layout, 16:9 aspect ratio.
Modern tech aesthetic.
```

**示例（LLM推理流程）**：
```
A flat design flowchart showing LLM inference pipeline.
4 steps connected by clean arrows: Input tokenization (puzzle pieces icon) →
Transformer processing (network/layers icon) → Probability distribution (bar chart icon) →
Output text (document icon).
Dark background #0F172A, steps in gradient from #6366F1 to #22D3EE.
Minimalist geometric icons, no realistic elements.
Horizontal layout, 16:9.
```

---

### 类型3：对比图

**用途**：比较两种方法、前后对比、优劣对比

**提示词模板**：
```
A clean flat design comparison illustration.
Left side shows [方案A/旧方法], right side shows [方案B/新方法].
Visual divider in the center.
Left side colors: [较暗或较旧的配色].
Right side colors: [较亮或更现代的配色].
Use icons and simple shapes to represent each concept.
Show clear contrast between the two approaches.
No text needed, purely visual.
16:9 aspect ratio, modern tech style.
```

---

### 类型4：数据可视化风格图

**用途**：展示统计数据、增长趋势、规模对比

**提示词模板**：
```
A stylized flat design data visualization illustration.
Show [数据类型：增长趋势/规模对比/分布比例].
[具体数据或比例描述].
Use [图表类型：bar chart/line graph/donut chart] style but illustrated, not photorealistic.
Color: [主配色] with gradient fills.
Clean grid lines, no clutter.
Modern infographic aesthetic.
16:9 aspect ratio.
```

---

### 类型5：场景应用图

**用途**：展示技术在实际场景中的应用

**提示词模板**：
```
A flat design illustration showing [技术名称] being applied in [应用场景].
Scene: [场景描述，如"a product manager reviewing AI-generated reports on a laptop"].
Isometric or flat 2D style.
Color palette: [配色].
Include relevant UI elements or product mockups if applicable.
People represented as simple flat icons, not realistic.
Clean background, minimal details.
16:9 aspect ratio.
```

---

## 通用提示词增强词汇

在任何提示词末尾可添加：

```
High quality, professional look. Clean composition.
No watermarks. No text overlays. No photographic elements.
Suitable for tech blog article illustration.
```

## 提示词禁忌

以下内容会降低图片质量：
- 避免要求"包含中文文字"（Gemini对中文排版效果差）
- 避免要求"人脸特写"（容易失真）
- 避免要求"超复杂场景"（细节混乱）
- 避免要求"照片写实风格"（与文章整体风格不符）

---

## 每张图片的配图决策流程

```
1. 读取文章该章节内容
2. 判断配图类型（概念/流程/对比/数据/场景）
3. 选择对应模板
4. 填入章节核心信息
5. 选择配色方案（全文统一）
6. 组装最终提示词
```

## 批量生成时的一致性保持

同一篇文章的所有图片：
- 统一使用同一配色方案（方案1或方案2）
- 统一使用相同风格关键词
- 在提示词中加入："Consistent with previous illustrations in the same article series."
