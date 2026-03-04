export interface ArticleParams {
  topic: string
  audience: string
  length: 'short' | 'medium' | 'long'
  viewpoint?: string
}

export const AUDIENCE_LABELS: Record<string, string> = {
  pm: '产品经理',
  dev: '开发者',
  exec: '高管',
  public: '普通大众',
  student: '学生',
  founder: '创业者',
}

const AUDIENCE_DETAIL: Record<string, string> = {
  pm: '产品经理（关注商业价值、用户价值、竞品对比、决策参考）',
  dev: '开发者（关注技术原理、架构设计、代码实现、API使用）',
  exec: '高管（关注战略价值、市场规模、ROI、风险判断）',
  public: '普通大众（通俗易懂，类比生活场景，避免专业术语）',
  student: '学生（基础概念为主，有学习路径，激发兴趣）',
  founder: '创业者（关注商业机会、竞争格局、切入点、落地路径）',
}

export const LENGTH_CONFIG = {
  short:  { label: '短文',  range: '1000-2000字', images: '1', minTokens: 1000, maxTokens: 2500 },
  medium: { label: '中篇',  range: '2000-5000字', images: '2', minTokens: 2000, maxTokens: 6000 },
  long:   { label: '长篇',  range: '5000字以上',  images: '3', minTokens: 5000, maxTokens: 12000 },
}

export function buildResearchPrompt(params: ArticleParams): string {
  return `你是AI领域的资深研究员。请对以下主题进行深度调研，输出调研摘要。

主题：${params.topic}
目标受众：${AUDIENCE_DETAIL[params.audience]}

请从以下维度分析（基于你的知识库，截止2025年）：
1. 核心定义与本质
2. 技术工作原理（简明）
3. 真实应用场景与数据案例
4. 最新发展动态与代表性产品
5. 商业价值与市场规模数据

输出要求：500-700字摘要，多用具体数字和案例，不要泛泛而谈。`
}

export function buildOutlinePrompt(params: ArticleParams, research: string): string {
  const cfg = LENGTH_CONFIG[params.length]
  return `基于以下调研结果，为AI科普文章生成大纲。

【调研摘要】
${research}

【文章参数】
- 主题：${params.topic}
- 受众：${AUDIENCE_DETAIL[params.audience]}
- 长度：${cfg.range}，配图${cfg.images}张
${params.viewpoint ? `- 核心观点：${params.viewpoint}` : ''}

【结构要求】使用 HOOK-BRIDGE-CORE-CLOSE 框架：
- HOOK（100-200字）：用震撼场景/数据抓住读者注意力
- BRIDGE（50-100字）：过渡到文章主题
- CORE：3-5个主体章节，每章注明核心论点 + 关键数据点 + 是否需要配图
- CLOSE（100-200字）：给读者具体可执行的行动建议

直接输出大纲，不要额外说明。`
}

export function buildWritingPrompt(params: ArticleParams, research: string, outline: string): string {
  const cfg = LENGTH_CONFIG[params.length]
  return `基于以下调研和大纲，写一篇完整的AI科普文章。

【调研摘要】
${research}

【文章大纲】
${outline}

【写作规范】
1. 目标受众：${AUDIENCE_DETAIL[params.audience]}
2. 文章长度：${cfg.range}
3. 严格遵循 HOOK-BRIDGE-CORE-CLOSE 结构
4. 用 ## 开始章节标题，不使用一级标题 #
5. 每段3-5句，避免信息密度过高
6. 类比优先：用生活场景解释技术概念
7. 数据支撑：引用具体数字和真实案例
8. 在需要配图处写：[IMAGE: 英文图片生成提示词，描述具体场景，科技感蓝紫色调]

【禁止使用】
众所周知 / 让我们看看 / 首先其次最后（并列时）/ 简单来说
${params.viewpoint ? `\n【核心观点】文章须体现：${params.viewpoint}` : ''}

【关键要求】
1. 每个章节标题后必须有完整的段落内容，不能只有标题
2. 文章必须包含完整的 CLOSE 结尾部分（总结+行动建议）
3. 不要在标题后立即结束，确保每个标题下都有实质内容
4. 结尾必须给出具体可执行的建议，不能以标题结束

直接输出完整 Markdown 文章，确保结构完整。`
}
