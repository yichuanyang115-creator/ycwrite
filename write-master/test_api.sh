#!/bin/bash
# 测试 FastAPI 服务

echo "测试 FastAPI 健康检查..."
curl -s http://localhost:8000/health | jq .

echo -e "\n\n测试文章生成 API..."
curl -N http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "AI Agent",
    "audience": "pm",
    "length": "short"
  }'
