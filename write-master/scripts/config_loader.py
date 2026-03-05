#!/usr/bin/env python3
"""
配置加载器 - 检查和加载write-master的配置文件
用法：
  python config_loader.py --check          # 验证配置是否就绪
  python config_loader.py --get gemini.api_key  # 获取指定配置项
"""

import json
import os
import sys
import argparse
from pathlib import Path


DEFAULT_CONFIG_PATH = "config.json"


def find_config(config_path: str = DEFAULT_CONFIG_PATH) -> Path | None:
    """在当前目录和父目录中查找config.json"""
    search_path = Path(config_path)
    if search_path.exists():
        return search_path

    # 向上查找最多3层
    current = Path.cwd()
    for _ in range(3):
        candidate = current / config_path
        if candidate.exists():
            return candidate
        current = current.parent

    return None


def load_config(config_path: str = DEFAULT_CONFIG_PATH) -> dict:
    """加载配置文件，返回配置字典"""
    found = find_config(config_path)
    if not found:
        raise FileNotFoundError(
            f"config.json 未找到。请在项目根目录创建 config.json，"
            f"参考 references/gemini-setup.md"
        )

    with open(found, "r", encoding="utf-8") as f:
        return json.load(f)


def check_config(config_path: str = DEFAULT_CONFIG_PATH) -> bool:
    """验证配置完整性，打印检查结果"""
    all_ok = True

    # 检查文件存在
    found = find_config(config_path)
    if not found:
        print("❌ config.json 未找到")
        print("   → 请在项目根目录创建 config.json，参考 references/gemini-setup.md")
        return False
    print(f"✅ config.json 找到：{found}")

    # 检查JSON格式
    try:
        with open(found, "r", encoding="utf-8") as f:
            config = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ config.json 格式错误：{e}")
        return False

    # 检查图片 API key
    api_key = config.get("image_api", {}).get("api_key", "")
    if not api_key or api_key == "YOUR_API_KEY_HERE":
        print("❌ 图片 API key 未配置")
        print("   → 请将 config.json 中的 api_key 替换为真实的 API key")
        all_ok = False
    else:
        print("✅ 图片 API key 已配置")

    # 检查输出目录
    output_dir = config.get("output", {}).get("images_dir", "./output/images")
    output_path = Path(output_dir)
    try:
        output_path.mkdir(parents=True, exist_ok=True)
        print(f"✅ 输出目录可写：{output_path.resolve()}")
    except PermissionError:
        print(f"❌ 输出目录无写权限：{output_path}")
        all_ok = False

    if all_ok:
        print("\n配置验证通过，可以开始生成图片。")
    else:
        print("\n⚠️  请修复以上问题后重新运行。")

    return all_ok


def get_value(key_path: str, config_path: str = DEFAULT_CONFIG_PATH) -> str:
    """获取配置中的指定值，支持点分隔路径如 'gemini.api_key'"""
    config = load_config(config_path)
    keys = key_path.split(".")
    value = config
    for key in keys:
        if not isinstance(value, dict) or key not in value:
            raise KeyError(f"配置项 '{key_path}' 不存在")
        value = value[key]
    return value


def main():
    parser = argparse.ArgumentParser(description="write-master 配置加载器")
    parser.add_argument("--check", action="store_true", help="验证配置是否完整")
    parser.add_argument("--get", type=str, help="获取指定配置项（点分隔路径）")
    parser.add_argument("--config", type=str, default=DEFAULT_CONFIG_PATH, help="配置文件路径")
    args = parser.parse_args()

    if args.check:
        success = check_config(args.config)
        sys.exit(0 if success else 1)

    elif args.get:
        try:
            value = get_value(args.get, args.config)
            print(value)
        except (FileNotFoundError, KeyError) as e:
            print(f"错误：{e}", file=sys.stderr)
            sys.exit(1)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
