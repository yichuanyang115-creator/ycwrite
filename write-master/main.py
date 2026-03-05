#!/usr/bin/env python3
"""
Write Master - AI科普文章自动化写作主控制器

完整的 6 阶段工作流：
1. 需求确认与参数收集
2. 主题调研（MCP 工具）
3. 大纲生成
4. 正文写作
5. 配图生成
6. 富文本排版
"""

import os
import re
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# 加载 .env 文件
load_dotenv(project_root / '.env')

from lib.params import (
    parse_user_input, identify_input_mode, collect_missing_params,
    validate_params, recommend_length, format_params_summary,
    AUDIENCE_TYPES, LENGTH_CONFIG
)
from lib.review import create_review_nodes, handle_feedback
from lib.mcp_tools import MCPTools, score_and_filter
try:
    from scripts.progress_tracker import ProgressTracker
except ImportError:
    class ProgressTracker:
        def __init__(self, progress_path="output/progress.json"):
            self.progress_path = progress_path
        def update_stage(self, stage, status): pass
        def complete_section(self, section, word_count=0): pass
        def mark_complete(self): pass
from scripts.config_loader import load_config
from scripts.gemini_image_gen import generate_all_images, load_config as load_image_config
from scripts.markdown_to_html import (
    replace_image_placeholders, markdown_to_html_content,
    build_html, extract_title, read_file
)
from openai import OpenAI


