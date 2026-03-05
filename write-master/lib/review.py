"""
审核节点交互模块
负责在每个阶段后展示内容并等待用户确认
"""

from typing import Dict, Optional, Tuple
import sys


class ReviewNode:
    """审核节点类"""

    def __init__(self, stage: int, stage_name: str):
        """
        初始化审核节点

        Args:
            stage: 阶段编号 (1-6)
            stage_name: 阶段名称
        """
        self.stage = stage
        self.stage_name = stage_name

    def show(self, content: Dict) -> None:
        """
        展示审核内容

        Args:
            content: 要展示的内容字典
        """
        print("\n" + "=" * 60)
        print(f"⏸️  审核节点 {self.stage}: {self.stage_name}")
        print("=" * 60)

        # 根据不同阶段展示不同内容
        if self.stage == 1:
            self._show_params(content)
        elif self.stage == 2:
            self._show_research(content)
        elif self.stage == 3:
            self._show_outline(content)
        elif self.stage == 4:
            self._show_draft(content)
        elif self.stage == 5:
            self._show_images(content)
        elif self.stage == 6:
            self._show_final(content)

        print("=" * 60)

    def _show_params(self, content: Dict) -> None:
        """展示参数配置"""
        print("\n📋 参数配置:")
        for key, value in content.items():
            print(f"  • {key}: {value}")

    def _show_research(self, content: Dict) -> None:
        """展示调研结果"""
        print("\n🔍 调研结果:")

        if 'insights' in content:
            print("\n关键洞察:")
            for i, insight in enumerate(content['insights'], 1):
                print(f"  {i}. {insight}")

        if 'knowledge_graph' in content:
            print("\n知识图谱:")
            print(content['knowledge_graph'])

        if 'sources' in content:
            print(f"\n参考来源: {len(content['sources'])} 篇")
            for i, source in enumerate(content['sources'][:5], 1):
                print(f"  {i}. {source.get('title', 'Unknown')} - {source.get('source', 'Unknown')}")
            if len(content['sources']) > 5:
                print(f"  ... 还有 {len(content['sources']) - 5} 篇")

    def _show_outline(self, content: Dict) -> None:
        """展示大纲"""
        print("\n📝 文章大纲:")
        if 'outline' in content:
            print(content['outline'])

        if 'structure' in content:
            print("\n结构标注:")
            for section, desc in content['structure'].items():
                print(f"  • {section}: {desc}")

    def _show_draft(self, content: Dict) -> None:
        """展示初稿"""
        print("\n✍️  文章初稿:")
        if 'draft' in content:
            # 只展示前500字和后200字
            draft = content['draft']
            if len(draft) > 700:
                print(draft[:500])
                print("\n... [中间省略] ...\n")
                print(draft[-200:])
            else:
                print(draft)

        if 'word_count' in content:
            print(f"\n字数统计: {content['word_count']} 字")

    def _show_images(self, content: Dict) -> None:
        """展示配图"""
        print("\n🖼️  生成的配图:")
        if 'images' in content:
            for i, img in enumerate(content['images'], 1):
                print(f"  {i}. {img.get('path', 'Unknown')} - {img.get('description', '')}")

    def _show_final(self, content: Dict) -> None:
        """展示最终输出"""
        print("\n✅ 最终输出:")
        if 'output_path' in content:
            print(f"  HTML 文件: {content['output_path']}")
        if 'word_count' in content:
            print(f"  字数: {content['word_count']}")
        if 'image_count' in content:
            print(f"  配图: {content['image_count']} 张")

    def wait_for_approval(self) -> Tuple[str, Optional[str]]:
        """
        等待用户确认

        Returns:
            (action, feedback)
            action: 'approve' | 'modify' | 'redo'
            feedback: 用户反馈内容（如果选择 modify）
        """
        print("\n请选择操作:")
        print("  1. ✅ 确认，继续下一步")
        print("  2. ✏️  需要修改（请说明修改内容）")
        print("  3. 🔄 重做本阶段")
        print("  4. ❌ 退出")

        while True:
            try:
                choice = input("\n请输入选项 (1-4): ").strip()

                if choice == '1':
                    return 'approve', None
                elif choice == '2':
                    feedback = input("请说明需要修改的内容: ").strip()
                    if feedback:
                        return 'modify', feedback
                    else:
                        print("❌ 请提供修改内容")
                elif choice == '3':
                    return 'redo', None
                elif choice == '4':
                    confirm = input("确认退出？(y/n): ").strip().lower()
                    if confirm == 'y':
                        print("👋 已退出")
                        sys.exit(0)
                else:
                    print("❌ 无效选项，请输入 1-4")
            except KeyboardInterrupt:
                print("\n\n👋 已退出")
                sys.exit(0)
            except Exception as e:
                print(f"❌ 错误: {e}")


def handle_feedback(stage: int, feedback: str, current_content: Dict) -> Dict:
    """
    处理用户反馈

    Args:
        stage: 当前阶段
        feedback: 用户反馈
        current_content: 当前内容

    Returns:
        更新后的内容
    """
    print(f"\n🔧 处理反馈: {feedback}")
    print("（此功能需要调用 Claude API 根据反馈修改内容）")

    # TODO: 实现根据反馈修改内容的逻辑
    # 这里需要调用 Claude API，传入当前内容和用户反馈，生成修改后的内容

    return current_content


def create_review_nodes() -> Dict[int, ReviewNode]:
    """
    创建所有审核节点

    Returns:
        审核节点字典 {stage: ReviewNode}
    """
    return {
        1: ReviewNode(1, "参数确认"),
        2: ReviewNode(2, "调研确认"),
        3: ReviewNode(3, "大纲确认"),
        4: ReviewNode(4, "初稿确认"),
        5: ReviewNode(5, "配图确认"),
        6: ReviewNode(6, "最终确认")
    }
