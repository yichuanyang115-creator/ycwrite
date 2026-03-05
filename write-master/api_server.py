#!/usr/bin/env python3
"""
FastAPI 服务层 - Write Master Web API
提供 SSE 流式接口，桥接前端和 WriteMaster 后端
Railway deployment: 2026-03-05
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from queue import Queue
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from main import WriteMaster


app = FastAPI(title="Write Master API", version="1.0.0")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制为具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    """文章生成请求"""
    topic: str
    audience: str = "pm"
    length: str = "medium"
    viewpoint: Optional[str] = None


def sse_event(event_type: str, data: dict) -> str:
    """格式化 SSE 事件"""
    return f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@app.post("/api/generate")
async def generate_article(request: GenerateRequest):
    """
    生成文章的 SSE 流式接口

    事件类型：
    - stage: 阶段更新 {stage: 1-6}
    - research_complete: 调研完成 {summary, sources}
    - outline_complete: 大纲完成 {outline}
    - stream: 正文流式输出 {text}
    - image_start: 开始生成配图 {count}
    - image_done: 配图完成 {id, success}
    - done: 全部完成 {html, title, wordCount, imageCount}
    - error: 错误 {message}
    """

    async def event_stream():
        try:
            # 构建用户输入
            user_input = f"{request.topic}\n受众: {request.audience}\n长度: {request.length}"
            if request.viewpoint:
                user_input += f"\n核心观点: {request.viewpoint}"

            # 使用线程安全的 queue.Queue 替代 asyncio.Queue
            event_queue = Queue()

            def event_callback(event_type: str, data: dict):
                """WriteMaster 事件回调 - 线程安全版本"""
                # queue.Queue 是线程安全的，可以直接从任何线程调用
                event_queue.put((event_type, data))

            # 创建 WriteMaster 实例
            writer = WriteMaster(no_review=True, event_callback=event_callback)
            loop = asyncio.get_event_loop()

            # 阶段 1: 参数收集（前端没有这个阶段，跳过）
            params = await loop.run_in_executor(None, writer.stage1_collect_params, user_input)

            # 阶段 2: 主题调研
            yield sse_event('stage', {'id': 'research', 'status': 'active'})
            research_data = await loop.run_in_executor(None, writer.stage2_research, params)
            while not event_queue.empty():
                evt_type, evt_data = event_queue.get()
                if evt_type == 'thinking':
                    yield sse_event('thinking', evt_data)
                elif evt_type == 'research_complete':
                    yield sse_event('research_complete', {'content': evt_data.get('summary', '')})
            yield sse_event('stage', {'id': 'research', 'status': 'done'})

            # 阶段 3: 大纲生成
            yield sse_event('stage', {'id': 'outline', 'status': 'active'})
            outline = await loop.run_in_executor(None, writer.stage3_outline, params, research_data)
            while not event_queue.empty():
                evt_type, evt_data = event_queue.get()
                if evt_type == 'thinking':
                    yield sse_event('thinking', evt_data)
                elif evt_type == 'outline_complete':
                    yield sse_event('outline_complete', {'content': evt_data.get('outline', '')})
            yield sse_event('stage', {'id': 'outline', 'status': 'done'})

            # 阶段 4: 正文写作
            yield sse_event('stage', {'id': 'writing', 'status': 'active'})
            article = await loop.run_in_executor(None, writer.stage4_writing, params, research_data, outline)
            while not event_queue.empty():
                evt_type, evt_data = event_queue.get()
                if evt_type == 'thinking':
                    yield sse_event('thinking', evt_data)
                elif evt_type == 'stream':
                    yield sse_event('stream', {'text': evt_data.get('text', '')})
            yield sse_event('stage', {'id': 'writing', 'status': 'done'})

            # 阶段 5: 配图生成（在线程池中执行，避免阻塞事件循环）
            yield sse_event('stage', {'id': 'images', 'status': 'active'})

            # 启动图片生成任务（线程池）
            images_task = loop.run_in_executor(None, writer.stage5_images, article)

            # 等待完成，同时每 20s 发一次 SSE 心跳注释，防止连接被超时切断
            while not images_task.done():
                try:
                    images = await asyncio.wait_for(asyncio.shield(images_task), timeout=20)
                    break
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"  # SSE 注释行，客户端会忽略但连接保活
            else:
                images = await images_task

            while not event_queue.empty():
                evt_type, evt_data = event_queue.get()
                if evt_type == 'thinking':
                    yield sse_event('thinking', evt_data)
                elif evt_type == 'image_start':
                    yield sse_event('image_start', {'message': f"开始生成 {evt_data.get('count', 0)} 张配图"})
                elif evt_type == 'image_done':
                    pass  # 前端不需要单张图片完成事件
            yield sse_event('stage', {'id': 'images', 'status': 'done'})

            # 阶段 6: 富文本排版
            yield sse_event('stage', {'id': 'formatting', 'status': 'active'})
            final_output = await loop.run_in_executor(None, writer.stage6_formatting, article, images, research_data, outline)
            # 给一点时间让 event_callback 完成
            await asyncio.sleep(0.1)
            done_sent = False
            while not event_queue.empty():
                evt_type, evt_data = event_queue.get()
                if evt_type == 'thinking':
                    yield sse_event('thinking', evt_data)
                elif evt_type == 'done':
                    yield sse_event('done', {
                        'html': evt_data.get('html', ''),
                        'title': evt_data.get('title', ''),
                        'wordCount': evt_data.get('wordCount', 0),
                        'imageCount': evt_data.get('imageCount', 0),
                        'research': evt_data.get('research', ''),
                        'outline': evt_data.get('outline', '')
                    })
                    done_sent = True
            # 兜底：若 done 事件未入队，直接从返回值构造
            if not done_sent:
                from pathlib import Path as _Path
                from scripts.markdown_to_html import extract_title as _extract_title
                html_content = ''
                html_path = final_output.get('html_path', '')
                if html_path and _Path(html_path).exists():
                    with open(html_path, 'r', encoding='utf-8') as f:
                        html_content = f.read()
                yield sse_event('done', {
                    'html': html_content,
                    'title': _extract_title(article),
                    'wordCount': final_output.get('word_count', 0),
                    'imageCount': final_output.get('image_count', 0)
                })
            yield sse_event('stage', {'id': 'formatting', 'status': 'done'})

        except Exception as e:
            yield sse_event('error', {'message': str(e)})

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "ok", "service": "write-master-api"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
