# Gemini API 配置指南

## 快速配置

在项目根目录创建 `config.json`：

```json
{
  "gemini": {
    "api_key": "YOUR_GEMINI_API_KEY_HERE",
    "model": "gemini-2.0-flash-preview-image-generation",
    "image_size": "1344x768",
    "output_format": "png"
  },
  "output": {
    "images_dir": "./output/images",
    "article_dir": "./output"
  }
}
```

## 获取 API Key

1. 访问 [Google AI Studio](https://aistudio.google.com/)
2. 登录 Google 账号
3. 点击左上角 "Get API key" → "Create API key"
4. 复制 key 填入 `config.json`

## 验证配置

```bash
python scripts/config_loader.py --check
```

预期输出：
```
✅ config.json 找到
✅ Gemini API key 已配置
✅ 输出目录可写
配置验证通过，可以开始生成图片。
```

## 常见错误处理

| 错误信息 | 原因 | 解决方法 |
|---------|------|---------|
| `API key not valid` | Key 错误或已过期 | 重新生成 API key |
| `Quota exceeded` | 超出免费额度 | 等待重置或升级套餐 |
| `config.json not found` | 配置文件不存在 | 按上方格式创建文件 |
| `Permission denied` | 输出目录无写权限 | `chmod 755 ./output` |

## 图片生成失败的降级处理

若 Gemini API 调用失败，`gemini_image_gen.py` 会自动：
1. 打印错误信息和失败的提示词
2. 在对应位置生成占位符图片（灰色背景 + 图片描述文字）
3. 继续处理其余图片，不中断整体流程

最终 HTML 中失败的图片会显示为带描述文字的占位框，可后续手动替换。

## 费用参考（截至2025年）

- Gemini 2.0 Flash：免费额度内可生成约50-100张/天
- 超出免费额度：约$0.04/张（1344x768）
- 一篇中篇文章（2-3张图）通常在免费额度内完成
