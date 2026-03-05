#!/usr/bin/env python3
"""
图片生成脚本 - 使用 OpenAI 兼容 API (apicore.ai)
用法：
  python gemini_image_gen.py --config config.json --prompts prompts.json --output ./output/images/

prompts.json 格式：
[
  {"id": "image_01", "description": "图片描述", "prompt": "英文提示词"},
  {"id": "image_02", "description": "图片描述", "prompt": "英文提示词"}
]
"""

import json
import os
import sys
import argparse
import base64
from pathlib import Path

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


def load_config(config_path: str) -> dict:
    """加载配置文件"""
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def create_placeholder_image(output_path: Path, description: str) -> None:
    """当API调用失败时，生成SVG占位符图片"""
    svg_content = f"""<svg width="1344" height="768" xmlns="http://www.w3.org/2000/svg">
  <rect width="1344" height="768" fill="#1e293b"/>
  <rect x="20" y="20" width="1304" height="728" fill="none" stroke="#475569" stroke-width="2" stroke-dasharray="10,5"/>
  <text x="672" y="350" font-family="Arial, sans-serif" font-size="24" fill="#94a3b8" text-anchor="middle">
    [配图占位符]
  </text>
  <text x="672" y="400" font-family="Arial, sans-serif" font-size="18" fill="#64748b" text-anchor="middle">
    {description[:80]}
  </text>
  <text x="672" y="440" font-family="Arial, sans-serif" font-size="14" fill="#475569" text-anchor="middle">
    API 生成失败，请手动替换此图片
  </text>
</svg>"""

    svg_path = output_path.with_suffix(".svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg_content)


def extract_image_from_response(response_json: dict) -> bytes | None:
    """
    从API响应中提取图片二进制数据
    兼容多种响应格式：base64内联、data URL、markdown图片URL
    """
    choices = response_json.get("choices", [])
    if not choices:
        return None

    message = choices[0].get("message", {})
    content = message.get("content")

    # 格式1：content 是列表，每项是 {type, image_url} 或 {type, text}
    if isinstance(content, list):
        for part in content:
            if isinstance(part, dict):
                if part.get("type") == "image_url":
                    url = part.get("image_url", {}).get("url", "")
                    if url.startswith("data:image/"):
                        return base64.b64decode(url.split(",", 1)[-1])
                    if url.startswith("http"):
                        return _download_image(url)
                if part.get("type") == "image" or "inline_data" in part:
                    inline = part.get("inline_data", {})
                    if inline.get("data"):
                        return base64.b64decode(inline["data"])

    if isinstance(content, str):
        # 格式2：content 是 data URL
        if content.startswith("data:image/"):
            return base64.b64decode(content.split(",", 1)[-1])

        # 格式3：content 是 Markdown 字符串，包含图片链接 ![...](url)
        import re
        urls = re.findall(r'!\[.*?\]\((https?://[^)]+)\)', content)
        if urls:
            return _download_image(urls[0])

    # 格式4：message 直接包含 image_data 字段
    image_data = message.get("image_data")
    if image_data:
        return base64.b64decode(image_data)

    return None


def _download_image(url: str) -> bytes | None:
    """从 URL 下载图片，返回二进制数据"""
    try:
        resp = requests.get(url, timeout=60)
        resp.raise_for_status()
        return resp.content
    except Exception as e:
        print(f"  ⚠️  下载图片失败 ({url}): {e}")
        return None


def generate_image(
    api_key: str,
    base_url: str,
    model_name: str,
    prompt: str,
    output_path: Path,
) -> bool:
    """
    调用 OpenAI 兼容 API 生成单张图片
    返回 True 表示成功，False 表示失败
    """
    if not REQUESTS_AVAILABLE:
        print("  ⚠️  requests 未安装，请运行：pip install requests")
        return False

    endpoint = base_url.rstrip("/") + "/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model_name,
        "messages": [{"role": "user", "content": prompt}],
        "n": 1,
    }

    try:
        response = requests.post(endpoint, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        response_json = response.json()

        image_bytes = extract_image_from_response(response_json)
        if image_bytes:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(image_bytes)
            return True

        print("  ⚠️  API 响应中未找到图片数据")
        print(f"  响应内容：{json.dumps(response_json, ensure_ascii=False)[:300]}")
        return False

    except requests.HTTPError as e:
        print(f"  ❌ HTTP 错误 {e.response.status_code}：{e.response.text[:200]}")
        return False
    except Exception as e:
        print(f"  ❌ API 调用失败：{e}")
        return False


def generate_all_images(
    config: dict,
    prompts: list[dict],
    output_dir: Path,
) -> dict:
    """
    批量生成所有图片
    返回结果字典：{image_id: {"success": bool, "path": str}}
    """
    api_cfg = config["image_api"]
    api_key = api_cfg["api_key"]
    base_url = api_cfg.get("base_url", "https://api.apicore.ai/v1")
    model_name = api_cfg.get("model", "gemini-2.0-flash-preview-image-generation")
    output_format = api_cfg.get("output_format", "png")

    results = {}
    total = len(prompts)

    print(f"\n开始生成 {total} 张图片...\n")

    for i, item in enumerate(prompts, 1):
        image_id = item.get("id", f"image_{i:02d}")
        description = item.get("description", "")
        prompt = item.get("prompt", "")

        output_path = output_dir / f"{image_id}.{output_format}"

        print(f"[{i}/{total}] 生成：{image_id}")
        print(f"  描述：{description}")

        success = generate_image(api_key, base_url, model_name, prompt, output_path)

        if success:
            print(f"  ✅ 已保存：{output_path}")
            results[image_id] = {"success": True, "path": str(output_path)}
        else:
            create_placeholder_image(output_path, description)
            placeholder_path = output_path.with_suffix(".svg")
            print(f"  📋 已创建占位符：{placeholder_path}")
            results[image_id] = {"success": False, "path": str(placeholder_path)}

        print()

    return results


def print_summary(results: dict) -> None:
    """打印生成结果摘要"""
    success_count = sum(1 for r in results.values() if r["success"])
    fail_count = len(results) - success_count

    print("=" * 50)
    print(f"生成完成：{success_count} 成功，{fail_count} 失败（使用占位符）")
    print()

    if fail_count > 0:
        print("失败的图片（需手动替换）：")
        for image_id, result in results.items():
            if not result["success"]:
                print(f"  - {image_id}：{result['path']}")
        print()

    print("所有图片路径：")
    for image_id, result in results.items():
        status = "✅" if result["success"] else "📋"
        print(f"  {status} {image_id}: {result['path']}")


def main():
    parser = argparse.ArgumentParser(description="图片批量生成工具（OpenAI 兼容 API）")
    parser.add_argument("--config", type=str, default="config.json", help="配置文件路径")
    parser.add_argument("--prompts", type=str, required=True, help="提示词 JSON 文件路径")
    parser.add_argument("--output", type=str, default="./output/images", help="图片输出目录")
    args = parser.parse_args()

    try:
        config = load_config(args.config)
    except FileNotFoundError:
        print(f"❌ 配置文件未找到：{args.config}")
        print("   请参考 references/gemini-setup.md 创建配置文件")
        sys.exit(1)

    api_key = config.get("image_api", {}).get("api_key", "")
    if not api_key or api_key == "YOUR_API_KEY_HERE":
        print("❌ API key 未配置，请先配置 config.json")
        sys.exit(1)

    try:
        with open(args.prompts, "r", encoding="utf-8") as f:
            prompts = json.load(f)
    except FileNotFoundError:
        print(f"❌ 提示词文件未找到：{args.prompts}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ 提示词文件格式错误：{e}")
        sys.exit(1)

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    results = generate_all_images(config, prompts, output_dir)
    print_summary(results)

    results_path = output_dir / "generation_results.json"
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n结果已保存：{results_path}")


if __name__ == "__main__":
    main()
