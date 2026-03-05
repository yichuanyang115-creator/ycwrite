"""
参数收集和验证模块
负责从用户输入中提取参数、识别输入模式、收集缺失参数
"""

import re
from typing import Dict, Optional, Tuple

# 受众类型映射
AUDIENCE_TYPES = {
    'pm': '产品经理',
    'dev': '开发者',
    'exec': '高管',
    'public': '普通大众',
    'student': '学生',
    'founder': '创业者'
}

# 文章长度配置
LENGTH_CONFIG = {
    'short': {'label': '短文', 'range': '1000-2000字', 'images': 1, 'tokens': 2500},
    'medium': {'label': '中篇', 'range': '2000-5000字', 'images': 2, 'tokens': 6000},
    'long': {'label': '长篇', 'range': '5000字以上', 'images': 3, 'tokens': 12000}
}


def parse_user_input(text: str) -> Dict:
    """
    从用户输入中提取已有参数

    Args:
        text: 用户输入文本

    Returns:
        提取到的参数字典
    """
    params = {}

    # 提取主题（假设第一行或最显著的内容是主题）
    lines = text.strip().split('\n')
    if lines:
        params['topic'] = lines[0].strip()

    # 提取受众
    for key, label in AUDIENCE_TYPES.items():
        if label in text or key in text.lower():
            params['audience'] = key
            break

    # 提取长度
    if '短文' in text or 'short' in text.lower():
        params['length'] = 'short'
    elif '长篇' in text or 'long' in text.lower():
        params['length'] = 'long'
    elif '中篇' in text or 'medium' in text.lower():
        params['length'] = 'medium'

    # 提取核心观点
    viewpoint_patterns = [
        r'观点[：:]\s*(.+)',
        r'核心观点[：:]\s*(.+)',
        r'论点[：:]\s*(.+)'
    ]
    for pattern in viewpoint_patterns:
        match = re.search(pattern, text)
        if match:
            params['viewpoint'] = match.group(1).strip()
            break

    # 提取参考资料（URL）
    url_pattern = r'https?://[^\s]+'
    urls = re.findall(url_pattern, text)
    if urls:
        params['references'] = urls

    return params


def identify_input_mode(params: Dict) -> str:
    """
    识别输入模式

    Args:
        params: 参数字典

    Returns:
        'minimal' | 'guided' | 'continuation'
    """
    # 极简模式：只有主题
    if len(params) == 1 and 'topic' in params:
        return 'minimal'

    # 续写模式：包含大纲或草稿
    if 'outline' in params or 'draft' in params:
        return 'continuation'

    # 指导模式：提供了部分参数
    return 'guided'


def collect_missing_params(params: Dict) -> Dict:
    """
    识别缺失的参数

    Args:
        params: 当前参数字典

    Returns:
        缺失参数的字典（key: 参数名, value: 是否必填）
    """
    missing = {}

    if 'topic' not in params:
        missing['topic'] = True  # 必填

    if 'audience' not in params:
        missing['audience'] = False  # 可选，有默认值

    if 'length' not in params:
        missing['length'] = True  # 必须询问

    # viewpoint 和 references 是可选的，不需要主动询问

    return missing


def validate_params(params: Dict) -> Tuple[bool, Optional[str]]:
    """
    验证参数完整性

    Args:
        params: 参数字典

    Returns:
        (是否有效, 错误信息)
    """
    # 检查必填参数
    if 'topic' not in params or not params['topic']:
        return False, "缺少主题"

    if 'length' not in params:
        return False, "缺少文章长度"

    # 检查受众类型
    if 'audience' in params and params['audience'] not in AUDIENCE_TYPES:
        return False, f"无效的受众类型: {params['audience']}"

    # 检查长度类型
    if params['length'] not in LENGTH_CONFIG:
        return False, f"无效的文章长度: {params['length']}"

    return True, None


def recommend_length(topic: str) -> Tuple[str, str]:
    """
    根据主题推荐文章长度

    Args:
        topic: 文章主题

    Returns:
        (推荐长度, 推荐理由)
    """
    # 简单的启发式规则
    topic_lower = topic.lower()

    # 如果是"入门"、"快速"、"简介"等关键词，推荐短文
    if any(kw in topic_lower for kw in ['入门', '快速', '简介', 'intro', 'quick']):
        return 'short', '主题适合快速概览，短文即可讲清核心要点'

    # 如果是"深入"、"详解"、"完整"等关键词，推荐长篇
    if any(kw in topic_lower for kw in ['深入', '详解', '完整', 'deep', 'complete', 'comprehensive']):
        return 'long', '主题需要深入讲解，长篇文章能够全面覆盖'

    # 默认推荐中篇
    return 'medium', '主题适合深入浅出的讲解，中篇文章平衡了深度和可读性'


def format_params_summary(params: Dict) -> str:
    """
    格式化参数摘要用于展示

    Args:
        params: 参数字典

    Returns:
        格式化的参数摘要文本
    """
    lines = ["📋 参数配置摘要", "=" * 40]

    lines.append(f"主题: {params.get('topic', '未设置')}")

    audience = params.get('audience', 'pm')
    lines.append(f"目标受众: {AUDIENCE_TYPES.get(audience, audience)}")

    length = params.get('length', 'medium')
    length_info = LENGTH_CONFIG.get(length, {})
    lines.append(f"文章长度: {length_info.get('label', length)} ({length_info.get('range', '')})")
    lines.append(f"配图数量: {length_info.get('images', 0)} 张")

    if 'viewpoint' in params:
        lines.append(f"核心观点: {params['viewpoint']}")

    if 'references' in params:
        lines.append(f"参考资料: {len(params['references'])} 个链接")
        for i, ref in enumerate(params['references'][:3], 1):
            lines.append(f"  {i}. {ref}")
        if len(params['references']) > 3:
            lines.append(f"  ... 还有 {len(params['references']) - 3} 个")

    lines.append("=" * 40)
    return '\n'.join(lines)
