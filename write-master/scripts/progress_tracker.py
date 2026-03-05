#!/usr/bin/env python3
"""
进度状态管理脚本 - 支持前端实时同步
用法：
  python progress_tracker.py --init                    # 初始化进度文件
  python progress_tracker.py --update stage writing    # 更新当前阶段
  python progress_tracker.py --complete HOOK           # 标记某部分完成
  python progress_tracker.py --get                     # 获取当前进度
"""

import json
import argparse
from pathlib import Path
from datetime import datetime, timezone


DEFAULT_PROGRESS_FILE = "output/progress.json"


def init_progress(output_path: str = DEFAULT_PROGRESS_FILE) -> None:
    """初始化进度跟踪文件"""
    progress = {
        "stage": "init",
        "completed_sections": [],
        "current_section": None,
        "progress_percent": 0,
        "last_update": datetime.now(timezone.utc).isoformat(),
        "stages": {
            "params": {"name": "参数收集", "status": "pending"},
            "research": {"name": "主题调研", "status": "pending"},
            "outline": {"name": "大纲生成", "status": "pending"},
            "writing": {"name": "正文写作", "status": "pending"},
            "images": {"name": "配图生成", "status": "pending"},
            "formatting": {"name": "富文本排版", "status": "pending"}
        },
        "writing_sections": {
            "HOOK": {"status": "pending", "word_count": 0},
            "BRIDGE": {"status": "pending", "word_count": 0},
            "CORE": {"status": "pending", "word_count": 0, "subsections": []},
            "CLOSE": {"status": "pending", "word_count": 0}
        }
    }

    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)

    print(f"✅ 进度文件已初始化：{output_file}")


def load_progress(progress_path: str = DEFAULT_PROGRESS_FILE) -> dict:
    """加载进度文件"""
    with open(progress_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_progress(progress: dict, progress_path: str = DEFAULT_PROGRESS_FILE) -> None:
    """保存进度文件"""
    progress["last_update"] = datetime.now(timezone.utc).isoformat()
    with open(progress_path, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def update_stage(stage: str, progress_path: str = DEFAULT_PROGRESS_FILE) -> None:
    """更新当前阶段"""
    progress = load_progress(progress_path)

    if stage in progress["stages"]:
        progress["stage"] = stage
        progress["stages"][stage]["status"] = "in_progress"

        # 计算总体进度
        stage_weights = {
            "params": 5,
            "research": 20,
            "outline": 10,
            "writing": 50,
            "images": 10,
            "formatting": 5
        }

        completed_weight = sum(
            stage_weights[s] for s, data in progress["stages"].items()
            if data["status"] == "completed"
        )
        progress["progress_percent"] = completed_weight

        save_progress(progress, progress_path)
        print(f"✅ 阶段更新：{stage} ({progress['stages'][stage]['name']})")
        print(f"   总体进度：{progress['progress_percent']}%")
    else:
        print(f"❌ 无效的阶段名称：{stage}")


def complete_section(section: str, word_count: int = 0, progress_path: str = DEFAULT_PROGRESS_FILE) -> None:
    """标记某个写作部分完成"""
    progress = load_progress(progress_path)

    if section in progress["writing_sections"]:
        progress["writing_sections"][section]["status"] = "completed"
        progress["writing_sections"][section]["word_count"] = word_count

        if section not in progress["completed_sections"]:
            progress["completed_sections"].append(section)

        # 计算写作阶段进度（写作占总进度的50%）
        total_sections = len(progress["writing_sections"])
        completed_sections = sum(
            1 for s in progress["writing_sections"].values()
            if s["status"] == "completed"
        )
        writing_progress = (completed_sections / total_sections) * 50

        # 加上之前阶段的进度
        base_progress = 5 + 20 + 10  # params + research + outline
        progress["progress_percent"] = int(base_progress + writing_progress)

        save_progress(progress, progress_path)
        print(f"✅ 部分完成：{section} ({word_count}字)")
        print(f"   写作进度：{completed_sections}/{total_sections}")
        print(f"   总体进度：{progress['progress_percent']}%")
    else:
        print(f"❌ 无效的部分名称：{section}")


def complete_stage(stage: str, progress_path: str = DEFAULT_PROGRESS_FILE) -> None:
    """标记某个阶段完成"""
    progress = load_progress(progress_path)

    if stage in progress["stages"]:
        progress["stages"][stage]["status"] = "completed"
        save_progress(progress, progress_path)
        print(f"✅ 阶段完成：{stage} ({progress['stages'][stage]['name']})")
    else:
        print(f"❌ 无效的阶段名称：{stage}")


def get_progress(progress_path: str = DEFAULT_PROGRESS_FILE) -> None:
    """获取当前进度"""
    try:
        progress = load_progress(progress_path)
        print(json.dumps(progress, ensure_ascii=False, indent=2))
    except FileNotFoundError:
        print(f"❌ 进度文件不存在：{progress_path}")
        print("   请先运行：python progress_tracker.py --init")


def main():
    parser = argparse.ArgumentParser(description="进度状态管理工具")
    parser.add_argument("--init", action="store_true", help="初始化进度文件")
    parser.add_argument("--update", type=str, nargs=2, metavar=("TYPE", "VALUE"),
                        help="更新进度 (stage STAGE_NAME)")
    parser.add_argument("--complete", type=str, nargs="+", metavar="SECTION",
                        help="标记部分完成 (SECTION [WORD_COUNT])")
    parser.add_argument("--complete-stage", type=str, metavar="STAGE",
                        help="标记阶段完成")
    parser.add_argument("--get", action="store_true", help="获取当前进度")
    parser.add_argument("--file", type=str, default=DEFAULT_PROGRESS_FILE,
                        help="进度文件路径")

    args = parser.parse_args()

    if args.init:
        init_progress(args.file)
    elif args.update:
        update_type, value = args.update
        if update_type == "stage":
            update_stage(value, args.file)
        else:
            print(f"❌ 无效的更新类型：{update_type}")
    elif args.complete:
        section = args.complete[0]
        word_count = int(args.complete[1]) if len(args.complete) > 1 else 0
        complete_section(section, word_count, args.file)
    elif args.complete_stage:
        complete_stage(args.complete_stage, args.file)
    elif args.get:
        get_progress(args.file)
    else:
        parser.print_help()


class ProgressTracker:
    """进度跟踪器类（用于 main.py 调用）"""

    def __init__(self, progress_path: str = DEFAULT_PROGRESS_FILE):
        self.progress_path = progress_path
        init_progress(progress_path)

    def update_stage(self, stage: str, status: str) -> None:
        """更新阶段状态"""
        if status == 'in_progress':
            update_stage(stage, self.progress_path)
        elif status == 'completed':
            complete_stage(stage, self.progress_path)

    def complete_section(self, section: str, word_count: int = 0) -> None:
        """标记写作部分完成"""
        complete_section(section, word_count, self.progress_path)

    def mark_complete(self) -> None:
        """标记整体完成"""
        progress = load_progress(self.progress_path)
        progress["progress_percent"] = 100
        save_progress(progress, self.progress_path)


if __name__ == "__main__":
    main()