class WriteMaster:
    """Write Master 主控制器"""

    def __init__(self, no_review=False, event_callback=None):
        """初始化"""
        self.config = load_config()
        self.api_key = os.getenv('ZHIPU_API_KEY')
        self.no_review = no_review
        self.event_callback = event_callback or (lambda t, d: None)

        if not self.api_key:
            raise ValueError("请设置 ZHIPU_API_KEY 环境变量")

        # 初始化智谱 OpenAI 客户端
        self.client = OpenAI(
            api_key=self.api_key,
            base_url='https://open.bigmodel.cn/api/paas/v4/'
        )
        self.model = os.getenv('ZHIPU_MODEL', 'glm-4.5')
        self.mcp_tools = MCPTools(self.api_key)
        self.progress = ProgressTracker()
        self.review_nodes = create_review_nodes()

        # 工作目录
        self.output_dir = project_root / 'output'
        self.output_dir.mkdir(exist_ok=True)

    def run(self, user_input: str):
        """
        运行完整工作流

        Args:
            user_input: 用户输入
        """
        print("\n" + "=" * 60)
        print("🚀 Write Master - AI科普文章自动化写作")
        print("=" * 60)

        # 阶段 1: 需求确认与参数收集
        params = self.stage1_collect_params(user_input)

        # 阶段 2: 主题调研
        research_data = self.stage2_research(params)

        # 阶段 3: 大纲生成
        outline = self.stage3_outline(params, research_data)

        # 阶段 4: 正文写作
        article = self.stage4_writing(params, research_data, outline)

        # 阶段 5: 配图生成
        images = self.stage5_images(article)

        # 阶段 6: 富文本排版
        final_output = self.stage6_formatting(article, images)

        print("\n" + "=" * 60)
        print("🎉 文章生成完成！")
        print("=" * 60)
        print(f"📄 HTML 文件: {final_output['html_path']}")
        print(f"📝 Markdown 文件: {final_output['md_path']}")
        print(f"📊 字数: {final_output['word_count']}")
        print(f"🖼️  配图: {final_output['image_count']} 张")

    def stage1_collect_params(self, user_input: str) -> dict:
        """阶段 1: 需求确认与参数收集"""
        print("\n" + "=" * 60)
        print("📋 阶段 1: 需求确认与参数收集")
        print("=" * 60)

        self.progress.update_stage('params', 'in_progress')

        # 解析用户输入
        params = parse_user_input(user_input)
        input_mode = identify_input_mode(params)

        print(f"\n识别到输入模式: {input_mode}")

        # 收集缺失参数
        missing = collect_missing_params(params)

        # 如果是交互式环境，询问缺失参数
        if missing and sys.stdin.isatty():
            print("\n需要补充以下参数:")

            # 询问受众
            if 'audience' in missing:
                print("\n目标受众选项:")
                for key, label in AUDIENCE_TYPES.items():
                    print(f"  {key}: {label}")
                audience = input("请选择目标受众 (默认: pm): ").strip() or 'pm'
                params['audience'] = audience

            # 询问长度
            if 'length' in missing:
                recommended, reason = recommend_length(params.get('topic', ''))
                print(f"\n根据主题「{params.get('topic', '')}」，推荐【{LENGTH_CONFIG[recommended]['label']}】")
                print(f"原因: {reason}\n")
                print("请选择文章长度:")
                print("  1. 短文 (1000-2000字) - 配图 1 张")
                print("  2. 中篇 (2000-5000字) - 配图 2 张 【推荐】")
                print("  3. 长篇 (5000字以上) - 配图 3 张")

                choice = input("请输入选项 (1-3, 默认: 2): ").strip() or '2'
                length_map = {'1': 'short', '2': 'medium', '3': 'long'}
                params['length'] = length_map.get(choice, 'medium')

        # 设置默认值
        if 'audience' not in params:
            params['audience'] = 'pm'

        # 验证参数
        valid, error = validate_params(params)
        if not valid:
            print(f"\n❌ 参数验证失败: {error}")
            sys.exit(1)

        # 审核节点 1
        review_content = params.copy()
        self.review_nodes[1].show(review_content)

        if not self.no_review:
            action, feedback = self.review_nodes[1].wait_for_approval()

            if action == 'modify':
                params = handle_feedback(1, feedback, params)
            elif action == 'redo':
                return self.stage1_collect_params(user_input)
        else:
            print("\n⏭️  跳过审核，自动继续...")

        self.progress.update_stage('params', 'completed')

        # 保存参数
        with open(self.output_dir / 'params.json', 'w', encoding='utf-8') as f:
            json.dump(params, f, ensure_ascii=False, indent=2)

        return params

    def stage2_research(self, params: dict) -> dict:
        """阶段 2: 主题调研"""
        print("\n" + "=" * 60)
        print("🔍 阶段 2: 主题调研")
        print("=" * 60)

        self.progress.update_stage('research', 'in_progress')

        topic = params['topic']

        # 并行搜索
        search_results = self.mcp_tools.parallel_search(topic)

        # 打分和筛选
        top_articles = score_and_filter(search_results, topic, top_n=10)

        # 使用 Claude 生成调研摘要
        print("\n📝 生成调研摘要...")

        prompt = f"""基于以下搜索结果，生成调研摘要。

主题: {topic}
目标受众: {params.get('audience', 'pm')}

搜索结果:
{json.dumps(top_articles[:10], ensure_ascii=False, indent=2)}

请从以下维度分析:
1. 核心定义与本质
2. 技术工作原理（简明）
3. 真实应用场景与数据案例
4. 最新发展动态与代表性产品
5. 商业价值与市场规模数据

输出要求: 500-700字摘要，多用具体数字和案例。"""

        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=1500,
            messages=[{'role': 'user', 'content': prompt}]
        )

        research_summary = response.choices[0].message.content

        research_data = {
            'summary': research_summary,
            'sources': top_articles,
            'insights': [
                "（从调研中提取的关键洞察）",
                "（需要 Claude 分析生成）"
            ],
            'knowledge_graph': "（知识图谱需要 Claude 生成）"
        }

        # 审核节点 2
        self.review_nodes[2].show(research_data)

        if not self.no_review:
            action, feedback = self.review_nodes[2].wait_for_approval()

            if action == 'modify':
                research_data = handle_feedback(2, feedback, research_data)
            elif action == 'redo':
                return self.stage2_research(params)
        else:
            print("\n⏭️  跳过审核，自动继续...")

        self.progress.update_stage('research', 'completed')

        # 触发事件回调
        self.event_callback('research_complete', {
            'summary': research_summary,
            'sources': top_articles[:5]
        })

        # 保存调研结果
        with open(self.output_dir / 'research.md', 'w', encoding='utf-8') as f:
            f.write(f"# 调研报告: {topic}\n\n")
            f.write(research_summary)

        return research_data

    def stage3_outline(self, params: dict, research_data: dict) -> str:
        """阶段 3: 大纲生成"""
        print("\n" + "=" * 60)
        print("📝 阶段 3: 大纲生成")
        print("=" * 60)

        self.progress.update_stage('outline', 'in_progress')

        topic = params['topic']
        audience = params.get('audience', 'pm')
        length = params.get('length', 'medium')
        length_cfg = LENGTH_CONFIG[length]

        audience_map = {
            'pm': '产品经理',
            'dev': '开发者',
            'exec': '高管/决策层',
            'public': '普通大众',
            'student': '学生',
            'founder': '创业者',
        }
        audience_label = audience_map.get(audience, '产品经理')

        # 从调研数据中取摘要和来源
        research_summary = research_data.get('summary', '')
        sources = research_data.get('sources', [])
        sources_text = ''
        if sources:
            top5 = sources[:5]
            sources_text = '\n'.join(
                f"- {s.get('title', '')} ({s.get('source', '')}): {s.get('summary', '')[:80]}"
                for s in top5
            )

        print("⏳ 正在调用 AI 生成大纲...")

        prompt = f"""你是一位专业的AI科技内容策划，擅长为{audience_label}撰写高质量科普文章。

## 写作任务
主题：{topic}
目标受众：{audience_label}
目标字数：{length_cfg['range']}（{length_cfg['label']}）
配图数量：{length_cfg['images']} 张

## 调研摘要
{research_summary}

## 参考来源
{sources_text if sources_text else '（无外部来源）'}

## 大纲选型规则
根据主题性质，从以下5种模板中选择最合适的一种：
- A（概念解释型）：解释新技术/概念，适合"什么是XXX"类主题
- B（技术原理型）：深入解析工作机制，适合"XXX如何工作"类主题
- C（应用场景型）：讲商业/产品应用，适合"XXX在产品中的应用"类主题
- D（对比评测型）：评估/比较多个方案，适合横向对比类主题
- E（观点探讨型）：探讨争议性话题，适合"XXX会XXX吗"类主题

## 大纲输出要求
1. 先在第一行注明选用的模板（如：【选用模板A：概念解释型】）
2. 给出完整 Markdown 大纲，每章节标注预计字数
3. 配图位置用 `[📷 配图N：图片内容描述]` 标注（N为序号，共{length_cfg['images']}张）
4. 大纲层级：标题 + 二级章节 + 每章节3-5个要点
5. 章节间有明确的逻辑递进关系

请直接输出大纲，不要其他解释："""

        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=2000,
            messages=[{'role': 'user', 'content': prompt}]
        )

        outline = response.choices[0].message.content.strip()
        print(f"✅ 大纲生成完成（{len(outline)} 字符）")

        # 审核节点 3
        self.review_nodes[3].show({'outline': outline})

        if not self.no_review:
            action, feedback = self.review_nodes[3].wait_for_approval()

            if action == 'redo':
                return self.stage3_outline(params, research_data)
        else:
            print("\n⏭️  跳过审核，自动继续...")

        self.progress.update_stage('outline', 'completed')

        # 触发事件回调
        self.event_callback('outline_complete', {'outline': outline})

        return outline

    def stage4_writing(self, params: dict, research_data: dict, outline: str) -> str:
        """阶段 4: 正文写作"""
        print("\n" + "=" * 60)
        print("✍️  阶段 4: 正文写作")
        print("=" * 60)

        self.progress.update_stage('writing', 'in_progress')

        topic = params['topic']
        audience = params.get('audience', 'pm')
        length = params.get('length', 'medium')
        length_cfg = LENGTH_CONFIG[length]

        audience_map = {
            'pm': '产品经理',
            'dev': '开发者',
            'exec': '高管/决策层',
            'public': '普通大众',
            'student': '学生',
            'founder': '创业者',
        }
        audience_label = audience_map.get(audience, '产品经理')

        research_summary = research_data.get('summary', '')
        sources = research_data.get('sources', [])
        sources_text = ''
        if sources:
            sources_text = '\n'.join(
                f"- {s.get('title', '')} ({s.get('source', '')}): {s.get('summary', '')[:120]}"
                for s in sources[:8]
            )

        print("⏳ 正在调用 AI 写作正文（可能需要1-2分钟）...")

        system_prompt = """你是一位顶级AI科技科普作家，专注于为非技术读者撰写有深度、有温度的技术科普文章。

## 写作风格核心原则
1. **类比优先**：每个抽象概念必须有生活化类比，先给类比再给定义
2. **数据支撑**：关键观点必须有具体数据或案例支撑
3. **段落节奏**：每段3-5句，每句25字以内，章节以问题开头、洞察结尾
4. **HOOK结构**：开场100字内必须有钩子（反常识/场景代入/尖锐问题/故事开头）

## 绝对禁用词
❌ "众所周知" ❌ "让我们看看" ❌ "首先、其次、最后"（段落开头）
❌ "简单来说" ❌ "总的来说" ❌ "综上所述"（非总结段落）
❌ 连续3句抽象描述（必须插入例子）

## 配图标记规则
在文章中配图的位置插入：`![配图N描述](images/image_0N.png)`
配图标记必须在该章节的核心内容之后，不要堆在一起。"""

        user_prompt = f"""## 写作任务

**主题**：{topic}
**目标受众**：{audience_label}
**目标字数**：{length_cfg['range']}
**配图数量**：{length_cfg['images']} 张（均匀分布在文章中）

## 确认大纲
{outline}

## 调研背景
{research_summary}

## 参考资料
{sources_text if sources_text else '（基于你的知识写作）'}

## 写作指令
1. 严格按照大纲结构展开，不要遗漏任何章节
2. 每个章节按照「论点→类比→数据/案例→洞察」的段落结构写作
3. 在大纲中标注 `[📷 配图N]` 的位置，插入对应的 `![配图N描述](images/image_0N.png)` Markdown 图片标记
4. 配图描述要具体（10-20字），便于后续AI生图
5. 目标受众是{audience_label}，避免过度技术细节，强调商业/产品价值
6. 直接输出 Markdown 格式的完整文章，不要任何前言或解释"""

        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=length_cfg['tokens'],
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt}
            ]
        )

        article = response.choices[0].message.content.strip()
        word_count = len(article.replace(' ', '').replace('\n', ''))
        print(f"✅ 正文写作完成（约 {word_count} 字符）")

        # 审核节点 4
        self.review_nodes[4].show({'draft': article, 'word_count': len(article)})

        if not self.no_review:
            action, feedback = self.review_nodes[4].wait_for_approval()

            if action == 'redo':
                return self.stage4_writing(params, research_data, outline)
        else:
            print("\n⏭️  跳过审核，自动继续...")

        self.progress.update_stage('writing', 'completed')

        # 触发事件回调
        self.event_callback('stream', {'text': article})

        return article

    def _extract_image_markers(self, article: str) -> list:
        """
        从文章中提取配图标记

        匹配格式：![描述](images/image_0N.png)

        Returns:
            [{'id': 'image_01', 'description': '...', 'index': N}, ...]
        """
        pattern = r'!\[([^\]]+)\]\(images/(image_\d+)\.(?:png|jpg|jpeg|svg)\)'
        markers = []
        for desc, img_id in re.findall(pattern, article):
            markers.append({'id': img_id, 'description': desc.strip()})
        # 去重（保留首次出现）
        seen = set()
        unique = []
        for m in markers:
            if m['id'] not in seen:
                seen.add(m['id'])
                unique.append(m)
        return unique

    def _generate_image_prompts(self, markers: list, article: str) -> list:
        """
        调用 Claude 将中文配图描述转为英文图片生成提示词

        Args:
            markers: 配图标记列表 [{'id': ..., 'description': ...}]
            article: 文章正文（提供上下文）

        Returns:
            prompts 列表，格式与 gemini_image_gen.py 兼容
        """
        if not markers:
            return []

        # 构建批量翻译任务
        tasks = '\n'.join(
            f'{i+1}. ID={m["id"]} 描述="{m["description"]}"'
            for i, m in enumerate(markers)
        )

        # 截取文章前500字作为上下文
        article_ctx = article[:500].replace('\n', ' ').strip()

        prompt = f"""你是一位专业AI图片提示词工程师。请将以下中文配图描述转换为高质量的英文图片生成提示词。

## 文章主题背景
{article_ctx}...

## 待转换的配图（共{len(markers)}张）
{tasks}

## 图片风格要求（所有图片保持一致）
- 风格：现代科技扁平插图（Modern flat tech illustration）
- 配色：深色科技风（深蓝黑背景 #0F172A，靛蓝紫+青蓝高亮）
- 要素：几何图形、简洁线条、科技感图标
- 禁止：照片写实、中文文字、人脸特写、过度复杂场景
- 比例：16:9

## 输出格式
严格按以下 JSON 数组返回，不要其他内容：
[
  {{
    "id": "image_01",
    "description": "中文描述原文",
    "prompt": "完整英文提示词（50-100词，参考示例风格）"
  }}
]

## 英文提示词示例
A clean flat design diagram showing AI agent workflow. Three connected components: input processing box on left, central reasoning engine with neural network icon, output/action module on right. Connected by glowing arrows. Dark background #0F172A, main colors #6366F1 and #22D3EE. Minimalist geometric style. No text, no photorealistic elements. 16:9 aspect ratio. High quality, professional tech blog illustration."""

        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=1500,
            messages=[{'role': 'user', 'content': prompt}]
        )

        content = response.choices[0].message.content.strip()

        # 解析 JSON
        content = re.sub(r'```(?:json)?\s*', '', content).rstrip('`').strip()
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if not json_match:
            # 降级：直接用描述作为提示词
            return [
                {
                    'id': m['id'],
                    'description': m['description'],
                    'prompt': (
                        f'A clean flat design tech illustration of {m["description"]}. '
                        'Dark background, minimalist geometric style, 16:9 aspect ratio.'
                    )
                }
                for m in markers
            ]

        def _fallback_prompt(m: dict) -> dict:
            # 用更安全的通用英文描述，避免在 prompt 中出现中文
            idx = m['id'].replace('image_', '')
            return {
                'id': m['id'],
                'description': m['description'],
                'prompt': (
                    f'A clean flat design tech illustration for article figure {idx}. '
                    'Abstract technology concept visualization with connected nodes and data flow. '
                    'Dark background #0F172A, indigo #6366F1 and cyan #22D3EE color scheme, '
                    'minimalist geometric style, no text, 16:9 aspect ratio. '
                    'High quality professional tech blog illustration.'
                )
            }

        try:
            prompts = json.loads(json_match.group())
            # 补全缺少的字段
            for p in prompts:
                if 'description' not in p:
                    matched = next((m['description'] for m in markers if m['id'] == p.get('id')), '')
                    p['description'] = matched
            # 确保每个 marker 都有对应的提示词（兜底补全）
            prompt_ids = {p['id'] for p in prompts}
            for m in markers:
                if m['id'] not in prompt_ids:
                    prompts.append(_fallback_prompt(m))
            return prompts
        except json.JSONDecodeError:
            return [
                {
                    'id': m['id'],
                    'description': m['description'],
                    'prompt': (
                        f'A clean flat design tech illustration about {m["description"]}. '
                        'Dark background #0F172A, minimalist style, 16:9 aspect ratio.'
                    )
                }
                for m in markers
            ]

    def stage5_images(self, article: str) -> list:
        """阶段 5: 配图生成"""
        print("\n" + "=" * 60)
        print("🖼️  阶段 5: 配图生成")
        print("=" * 60)

        self.progress.update_stage('images', 'in_progress')

        # 步骤1：提取文章中的配图标记
        markers = self._extract_image_markers(article)
        print(f"📌 提取到 {len(markers)} 个配图标记: {[m['id'] for m in markers]}")

        images = []

        if not markers:
            print("⚠️  文章中未找到配图标记，跳过图片生成")
        else:
            # 步骤2：生成英文提示词
            print("⏳ 正在生成图片提示词...")
            prompts = self._generate_image_prompts(markers, article)
            print(f"✅ 提示词生成完成，共 {len(prompts)} 张")

            # 保存提示词供调试
            prompts_path = self.output_dir / 'prompts.json'
            with open(prompts_path, 'w', encoding='utf-8') as f:
                json.dump(prompts, f, ensure_ascii=False, indent=2)

            # 步骤3：调用 Gemini API 批量生成图片
            images_dir = self.output_dir / 'images'
            images_dir.mkdir(exist_ok=True)

            # 触发开始生成配图事件
            self.event_callback('image_start', {'count': len(prompts)})

            config_path = project_root / 'config.json'
            if config_path.exists():
                image_config = load_image_config(str(config_path))
                print("🎨 开始生成配图...")
                results = generate_all_images(image_config, prompts, images_dir)

                for img_id, result in results.items():
                    img_data = {
                        'id': img_id,
                        'path': result['path'],
                        'success': result['success'],
                        'description': next(
                            (p['description'] for p in prompts if p['id'] == img_id), ''
                        )
                    }
                    images.append(img_data)
                    # 触发单张图片完成事件
                    self.event_callback('image_done', {'id': img_id, 'success': result['success']})
            else:
                print("⚠️  config.json 未找到，跳过图片生成（使用占位符）")
                for m in markers:
                    images.append({
                        'id': m['id'],
                        'path': str(images_dir / f"{m['id']}.svg"),
                        'success': False,
                        'description': m['description']
                    })

        # 审核节点 5
        self.review_nodes[5].show({'images': images})

        if not self.no_review:
            action, feedback = self.review_nodes[5].wait_for_approval()

            if action == 'redo':
                return self.stage5_images(article)
        else:
            print("\n⏭️  跳过审核，自动继续...")

        self.progress.update_stage('images', 'completed')
        return images

    def stage6_formatting(self, article: str, images: list) -> dict:
        """阶段 6: 富文本排版"""
        print("\n" + "=" * 60)
        print("🎨 阶段 6: 富文本排版")
        print("=" * 60)

        self.progress.update_stage('formatting', 'in_progress')

        html_path = self.output_dir / 'article.html'
        md_path = self.output_dir / 'article.md'

        # 1. 保存 Markdown 文件
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(article)
        print(f"💾 Markdown 已保存: {md_path}")

        # 2. 加载模板和 CSS（优先使用项目 assets 目录）
        assets_dir = project_root / 'assets'
        template_path = assets_dir / 'html-template.html'
        css_path = assets_dir / 'styles.css'

        if not template_path.exists() or not css_path.exists():
            print(f"⚠️  assets 目录缺少模板文件，跳过 HTML 生成")
            final_output = {
                'html_path': '',
                'md_path': str(md_path),
                'word_count': len(article),
                'image_count': len(images)
            }
        else:
            template = read_file(template_path)
            css = read_file(css_path)

            # 3. 将图片引用替换为 base64 内联数据
            images_dir = self.output_dir / 'images'
            print("🖼️  处理图片内联...")
            md_with_images = replace_image_placeholders(article, images_dir)

            # 4. 转换 Markdown → HTML
            print("📄 转换 Markdown → HTML...")
            article_html = markdown_to_html_content(md_with_images)

            # 5. 提取标题并填入模板
            title = extract_title(article)
            final_html = build_html(template, css, article_html, title)

            # 6. 写入 HTML 文件
            html_path.parent.mkdir(parents=True, exist_ok=True)
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(final_html)

            file_size = html_path.stat().st_size / 1024
            print(f"✅ HTML 生成完成: {html_path}")
            print(f"   标题: {title}")
            print(f"   文件大小: {file_size:.1f} KB")

            final_output = {
                'html_path': str(html_path),
                'md_path': str(md_path),
                'word_count': len(article),
                'image_count': len(images)
            }

        # 审核节点 6
        self.review_nodes[6].show(final_output)

        if not self.no_review:
            action, feedback = self.review_nodes[6].wait_for_approval()
        else:
            print("\n⏭️  跳过审核，自动继续...")

        self.progress.update_stage('formatting', 'completed')
        self.progress.mark_complete()

        # 读取 HTML 内容用于事件回调
        html_content = ''
        if final_output.get('html_path') and Path(final_output['html_path']).exists():
            with open(final_output['html_path'], 'r', encoding='utf-8') as f:
                html_content = f.read()

        # 触发完成事件
        self.event_callback('done', {
            'html': html_content,
            'title': extract_title(article),
            'wordCount': final_output.get('word_count', 0),
            'imageCount': final_output.get('image_count', 0)
        })

        return final_output


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description='Write Master - AI科普文章自动化写作')
    parser.add_argument('topic', help='文章主题')
    parser.add_argument('--audience', default='pm', choices=['pm', 'dev', 'exec', 'public', 'student', 'founder'],
                        help='目标受众 (默认: pm)')
    parser.add_argument('--length', default='medium', choices=['short', 'medium', 'long'],
                        help='文章长度 (默认: medium)')
    parser.add_argument('--no-review', action='store_true',
                        help='跳过审核节点，自动继续')

    args = parser.parse_args()

    # 构建用户输入
    user_input = f"{args.topic}\n受众: {args.audience}\n长度: {args.length}"

    try:
        writer = WriteMaster(no_review=args.no_review)
        writer.run(user_input)
    except KeyboardInterrupt:
        print("\n\n👋 已退出")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
