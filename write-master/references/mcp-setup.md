# MCP 工具配置指南

本技能的调研阶段支持使用 MCP (Model Context Protocol) 工具来获取微信公众号和小红书的内容。这些工具是可选的，如果未配置，技能将仅使用 Web 搜索。

## 支持的 MCP 工具

### 1. weixin_search_mcp - 微信公众号搜索

**功能**：
- 搜索微信公众号文章
- 获取文章完整内容

**GitHub 仓库**：https://github.com/fancyboi999/weixin_search_mcp

**提供的工具**：
- `weixin_search` - 搜索微信公众号文章
- `get_weixin_article_content` - 获取文章详细内容

### 2. redbook_mcp - 小红书搜索

**功能**：
- 搜索小红书笔记
- 获取笔记内容

**GitHub 仓库**：https://github.com/JonaFly/RednoteMCP

---

## 安装步骤

### 前置要求

- Node.js 18+ 或 Python 3.8+（根据 MCP 服务器实现语言）
- Claude Desktop 或支持 MCP 的客户端

### 安装 weixin_search_mcp

1. 克隆仓库：
```bash
git clone https://github.com/fancyboi999/weixin_search_mcp.git
cd weixin_search_mcp
```

2. 安装依赖（根据项目要求）：
```bash
npm install
# 或
pip install -r requirements.txt
```

3. 配置 MCP 服务器（在 Claude Desktop 配置文件中添加）：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "weixin_search": {
      "command": "node",
      "args": ["/path/to/weixin_search_mcp/index.js"]
    }
  }
}
```

### 安装 redbook_mcp

1. 克隆仓库：
```bash
git clone https://github.com/JonaFly/RednoteMCP.git
cd RednoteMCP
```

2. 安装依赖：
```bash
npm install
# 或
pip install -r requirements.txt
```

3. 配置 MCP 服务器：
```json
{
  "mcpServers": {
    "weixin_search": {
      "command": "node",
      "args": ["/path/to/weixin_search_mcp/index.js"]
    },
    "redbook": {
      "command": "node",
      "args": ["/path/to/RednoteMCP/index.js"]
    }
  }
}
```

---

## 验证安装

重启 Claude Desktop 后，可以通过以下方式验证 MCP 工具是否可用：

1. 在对话中询问："你有哪些 MCP 工具可用？"
2. 检查是否列出了 `weixin_search` 和 `get_weixin_article_content` 工具

---

## 使用说明

### 在 write-master 技能中的使用

当 MCP 工具配置成功后，write-master 技能会在阶段 2（主题调研）自动使用这些工具：

1. **Web 搜索**：使用 WebSearch 工具（始终可用）
2. **微信公众号搜索**：如果 weixin_search_mcp 可用，自动调用
3. **小红书搜索**：如果 redbook_mcp 可用，自动调用

### 手动调用示例

如果需要单独测试 MCP 工具：

**搜索微信公众号文章**：
```
使用 weixin_search 工具搜索关键词："Claude API"
```

**获取文章内容**：
```
使用 get_weixin_article_content 工具获取文章 URL 的完整内容
```

---

## 故障排查

### MCP 工具未显示

1. 检查配置文件路径是否正确
2. 确认 JSON 格式无误（使用 JSON 验证工具）
3. 重启 Claude Desktop
4. 查看 Claude Desktop 日志（Help → View Logs）

### 工具调用失败

1. 检查 MCP 服务器进程是否正常运行
2. 确认网络连接正常（某些工具需要访问外部 API）
3. 查看 MCP 服务器日志输出

### 降级使用

如果 MCP 工具无法使用，write-master 技能会自动降级为仅使用 Web 搜索，不影响核心功能。

---

## 注意事项

1. **API 限制**：某些 MCP 工具可能依赖第三方 API，请注意速率限制
2. **内容时效性**：微信公众号和小红书内容受平台限制，可能无法获取所有文章
3. **隐私保护**：使用这些工具时请遵守相关平台的服务条款和隐私政策

---

## 更多资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [Claude Desktop MCP 配置指南](https://docs.anthropic.com/claude/docs/mcp)
- [weixin_search_mcp GitHub](https://github.com/fancyboi999/weixin_search_mcp)
- [RednoteMCP GitHub](https://github.com/JonaFly/RednoteMCP)
